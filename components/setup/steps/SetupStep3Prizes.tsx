import React from 'react';
import type { Prize } from '../../../types.ts';
import { PrizeMode } from '../../../types.ts';
import SetupStepWrapper from '../SetupStepWrapper.tsx';
import PrizeBankSetup from '../PrizeBankSetup.tsx';
import { useTranslations } from '../../../hooks/useTranslations.ts';

interface SetupStep3PrizesProps {
    prizeMode: PrizeMode;
    prizeBank: Prize[];
    setPrizeBank: React.Dispatch<React.SetStateAction<Prize[]>>;
}

const SetupStep3Prizes: React.FC<SetupStep3PrizesProps> = ({ prizeMode, prizeBank, setPrizeBank }) => {
    const t = useTranslations();
    return (
        <SetupStepWrapper title={t.prizesTitle}>
            {prizeMode === PrizeMode.BANK ? (
                <PrizeBankSetup prizes={prizeBank} setPrizes={setPrizeBank} />
            ) : (
                <div className="text-center p-8 bg-brand-dark/30 rounded-lg border border-brand-gold/30">
                    <p className="text-lg text-brand-light/80">
                        {t.perRoundPrizeDesc}
                    </p>
                    <p className="mt-2 text-brand-light/60">
                        {t.perRoundPrizeConfigNext}
                    </p>
                </div>
            )}
        </SetupStepWrapper>
    );
};

export default SetupStep3Prizes;