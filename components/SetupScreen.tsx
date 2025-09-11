
import React, { useState, useRef, useEffect } from 'react';
import type { Team, Round, Prize, Question, GameSettings } from '../types';
import { QuestionType, TieBreakerRule } from '../types';
import { PlusIcon, TrashIcon, UploadIcon, DownloadIcon, SaveIcon, FolderOpenIcon, ClearIcon } from './IconComponents';
import AudioTrimmer from './AudioTrimmer';
import { demoData } from './configurations';
import { GoogleGenAI, Type } from "@google/genai";


interface SetupScreenProps {
  onSetupComplete: (teams: Team[], rounds: Round[], settings: GameSettings) => void;
}

type AvailableConfig = {
  name: string;
  source: 'local' | 'preconfigured';
  file?: string;
  data?: any;
};


const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const aiResponseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        answer: {
          type: Type.STRING,
          description: "The original, exact answer string provided in the prompt.",
        },
        filename: {
          type: Type.STRING,
          description: "The best-matching filename from the list provided. Should be null if no good match is found.",
        },
      },
      required: ["answer", "filename"],
    },
};


const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupComplete }) => {
  const [numTeams, setNumTeams] = useState(2);
  const [teams, setTeams] = useState<Partial<Team>[]>(Array(2).fill({ name: '' }));
  const [rounds, setRounds] = useState<Partial<Round>[]>([]);
  const [tieBreakerRule, setTieBreakerRule] = useState<TieBreakerRule>(TieBreakerRule.ALL_TIES);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);
  const bulkAudioFileRef = useRef<HTMLInputElement>(null);
  
  const [availableConfigs, setAvailableConfigs] = useState<AvailableConfig[]>([]);
  const [newConfigName, setNewConfigName] = useState('');


  useEffect(() => {
    const loadConfigs = async () => {
      // Load local configs
      const localConfigsRaw = localStorage.getItem('blindTestConfigs');
      const localConfigs = localConfigsRaw ? JSON.parse(localConfigsRaw) : {};
      const localList: AvailableConfig[] = Object.keys(localConfigs).map(name => ({
          name,
          source: 'local' as const,
          data: localConfigs[name],
      }));

      // Load preconfigured configs from manifest
      try {
          const response = await fetch('/Preconfigured_games/manifest.json');
          if (response.ok) {
              const manifest: { name: string; file: string }[] = await response.json();
              const preconfiguredList: AvailableConfig[] = manifest.map(item => ({
                  name: item.name,
                  source: 'preconfigured' as const,
                  file: item.file,
              }));
              setAvailableConfigs([...preconfiguredList, ...localList]);
          } else {
              setAvailableConfigs(localList); // If manifest fails, just show local
          }
      } catch (error) {
          console.error("Could not load preconfigured games manifest:", error);
          setAvailableConfigs(localList); // Fallback to local
      }
    };
    loadConfigs();
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleNumTeamsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Math.max(2, parseInt(e.target.value, 10) || 2);
    setNumTeams(count);
    
    setTeams(currentTeams => {
        const newTeams = Array.from({ length: count });
        for (let i = 0; i < count; i++) {
            newTeams[i] = currentTeams[i] || { name: '' };
        }
        return newTeams;
    });

    setRounds(currentRounds => currentRounds.map(r => {
        const currentPrizes = r.prizePool || [];
        const newPrizes: Prize[] = Array.from(
            { length: count },
            (_, i) => currentPrizes[i] || { name: '', imageUrl: '' }
        );
        return { ...r, prizePool: newPrizes };
    }));
  };

  const handleTeamNameChange = (index: number, name: string) => {
    const newTeams = [...teams];
    newTeams[index] = { ...newTeams[index], name };
    setTeams(newTeams);
  };
  
  const addRound = () => {
    setRounds([
        ...rounds, 
        { 
            name: '', 
            questions: [],
            prizePool: Array(numTeams).fill({ name: '', imageUrl: '' }),
        }
    ]);
  };

  const removeRound = (index: number) => {
    setRounds(rounds.filter((_, i) => i !== index));
  };
  
  const handleRoundChange = <K extends keyof Round>(index: number, field: K, value: Round[K]) => {
      const newRounds = [...rounds];
      newRounds[index] = { ...newRounds[index], [field]: value };
      setRounds(newRounds);
  };

  const addQuestion = (roundIndex: number) => {
    const newRounds = [...rounds];
    const round = newRounds[roundIndex];
    round.questions = [...(round.questions || []), { questionText: 'Devinez la chanson et l\'artiste', answer: '', type: QuestionType.AUDIO, points: 1 }];
    setRounds(newRounds);
  };

  const removeQuestion = (roundIndex: number, questionIndex: number) => {
    const newRounds = [...rounds];
    const round = newRounds[roundIndex];
    round.questions = round.questions?.filter((_, i) => i !== questionIndex);
    setRounds(newRounds);
  };

  const handleQuestionChange = <K extends keyof Question>(roundIndex: number, questionIndex: number, field: K, value: Question[K]) => {
    const newRounds = [...rounds];
    const round = newRounds[roundIndex];
    const newQuestions = [...(round.questions || [])];
    
    let processedValue = value;
    if (field === 'timer' || field === 'points') {
      const numValue = parseInt(value as string, 10);
      processedValue = isNaN(numValue) || numValue <= 0 ? undefined : numValue as Question[K];
    }

    newQuestions[questionIndex] = { ...newQuestions[questionIndex], [field]: processedValue };
    round.questions = newQuestions;
    setRounds(newRounds);
  };

  const handleQuestionTrimmerChange = (roundIndex: number, questionIndex: number, times: { start?: number, end?: number, answerStart?: number }) => {
    const newRounds = [...rounds];
    const round = newRounds[roundIndex];
    const newQuestions = [...(round.questions || [])];
    
    newQuestions[questionIndex] = { 
        ...newQuestions[questionIndex], 
        audioStartTime: times.start, 
        audioEndTime: times.end,
        answerStartTime: times.answerStart,
    };
    round.questions = newQuestions;
    setRounds(newRounds);
  };

  const handlePrizeChange = (roundIndex: number, prizeIndex: number, field: keyof Prize, value: string) => {
    const newRounds = [...rounds];
    const round = { ...newRounds[roundIndex] };
    const prizePool = [...(round.prizePool || [])];
    prizePool[prizeIndex] = { ...prizePool[prizeIndex], [field]: value };
    round.prizePool = prizePool;
    newRounds[roundIndex] = round;
    setRounds(newRounds);
  };

  const handlePrizeImageUpload = async (roundIndex: number, prizeIndex: number, file: File | null) => {
    if (!file) return;
    const base64 = await fileToBase64(file);
    handlePrizeChange(roundIndex, prizeIndex, 'imageUrl', base64);
  };

  const handleAudioUpload = async (roundIndex: number, questionIndex: number, file: File | null) => {
    if (!file) return;

    const currentAnswer = rounds[roundIndex]?.questions?.[questionIndex]?.answer;
    if (!currentAnswer || currentAnswer.trim() === '') {
        const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const cleanAnswer = fileName.replace(/[_-]/g, ' ');
        handleQuestionChange(roundIndex, questionIndex, 'answer', cleanAnswer);
    }
    
    handleQuestionChange(roundIndex, questionIndex, 'audioFileName', file.name);

    const base64 = await fileToBase64(file);
    handleQuestionChange(roundIndex, questionIndex, 'audioUrl', base64);
  };

  const handleSaveConfig = () => {
    if (!newConfigName.trim()) {
      showNotification('Veuillez entrer un nom pour la configuration.');
      return;
    }
    const localConfigsRaw = localStorage.getItem('blindTestConfigs');
    const localConfigs = localConfigsRaw ? JSON.parse(localConfigsRaw) : {};
    
    const configData = { teams, rounds, numTeams, tieBreakerRule };
    const newSavedConfigs = { ...localConfigs, [newConfigName]: configData };
    localStorage.setItem('blindTestConfigs', JSON.stringify(newSavedConfigs));
    
    const newEntry: AvailableConfig = { name: newConfigName, source: 'local', data: configData };
    setAvailableConfigs(prev => [...prev.filter(c => c.name !== newConfigName || c.source !== 'local'), newEntry]);

    setNewConfigName('');
    showNotification(`Configuration "${newConfigName}" sauvegardée !`);
  };

  const handleLoadConfig = async (configToLoad: AvailableConfig) => {
    try {
        let configData: any;
        if (configToLoad.source === 'local') {
            configData = configToLoad.data;
        } else if (configToLoad.source === 'preconfigured' && configToLoad.file) {
            const response = await fetch(`/Preconfigured_games/${configToLoad.file}`);
            if (!response.ok) {
                throw new Error(`Le fichier ${configToLoad.file} est introuvable.`);
            }
            configData = await response.json();
        } else if (configToLoad.name === 'Démo') { // Hardcoded fallback for demo
            configData = demoData;
        }

        if (configData) {
            loadPreset(configData, configToLoad.name);
        } else {
             throw new Error(`Configuration data for "${configToLoad.name}" could not be found.`);
        }
    } catch (err: any) {
        showNotification(`Erreur: ${err.message}`);
        console.error("Failed to load config:", err);
    }
  };

  const handleDeleteConfig = (name: string) => {
    const localConfigsRaw = localStorage.getItem('blindTestConfigs');
    const localConfigs = localConfigsRaw ? JSON.parse(localConfigsRaw) : {};
    delete localConfigs[name];
    localStorage.setItem('blindTestConfigs', JSON.stringify(localConfigs));

    setAvailableConfigs(prev => prev.filter(c => !(c.name === name && c.source === 'local')));

    showNotification(`Configuration "${name}" supprimée.`);
  };


  const handleExportConfig = () => {
    const config = { teams, rounds, numTeams, tieBreakerRule };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'blind-test-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        const config = JSON.parse(text as string);
        if (Array.isArray(config.teams) && Array.isArray(config.rounds) && typeof config.numTeams === 'number') {
            loadPreset(config, file.name);
            showNotification('Configuration importée avec succès !');
        } else {
          setError('Structure de fichier de configuration invalide.');
        }
      } catch (err) {
        setError('Échec de l\'analyse du fichier de configuration.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };
  
  const loadPreset = (config: any, name: string) => {
    const processedRounds = config.rounds.map((r: any) => ({
      ...r,
      prizePool: r.prizePool || r.prizesByRank || [],
    }));
    setNumTeams(config.numTeams);
    setTeams(config.teams);
    setRounds(processedRounds);
    setTieBreakerRule(config.tieBreakerRule || TieBreakerRule.ALL_TIES);
    showNotification(`Configuration "${name}" chargée !`);
  };

  const handleClearAll = () => {
    setNumTeams(2);
    setTeams(Array(2).fill({ name: '' }));
    setRounds([]);
    setError('');
    setTieBreakerRule(TieBreakerRule.ALL_TIES);
    showNotification('Configuration effacée.');
  }

    const handleBulkAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Mode A: Auto-create game from scratch
    if (rounds.length === 0) {
        const proceed = window.confirm(`Créer une nouvelle partie en utilisant les ${files.length} fichiers audio ? Vous pourrez définir les équipes et les manches plus tard.`);
        if (!proceed) { showNotification("Création de jeu annulée."); return; }
        
        const newTeams = Array.from({ length: 2 }, (_, i) => ({ name: `Équipe ${i + 1}` }));
        const newRound: Partial<Round> = { name: `Manche 1`, questions: [], prizePool: Array(2).fill({ name: `Ingrédient`, imageUrl: '' }) };

        const questionPromises = Array.from(files).map(async (file) => {
            const answer = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');
            const audioUrl = await fileToBase64(file);
            return {
                questionText: "Devinez la chanson et l'artiste",
                answer,
                type: QuestionType.AUDIO,
                points: 1,
                audioUrl,
                audioFileName: file.name
            };
        });

        const resolvedQuestions = await Promise.all(questionPromises);
        newRound.questions = resolvedQuestions;

        setNumTeams(2);
        setTeams(newTeams);
        setRounds([newRound]);
        showNotification(`${files.length} audios importés et une manche créée !`);
    } else { // Mode B: Intelligently match audio to existing questions with AI
        const currentNotification = 'Analyse des fichiers en cours...';
        setNotification(currentNotification);

        try {
            if (!process.env.API_KEY) {
              alert("Erreur: La clé API Gemini n'est pas configurée. Impossible d'utiliser l'association intelligente.");
              return;
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const newRounds = JSON.parse(JSON.stringify(rounds)) as Partial<Round>[];
            const questionsToMatch: Question[] = newRounds.flatMap(r => r.questions || []).filter(q => q && q.type === QuestionType.AUDIO && !q.audioUrl && q.answer);

            if (questionsToMatch.length === 0) {
                showNotification("Aucune question audio sans fichier à assigner.");
                return;
            }

            const questionAnswers = questionsToMatch.map(q => q.answer);
            const fileNames = Array.from(files).map(f => f.name);

            const prompt = `
              Associate each answer from the 'answers' list with the best-matching audio filename from the 'filenames' list.
              Prioritize matches that share key words from artists and song titles. Be accurate.
              Answers: ${JSON.stringify(questionAnswers)}
              Filenames: ${JSON.stringify(fileNames)}
            `;

            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: { 
                responseMimeType: "application/json",
                responseSchema: aiResponseSchema,
              },
            });

            const resultText = response.text.trim();
            const matches: { answer: string; filename: string | null }[] = JSON.parse(resultText);

            let matchedCount = 0;
            const fileMap = new Map(Array.from(files).map(f => [f.name, f]));
            const questionMap = new Map<string, Question>();
            // Use a unique key for each question to handle duplicate answers
            newRounds.forEach(r => {
                (r.questions || []).forEach((q, i) => {
                    if (q.type === QuestionType.AUDIO && !q.audioUrl && q.answer) {
                        questionMap.set(`${q.answer}#${i}`, q);
                    }
                });
            });

            const fileConversionPromises: Promise<void>[] = [];
            
            for (const match of matches) {
                if (match.filename && fileMap.has(match.filename)) {
                    // Find the first question that matches this answer and hasn't been assigned a file yet
                    const questionToUpdateEntry = Array.from(questionMap.entries()).find(([key, q]) => q.answer === match.answer);

                    if (questionToUpdateEntry) {
                        const [key, questionToUpdate] = questionToUpdateEntry;
                        const fileToAssign = fileMap.get(match.filename)!;

                        const promise = fileToBase64(fileToAssign).then(base64 => {
                            questionToUpdate.audioUrl = base64;
                            questionToUpdate.audioFileName = fileToAssign.name;
                            matchedCount++;
                        });
                        fileConversionPromises.push(promise);
                        
                        // Remove from maps to prevent re-use
                        fileMap.delete(match.filename);
                        questionMap.delete(key);
                    }
                }
            }

            await Promise.all(fileConversionPromises);
            setRounds(newRounds);

            let notificationMessage = `${matchedCount} audios assignés par l'IA.`;
            const unmatchedCount = files.length - matchedCount;
            if (unmatchedCount > 0) {
                notificationMessage += ` ${unmatchedCount} fichiers n'ont pas pu être assignés.`;
            }
            showNotification(notificationMessage);

        } catch (error) {
            console.error("Erreur lors de l'association par IA:", error);
            showNotification("Une erreur est survenue pendant l'association intelligente.");
        } finally {
            if (notification === currentNotification) {
                setNotification('');
            }
        }
    }
    event.target.value = ''; // Reset file input
  };

  const formatAnswersForExport = (format: 'txt' | 'csv'): string => {
    if (format === 'csv') {
      let csvContent = "Nom de la manche,N° Question,Question,Indice,Réponse,Points,Chrono (s),Type\n";
      rounds.forEach((round) => {
        (round.questions || []).forEach((q, qIndex) => {
          const row = [
            `"${round.name?.replace(/"/g, '""') || ''}"`,
            qIndex + 1,
            `"${q.questionText.replace(/"/g, '""')}"`,
            `"${q.clue?.replace(/"/g, '""') || ''}"`,
            `"${q.answer.replace(/"/g, '""')}"`,
            q.points || 1,
            q.timer || '',
            q.type
          ].join(',');
          csvContent += row + '\n';
        });
      });
      return csvContent;
    }

    let content = "Soirée Blind Test - Feuille de Réponses\n\n";
    rounds.forEach((round, roundIndex) => {
      content += `========================================\n`;
      content += `MANCHE ${roundIndex + 1}: ${round.name || 'Manche sans titre'}\n`;
      content += `========================================\n\n`;
      (round.questions || []).forEach((q, questionIndex) => {
        content += `Question ${questionIndex + 1}:\n`;
        content += `  Question: ${q.questionText}\n`;
        if (q.clue) content += `  Indice: ${q.clue}\n`;
        content += `  Réponse: ${q.answer}\n`;
        content += `  Points: ${q.points || 1}\n`;
        if (q.timer) content += `  Chrono: ${q.timer} secondes\n`;
        content += `\n`;
      });
    });
    return content;
  };

  const handleExportAnswers = (format: 'txt' | 'csv') => {
    const fileContent = formatAnswersForExport(format);
    const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8';
    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blind-test-answers.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const validateAndStart = () => {
      if (teams.some(t => !t.name?.trim())) {
          setError('Toutes les équipes doivent avoir un nom.');
          return;
      }
      if (rounds.length === 0) {
          setError('Veuillez ajouter au moins une manche.');
          return;
      }
      for (const r of rounds) {
        if (!r.name?.trim()) {
            setError('Toutes les manches doivent avoir un nom.');
            return;
        }
        if (!r.questions || r.questions.length === 0) {
            setError(`La manche "${r.name}" doit avoir au moins une question.`);
            return;
        }
        for (const q of r.questions) {
            if (!q.answer?.trim()) {
                setError(`Toutes les questions de la manche "${r.name}" doivent avoir une réponse pour l'animateur.`);
                return;
            }
        }
        if (r.prizePool?.some(p => !p.name?.trim() || !p.imageUrl)) {
            setError(`Tous les ingrédients de la manche "${r.name}" doivent avoir un nom et une image.`);
            return;
        }
        if (r.prizePool?.length !== numTeams) {
            setError(`Le nombre d'ingrédients pour la manche "${r.name}" (${r.prizePool?.length}) doit être égal au nombre d'équipes (${numTeams}).`);
            return;
        }
      }

      setError('');
      const finalTeams: Team[] = teams.map(t => ({
          id: crypto.randomUUID(),
          name: t.name!,
          collectedPrizes: [],
          scores: {}
      }));
      const finalRounds: Round[] = rounds.map(r => ({
          id: crypto.randomUUID(),
          name: r.name!,
          prizeCategory: r.prizeCategory,
          questions: r.questions as Question[],
          prizePool: r.prizePool!.map(p => ({...p, id: p.id || crypto.randomUUID()})),
          isCompleted: false
      }));
      
      const settings: GameSettings = { tieBreakerRule };

      onSetupComplete(finalTeams, finalRounds, settings);
  };

  const renderQuestionInput = (roundIndex: number, questionIndex: number) => {
      const question = rounds[roundIndex]?.questions?.[questionIndex];
      if (!question) return null;

      return (
        <div className="bg-brand-dark/30 p-4 rounded-lg border border-brand-gold/30 space-y-3">
            <div className='flex justify-between items-center'>
                <h4 className="text-lg font-bold text-brand-light/80">Question {questionIndex + 1}</h4>
                <button onClick={() => removeQuestion(roundIndex, questionIndex)} className="text-brand-burgundy hover:text-red-400">
                    <TrashIcon className="h-5 w-5"/>
                </button>
            </div>
             <input
                type="text"
                value={question.questionText}
                onChange={(e) => handleQuestionChange(roundIndex, questionIndex, 'questionText', e.target.value)}
                placeholder="Question (ex: 'Quelle est cette chanson ?')"
                className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition text-base"
            />
             <input
                type="text"
                value={question.clue || ''}
                onChange={(e) => handleQuestionChange(roundIndex, questionIndex, 'clue', e.target.value)}
                placeholder="Indice (optionnel, caché pendant le jeu)"
                className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition text-base"
            />
             <input
                type="text"
                value={question.answer}
                onChange={(e) => handleQuestionChange(roundIndex, questionIndex, 'answer', e.target.value)}
                placeholder="Réponse (pour votre référence)"
                className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition text-base"
            />
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-base font-medium text-brand-light/70">Points</label>
                <input type="number" value={question.points || ''} min="1" onChange={e => handleQuestionChange(roundIndex, questionIndex, 'points', e.target.value as any)} placeholder="1" className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base"/>
              </div>
              <div className="flex-1">
                <label className="block text-base font-medium text-brand-light/70">Chrono (sec)</label>
                <input type="number" value={question.timer || ''} min="1" onChange={e => handleQuestionChange(roundIndex, questionIndex, 'timer', e.target.value as any)} placeholder="Optionnel" className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base"/>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
                {[QuestionType.LIVE, QuestionType.AUDIO].map(type => (
                    <button
                        key={type}
                        onClick={() => handleQuestionChange(roundIndex, questionIndex, 'type', type)}
                        className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors uppercase tracking-wider ${question.type === type ? 'bg-brand-gold text-brand-dark' : 'bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20'}`}
                    >
                        {type === 'LIVE' ? 'Prestation Live' : type}
                    </button>
                ))}
            </div>
            {question.type === QuestionType.AUDIO && (
                <div className="mt-2">
                    <label className="block text-base font-medium text-brand-light/90 mb-1">Charger un fichier audio</label>
                    <input type="file" accept="audio/*" onChange={e => handleAudioUpload(roundIndex, questionIndex, e.target.files?.[0] || null)} className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-brand-light file:text-brand-dark hover:file:bg-brand-gold"/>
                    {question.audioFileName && (
                        <div className="flex items-center justify-between mt-2 p-2 bg-brand-dark/20 rounded-md border border-brand-gold/20">
                            <span className="text-brand-light/80 text-sm truncate" title={question.audioFileName}>
                                {question.audioFileName}
                            </span>
                            <button 
                                onClick={() => {
                                    handleQuestionChange(roundIndex, questionIndex, 'audioUrl', undefined);
                                    handleQuestionChange(roundIndex, questionIndex, 'audioFileName', undefined);
                                    handleQuestionTrimmerChange(roundIndex, questionIndex, { start: undefined, end: undefined, answerStart: undefined });
                                }} 
                                className="text-brand-burgundy hover:text-red-400 ml-2"
                                aria-label="Supprimer le fichier audio"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                    {question.audioUrl && (
                      <AudioTrimmer
                        src={question.audioUrl}
                        startTime={question.audioStartTime}
                        endTime={question.audioEndTime}
                        answerStartTime={question.answerStartTime}
                        onTimesChange={(times) => handleQuestionTrimmerChange(roundIndex, questionIndex, times)}
                      />
                    )}
                </div>
            )}
        </div>
      )
  }

  return (
    <div className="space-y-12 animate-slide-in-up">
      {notification && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in z-50 text-lg">
          {notification}
        </div>
      )}

      {/* Config Management */}
       <div className="bg-brand-dark/50 p-6 rounded-lg border-2 border-brand-gold/50 shadow-lg">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4 text-brand-gold tracking-widest uppercase">Le Bureau</h2>
           <div className="flex flex-wrap items-start gap-4">
              <button onClick={handleExportConfig} className="flex items-center px-4 py-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md font-semibold transition-colors text-sm sm:text-base">
                  <DownloadIcon className="h-5 w-5 mr-2" /> Exporter la Config
              </button>
              <label className="flex items-center px-4 py-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md font-semibold transition-colors cursor-pointer text-sm sm:text-base">
                  <UploadIcon className="h-5 w-5 mr-2" /> Importer la Config
                  <input type="file" accept=".json" className="hidden" ref={importFileRef} onChange={handleImportConfig}/>
              </label>
              <label className="flex items-center px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded-md font-semibold transition-colors cursor-pointer text-sm sm:text-base text-white">
                  <UploadIcon className="h-5 w-5 mr-2" /> Charger Audios en Masse
                  <input type="file" accept="audio/*" multiple className="hidden" ref={bulkAudioFileRef} onChange={handleBulkAudioUpload}/>
              </label>
               <button onClick={handleClearAll} className="flex items-center px-4 py-2 bg-brand-dark/50 border border-brand-burgundy hover:bg-brand-burgundy rounded-md font-semibold transition-colors text-sm sm:text-base">
                  <ClearIcon className="h-5 w-5 mr-2" /> Tout Effacer
              </button>
          </div>
          <div className="mt-6 border-t-2 border-brand-gold/30 pt-4">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-brand-light/80">Gestion des Configurations</h3>
            
            {/* --- SAVING --- */}
            <div className="flex items-center gap-2 mb-4">
              <input type="text" value={newConfigName} onChange={e => setNewConfigName(e.target.value)} placeholder="Nommer et sauvegarder la config actuelle" className="flex-grow bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base"/>
              <button onClick={handleSaveConfig} className="flex items-center px-4 py-2 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-md font-semibold transition-colors text-sm sm:text-base">
                  <SaveIcon className="h-5 w-5 mr-2" /> Sauver
              </button>
            </div>
            
            {/* --- LOADING --- */}
            {availableConfigs.length > 0 ? (
                <div className="space-y-2">
                    {availableConfigs.sort((a,b) => a.name.localeCompare(b.name)).map(config => (
                        <div key={`${config.source}-${config.name}`} className="flex items-center justify-between bg-brand-dark/30 p-2 rounded-md border border-brand-gold/30">
                            <span className="font-medium text-base sm:text-lg flex items-center">
                                {config.name}
                                {config.source === 'preconfigured' && <span title="Configuration pré-enregistrée" className="ml-2 text-xs bg-brand-burgundy text-white px-2 py-0.5 rounded-full">PRÉCONFIGURÉ</span>}
                                {config.source === 'local' && <span title="Sauvegardé dans votre navigateur" className="ml-2 text-xs bg-blue-800 text-white px-2 py-0.5 rounded-full">LOCAL</span>}
                            </span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleLoadConfig(config)} className="px-3 py-1 bg-green-800 hover:bg-green-700 rounded text-sm sm:text-base font-semibold">Charger</button>
                                {config.source === 'local' && (
                                    <button onClick={() => handleDeleteConfig(config.name)} className="text-brand-burgundy hover:text-red-400"><TrashIcon className="h-5 w-5"/></button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-brand-light/50 text-base">Aucune configuration disponible.</p>}
          </div>
      </div>
      
      {/* Top Start Game Button */}
      <div className="flex flex-col items-center space-y-4 -mt-4">
        {error && <p className="text-red-400 mb-4 text-base sm:text-lg">{error}</p>}
        <button 
            onClick={validateAndStart}
            className="font-display px-8 py-3 sm:px-12 sm:py-4 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-lg font-bold text-xl sm:text-2xl tracking-widest uppercase transition-all duration-300 transform hover:scale-105 shadow-lg animate-glow"
        >
            Que la partie commence !
        </button>
      </div>


      {/* Teams Setup */}
      <div className="bg-brand-dark/50 p-6 rounded-lg border-2 border-brand-gold/50 shadow-lg">
        <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4 text-brand-gold tracking-widest uppercase">1. Les Concurrents</h2>
        <div className="mb-4">
          <label htmlFor="numTeams" className="block text-lg sm:text-xl font-medium text-brand-light/80">Nombre d'Équipes</label>
          <input
            type="number"
            id="numTeams"
            value={numTeams}
            min="2"
            onChange={handleNumTeamsChange}
            className="mt-1 block w-24 bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition text-base"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teams.map((team, index) => (
            <div key={index}>
              <label htmlFor={`teamName-${index}`} className="block text-base font-medium text-brand-light/80">Nom de l'Équipe {index + 1}</label>
              <input
                type="text"
                id={`teamName-${index}`}
                value={team.name || ''}
                onChange={e => handleTeamNameChange(index, e.target.value)}
                className="mt-1 block w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition text-base"
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Tie Breaker Rules */}
      <div className="bg-brand-dark/50 p-6 rounded-lg border-2 border-brand-gold/50 shadow-lg">
        <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4 text-brand-gold tracking-widest uppercase">2. Règles du Jeu</h2>
        <div>
          <h3 className="text-lg sm:text-xl font-medium text-brand-light/80 mb-3">Gestion des Égalités</h3>
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="tiebreaker" value={TieBreakerRule.NONE} checked={tieBreakerRule === TieBreakerRule.NONE} onChange={(e) => setTieBreakerRule(e.target.value as TieBreakerRule)} className="h-5 w-5 bg-brand-dark border-brand-gold/70 text-brand-gold focus:ring-brand-gold focus:ring-2 cursor-pointer"/>
              <span className="ml-3 text-base text-brand-light/90">Désactiver : les égalités sont autorisées.</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="tiebreaker" value={TieBreakerRule.ALL_TIES} checked={tieBreakerRule === TieBreakerRule.ALL_TIES} onChange={(e) => setTieBreakerRule(e.target.value as TieBreakerRule)} className="h-5 w-5 bg-brand-dark border-brand-gold/70 text-brand-gold focus:ring-brand-gold focus:ring-2 cursor-pointer"/>
              <span className="ml-3 text-base text-brand-light/90">Activer pour toutes les places : un défi départagera toutes les équipes à égalité.</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="tiebreaker" value={TieBreakerRule.FIRST_PLACE_ONLY} checked={tieBreakerRule === TieBreakerRule.FIRST_PLACE_ONLY} onChange={(e) => setTieBreakerRule(e.target.value as TieBreakerRule)} className="h-5 w-5 bg-brand-dark border-brand-gold/70 text-brand-gold focus:ring-brand-gold focus:ring-2 cursor-pointer"/>
              <span className="ml-3 text-base text-brand-light/90">Activer uniquement pour la 1ère place : un défi ne départagera que les ex æquo pour la victoire.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Rounds Setup */}
      <div className="bg-brand-dark/50 p-6 rounded-lg border-2 border-brand-gold/50 shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-gold tracking-widest uppercase">3. Les Manches</h2>
            <button onClick={addRound} className="flex items-center px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark rounded-md text-white font-semibold transition-colors duration-200 text-sm sm:text-base">
                <PlusIcon className="h-5 w-5 mr-2"/>
                Ajouter une Manche
            </button>
        </div>
        <div className="space-y-6">
            {rounds.map((round, roundIndex) => (
                <div key={roundIndex} className="bg-brand-dark/40 p-4 rounded-lg border-2 border-brand-gold/30">
                    <div className="flex justify-between items-center mb-2">
                        <input
                            type="text"
                            value={round.name || ''}
                            onChange={e => handleRoundChange(roundIndex, 'name', e.target.value)}
                            placeholder={`Nom de la Manche ${roundIndex + 1}`}
                            className="font-display text-xl sm:text-2xl font-semibold text-brand-gold/90 bg-transparent border-0 border-b-2 border-brand-gold/50 focus:ring-0 focus:border-brand-gold w-full tracking-wider"
                        />
                        <button onClick={() => removeRound(roundIndex)} className="ml-4 text-brand-burgundy hover:text-red-400">
                            <TrashIcon className="h-6 w-6"/>
                        </button>
                    </div>
                     <input
                        type="text"
                        value={round.prizeCategory || ''}
                        onChange={e => handleRoundChange(roundIndex, 'prizeCategory', e.target.value)}
                        placeholder="Catégorie d'ingrédient (optionnel, ex: Alcools)"
                        className="text-base text-brand-light/80 bg-transparent border-0 border-b border-brand-gold/40 focus:ring-0 focus:border-brand-gold w-full mb-4"
                    />

                    <div className="space-y-4 my-4">
                        {round.questions?.map((_, questionIndex) => renderQuestionInput(roundIndex, questionIndex))}
                    </div>

                    <button onClick={() => addQuestion(roundIndex)} className="flex items-center text-sm sm:text-base px-3 py-1 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md text-white font-semibold transition-colors duration-200">
                        <PlusIcon className="h-4 w-4 mr-1"/>
                        Ajouter une Question
                    </button>

                    <div className="border-t border-brand-gold/30 my-6 mx-4"></div>

                    <h4 className="text-lg sm:text-xl font-medium mb-2 text-brand-light/80">Ingrédients à gagner pour cette manche</h4>
                    <p className="text-brand-light/60 mb-4 text-sm">Le classement déterminera l'ordre de sélection. Le nombre d'ingrédients doit correspondre au nombre d'équipes.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {(round.prizePool || []).map((prize, prizeIndex) => {
                            return (
                                <div key={prizeIndex} className="bg-brand-dark/50 p-3 rounded-md space-y-2 border border-brand-gold/30">
                                    <label className="block text-base font-semibold text-brand-light/70">Ingrédient {prizeIndex + 1}</label>
                                    <input
                                        type="text"
                                        value={prize.name}
                                        onChange={(e) => handlePrizeChange(roundIndex, prizeIndex, 'name', e.target.value)}
                                        placeholder="Nom de l'ingrédient"
                                        className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base"
                                    />
                                    <div className="flex items-center space-x-3 min-h-[80px]">
                                        <div className="flex items-center gap-2">
                                            <label htmlFor={`prize-img-${roundIndex}-${prizeIndex}`} className="cursor-pointer flex items-center px-3 py-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md text-sm">
                                                <UploadIcon className="h-4 w-4 mr-2" />
                                                Charger
                                            </label>
                                        </div>
                                        <input id={`prize-img-${roundIndex}-${prizeIndex}`} type="file" accept="image/*" className="hidden" onChange={(e) => handlePrizeImageUpload(roundIndex, prizeIndex, e.target.files?.[0] || null)} />
                                        {prize.imageUrl && <img src={prize.imageUrl} alt={prize.name} className="h-20 w-20 object-contain" style={{ maskImage: 'radial-gradient(circle, white 50%, transparent 75%)' }} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Start Game */}
      <div className="flex flex-col items-center space-y-4 mt-8">
        {error && <p className="text-red-400 mb-4 text-base sm:text-lg">{error}</p>}
        <div className="flex items-center flex-wrap justify-center gap-4">
            <button
                onClick={() => handleExportAnswers('txt')}
                disabled={rounds.length === 0}
                className="flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-transparent border-2 border-brand-gold/80 text-brand-light hover:bg-brand-gold hover:text-brand-dark rounded-lg font-bold text-lg sm:text-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
                <DownloadIcon className="h-6 w-6 mr-2"/>
                Réponses (TXT)
            </button>
            <button
                onClick={() => handleExportAnswers('csv')}
                disabled={rounds.length === 0}
                className="flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-transparent border-2 border-brand-gold/80 text-brand-light hover:bg-brand-gold hover:text-brand-dark rounded-lg font-bold text-lg sm:text-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
                <DownloadIcon className="h-6 w-6 mr-2"/>
                Réponses (CSV)
            </button>
            <button 
                onClick={validateAndStart}
                className="font-display px-8 py-3 sm:px-12 sm:py-4 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-lg font-bold text-xl sm:text-2xl tracking-widest uppercase transition-all duration-300 transform hover:scale-105 shadow-lg animate-glow"
            >
                Que la partie commence !
            </button>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;
