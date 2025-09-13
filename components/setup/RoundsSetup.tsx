

import React, { useState } from 'react';
import type { Round, Question, Prize } from '../../types';
import { QuestionType } from '../../types';
import { PlusIcon, TrashIcon, UploadIcon, SpinnerIcon } from '../IconComponents';
import AudioTrimmer from '../AudioTrimmer';

interface RoundsSetupProps {
    rounds: Partial<Round>[];
    setRounds: React.Dispatch<React.SetStateAction<Partial<Round>[]>>;
    numTeams: number;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Utility function to convert an AudioBuffer to a WAV file (Blob)
const audioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [];
    let i, sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }

    // write interleaved data
    for (i = 0; i < numOfChan; i++) {
        channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(pos, sample, true); // write 16-bit sample
            pos += 2;
        }
        offset++;
    }

    return new Blob([view], { type: "audio/wav" });
};


const normalizeAudio = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const reader = new FileReader();

        reader.onload = async (e) => {
            if (!e.target?.result) {
              console.warn("Failed to read file, falling back.");
              resolve(fileToBase64(file)); // Fallback
              return;
            }
            try {
                const decodedData = await audioContext.decodeAudioData(e.target.result as ArrayBuffer);
                
                let max = 0;
                for (let c = 0; c < decodedData.numberOfChannels; c++) {
                    const channelData = decodedData.getChannelData(c);
                    for (let i = 0; i < channelData.length; i++) {
                        max = Math.max(max, Math.abs(channelData[i]));
                    }
                }

                if (max === 0) { // Audio is silent
                  resolve(fileToBase64(file));
                  return;
                }
                
                // Use a slight margin to avoid potential clipping
                const gain = 0.98 / max;

                const offlineContext = new OfflineAudioContext(decodedData.numberOfChannels, decodedData.length, decodedData.sampleRate);
                const source = offlineContext.createBufferSource();
                source.buffer = decodedData;

                const gainNode = offlineContext.createGain();
                gainNode.gain.value = gain;

                source.connect(gainNode);
                gainNode.connect(offlineContext.destination);
                source.start(0);

                const renderedBuffer = await offlineContext.startRendering();
                const wavBlob = audioBufferToWavBlob(renderedBuffer);

                const normalizedReader = new FileReader();
                normalizedReader.onload = () => resolve(normalizedReader.result as string);
                normalizedReader.onerror = (err) => {
                  console.warn("Error reading normalized blob, falling back.", err);
                  resolve(fileToBase64(file));
                };
                normalizedReader.readAsDataURL(wavBlob);

            } catch (err) {
                console.error("Error processing audio, falling back to original:", err);
                resolve(fileToBase64(file)); // Fallback to original file if normalization fails
            }
        };
        reader.onerror = (err) => {
          console.warn("Error reading file for normalization, falling back.", err);
          resolve(fileToBase64(file)); // Fallback
        };
        reader.readAsArrayBuffer(file);
    });
};


