
import React, { useState, useRef, useEffect } from 'react';
import type { Team, Round, Prize, Question, GameSettings } from '../types';
import { TieBreakerRule } from '../types';
import { PlusIcon, TrashIcon, UploadIcon, DownloadIcon, SaveIcon, FolderOpenIcon, ClearIcon, SpinnerIcon, ChevronDownIcon } from './IconComponents';
import { GoogleGenAI, Type } from "@google/genai";
import RoundsSetup from './setup/RoundsSetup';
import JSZip from 'jszip';


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

const processZipFile = async (file: File): Promise<any> => {
    const zip = await JSZip.loadAsync(file);

    const configFileEntry = zip.file(/config\.json$/i)[0];
    if (!configFileEntry) {
        throw new Error('Could not find config.json in the zip file.');
    }
    const configText = await configFileEntry.async('string');
    const config = JSON.parse(configText);

    if (!config.rounds || !Array.isArray(config.rounds)) {
        return config;
    }

    const audioPathPrefixes = ['audio/', 'audios/', ''];

    for (const round of config.rounds) {
        if (round.questions && Array.isArray(round.questions)) {
            for (const question of round.questions) {
                if (question.type === 'AUDIO' && question.audioFileName && !question.audioUrl) {
                    let audioFileEntry: any = null;
                    for (const prefix of audioPathPrefixes) {
                        const path = prefix + question.audioFileName;
                        const entry = zip.file(path);
                        if (entry) {
                            audioFileEntry = entry;
                            break;
                        }
                    }

                    if (audioFileEntry) {
                        const blob = await audioFileEntry.async('blob');
                        question.audioUrl = URL.createObjectURL(blob);
                    } else {
                        console.warn(`Audio file "${question.audioFileName}" not found in zip.`);
                    }
                }
            }
        }
    }
    return config;
};

