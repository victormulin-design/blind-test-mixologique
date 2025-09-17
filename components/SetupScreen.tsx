import React, { useState } from 'react';
import type { Team, Round, Prize, GameSettings, Question } from '../types.ts';
import { PrizeMode, TieBreakerRule } from '../types.ts';
import SetupStep0Config from './setup/steps/SetupStep0Config.tsx';
import SetupStep1Teams from './setup/steps/SetupStep1Teams.tsx';
import SetupStep2Rules from './setup/steps/SetupStep2Rules.tsx';
import SetupStep3Prizes from './setup/steps/SetupStep3Prizes.tsx';
import SetupStep4Rounds from './setup/steps/SetupStep4Rounds.tsx';
import SetupStep5Recap from './setup/steps/SetupStep5Recap.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';
import { useNotifications } from '../contexts/NotificationContext.tsx';

interface SetupScreenProps {
  onSetupComplete: (teams: Team[], rounds: Round[], settings: GameSettings, prizeBank?: Prize[]) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupComplete }) => {
  const [step, setStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);
  
  const [numTeams, setNumTeams] = useState(2);
  const [teams, setTeams] = useState<Partial<Team>[]>(Array(2).fill({ name: '' }));
  const [rounds, setRounds] = useState<Partial<Round>[]>([]);
  const [prizeBank, setPrizeBank] = useState<Prize[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
      tieBreakerRule: TieBreakerRule.ALL_TIES,
      rules: '',
      prizeMode: PrizeMode.PER_ROUND
  });

  const t = useTranslations();
  const { showNotification } = useNotifications();

  const clearSetup = () => {
    setNumTeams(2);
    setTeams(Array(2).fill({ name: '' }));
    setRounds([]);
    setPrizeBank([]);
    setSettings({
        tieBreakerRule: TieBreakerRule.ALL_TIES,
        rules: '',
        prizeMode: PrizeMode.PER_ROUND
    });
    setStep(1);
    setMaxStepReached(1);
    showNotification(t.configReset, 'success');
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep <= maxStepReached) {
        setStep(targetStep);
    }
  };

  const onConfigLoaded = () => {
    setMaxStepReached(5); // Unlock all steps
    setStep(5); // Go to recap
  };

  const validateAndProceed = () => {
      let isValid = true;
      let validationError = '';

      switch (step) {
          case 1: // Validate Teams
              if (teams.some(t => !t.name?.trim())) {
                  validationError = t.errorAllTeamsMustHaveName;
                  isValid = false;
              }
              break;
          case 3: // Validate Prizes (if bank mode)
              if (settings.prizeMode === PrizeMode.BANK && prizeBank.length === 0) {
                  validationError = t.errorPrizeBankNotEmpty;
                  isValid = false;
              }
              break;
          case 4: // Validate Rounds
              if (rounds.length === 0) {
                  validationError = t.errorMinOneRound;
                  isValid = false;
              } else {
                  for (const r of rounds) {
                      if (!r.name?.trim()) { validationError = t.errorRoundMustHaveName; isValid = false; break; }
                      if (!r.questions || r.questions.length === 0) { validationError = t.errorRoundMinOneQuestion(r.name!); isValid = false; break; }
                      for (const q of r.questions) {
                          if (!q.answer?.trim()) { validationError = t.errorQuestionMustHaveAnswer(r.name!); isValid = false; break; }
                      }
                      if (!isValid) break;
                      if (settings.prizeMode === PrizeMode.PER_ROUND) {
                          if (r.prizePool?.some(p => !p.name?.trim())) { validationError = t.errorPrizesMustHaveName(r.name!); isValid = false; break; }
                          if (r.prizePool?.length !== numTeams) { validationError = t.errorPrizeCountMismatch(r.name!, r.prizePool?.length || 0, numTeams); isValid = false; break; }
                      }
                  }
              }
              break;
          case 5: // Recap step, proceed to game
              const finalTeams: Team[] = teams.map(team => ({ id: crypto.randomUUID(), name: team.name!, collectedPrizes: [], scores: {} }));
              const finalRounds: Round[] = rounds.map(r => ({ id: crypto.randomUUID(), name: r.name!, prizeCategory: r.prizeCategory, questions: r.questions as Question[], prizePool: (r.prizePool || []).map(p => ({...p, id: p.id || crypto.randomUUID()})), isCompleted: false }));
              const finalPrizeBank: Prize[] = prizeBank.map(p => ({ ...p, id: p.id || crypto.randomUUID() }));
              onSetupComplete(finalTeams, finalRounds, settings, finalPrizeBank);
              return;
      }

      if (isValid) {
          const nextStep = step + 1;
          setStep(nextStep);
          setMaxStepReached(Math.max(maxStepReached, nextStep));
      } else {
          showNotification(validationError, 'error');
      }
  };
  
  const buttonText = {
      0: t.createGameButtonSetup,
      1: t.nextButtonRules,
      2: t.nextButtonPrizes,
      3: t.nextButtonRounds,
      4: t.nextButtonRecap,
      5: t.startGameButton
  }[step];
  
  const stepTitles = [t.step0, t.step1, t.step2, t.step3, t.step4, t.step5];

  const currentConfigForExport = { teams, rounds, settings, prizeBank, numTeams };

  return (
    <div className="space-y-6 animate-slide-in-up">
      <div className="bg-brand-dark/50 rounded-lg border-2 border-brand-gold/50 shadow-lg p-4 sm:p-6">
        <div className="flex items-center mb-4 border-b-2 border-brand-gold/20 pb-4">
            {stepTitles.map((title, index) => (
                <React.Fragment key={index}>
                    <div className="flex-shrink-0">
                        <button 
                            onClick={() => handleStepClick(index)}
                            disabled={index > maxStepReached}
                            className={`flex items-center gap-2 transition-colors duration-300 ${step >= index ? 'text-brand-gold' : 'text-brand-light/50'} disabled:cursor-not-allowed`}
                        >
                            <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold leading-none transition-all duration-300 ${step >= index ? 'bg-brand-gold text-brand-dark border-brand-gold' : 'border-brand-light/50'}`}>{index+1}</div>
                            <span className="hidden sm:block font-semibold">{title}</span>
                        </button>
                    </div>
                    {index < stepTitles.length - 1 && (
                        <div className={`flex-1 h-0.5 transition-colors duration-500 mx-2 ${step > index ? 'bg-brand-gold' : 'bg-brand-gold/30'}`}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
        
        <div className="min-h-[400px] pt-2">
          {step === 0 && <SetupStep0Config 
            setTeams={setTeams} 
            setRounds={setRounds} 
            setNumTeams={setNumTeams} 
            setSettings={setSettings} 
            setPrizeBank={setPrizeBank} 
            onConfigLoaded={onConfigLoaded}
            currentConfig={currentConfigForExport}
            clearSetup={clearSetup}
          />}
          {step === 1 && <SetupStep1Teams numTeams={numTeams} setNumTeams={setNumTeams} teams={teams} setTeams={setTeams} setRounds={setRounds} />}
          {step === 2 && <SetupStep2Rules settings={settings} setSettings={setSettings} />}
          {step === 3 && <SetupStep3Prizes prizeMode={settings.prizeMode} prizeBank={prizeBank} setPrizeBank={setPrizeBank} />}
          {step === 4 && <SetupStep4Rounds rounds={rounds} setRounds={setRounds} numTeams={numTeams} prizeMode={settings.prizeMode} />}
          {step === 5 && <SetupStep5Recap teams={teams} rounds={rounds} settings={settings} prizeBank={prizeBank} setStep={setStep} />}
        </div>
      </div>
      
      <div className="flex flex-col items-center space-y-4 py-2">
        <div className="flex items-center gap-4 w-full max-w-lg">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 font-display px-6 py-3 bg-transparent border-2 border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark rounded-lg font-bold text-lg tracking-widest uppercase transition-all duration-300">
              {t.previousButton}
            </button>
          )}
          <button onClick={validateAndProceed} className="flex-1 font-display px-6 py-3 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-lg font-bold text-lg tracking-widest uppercase transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;