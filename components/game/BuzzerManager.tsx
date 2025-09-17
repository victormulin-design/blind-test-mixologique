import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useBuzzer } from '../../contexts/BuzzerContext';
import { useTranslations } from '../../hooks/useTranslations';
import { SpinnerIcon } from '../IconComponents';

const BuzzerManager: React.FC = () => {
    const buzzerContext = useBuzzer();
    const qrCodeRef = useRef<HTMLCanvasElement>(null);
    const t = useTranslations();
    const { hostId, connectedTeams } = buzzerContext || {};

    useEffect(() => {
        if (hostId && qrCodeRef.current) {
            const buzzerUrl = `${window.location.origin}${window.location.pathname}?page=buzzer&hostId=${hostId}`;
            QRCode.toCanvas(qrCodeRef.current, buzzerUrl, { width: 256, color: { dark: '#1a1a1a', light: '#d4af37' } });
        }
    }, [hostId]);

    return (
        <div className="my-8 w-full">
            <h3 className="font-display text-2xl text-brand-gold tracking-widest uppercase mb-4">{t.buzzerInstructions}</h3>
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                <div className="bg-brand-gold p-2 rounded-lg shadow-lg">
                    {hostId ? (
                        <canvas ref={qrCodeRef} />
                    ) : (
                         <div className="w-64 h-64 flex items-center justify-center bg-brand-dark/50 text-brand-light">
                            <SpinnerIcon className="h-10 w-10 animate-spin"/>
                         </div>
                    )}
                </div>
                <div className="bg-brand-dark/30 p-4 rounded-md border border-brand-gold/30 w-full max-w-sm text-left">
                    <h4 className="font-semibold text-lg text-brand-light/90 mb-2">{t.buzzerConnectedTeams} ({connectedTeams?.length || 0})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {connectedTeams && connectedTeams.length > 0 ? (
                            connectedTeams.map(team => (
                                <div key={team.connId} className="bg-brand-dark/50 p-2 rounded-md">
                                    <p className="font-medium text-brand-light truncate">{team.teamName}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-brand-light/60 italic">{t.buzzerNoTeamsConnected}</p>
                        )}
                    </div>
                </div>
            </div>
            {hostId && (
                <p className="text-sm mt-4 text-brand-light/50">
                    {t.buzzerHostId} <span className="font-mono">{hostId}</span>
                </p>
            )}
        </div>
    );
};

export default BuzzerManager;