import React from 'react';
import type { Team, Round, Prize, GameSettings } from '../../../types.ts';
import { PrizeMode } from '../../../types.ts';
import SetupStepWrapper from '../SetupStepWrapper.tsx';
import { EditIcon, DownloadIcon } from '../../IconComponents.tsx';
import { useTranslations } from '../../../hooks/useTranslations.ts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SetupStep5RecapProps {
  teams: Partial<Team>[];
  rounds: Partial<Round>[];
  settings: GameSettings;
  prizeBank: Prize[];
  setStep: (step: number) => void;
}

const Section: React.FC<{title: string; onEdit: () => void; children: React.ReactNode}> = ({ title, onEdit, children }) => {
    const t = useTranslations();
    return (
        <div className="bg-brand-dark/30 p-4 rounded-lg border border-brand-gold/30">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-brand-gold/80 font-display tracking-widest">{title}</h3>
                <button onClick={onEdit} className="flex items-center gap-2 px-3 py-1 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md text-sm font-semibold transition-colors">
                    <EditIcon className="h-4 w-4" /> {t.editButton}
                </button>
            </div>
            <div className="space-y-2">{children}</div>
        </div>
    )
};

const SetupStep5Recap: React.FC<SetupStep5RecapProps> = ({ teams, rounds, settings, prizeBank, setStep }) => {
    const t = useTranslations();

    const handleExport = () => {
        const doc = new jsPDF();
        let yPos = 20;

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text(t.pdfTitle, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 15;

        // Rules
        if (settings.rules) {
            doc.setFontSize(14);
            doc.text(t.pdfRulesTitle, 14, yPos);
            yPos += 8;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const rulesText = doc.splitTextToSize(settings.rules, 180);
            doc.text(rulesText, 14, yPos);
            yPos += rulesText.length * 5 + 10;
        }

        // Rounds
        rounds.forEach((round, index) => {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(`${t.pdfRoundTitle} ${index + 1}: ${round.name}`, 14, yPos);
            yPos += 8;

            if (settings.prizeMode === PrizeMode.PER_ROUND && round.prizePool && round.prizePool.length > 0) {
                doc.setFontSize(12);
                doc.text(t.pdfPrizesForRound, 14, yPos);
                yPos += 6;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const prizeText = round.prizePool.map(p => p.name).join(', ');
                const splitPrizeText = doc.splitTextToSize(prizeText, 180);
                doc.text(splitPrizeText, 14, yPos);
                yPos += splitPrizeText.length * 5 + 5;
            }
            
            const head = [['#', t.pdfQuestionColumn, t.pdfAnswerColumn, t.pdfPointsColumn]];
            const body = (round.questions || []).map((q, i) => [
                i + 1,
                q.questionText,
                q.answer,
                q.points || (q.splitAnswer ? '1+1' : 1)
            ]);

            autoTable(doc, {
                startY: yPos,
                head: head,
                body: body,
                headStyles: { fillColor: [26, 26, 26] },
                theme: 'striped',
                didDrawPage: (data) => {
                    yPos = data.cursor?.y || 20; 
                }
            });
            
            yPos = (doc as any).lastAutoTable.finalY + 15;
        });

        if (settings.prizeMode === PrizeMode.BANK && prizeBank.length > 0) {
            if (yPos > 260) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(t.pdfPrizeBankTitle, 14, yPos);
            yPos += 8;

            const prizeText = prizeBank.map(p => `- ${p.name}`).join('\n');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const splitBankText = doc.splitTextToSize(prizeText, 180);
            doc.text(splitBankText, 14, yPos);
        }

        doc.save('quiz-night-answers.pdf');
    };

    return (
        <SetupStepWrapper title={t.recapTitle}>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <Section title={t.recapContestants} onEdit={() => setStep(1)}>
                        <ul className="list-disc list-inside text-brand-light/90">
                            {teams.map((team, index) => <li key={index}>{team.name}</li>)}
                        </ul>
                    </Section>
                    
                    <Section title={t.recapRules} onEdit={() => setStep(2)}>
                        <p><strong>{t.recapPrizeMode}</strong> <span className="text-brand-gold">{settings.prizeMode === PrizeMode.BANK ? 'Banque de Prix' : 'Par Manche'}</span></p>
                        <p><strong>{t.recapTieBreaker}</strong> <span className="text-brand-gold">{
                            { 'NONE': t.recapTieBreakerValueNone, 'ALL_TIES': t.recapTieBreakerValueAll, 'FIRST_PLACE_ONLY': t.recapTieBreakerValueFirst }[settings.tieBreakerRule]
                        }</span></p>
                        {settings.rules && <p className="whitespace-pre-wrap pt-2 border-t border-brand-gold/20 mt-2"><strong>{t.recapSpecificRules}</strong><br/>{settings.rules}</p>}
                    </Section>

                    <Section title={t.recapPrizes} onEdit={() => setStep(3)}>
                        {settings.prizeMode === PrizeMode.BANK ? (
                            <ul className="list-disc list-inside text-brand-light/90">
                                {prizeBank.map((prize, index) => <li key={index}>{prize.name}</li>)}
                            </ul>
                        ) : (
                            <p className="text-brand-light/70 italic">{t.recapPrizesInRounds}</p>
                        )}
                    </Section>
                </div>
                
                <div className="space-y-6">
                    <Section title={t.recapRounds} onEdit={() => setStep(4)}>
                         <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                             {rounds.map((round, index) => (
                                <div key={index} className="pb-2 border-b border-brand-gold/20 last:border-b-0">
                                    <h4 className="font-semibold text-lg text-brand-light">{index + 1}. {round.name}</h4>
                                    <p className="text-sm text-brand-light/70">{t.recapQuestionCount(round.questions?.length || 0)}</p>
                                    {settings.prizeMode === PrizeMode.PER_ROUND && (
                                        <p className="text-sm text-brand-light/70">{t.recapPrizeCount(round.prizePool?.length || 0)}</p>
                                    )}
                                </div>
                             ))}
                         </div>
                    </Section>
                </div>
           </div>
            <div className="mt-8 pt-6 border-t-2 border-brand-gold/30 flex justify-center">
                <button 
                    onClick={handleExport}
                    className="flex items-center font-display px-6 py-3 bg-brand-burgundy text-brand-light hover:bg-brand-burgundy-dark rounded-lg font-bold text-lg tracking-widest uppercase transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                    <DownloadIcon className="h-6 w-6 mr-3" />
                    {t.exportAnswers}
                </button>
            </div>
        </SetupStepWrapper>
    );
};

export default SetupStep5Recap;