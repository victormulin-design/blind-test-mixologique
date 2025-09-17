import React, { useState, useEffect } from 'react';
import type { Team, Round, Question, Prize, GameSettings } from './types.ts';
import { TieBreakerRule, PrizeMode } from './types.ts';
import SetupScreen from './components/SetupScreen.tsx';
import GameScreen from './components/GameScreen.tsx';
import WelcomeScreen from './components/WelcomeScreen.tsx';
import WaitingRoom from './components/game/WaitingRoom.tsx';
import { CloseIcon, GearIcon } from './components/IconComponents.tsx';
import ThemeSelector from './components/ThemeSelector.tsx';
import LanguageSelector from './components/LanguageSelector.tsx';
import Notification from './components/common/Notification.tsx';
import JSZip from 'jszip';
import { useTranslations } from './hooks/useTranslations.ts';
import { useNotifications } from './contexts/NotificationContext.tsx';
import { BuzzerProvider } from './contexts/BuzzerContext.tsx';

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


const App: React.FC = () => {
  const [gameState, setGameState] = useState<'WELCOME' | 'SETUP' | 'WAITING_ROOM' | 'GAME'>('WELCOME');
  const [teams, setTeams] = useState<Team[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [prizeBank, setPrizeBank] = useState<Prize[]>([]);
  const [settings, setSettings] = useState<GameSettings>({ tieBreakerRule: TieBreakerRule.ALL_TIES, rules: '', prizeMode: PrizeMode.PER_ROUND });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const t = useTranslations();
  const { showNotification } = useNotifications();
  
  useEffect(() => {
    // Apply theme on initial load from localStorage
    const savedTheme = localStorage.getItem('blindtest-theme') || 'speakeasy-gold';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const height = window.innerHeight;
    let profile = 'large'; // default
    if (height <= 800) {
      profile = 'small';
    }
    document.documentElement.setAttribute('data-screen-profile', profile);
  }, []);


  const handleSetupComplete = (configuredTeams: Team[], configuredRounds: Round[], configuredSettings: GameSettings, configuredPrizeBank?: Prize[]) => {
    setTeams(configuredTeams);
    setRounds(configuredRounds);
    setSettings(configuredSettings);
    setPrizeBank(configuredPrizeBank || []);
    setGameState('WAITING_ROOM');
  };

  const handleStartGame = () => {
    setGameState('GAME');
  };

  const resetGame = () => {
    setGameState('WELCOME');
    setTeams([]);
    setRounds([]);
    setPrizeBank([]);
    setSettings({ tieBreakerRule: TieBreakerRule.ALL_TIES, rules: '', prizeMode: PrizeMode.PER_ROUND });
  }

  const processAndStartGame = (config: any) => {
     // Basic validation
    if (!config.teams || !Array.isArray(config.teams) || !config.rounds || !Array.isArray(config.rounds) || typeof config.numTeams !== 'number') {
      throw new Error('Invalid configuration file structure.');
    }

    // Process data to create final game state
    const finalTeams: Team[] = config.teams.map((t: Partial<Team>) => ({
      id: crypto.randomUUID(),
      name: t.name!,
      collectedPrizes: [],
      scores: {}
    }));

    const finalRounds: Round[] = config.rounds.map((r: Partial<Round> & {prizesByRank?: Prize[]}) => ({
      id: crypto.randomUUID(),
      name: r.name!,
      questions: r.questions as Question[],
      prizePool: (r.prizePool || r.prizesByRank || []).map((p: Prize) => ({...p, id: p.id || crypto.randomUUID()})),
      isCompleted: false,
      prizeCategory: r.prizeCategory,
    }));
    
    const finalPrizeBank: Prize[] = (config.prizeBank || []).map((p: Prize) => ({ ...p, id: p.id || crypto.randomUUID() }));

    const finalSettings: GameSettings = {
        tieBreakerRule: config.tieBreakerRule || TieBreakerRule.ALL_TIES,
        rules: config.rules || '',
        prizeMode: config.prizeMode || PrizeMode.PER_ROUND,
        enableBuzzer: config.settings?.enableBuzzer || false,
    };

    setTeams(finalTeams);
    setRounds(finalRounds);
    setPrizeBank(finalPrizeBank);
    setSettings(finalSettings);
    setGameState('WAITING_ROOM');
  };

  const handleLoadGameFromFile = (file: File) => {
    if (file.name.endsWith('.zip')) {
        processZipFile(file)
            .then(config => {
                processAndStartGame(config);
            })
            .catch((err: any) => {
                console.error('Failed to load configuration from ZIP:', err);
                showNotification(`Error loading configuration file from ZIP: ${err.message}`, 'error');
            });
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result;
            if (typeof text !== 'string') {
              throw new Error('Could not read file.');
            }
            const config = JSON.parse(text);
            processAndStartGame(config);
          } catch (err: any) {
            console.error('Failed to load configuration:', err);
            showNotification(`Error loading configuration file: ${err.message}`, 'error');
          }
        };
        reader.onerror = () => {
          showNotification('Failed to read the file.', 'error');
        };
        reader.readAsText(file);
    }
  };

  const isSetupOrWelcome = gameState === 'SETUP' || gameState === 'WELCOME';
  const isCentered = gameState === 'WELCOME' || gameState === 'WAITING_ROOM';

  const renderGameContent = () => {
    let content: React.ReactNode;
    switch (gameState) {
      case 'WELCOME':
        content = <WelcomeScreen onStart={() => setGameState('SETUP')} onLoadGame={handleLoadGameFromFile} />;
        break;
      case 'SETUP':
        content = <SetupScreen onSetupComplete={handleSetupComplete} />;
        break;
      case 'WAITING_ROOM':
        content = <WaitingRoom teams={teams} onStartGame={handleStartGame} settings={settings} />;
        break;
      case 'GAME':
        content = <GameScreen initialTeams={teams} initialRounds={rounds} initialPrizeBank={prizeBank} settings={settings} />;
        break;
      default:
        content = null;
    }

    if ((gameState === 'WAITING_ROOM' || gameState === 'GAME') && settings.enableBuzzer) {
        return <BuzzerProvider teams={teams}>{content}</BuzzerProvider>;
    }
    return content;
  }

  return (
    <>
      <Notification />
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-full text-brand-light/70 hover:bg-brand-burgundy hover:text-white transition-colors duration-300"
          aria-label={t.settingsTitle}
        >
          <GearIcon className="h-6 w-6" />
        </button>
        <button
          onClick={resetGame}
          className="p-2 rounded-full text-brand-light/70 hover:bg-brand-red-alert hover:text-white transition-colors duration-300"
          aria-label={t.resetGameTitle}
        >
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>

       {isSettingsOpen && (
        <div 
            className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in" 
            onClick={() => setIsSettingsOpen(false)}
        >
           <div 
                className="bg-brand-dark/95 border-2 border-brand-gold/50 rounded-lg shadow-2xl p-6 w-full max-w-xl m-4" 
                onClick={(e) => e.stopPropagation()}
            >
             <ThemeSelector />
             <LanguageSelector />
             <button
               onClick={() => setIsSettingsOpen(false)}
               className="mt-6 w-full font-display px-6 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark rounded-lg font-bold text-lg tracking-widest uppercase transition-all duration-300"
             >
               {t.closeButton}
             </button>
           </div>
        </div>
      )}


      <div className={`min-h-screen flex flex-col ${isSetupOrWelcome ? 'p-4 sm:p-6 lg:p-8' : ''}`}>
        <div className={`${isSetupOrWelcome ? 'max-w-7xl mx-auto w-full flex-grow flex flex-col' : 'flex-grow flex flex-col'}`}>
          <main className={`flex-grow animate-fade-in ${gameState === 'GAME' ? 'flex justify-center p-2 sm:p-4 [&[data-screen-profile=small]]:p-1' : ''} ${isCentered ? 'flex flex-col items-center justify-center text-center' : ''}`}>
            {renderGameContent()}
          </main>
        </div>
      </div>
    </>
  );
};

export default App;