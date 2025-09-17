import React, { useState, useEffect, useRef } from 'react';
import type { Team, Round, Prize, GameSettings, Question } from '../../../types.ts';
import { PrizeMode, QuestionType } from '../../../types.ts';
import SetupStepWrapper from '../SetupStepWrapper.tsx';
import { UploadIcon, DownloadIcon, SaveIcon, TrashIcon, ClearIcon, SpinnerIcon } from '../../IconComponents.tsx';
import JSZip from 'jszip';
import { useTranslations } from '../../../hooks/useTranslations.ts';
import { useNotifications } from '../../../contexts/NotificationContext.tsx';

interface SetupStep0ConfigProps {
  setTeams: React.Dispatch<React.SetStateAction<Partial<Team>[]>>;
  setRounds: React.Dispatch<React.SetStateAction<Partial<Round>[]>>;
  setNumTeams: React.Dispatch<React.SetStateAction<number>>;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  setPrizeBank: React.Dispatch<React.SetStateAction<Prize[]>>;
  onConfigLoaded: () => void;
  clearSetup: () => void;
  currentConfig: {
    teams: Partial<Team>[];
    rounds: Partial<Round>[];
    settings: GameSettings;
    prizeBank: Prize[];
    numTeams: number;
  };
}

type AvailableConfig = {
  name: string;
  source: 'local' | 'preconfigured';
  file?: string;
  data?: any;
};

const processZipFile = async (file: File): Promise<any> => {
    const zip = await JSZip.loadAsync(file);
    const configFileEntry = zip.file(/config\.json$/i)[0];
    if (!configFileEntry) throw new Error('Could not find config.json in the zip file.');
    const configText = await configFileEntry.async('string');
    const config = JSON.parse(configText);

    // This function needs to handle audio AND images now
    const processAsset = async (item: any, assetType: 'AUDIO' | 'IMAGE') => {
        const fileNameProp = assetType === 'AUDIO' ? 'audioFileName' : 'imageFileName';
        const urlProp = assetType === 'AUDIO' ? 'audioUrl' : 'imageUrl';
        const prefixes = assetType === 'AUDIO' ? ['audio/', 'audios/', ''] : ['image/', 'images/', ''];
        
        if (item.type === assetType && item[fileNameProp] && !item[urlProp]) {
            let fileEntry: any = null;
            for (const prefix of prefixes) {
                const path = prefix + item[fileNameProp];
                const entry = zip.file(path);
                if (entry) { fileEntry = entry; break; }
            }
            if (fileEntry) {
                const blob = await fileEntry.async('blob');
                item[urlProp] = URL.createObjectURL(blob);
            } else {
                console.warn(`Asset file "${item[fileNameProp]}" not found in zip.`);
            }
        }
    };
    
    // Process prize images (they don't have a 'type' property)
    const processPrizeAsset = async (prize: any) => {
        if (prize.imageFileName && !prize.imageUrl) {
            let fileEntry: any = null;
            const prefixes = ['image/', 'images/', ''];
            for (const prefix of prefixes) {
                const path = prefix + prize.imageFileName;
                const entry = zip.file(path);
                if (entry) { fileEntry = entry; break; }
            }
            if (fileEntry) {
                const blob = await fileEntry.async('blob');
                prize.imageUrl = URL.createObjectURL(blob);
            } else {
                console.warn(`Prize image file "${prize.imageFileName}" not found in zip.`);
            }
        }
    };

    if (config.rounds && Array.isArray(config.rounds)) {
        for (const round of config.rounds) {
            if (round.questions && Array.isArray(round.questions)) {
                for (const question of round.questions) {
                    await processAsset(question, 'AUDIO');
                    await processAsset(question, 'IMAGE');
                }
            }
            if (round.prizePool && Array.isArray(round.prizePool)) {
                for (const prize of round.prizePool) {
                    await processPrizeAsset(prize);
                }
            }
        }
    }
    
    if (config.prizeBank && Array.isArray(config.prizeBank)) {
        for (const prize of config.prizeBank) {
            await processPrizeAsset(prize);
        }
    }

    return config;
};


const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid Data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Could not determine MIME type from Data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

