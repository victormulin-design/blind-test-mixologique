import React from 'react';
import type { Round } from '../../../types.ts';
import { PrizeMode } from '../../../types.ts';
import SetupStepWrapper from '../SetupStepWrapper.tsx';
import RoundsSetup from '../RoundsSetup.tsx';
import { useTranslations } from '../../../hooks/useTranslations.ts';

interface SetupStep4RoundsProps {
    rounds: Partial<Round>[];
    setRounds: React.Dispatch<React.SetStateAction<Partial<Round>[]>>;
    numTeams: number;
    prizeMode: PrizeMode;
}

const SetupStep4Rounds: React.FC<SetupStep4RoundsProps> = (props) => {
    const t = useTranslations();
    return (
        <SetupStepWrapper title={t.roundsTitle}>
           <RoundsSetup {...props} />
        </SetupStepWrapper>
    );
};

export default SetupStep4Rounds;