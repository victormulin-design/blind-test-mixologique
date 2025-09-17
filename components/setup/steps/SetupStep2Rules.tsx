import React from 'react';
import { PrizeMode, TieBreakerRule, GameSettings } from '../../../types.ts';
import SetupStepWrapper from '../SetupStepWrapper.tsx';
import { useTranslations } from '../../../hooks/useTranslations.ts';

interface SetupStep2RulesProps {
    settings: GameSettings;
    setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
}

const SetupStep2Rules: React.FC<SetupStep2RulesProps> = ({ settings, setSettings }) => {
    const t = useTranslations();
    
    const handleChange = <K extends keyof GameSettings>(field: K, value: GameSettings[K]) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    return (
        <SetupStepWrapper title={t.gameRulesTitle}>
            <div>
                <h3 className="text-lg sm:text-xl font-medium text-brand-light/80 mb-3">{t.prizeModeTitle}</h3>
                <div className="space-y-4">
                    <label className="flex items-start p-3 rounded-lg cursor-pointer transition-colors hover:bg-brand-dark/50">
                    <input type="radio" name="prizemode" value={PrizeMode.PER_ROUND} checked={settings.prizeMode === PrizeMode.PER_ROUND} onChange={(e) => handleChange('prizeMode', e.target.value as PrizeMode)} className="h-5 w-5 bg-brand-dark border-brand-gold/70 text-brand-gold focus:ring-brand-gold focus:ring-2 cursor-pointer mt-1"/>
                    <span className="ml-3 text-base text-brand-light/90">
                        <span className="font-semibold">{t.prizeModePerRound}</span> {t.prizeModePerRoundDesc}
                    </span>
                    </label>
                    <label className="flex items-start p-3 rounded-lg cursor-pointer transition-colors hover:bg-brand-dark/50">
                    <input type="radio" name="prizemode" value={PrizeMode.BANK} checked={settings.prizeMode === PrizeMode.BANK} onChange={(e) => handleChange('prizeMode', e.target.value as PrizeMode)} className="h-5 w-5 bg-brand-dark border-brand-gold/70 text-brand-gold focus:ring-brand-gold focus:ring-2 cursor-pointer mt-1"/>
                    <span className="ml-3 text-base text-brand-light/90">
                        <span className="font-semibold">{t.prizeModeBank}</span> {t.prizeModeBankDesc}
                    </span>
                    </label>
                </div>
            </div>
            
            <div className="border-t border-brand-gold/30 pt-6">
                <h3 className="text-lg sm:text-xl font-medium text-brand-light/80 mb-3">{t.buzzerModeTitle}</h3>
                 <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors hover:bg-brand-dark/50">
                    <span className="text-base text-brand-light/90">
                        <span className="font-semibold">{t.buzzerModeEnable}</span> {t.buzzerModeEnableDesc}
                    </span>
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={!!settings.enableBuzzer} onChange={(e) => handleChange('enableBuzzer', e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-brand-dark/80 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-gold rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-burgundy"></div>
                    </div>
                </label>
            </div>

            <div className="border-t border-brand-gold/30 pt-6">
                <h3 className="text-lg sm:text-xl font-medium text-brand-light/80 mb-3">{t.tieBreakerTitle}</h3>
                <div className="space-y-4">
                    <label className="flex items-start p-3 rounded-lg cursor-pointer transition-colors hover:bg-brand-dark/50">
                    <input type="radio" name="tiebreaker" value={TieBreakerRule.NONE} checked={settings.tieBreakerRule === TieBreakerRule.NONE} onChange={(e) => handleChange('tieBreakerRule', e.target.value as TieBreakerRule)} className="h-5 w-5 bg-brand-dark border-brand-gold/70 text-brand-gold focus:ring-brand-gold focus:ring-2 cursor-pointer mt-1"/>
                    <span className="ml-3 text-base text-brand-light/90">
                        <span className="font-semibold">{t.tieBreakerNone}</span> {t.tieBreakerNoneDesc}
                    </span>
                    </label>
                    <label className="flex items-start p-3 rounded-lg cursor-pointer transition-colors hover:bg-brand-dark/50">
                    <input type="radio" name="tiebreaker" value={TieBreakerRule.ALL_TIES} checked={settings.tieBreakerRule === TieBreakerRule.ALL_TIES} onChange={(e) => handleChange('tieBreakerRule', e.target.value as TieBreakerRule)} className="h-5 w-5 bg-brand-dark border-brand-gold/70 text-brand-gold focus:ring-brand-gold focus:ring-2 cursor-pointer mt-1"/>
                    <span className="ml-3 text-base text-brand-light/90"><span className="font-semibold">{t.tieBreakerAll}</span> {t.tieBreakerAllDesc}</span>
                    </label>
                    <label className="flex items-start p-3 rounded-lg cursor-pointer transition-colors hover:bg-brand-dark/50">
                    <input type="radio" name="tiebreaker" value={TieBreakerRule.FIRST_PLACE_ONLY} checked={settings.tieBreakerRule === TieBreakerRule.FIRST_PLACE_ONLY} onChange={(e) => handleChange('tieBreakerRule', e.target.value as TieBreakerRule)} className="h-5 w-5 bg-brand-dark border-brand-gold/70 text-brand-gold focus:ring-brand-gold focus:ring-2 cursor-pointer mt-1"/>
                    <span className="ml-3 text-base text-brand-light/90">
                        <span className="font-semibold">{t.tieBreakerFirst}</span> {t.tieBreakerFirstDesc}
                    </span>
                    </label>
                </div>
            </div>
            <div className="mt-6 border-t border-brand-gold/30 pt-6">
                <h3 className="text-lg sm:text-xl font-medium text-brand-light/80 mb-3">{t.winConditionTitle}</h3>
                <textarea
                    value={settings.rules}
                    onChange={(e) => handleChange('rules', e.target.value)}
                    placeholder={t.winConditionPlaceholder}
                    className="w-full h-24 bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition text-base"
                />
            </div>
        </SetupStepWrapper>
    );
};

export default SetupStep2Rules;