const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupComplete }) => {
  const [numTeams, setNumTeams] = useState(2);
  const [teams, setTeams] = useState<Partial<Team>[]>(Array(2).fill({ name: '' }));
  const [rounds, setRounds] = useState<Partial<Round>[]>([]);
  const [tieBreakerRule, setTieBreakerRule] = useState<TieBreakerRule>(TieBreakerRule.ALL_TIES);
  const [rules, setRules] = useState('');
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);
  const bulkAudioFileRef = useRef<HTMLInputElement>(null);
  
  const [availableConfigs, setAvailableConfigs] = useState<AvailableConfig[]>([]);
  const [newConfigName, setNewConfigName] = useState('');

  const [isAiMatching, setIsAiMatching] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  
  const [openSections, setOpenSections] = useState<string[]>(['gestion', 'concurrents', 'regles', 'manches']);

  const toggleSection = (section: string) => {
      setOpenSections(prev => 
          prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
      );
  };


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
  
  const handleSaveConfig = () => {
    if (!newConfigName.trim()) {
      showNotification('Veuillez entrer un nom pour la configuration.');
      return;
    }
    const localConfigsRaw = localStorage.getItem('blindTestConfigs');
    const localConfigs = localConfigsRaw ? JSON.parse(localConfigsRaw) : {};
    
    const configData = { teams, rounds, numTeams, tieBreakerRule, rules };
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
    const config = { teams, rounds, numTeams, tieBreakerRule, rules };
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

  const handleImportConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.zip')) {
        try {
            showNotification('Traitement du fichier ZIP...');
            const config = await processZipFile(file);
            loadPreset(config, file.name);
            showNotification('Configuration ZIP importée avec succès !');
        } catch (err: any) {
            setError('Échec du traitement du fichier ZIP: ' + err.message);
        }
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                const config = JSON.parse(text as string);
                if (Array.isArray(config.teams) && Array.isArray(config.rounds) && typeof config.numTeams === 'number') {
                    loadPreset(config, file.name);
                    showNotification('Configuration JSON importée avec succès !');
                } else {
                    setError('Structure de fichier de configuration invalide.');
                }
            } catch (err) {
                setError('Échec de l\'analyse du fichier de configuration.');
            }
        };
        reader.readAsText(file);
    }
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
    setRules(config.rules || '');
    showNotification(`Configuration "${name}" chargée !`);
  };

  const handleClearAll = () => {
    setNumTeams(2);
    setTeams(Array(2).fill({ name: '' }));
    setRounds([]);
    setError('');
    setTieBreakerRule(TieBreakerRule.ALL_TIES);
    setRules('');
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
                type: "AUDIO",
                points: 1,
                audioUrl,
                audioFileName: file.name
            };
        });

        const resolvedQuestions = await Promise.all(questionPromises);
        newRound.questions = resolvedQuestions as Question[];

        setNumTeams(2);
        setTeams(newTeams);
        setRounds([newRound]);
        showNotification(`${files.length} audios importés et une manche créée !`);
    } else { // Mode B: Intelligently match audio to existing questions with AI
        setIsAiMatching(true);
        setAiStatus('Préparation des données...');

        try {
            if (!process.env.API_KEY) {
              alert("Erreur: La clé API Gemini n'est pas configurée. Impossible d'utiliser l'association intelligente.");
              setIsAiMatching(false);
              return;
            }
            setAiStatus('Analyse des fichiers en cours...');
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const newRounds = JSON.parse(JSON.stringify(rounds)) as Partial<Round>[];
            const questionsToMatch: Question[] = newRounds.flatMap(r => r.questions || []).filter(q => q && q.type === "AUDIO" && !q.audioUrl && q.answer);

            if (questionsToMatch.length === 0) {
                showNotification("Aucune question audio sans fichier à assigner.");
                return;
            }

            const questionAnswers = questionsToMatch.map(q => q.answer);
            const fileNames = Array.from(files).map(f => f.name);

            setAiStatus('Contact de l\'IA Gemini...');
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

            setAiStatus('Traitement de la réponse de l\'IA...');
            const resultText = response.text.trim();
            const matches: { answer: string; filename: string | null }[] = JSON.parse(resultText);

            let matchedCount = 0;
            const fileMap = new Map(Array.from(files).map(f => [f.name, f]));
            const questionMap = new Map<string, Question>();
            // Use a unique key for each question to handle duplicate answers
            newRounds.forEach(r => {
                (r.questions || []).forEach((q, i) => {
                    if (q.type === "AUDIO" && !q.audioUrl && q.answer) {
                        questionMap.set(`${q.answer}#${i}`, q);
                    }
                });
            });

            setAiStatus('Assignation des fichiers audio...');
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
            setIsAiMatching(false);
            setAiStatus('');
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
        content += `  Points: ${q.splitAnswer ? '2 (1+1)' : (q.points || 1)}\n`;
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
      
      const settings: GameSettings = { tieBreakerRule, rules };

      onSetupComplete(finalTeams, finalRounds, settings);
  };


  return (
    <div className="space-y-6 animate-slide-in-up">
      {notification && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in z-50 text-lg">
          {notification}
        </div>
      )}

      {/* Config Management */}
       <div className="bg-brand-dark/50 rounded-lg border-2 border-brand-gold/50 shadow-lg">
          <button type="button" onClick={() => toggleSection('gestion')} className="w-full flex justify-between items-center p-4 sm:p-5 text-left">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-gold tracking-widest uppercase">Gestion de la Partie</h2>
              <ChevronDownIcon className={`h-8 w-8 text-brand-gold transition-transform duration-300 ${openSections.includes('gestion') ? 'rotate-180' : ''}`} />
          </button>
          {openSections.includes('gestion') && (
            <div className="px-4 sm:px-6 pb-6 animate-fade-in space-y-6">
              
               <div className="border-b-2 border-brand-gold/30 pb-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-brand-light/80">Charger une configuration</h3>
                {availableConfigs.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {availableConfigs.sort((a,b) => a.name.localeCompare(b.name)).map(config => (
                            <div key={`${config.source}-${config.name}`} className="flex items-center justify-between bg-brand-dark/30 p-2 rounded-md border border-brand-gold/30">
                                <span className="font-medium text-base sm:text-lg flex items-center gap-2">
                                    {config.source === 'preconfigured' && <span title="Configuration pré-enregistrée" className="text-xs bg-brand-burgundy text-white px-2 py-0.5 rounded-full flex-shrink-0">PRÉ</span>}
                                    {config.source === 'local' && <span title="Sauvegardé dans votre navigateur" className="text-xs bg-blue-800 text-white px-2 py-0.5 rounded-full flex-shrink-0">LOC</span>}
                                    <span className="truncate" title={config.name}>{config.name}</span>
                                </span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button onClick={() => handleLoadConfig(config)} className="px-3 py-1 bg-green-800 hover:bg-green-700 rounded text-sm sm:text-base font-semibold">Charger</button>
                                    {config.source === 'local' && (
                                        <button onClick={() => handleDeleteConfig(config.name)} className="text-brand-burgundy hover:text-red-400" aria-label={`Supprimer ${config.name}`}><TrashIcon className="h-5 w-5"/></button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-center text-brand-light/50 text-base p-4 bg-brand-dark/20 rounded-md">Aucune configuration disponible.</p>}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Side: Save/File management */}
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-brand-light/80 border-b-2 border-brand-gold/30 pb-2">Sauvegarde & Fichiers</h3>
                  
                  <div className="flex items-center gap-2">
                    <input type="text" value={newConfigName} onChange={e => setNewConfigName(e.target.value)} placeholder="Nommer la config actuelle..." className="flex-grow bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base"/>
                    <button onClick={handleSaveConfig} className="flex items-center px-4 py-2 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-md font-semibold transition-colors text-sm sm:text-base">
                        <SaveIcon className="h-5 w-5 mr-2" /> Sauver
                    </button>
                  </div>

                  <div className="flex flex-wrap items-start gap-3 justify-center pt-2">
                    <button onClick={handleExportConfig} className="flex-1 flex items-center justify-center px-4 py-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md font-semibold transition-colors text-sm sm:text-base">
                        <DownloadIcon className="h-5 w-5 mr-2" /> Exporter
                    </button>
                    <label className="flex-1 flex items-center justify-center px-4 py-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md font-semibold transition-colors cursor-pointer text-sm sm:text-base">
                        <UploadIcon className="h-5 w-5 mr-2" /> Importer
                        <input type="file" accept=".json,.zip" className="hidden" ref={importFileRef} onChange={handleImportConfig}/>
                    </label>
                    <button onClick={handleClearAll} className="flex-1 flex items-center justify-center px-4 py-2 bg-brand-dark/50 border border-brand-burgundy hover:bg-brand-burgundy rounded-md font-semibold transition-colors text-sm sm:text-base">
                        <ClearIcon className="h-5 w-5 mr-2" /> Tout Effacer
                    </button>
                  </div>
                </div>

                {/* Right Side: Bulk/AI Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-brand-light/80 border-b-2 border-brand-gold/30 pb-2">Actions Avancées</h3>
                   <label className={`flex items-center justify-center text-center p-4 bg-blue-800 rounded-lg font-semibold transition-colors text-white ${isAiMatching ? 'cursor-not-allowed opacity-50' : 'hover:bg-blue-700 cursor-pointer'}`}>
                        <div>
                           <div className="flex items-center justify-center">
                              <UploadIcon className="h-3 w-3 mr-2" />
                              <span className="text-lg">Charger des Audios en Masse</span>
                            </div>
                           <p className="text-sm font-normal mt-1">Crée un nouveau jeu ou associe intelligemment les fichiers aux questions existantes.</p>
                        </div>
                        <input type="file" accept="audio/*" multiple className="hidden" ref={bulkAudioFileRef} onChange={handleBulkAudioUpload} disabled={isAiMatching} />
                    </label>
                    {isAiMatching && (
                        <div className="flex items-center justify-center gap-2 text-brand-light animate-fade-in p-2 bg-brand-dark/50 rounded-md">
                            <SpinnerIcon className="h-6 w-6 text-brand-gold animate-spin" />
                            <span className="font-semibold">{aiStatus}</span>
                        </div>
                    )}
                </div>

              </div>
            </div>
          )}
      </div>
      
      {/* Start Button */}
      <div className="flex flex-col items-center space-y-4 py-2">
        {error && <p className="text-red-400 mb-4 text-base sm:text-lg text-center">{error}</p>}
        <button 
            onClick={validateAndStart}
            className="font-display px-8 py-3 sm:px-10 sm:py-3 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-lg font-bold text-lg sm:text-xl tracking-widest uppercase transition-all duration-300 transform hover:scale-105 shadow-lg animate-glow"
        >
            Que la partie commence !
        </button>
      </div>


      {/* Teams Setup */}
      <div className="bg-brand-dark/50 rounded-lg border-2 border-brand-gold/50 shadow-lg">
         <button type="button" onClick={() => toggleSection('concurrents')} className="w-full flex justify-between items-center p-4 sm:p-5 text-left">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-gold tracking-widest uppercase">1. Les Concurrents</h2>
            <ChevronDownIcon className={`h-8 w-8 text-brand-gold transition-transform duration-300 ${openSections.includes('concurrents') ? 'rotate-180' : ''}`} />
        </button>
        {openSections.includes('concurrents') && (
          <div className="px-4 sm:px-6 pb-6 animate-fade-in">
            <div className="mb-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        )}
      </div>
      
      {/* Tie Breaker Rules */}
      <div className="bg-brand-dark/50 rounded-lg border-2 border-brand-gold/50 shadow-lg">
        <button type="button" onClick={() => toggleSection('regles')} className="w-full flex justify-between items-center p-4 sm:p-5 text-left">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-gold tracking-widest uppercase">2. Règles du Jeu</h2>
            <ChevronDownIcon className={`h-8 w-8 text-brand-gold transition-transform duration-300 ${openSections.includes('regles') ? 'rotate-180' : ''}`} />
        </button>
        {openSections.includes('regles') && (
            <div className="px-4 sm:px-6 pb-6 animate-fade-in">
                <div>
                  <h3 className="text-lg sm:text-xl font-medium text-brand-light/80 mb-3">Gestion des Égalités</h3>
                  <div className="space-y-4">
                    <label className="flex items-start p-3 rounded-lg cursor-pointer transition-colors hover:bg-brand-dark/50">
                      <input type="radio" name="tiebreaker" value={TieBreakerRule.NONE} checked={tieBreakerRule === TieBreakerRule.NONE} onChange={(e) => setTieBreakerRule(e.target.value as TieBreakerRule)} className="h-5 w-5 bg-brand-dark border-brand-gold/70 text-brand-gold focus:ring-brand-gold focus:ring-2 cursor-pointer mt-1"/>
                      <span className="ml-3 text-base text-brand-light/90">
                        <span className="font-semibold">Désactiver :</span> les égalités sont autorisées.
                        <br />
                        <span className="text-sm text-brand-light/60">L'ordre des équipes à égalité sera déterminé au hasard.</span>
                      </span>
                    </label>
                    <label className="flex items-start p-3 rounded-lg cursor-pointer transition-colors hover:bg-brand-dark/50">
                      <input type="radio" name="tiebreaker" value={TieBreakerRule.ALL_TIES} checked={tieBreakerRule === TieBreakerRule.ALL_TIES} onChange={(e) => setTieBreakerRule(e.target.value as TieBreakerRule)} className="h-5 w-5 bg-brand-dark border-brand-gold/70 text-brand-gold focus:ring-brand-gold focus:ring-2 cursor-pointer mt-1"/>
                      <span className="ml-3 text-base text-brand-light/90"><span className="font-semibold">Activer pour toutes les places :</span> un défi départagera toutes les équipes à égalité.</span>
                    </label>
                    <label className="flex items-start p-3 rounded-lg cursor-pointer transition-colors hover:bg-brand-dark/50">
                      <input type="radio" name="tiebreaker" value={TieBreakerRule.FIRST_PLACE_ONLY} checked={tieBreakerRule === TieBreakerRule.FIRST_PLACE_ONLY} onChange={(e) => setTieBreakerRule(e.target.value as TieBreakerRule)} className="h-5 w-5 bg-brand-dark border-brand-gold/70 text-brand-gold focus:ring-brand-gold focus:ring-2 cursor-pointer mt-1"/>
                      <span className="ml-3 text-base text-brand-light/90">
                        <span className="font-semibold">Activer uniquement pour la 1ère place :</span> un défi ne départagera que les ex æquo pour la victoire.
                         <br />
                        <span className="text-sm text-brand-light/60">Les autres égalités seront classées au hasard.</span>
                      </span>
                    </label>
                  </div>
                </div>
                <div className="mt-6">
                    <h3 className="text-lg sm:text-xl font-medium text-brand-light/80 mb-3">Condition de Victoire / Règles Spécifiques</h3>
                    <textarea
                        value={rules}
                        onChange={(e) => setRules(e.target.value)}
                        placeholder="Optionnel. Si rempli, un écran affichera ces règles au début de la partie."
                        className="w-full h-24 bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition text-base"
                    />
                </div>
            </div>
        )}
      </div>

      <div className="bg-brand-dark/50 rounded-lg border-2 border-brand-gold/50 shadow-lg">
          <button type="button" onClick={() => toggleSection('manches')} className="w-full flex justify-between items-center p-4 sm:p-5 text-left">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-gold tracking-widest uppercase">3. Les Manches</h2>
            <ChevronDownIcon className={`h-8 w-8 text-brand-gold transition-transform duration-300 ${openSections.includes('manches') ? 'rotate-180' : ''}`} />
          </button>
          {openSections.includes('manches') && (
            <div className="px-4 sm:px-6 pb-6 animate-fade-in">
              <RoundsSetup 
                rounds={rounds}
                setRounds={setRounds}
                numTeams={numTeams}
              />
            </div>
          )}
      </div>


      {/* Start Game */}
      <div className="flex flex-col items-center space-y-4 mt-6">
        {error && <p className="text-red-400 mb-4 text-base sm:text-lg text-center">{error}</p>}
        <div className="flex items-center flex-wrap justify-center gap-4">
            <button
                onClick={() => handleExportAnswers('txt')}
                disabled={rounds.length === 0}
                className="flex items-center px-4 py-2 sm:px-6 sm:py-2 bg-transparent border-2 border-brand-gold/80 text-brand-light hover:bg-brand-gold hover:text-brand-dark rounded-lg font-bold text-lg sm:text-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
                <DownloadIcon className="h-6 w-6 mr-2"/>
                Réponses (TXT)
            </button>
            <button
                onClick={() => handleExportAnswers('csv')}
                disabled={rounds.length === 0}
                className="flex items-center px-4 py-2 sm:px-6 sm:py-2 bg-transparent border-2 border-brand-gold/80 text-brand-light hover:bg-brand-gold hover:text-brand-dark rounded-lg font-bold text-lg sm:text-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
                <DownloadIcon className="h-6 w-6 mr-2"/>
                Réponses (CSV)
            </button>
            <button 
                onClick={validateAndStart}
                className="font-display px-8 py-3 sm:px-10 sm:py-3 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-lg font-bold text-lg sm:text-xl tracking-widest uppercase transition-all duration-300 transform hover:scale-105 shadow-lg animate-glow"
            >
                Que la partie commence !
            </button>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;