const SetupStep0Config: React.FC<SetupStep0ConfigProps> = ({
    setTeams, setRounds, setNumTeams, setSettings, setPrizeBank, onConfigLoaded, clearSetup, currentConfig
}) => {
    const [availableConfigs, setAvailableConfigs] = useState<AvailableConfig[]>([]);
    const [isZipping, setIsZipping] = useState(false);
    const importFileRef = useRef<HTMLInputElement>(null);
    const t = useTranslations();
    const { showNotification } = useNotifications();

    const refreshLocalConfigs = () => {
        const localConfigsRaw = localStorage.getItem('blindTestConfigs');
        const localConfigs = localConfigsRaw ? JSON.parse(localConfigsRaw) : {};
        return Object.keys(localConfigs).map(name => ({ name, source: 'local' as const, data: localConfigs[name] }));
    };

    useEffect(() => {
        const loadConfigs = async () => {
            const localList = refreshLocalConfigs();
            try {
                const response = await fetch('/Preconfigured_games/manifest.json');
                if (response.ok) {
                    const manifest: { name: string; file: string }[] = await response.json();
                    const preconfiguredList: AvailableConfig[] = manifest.map(item => ({ name: item.name, source: 'preconfigured' as const, file: item.file }));
                    setAvailableConfigs([...preconfiguredList, ...localList]);
                } else { setAvailableConfigs(localList); }
            } catch (error) {
                console.error("Could not load preconfigured games manifest:", error);
                setAvailableConfigs(localList);
            }
        };
        loadConfigs();
    }, []);
    
    const loadPreset = (config: any, name: string) => {
        const processedRounds = config.rounds.map((r: any) => ({ ...r, prizePool: r.prizePool || r.prizesByRank || [] }));
        setNumTeams(config.numTeams);
        setTeams(config.teams);
        setRounds(processedRounds);
        setSettings({
            tieBreakerRule: config.tieBreakerRule || 'ALL_TIES',
            rules: config.rules || '',
            prizeMode: config.prizeMode || PrizeMode.PER_ROUND,
        });
        setPrizeBank(config.prizeBank || []);
        showNotification(t.configLoaded(name), 'success');
        onConfigLoaded();
    };

    const handleLoadConfig = async (configToLoad: AvailableConfig) => {
        try {
            let configData: any;
            if (configToLoad.source === 'local') {
                configData = configToLoad.data;
            } else if (configToLoad.source === 'preconfigured' && configToLoad.file) {
                const response = await fetch(`/Preconfigured_games/${configToLoad.file}`);
                if (!response.ok) throw new Error(`Le fichier ${configToLoad.file} est introuvable.`);
                configData = await response.json();
            }
            if (configData) loadPreset(configData, configToLoad.name);
            else throw new Error(`Configuration data for "${configToLoad.name}" could not be found.`);
        } catch (err: any) {
            showNotification(`Erreur: ${err.message}`, 'error');
            console.error("Failed to load config:", err);
        }
    };
    
    const handleDeleteConfig = (name: string) => {
        // We removed the confirm() call for a better UX. Add it back if needed.
        const localConfigsRaw = localStorage.getItem('blindTestConfigs');
        const localConfigs = localConfigsRaw ? JSON.parse(localConfigsRaw) : {};
        delete localConfigs[name];
        localStorage.setItem('blindTestConfigs', JSON.stringify(localConfigs));
        setAvailableConfigs(prev => prev.filter(c => !(c.name === name && c.source === 'local')));
        showNotification(t.configDeleted(name), 'success');
    };
    
    const handleImportConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            let config;
            if (file.name.endsWith('.zip')) {
                showNotification(t.errorProcessingZip, 'info');
                config = await processZipFile(file);
            } else {
                const text = await file.text();
                config = JSON.parse(text);
            }

            if (Array.isArray(config.teams) && Array.isArray(config.rounds) && typeof config.numTeams === 'number') {
                loadPreset(config, file.name);
            } else { 
                showNotification(t.errorInvalidConfig, 'error');
            }
        } catch (err: any) {
            showNotification('Erreur: ' + err.message, 'error');
        }
        event.target.value = '';
    };

    const handleSaveConfig = () => {
        const name = prompt(t.saveConfigPrompt);
        if (!name || !name.trim()) return;

        const configToSave = {
            numTeams: currentConfig.numTeams,
            teams: currentConfig.teams,
            rounds: currentConfig.rounds,
            settings: currentConfig.settings,
            prizeBank: currentConfig.prizeBank,
        };

        const localConfigsRaw = localStorage.getItem('blindTestConfigs');
        const localConfigs = localConfigsRaw ? JSON.parse(localConfigsRaw) : {};
        localConfigs[name] = configToSave;
        localStorage.setItem('blindTestConfigs', JSON.stringify(localConfigs));

        setAvailableConfigs(prev => {
            const others = prev.filter(c => c.name !== name || c.source !== 'local');
            const newConfigEntry: AvailableConfig = { name, source: 'local', data: configToSave };
            return [...others, newConfigEntry];
        });
        showNotification(t.configLoaded(name), 'success');
    };

    const getConfigForExport = () => JSON.parse(JSON.stringify({
        numTeams: currentConfig.numTeams,
        teams: currentConfig.teams,
        rounds: currentConfig.rounds,
        settings: currentConfig.settings,
        prizeBank: currentConfig.prizeBank,
    }));

    const handleExportConfig = () => {
        const configToExport = getConfigForExport();
        const blob = new Blob([JSON.stringify(configToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportZip = async () => {
        setIsZipping(true);
        showNotification(t.preparingZip, 'info');
        try {
            const zip = new JSZip();
            const config = getConfigForExport();
            const assets: { path: string; dataUrl: string }[] = [];

            const addPrizeAsset = (p: Prize & { imageFileName?: string }) => {
                if (p.imageUrl && p.name) {
                    const extension = p.imageUrl.includes('svg+xml') ? 'svg' : 'png';
                    const filename = `prize_${p.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
                    assets.push({ path: `images/${filename}`, dataUrl: p.imageUrl });
                    p.imageFileName = filename;
                    delete (p as Partial<Prize>).imageUrl;
                }
            };

            config.rounds.forEach((round: Partial<Round>) => {
                round.questions?.forEach((q: Question) => {
                    if (q.type === QuestionType.AUDIO && q.audioUrl && q.audioFileName) {
                        assets.push({ path: `audio/${q.audioFileName}`, dataUrl: q.audioUrl });
                        delete q.audioUrl;
                    }
                    if (q.type === QuestionType.IMAGE && q.imageUrl && q.imageFileName) {
                        assets.push({ path: `images/${q.imageFileName}`, dataUrl: q.imageUrl });
                        delete q.imageUrl;
                    }
                });
                if (config.settings.prizeMode === PrizeMode.PER_ROUND) {
                    round.prizePool?.forEach(addPrizeAsset);
                }
            });
            if (config.settings.prizeMode === PrizeMode.BANK) {
                config.prizeBank.forEach(addPrizeAsset);
            }
            
            for (const asset of assets) {
                const blob = dataUrlToBlob(asset.dataUrl);
                zip.file(asset.path, blob);
            }

            zip.file('config.json', JSON.stringify(config, null, 2));

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'game_export.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showNotification(t.zipGenerated, 'success');

        } catch (err: any) {
            console.error("ZIP Export Error:", err);
            showNotification(t.errorZip(err.message), 'error');
        } finally {
            setIsZipping(false);
        }
    };


    return (
        <SetupStepWrapper title={t.step0}>
            <div className="space-y-6">
                <div className="border-b-2 border-brand-gold/30 pb-6">
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 text-brand-light/80">{t.loadExistingGame}</h3>
                    {availableConfigs.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {availableConfigs.sort((a,b) => b.source.localeCompare(a.source) || a.name.localeCompare(b.name)).map(config => (
                                <div key={`${config.source}-${config.name}`} className="flex items-center justify-between bg-brand-dark/30 p-2 rounded-md border border-brand-gold/30">
                                    <span className="font-medium text-base sm:text-lg flex items-center gap-2">
                                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${config.source === 'local' ? 'bg-blue-800' : 'bg-gray-600'}`}>{config.source === 'local' ? t.localConfig : t.presetConfig}</span>
                                        <span className="truncate" title={config.name}>{config.name}</span>
                                    </span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => handleLoadConfig(config)} className="px-3 py-1 bg-green-800 hover:bg-green-700 rounded text-sm sm:text-base font-semibold">{t.loadButton}</button>
                                        {config.source === 'local' && (<button onClick={() => handleDeleteConfig(config.name)} className="text-brand-burgundy hover:text-red-400" aria-label={`Supprimer ${config.name}`}><TrashIcon className="h-5 w-5"/></button>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-center text-brand-light/50 text-base p-4 bg-brand-dark/20 rounded-md">{t.noConfigAvailable}</p>}
                </div>
                
                 <div className="border-b-2 border-brand-gold/30 pb-6">
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 text-brand-light/80">{t.manageCurrentConfig}</h3>
                     <div className="flex flex-wrap items-stretch gap-3 justify-center pt-2">
                        <button onClick={handleSaveConfig} className="flex-1 flex items-center justify-center px-4 py-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md font-semibold transition-colors cursor-pointer text-sm sm:text-base">
                            <SaveIcon className="h-5 w-5 mr-2" /> {t.saveConfig}
                        </button>
                        <button onClick={handleExportConfig} className="flex-1 flex items-center justify-center px-4 py-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md font-semibold transition-colors cursor-pointer text-sm sm:text-base">
                            <DownloadIcon className="h-5 w-5 mr-2" /> {t.exportJson}
                        </button>
                        <button onClick={handleExportZip} disabled={isZipping} className="flex-1 flex items-center justify-center px-4 py-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md font-semibold transition-colors cursor-pointer text-sm sm:text-base disabled:opacity-50 disabled:cursor-wait">
                            {isZipping ? <SpinnerIcon className="h-5 w-5 mr-2 animate-spin" /> : <DownloadIcon className="h-5 w-5 mr-2" />}
                            {t.exportZip}
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-start gap-3 justify-center pt-2">
                    <button onClick={() => importFileRef.current?.click()} className="flex-1 flex items-center justify-center px-4 py-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md font-semibold transition-colors cursor-pointer text-sm sm:text-base">
                        <UploadIcon className="h-5 w-5 mr-2" /> 
                        {t.importFile}
                        <input type="file" accept=".json,.zip" className="hidden" ref={importFileRef} onChange={handleImportConfig}/>
                    </button>
                    <button onClick={clearSetup} className="flex-1 flex items-center justify-center px-4 py-2 bg-brand-dark/50 border border-brand-burgundy hover:bg-brand-burgundy rounded-md font-semibold transition-colors cursor-pointer text-sm sm:text-base">
                        <ClearIcon className="h-5 w-5 mr-2" /> {t.resetButton}
                    </button>
                </div>
            </div>
        </SetupStepWrapper>
    );
};

export default SetupStep0Config;