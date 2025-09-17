import React from 'react';
import { produce } from 'immer';
import type { Round, Prize } from '../../types';
import { UploadIcon, TrashIcon } from '../IconComponents';
import { fileToBase64, generateColorFromName } from '../../utils/helpers';

interface PrizeSetupProps {
  prize: Partial<Prize>;
  roundIndex: number;
  prizeIndex: number;
  setRounds: React.Dispatch<React.SetStateAction<Partial<Round>[]>>;
}

const PrizeSetup: React.FC<PrizeSetupProps> = ({ prize, roundIndex, prizeIndex, setRounds }) => {
  
  const handlePrizeChange = (field: keyof Prize, value: string) => {
    setRounds(
      produce(draft => {
        const p = draft[roundIndex].prizePool![prizeIndex];
        (p as any)[field] = value;
      })
    );
  };

  const handlePrizeImageUpload = async (file: File | null) => {
    if (!file) return;
    const base64 = await fileToBase64(file);
    handlePrizeChange('imageUrl', base64);
  };

  return (
    <div className="bg-brand-dark/50 p-3 rounded-md space-y-2 border border-brand-gold/30">
        <label className="block text-base font-semibold text-brand-light/70">Prix {prizeIndex + 1}</label>
        <input
            type="text"
            value={prize.name}
            onChange={(e) => handlePrizeChange('name', e.target.value)}
            placeholder="Nom du prix"
            className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base"
        />
        <div className="flex items-center space-x-3 min-h-[80px]">
            <div className="flex items-center gap-2">
                <label htmlFor={`prize-img-${roundIndex}-${prizeIndex}`} className="cursor-pointer flex items-center px-3 py-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md text-sm">
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Image
                </label>
                {prize.imageUrl && (
                    <button onClick={() => handlePrizeChange('imageUrl', '')} className="text-brand-burgundy hover:text-red-400" aria-label="Supprimer l'image">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
            <input id={`prize-img-${roundIndex}-${prizeIndex}`} type="file" accept="image/*" className="hidden" onChange={(e) => handlePrizeImageUpload(e.target.files?.[0] || null)} />
            {prize.imageUrl ? (
                <img src={prize.imageUrl} alt={prize.name} className="h-20 w-20 object-contain" style={{ maskImage: 'radial-gradient(circle, white 50%, transparent 75%)' }} />
            ) : (
                <div style={{ backgroundColor: generateColorFromName(prize.name) }} className="h-20 w-20 flex items-center justify-center rounded-lg text-white font-bold text-4xl flex-shrink-0">
                    {prize.name ? prize.name.charAt(0).toUpperCase() : '?'}
                </div>
            )}
        </div>
    </div>
  );
};

export default PrizeSetup;
