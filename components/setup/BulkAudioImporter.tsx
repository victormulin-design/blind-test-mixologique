

import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { Round } from '../../types.ts';
import { QuestionType } from '../../types.ts';
import { SpinnerIcon, UploadIcon, CheckIcon } from '../IconComponents.tsx';

interface BulkAudioImporterProps {
    rounds: Partial<Round>[];
    setRounds: React.Dispatch<React.SetStateAction<Partial<Round>[]>>;
    onClose: () => void;
}

type Match = { filename: string; matchedAnswer: string | null; confidence: number };
type StagedFile = { file: File; base64: string };

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

const matchSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            filename: { type: Type.STRING },
            matchedAnswer: { type: Type.STRING },
            confidence: { type: Type.NUMBER, description: "A confidence score from 0 to 1 on the quality of the match." },
        },
        required: ["filename", "matchedAnswer", "confidence"],
    },
};

const BulkAudioImporter: React.FC<BulkAudioImporterProps> = ({ rounds, setRounds, onClose }) => {
    const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileDrop = useCallback(async (event: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        setError('');
        const files = 'dataTransfer' in event ? event.dataTransfer.files : event.target.files;
        if (!files || files.length === 0) return;

        const audioFiles = Array.from(files).filter(file => file.type.startsWith('audio/'));
        
        setIsLoading(true);
        try {
            const processedFiles = await Promise.all(
                audioFiles.map(async file => ({ file, base64: await fileToBase64(file) }))
            );
            setStagedFiles(prev => [...prev, ...processedFiles]);
        } catch (err) {
            setError("Erreur lors de la lecture des fichiers.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleMatchWithAI = async () => {
        if (stagedFiles.length === 0) {
            setError("Veuillez d'abord ajouter des fichiers audio.");
            return;
        }
        if (!process.env.API_KEY) {
            alert("Erreur : La clé API Gemini n'est pas configurée.");
            return;
        }
        
        setIsLoading(true);
        setError('');

        const audioQuestions = rounds.flatMap(r => r.questions || [])
            .filter(q => q.type === QuestionType.AUDIO && !q.audioUrl)
            .map(q => q.answer);

        if (audioQuestions.length === 0) {
            setError("Aucune question de type AUDIO sans fichier audio n'a été trouvée.");
            setIsLoading(false);
            return;
        }
        
        const filenames = stagedFiles.map(f => f.file.name);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Match the following audio filenames to the most likely correct answer from the provided list. The filenames often contain the artist and title. Provide a confidence score for each match.
            
            Filenames: ${JSON.stringify(filenames)}
            
            Possible Answers: ${JSON.stringify(audioQuestions)}
            
            Return ONLY the JSON array.`;
            
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: matchSchema,
              },
            });

            const resultText = response.text.trim();
            const aiMatches: Match[] = JSON.parse(resultText);
            setMatches(aiMatches);
            
        } catch (err) {
            console.error("Erreur de l'assistant IA:", err);
            setError("L'association par IA a échoué. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleApplyMatches = () => {
        const newRounds = JSON.parse(JSON.stringify(rounds));
        let appliedCount = 0;
        
        matches.forEach(match => {
            const stagedFile = stagedFiles.find(sf => sf.file.name === match.filename);
            if (!stagedFile) return;

            for (const round of newRounds) {
                if (round.questions) {
                    const questionIndex = round.questions.findIndex((q: any) => q.answer === match.matchedAnswer && q.type === QuestionType.AUDIO && !q.audioUrl);
                    if (questionIndex !== -1) {
                        round.questions[questionIndex].audioUrl = stagedFile.base64;
                        round.questions[questionIndex].audioFileName = stagedFile.file.name;
                        appliedCount++;
                        // Prevent re-matching the same question
                        break; 
                    }
                }
            }
        });
        
        setRounds(newRounds);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in" onClick={onClose}>
            <div className="bg-brand-dark/95 border-2 border-brand-gold/50 rounded-lg shadow-2xl p-6 w-full max-w-4xl m-4 text-brand-light space-y-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-display text-2xl text-brand-gold tracking-widest text-center">Importation Audio en Masse</h3>
                
                <div 
                    onDragOver={e => e.preventDefault()} 
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-brand-gold/50 rounded-lg p-8 text-center bg-brand-dark/30"
                >
                    <UploadIcon className="h-12 w-12 mx-auto text-brand-gold/70" />
                    <p className="mt-2 text-lg">Glissez-déposez vos fichiers audio ici</p>
                    <p className="text-sm text-brand-light/60">ou</p>
                    <label className="font-semibold text-brand-gold hover:underline cursor-pointer">
                        Parcourir les fichiers
                        <input type="file" multiple accept="audio/*" className="hidden" onChange={handleFileDrop} />
                    </label>
                </div>

                {stagedFiles.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-lg mb-2">Fichiers en attente ({stagedFiles.length})</h4>
                        <div className="max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                            {stagedFiles.map((sf, i) => <p key={i} className="text-sm bg-brand-dark/20 p-1 rounded truncate">{sf.file.name}</p>)}
                        </div>
                    </div>
                )}
                
                {isLoading && (
                     <div className="flex items-center justify-center gap-3 text-brand-light p-4">
                        <SpinnerIcon className="h-8 w-8 animate-spin text-brand-gold" />
                        <span className="text-lg font-semibold">Traitement en cours...</span>
                    </div>
                )}
                
                {error && <p className="text-red-400 text-center">{error}</p>}
                
                {matches.length > 0 && (
                     <div>
                        <h4 className="font-semibold text-lg mb-2">Correspondances proposées par l'IA</h4>
                        <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar border border-brand-gold/30 rounded-lg">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-brand-dark/50 sticky top-0">
                                    <tr>
                                        <th className="p-2">Fichier Audio</th>
                                        <th className="p-2">Réponse Associée</th>
                                        <th className="p-2">Confiance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {matches.map((match, i) => (
                                        <tr key={i} className="border-t border-brand-gold/20">
                                            <td className="p-2 truncate" title={match.filename}>{match.filename}</td>
                                            <td className="p-2 text-brand-gold">{match.matchedAnswer}</td>
                                            <td className="p-2">{Math.round(match.confidence * 100)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <button onClick={onClose} className="flex-1 font-display px-6 py-2 bg-brand-dark/50 border border-brand-burgundy hover:bg-brand-burgundy rounded-lg font-bold text-lg tracking-widest uppercase">Annuler</button>
                    {matches.length > 0 ? (
                         <button onClick={handleApplyMatches} className="flex-1 font-display px-6 py-2 bg-green-700 hover:bg-green-600 rounded-lg font-bold text-lg tracking-widest uppercase flex items-center justify-center gap-2">
                             <CheckIcon className="h-6 w-6"/>Appliquer les correspondances
                         </button>
                    ) : (
                         <button onClick={handleMatchWithAI} disabled={isLoading || stagedFiles.length === 0} className="flex-1 font-display px-6 py-2 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-lg font-bold text-lg tracking-widest uppercase disabled:opacity-50">
                            Associer avec l'IA
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default BulkAudioImporter;