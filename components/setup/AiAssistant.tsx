import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { Question, Prize } from '../../types.ts';
import { QuestionType } from '../../types.ts';
import { SparklesIcon, SpinnerIcon } from '../IconComponents.tsx';
import { useNotifications } from '../../contexts/NotificationContext.tsx';

interface AiAssistantProps {
  modes: ('questions' | 'prizes')[];
  onClose: () => void;
  onGeneratedQuestions?: (questions: Question[]) => void;
  onGeneratedPrizes?: (prizes: Prize[]) => void;
}

const questionSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        questionText: { type: Type.STRING, description: "The text of the question to ask." },
        answer: { type: Type.STRING, description: "The correct answer to the question." },
        clue: { type: Type.STRING, description: "An optional hint for the players." },
      },
      required: ["questionText", "answer"],
    },
};

const prizeSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The creative name of the prize." },
      },
      required: ["name"],
    },
};


const AiAssistant: React.FC<AiAssistantProps> = ({ modes, onClose, onGeneratedQuestions, onGeneratedPrizes }) => {
    const [activeMode, setActiveMode] = useState<'questions' | 'prizes'>(modes[0]);
    const [topic, setTopic] = useState('');
    const [numItems, setNumItems] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any[] | null>(null);
    const { showNotification } = useNotifications();

    const handleGenerate = async () => {
        if (!topic.trim()) {
            showNotification('Veuillez entrer un sujet.', 'error');
            return;
        }
        if (!process.env.API_KEY) {
            showNotification("Erreur : La clé API Gemini n'est pas configurée.", 'error');
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const isQuestions = activeMode === 'questions';
            const prompt = isQuestions
                ? `Generate ${numItems} trivia questions about "${topic}". They should be varied and interesting. Include a short, optional clue for each.`
                : `Generate ${numItems} creative prize names related to the theme "${topic}".`;
            const schema = isQuestions ? questionSchema : prizeSchema;

            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: schema,
              },
            });

            const resultText = response.text.trim();
            const generatedItems = JSON.parse(resultText);

            // --- Validation ---
            if (!Array.isArray(generatedItems)) {
                throw new Error("AI response was not a valid array.");
            }
            if (isQuestions && generatedItems.some(q => typeof q.questionText !== 'string' || typeof q.answer !== 'string')) {
                throw new Error("AI response for questions has incorrect format.");
            }
             if (!isQuestions && generatedItems.some(p => typeof p.name !== 'string')) {
                throw new Error("AI response for prizes has incorrect format.");
            }
            // --- End Validation ---

            setResult(generatedItems);

        } catch (err) {
            console.error("Erreur de l'assistant IA:", err);
            showNotification("Une erreur est survenue lors de la génération. Veuillez réessayer.", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddContent = () => {
        if (!result) return;
        if (activeMode === 'questions' && onGeneratedQuestions) {
            const newQuestions: Question[] = result.map(item => ({
                ...item,
                type: QuestionType.LIVE, // Default to LIVE
                points: 1,
            }));
            onGeneratedQuestions(newQuestions);
        } else if (activeMode === 'prizes' && onGeneratedPrizes) {
            const newPrizes: Prize[] = result.map(item => ({
                name: item.name,
                imageUrl: '',
            }));
            onGeneratedPrizes(newPrizes);
        }
        onClose();
    };

    const renderResult = () => {
        if (!result) return null;
        return (
            <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {result.map((item, index) => (
                    <div key={index} className="p-3 bg-brand-dark/40 rounded-lg border border-brand-gold/30">
                        {activeMode === 'questions' ? (
                            <>
                                <p className="font-semibold text-brand-light">{index + 1}. {item.questionText}</p>
                                <p className="text-brand-gold"><span className="font-bold">R:</span> {item.answer}</p>
                                {item.clue && <p className="text-brand-light/70 italic"><span className="font-bold">I:</span> {item.clue}</p>}
                            </>
                        ) : (
                            <p className="font-semibold text-brand-light">{item.name}</p>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div 
            className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in" 
            onClick={onClose}
        >
           <div 
                className="bg-brand-dark/95 border-2 border-brand-gold/50 rounded-lg shadow-2xl p-6 w-full max-w-2xl m-4 text-brand-light space-y-4" 
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="flex items-center justify-center gap-3 font-display text-2xl text-brand-gold tracking-widest uppercase">
                    <SparklesIcon className="h-7 w-7"/> Assistant IA
                </h3>

                {modes.length > 1 && (
                    <div className="flex justify-center bg-brand-dark/50 p-1 rounded-lg">
                        {modes.map(mode => (
                            <button 
                                key={mode}
                                onClick={() => setActiveMode(mode)}
                                className={`flex-1 px-4 py-2 rounded-md font-semibold transition-colors text-sm ${activeMode === mode ? 'bg-brand-burgundy text-white' : 'text-brand-light/70 hover:bg-brand-dark/70'}`}
                            >
                                {mode === 'questions' ? 'Générer des Questions' : 'Générer des Prix'}
                            </button>
                        ))}
                    </div>
                )}

                <div>
                    <label htmlFor="ai-topic" className="block text-lg font-medium text-brand-light/80 mb-1">
                        Sujet / Thème
                    </label>
                    <input 
                        type="text" 
                        id="ai-topic"
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder={activeMode === 'questions' ? "Ex: Films de science-fiction des années 90" : "Ex: Pirates"}
                        className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition"
                    />
                </div>

                 <div>
                    <label htmlFor="ai-num" className="block text-lg font-medium text-brand-light/80 mb-1">
                        Nombre
                    </label>
                    <input 
                        type="number" 
                        id="ai-num"
                        value={numItems}
                        min="1"
                        max="20"
                        onChange={e => setNumItems(parseInt(e.target.value, 10))}
                        className="w-24 bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition"
                    />
                </div>
                
                {isLoading && (
                    <div className="flex items-center justify-center gap-3 text-brand-light p-4">
                        <SpinnerIcon className="h-8 w-8 animate-spin text-brand-gold" />
                        <span className="text-lg font-semibold">Génération en cours...</span>
                    </div>
                )}

                {result && renderResult()}
                
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <button onClick={onClose} className="flex-1 font-display px-6 py-2 bg-brand-dark/50 border border-brand-burgundy hover:bg-brand-burgundy rounded-lg font-bold text-lg tracking-widest uppercase transition-all duration-300">
                        Annuler
                    </button>
                    {result ? (
                         <button onClick={handleAddContent} className="flex-1 font-display px-6 py-2 bg-green-700 hover:bg-green-600 rounded-lg font-bold text-lg tracking-widest uppercase transition-all duration-300">
                           Ajouter ({result.length})
                        </button>
                    ) : (
                        <button onClick={handleGenerate} disabled={isLoading} className="flex-1 font-display px-6 py-2 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-lg font-bold text-lg tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-wait">
                            Générer
                        </button>
                    )}
                </div>
           </div>
        </div>
    );
};

export default AiAssistant;