const RoundsSetup: React.FC<RoundsSetupProps> = ({ rounds, setRounds, numTeams }) => {
    const [processingAudio, setProcessingAudio] = useState<Record<string, boolean>>({});

    const addRound = () => {
        setRounds(prev => [
            ...prev, 
            { 
                name: '', 
                questions: [],
                prizePool: Array(numTeams).fill({ name: '', imageUrl: '' }),
            }
        ]);
    };

    const removeRound = (index: number) => {
        setRounds(prev => prev.filter((_, i) => i !== index));
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
        
        if (field === 'splitAnswer' && value === true) {
            newQuestions[questionIndex].points = 2;
        }

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
        
        const processingKey = `${roundIndex}-${questionIndex}`;
        setProcessingAudio(prev => ({ ...prev, [processingKey]: true }));
        
        try {
            const currentAnswer = rounds[roundIndex]?.questions?.[questionIndex]?.answer;
            if (!currentAnswer || currentAnswer.trim() === '') {
                const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                const cleanAnswer = fileName.replace(/[_-]/g, ' ');
                handleQuestionChange(roundIndex, questionIndex, 'answer', cleanAnswer);
            }
            
            handleQuestionChange(roundIndex, questionIndex, 'audioFileName', file.name);

            const normalizedBase64 = await normalizeAudio(file);
            handleQuestionChange(roundIndex, questionIndex, 'audioUrl', normalizedBase64);

        } catch (error) {
            console.error("Failed to normalize and upload audio, falling back:", error);
            const base64 = await fileToBase64(file); // Fallback to non-normalized
            handleQuestionChange(roundIndex, questionIndex, 'audioUrl', base64);
        } finally {
             setProcessingAudio(prev => {
                const newState = { ...prev };
                delete newState[processingKey];
                return newState;
            });
        }
    };

    const renderQuestionInput = (roundIndex: number, questionIndex: number) => {
      const question = rounds[roundIndex]?.questions?.[questionIndex];
      if (!question) return null;
      const isProcessing = processingAudio[`${roundIndex}-${questionIndex}`];

      return (
        <div className="bg-brand-dark/30 p-3 rounded-lg border-2 border-brand-gold/30 space-y-3 shadow-inner">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center space-x-3">
                <label className="text-base font-medium text-brand-light/70 flex-shrink-0">Points</label>
                <input type="number" value={question.points || ''} min="1" onChange={e => handleQuestionChange(roundIndex, questionIndex, 'points', e.target.value as any)} placeholder="1" className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base disabled:bg-brand-dark/30 disabled:cursor-not-allowed" disabled={!!question.splitAnswer}/>
              </div>
              <div className="flex items-center space-x-3">
                <label className="text-base font-medium text-brand-light/70 flex-shrink-0">Chrono</label>
                <input type="number" value={question.timer || ''} min="1" onChange={e => handleQuestionChange(roundIndex, questionIndex, 'timer', e.target.value as any)} placeholder="Aucun" className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base"/>
              </div>
            </div>
            
            {(question.type === QuestionType.AUDIO || question.type === QuestionType.LIVE) && (
                <div className="flex items-center space-x-3 pt-1">
                    <input
                        type="checkbox"
                        id={`split-${roundIndex}-${questionIndex}`}
                        checked={!!question.splitAnswer}
                        onChange={(e) => handleQuestionChange(roundIndex, questionIndex, 'splitAnswer', e.target.checked)}
                        className="h-5 w-5 rounded border-brand-gold/70 bg-brand-dark/50 text-brand-gold focus:ring-2 focus:ring-brand-gold"
                    />
                    <label htmlFor={`split-${roundIndex}-${questionIndex}`} className="text-base font-medium text-brand-light/90">
                        Séparer Artiste / Titre (1pt + 1pt)
                    </label>
                </div>
            )}

            <div className="flex space-x-2 pt-1">
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
                    <label className="block text-base font-medium text-brand-light/90 mb-1">Fichier audio</label>
                     {isProcessing ? (
                        <div className="flex items-center gap-2 text-brand-light/80 p-2 bg-brand-dark/20 rounded-md">
                            <SpinnerIcon className="animate-spin h-5 w-5" />
                            <span>Normalisation en cours...</span>
                        </div>
                    ) : (
                      <>
                        <input type="file" accept="audio/*" onChange={e => handleAudioUpload(roundIndex, questionIndex, e.target.files?.[0] || null)} className="text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:font-semibold file:bg-brand-light file:text-brand-dark hover:file:bg-brand-gold"/>
                        {question.audioFileName && !question.audioUrl && (
                             <div className="flex items-center justify-between mt-2 p-2 bg-brand-dark/20 rounded-md border border-red-500/50">
                                <span className="text-red-400/80 text-sm truncate" title={question.audioFileName}>
                                    Fichier manquant : {question.audioFileName}
                                </span>
                            </div>
                        )}
                        {question.audioFileName && question.audioUrl && (
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
                      </>
                    )}
                </div>
            )}
        </div>
      )
    }


    return (
        <div className="space-y-6">
            <div className="flex justify-end">
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
                        
                        <div className="my-4">
                            <h3 className="text-lg sm:text-xl font-medium text-brand-light/80">Questions</h3>
                            <div className="space-y-4 mt-2">
                                {round.questions?.map((_, questionIndex) => renderQuestionInput(roundIndex, questionIndex))}
                            </div>
                        </div>


                        <button onClick={() => addQuestion(roundIndex)} className="flex items-center text-sm sm:text-base px-3 py-1 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md text-white font-semibold transition-colors duration-200">
                            <PlusIcon className="h-4 w-4 mr-1"/>
                            Ajouter une Question
                        </button>

                        <div className="border-t border-brand-gold/30 my-6 mx-4"></div>

                        <h4 className="text-lg sm:text-xl font-medium mb-2 text-brand-light/80">Ingrédients à gagner</h4>
                        <p className="text-brand-light/60 mb-4 text-sm">Le nombre d'ingrédients doit correspondre au nombre d'équipes.</p>
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
    );
}

export default RoundsSetup;