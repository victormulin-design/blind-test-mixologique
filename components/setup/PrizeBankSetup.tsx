import React, { useState } from 'react';
import type { Prize } from '../../types.ts';
import { PlusIcon, TrashIcon, UploadIcon, SparklesIcon } from '../IconComponents.tsx';
import AiAssistant from './AiAssistant.tsx';
import { fileToBase64, generateColorFromName } from '../../utils/helpers.ts';

interface PrizeBankSetupProps {
    prizes: Prize[];
    setPrizes: React.Dispatch<React.SetStateAction<Prize[]>>;
}

const PrizeBankSetup: React.FC<PrizeBankSetupProps> = ({ prizes, setPrizes }) => {
    const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

    // FIX: Changed parameter from Partial<Prize>[] to Prize[] to fix type error.
    const handleAiPrizesGenerated = (newPrizes: Prize[]) => {
        setPrizes(prev => [...prev, ...newPrizes]);
    };

    const addPrize = () => {
        setPrizes(prev => [...prev, { name: '', imageUrl: '' }]);
    };

    const removePrize = (index: number) => {
        setPrizes(prev => prev.filter((_, i) => i !== index));
    };

    const handlePrizeChange = (index: number, field: keyof Prize, value: string) => {
        const newPrizes = [...prizes];
        newPrizes[index] = { ...newPrizes[index], [field]: value };
        setPrizes(newPrizes);
    };

    const handlePrizeImageUpload = async (index: number, file: File | null) => {
        if (!file) return;
        const base64 = await fileToBase64(file);
        handlePrizeChange(index, 'imageUrl', base64);
    };

    return (
        <div className="space-y-6">
            {isAiAssistantOpen && (
                <AiAssistant
                    modes={['prizes']}
                    onClose={() => setIsAiAssistantOpen(false)}
                    onGeneratedPrizes={handleAiPrizesGenerated}
                />
            )}
             <div className="flex justify-between items-center">
                <p className="text-brand-light/80">Configurez tous les prix qui pourront être gagnés pendant la partie.</p>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsAiAssistantOpen(true)} className="flex items-center px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded-md text-white font-semibold transition-colors duration-200 text-sm sm:text-base">
                        <SparklesIcon className="h-5 w-5 mr-2"/>
                        Idées
                    </button>
                    <button onClick={addPrize} className="flex items-center px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark rounded-md text-white font-semibold transition-colors duration-200 text-sm sm:text-base">
                        <PlusIcon className="h-5 w-5 mr-2"/>
                        Ajouter
                    </button>
                </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {prizes.map((prize, index) => (
                    <div key={index} className="bg-brand-dark/50 p-3 rounded-md space-y-2 border border-brand-gold/30">
                        <div className="flex justify-between items-center">
                            <label className="block text-base font-semibold text-brand-light/70">Prix {index + 1}</label>
                             <button onClick={() => removePrize(index)} className="text-brand-burgundy hover:text-red-400">
                                <TrashIcon className="h-5 w-5"/>
                            </button>
                        </div>
                        <input
                            type="text"
                            value={prize.name}
                            onChange={(e) => handlePrizeChange(index, 'name', e.target.value)}
                            placeholder="Nom du prix"
                            className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base"
                        />
                        <div className="flex items-center space-x-3 min-h-[80px]">
                            <div className="flex items-center gap-2">
                                <label htmlFor={`prize-bank-img-${index}`} className="cursor-pointer flex items-center px-3 py-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md text-sm">
                                    <UploadIcon className="h-4 w-4 mr-2" />
                                    Image
                                </label>
                                {prize.imageUrl && (
                                    <button onClick={() => handlePrizeChange(index, 'imageUrl', '')} className="text-brand-burgundy hover:text-red-400" aria-label="Supprimer l'image">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                            <input id={`prize-bank-img-${index}`} type="file" accept="image/*" className="hidden" onChange={(e) => handlePrizeImageUpload(index, e.target.files?.[0] || null)} />
                            {prize.imageUrl ? (
                                <img src={prize.imageUrl} alt={prize.name} className="h-20 w-20 object-contain" style={{ maskImage: 'radial-gradient(circle, white 50%, transparent 75%)' }} />
                            ) : (
                                <div style={{ backgroundColor: generateColorFromName(prize.name) }} className="h-20 w-20 flex items-center justify-center rounded-lg text-white font-bold text-4xl flex-shrink-0">
                                    {prize.name ? prize.name.charAt(0).toUpperCase() : '?'}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PrizeBankSetup;