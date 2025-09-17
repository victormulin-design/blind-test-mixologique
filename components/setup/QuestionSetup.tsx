import React, { useState } from 'react';
import { produce } from 'immer';
import type { Round, Question, CropData } from '../../types';
import { QuestionType } from '../../types';
import { TrashIcon, SpinnerIcon, CropIcon } from '../IconComponents';
import AudioTrimmer from '../AudioTrimmer';
import ImageCropper from './ImageCropper';
import CroppedImage from '../common/CroppedImage';
import { fileToBase64, normalizeAudio } from '../../utils/helpers';

interface QuestionSetupProps {
  question: Partial<Question>;
  roundIndex: number;
  questionIndex: number;
  setRounds: React.Dispatch<React.SetStateAction<Partial<Round>[]>>;
}

const QuestionSetup: React.FC<QuestionSetupProps> = ({ question, roundIndex, questionIndex, setRounds }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropperState, setCropperState] = useState<{ isOpen: boolean; imageUrl: string; initialCrop?: CropData }>({ isOpen: false, imageUrl: '' });

  const handleQuestionChange = <K extends keyof Question>(field: K, value: Question[K]) => {
    setRounds(
      produce(draft => {
        const q = draft[roundIndex].questions![questionIndex];
        
        let processedValue = value;
        if (field === 'timer' || field === 'points') {
          const numValue = parseInt(value as string, 10);
          processedValue = isNaN(numValue) || numValue <= 0 ? undefined : numValue as Question[K];
        }

        (q as any)[field] = processedValue;
        
        if (field === 'splitAnswer' && value === true) {
            q.points = 2;
        }
      })
    );
  };

  const removeQuestion = () => {
    setRounds(
      produce(draft => {
        draft[roundIndex].questions!.splice(questionIndex, 1);
      })
    );
  };
  
  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    const base64 = await fileToBase64(file);
    setRounds(produce(draft => {
      const q = draft[roundIndex].questions![questionIndex];
      q.imageUrl = base64;
      q.imageFileName = file.name;
      q.cropData = undefined; // Reset crop on new image
      if (!q.answer?.trim()) {
        const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        q.answer = fileName.replace(/[_-]/g, ' ');
      }
    }));
  };

  const handleAudioUpload = async (file: File | null) => {
    if (!file) return;
    
    setIsProcessing(true);
    try {
        const normalizedBase64 = await normalizeAudio(file);
        setRounds(produce(draft => {
            const q = draft[roundIndex].questions![questionIndex];
            q.audioUrl = normalizedBase64;
            q.audioFileName = file.name;
            if (!q.answer?.trim()) {
                const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                q.answer = fileName.replace(/[_-]/g, ' ');
            }
        }));
    } catch (error) {
        console.error("Failed to normalize and upload audio, falling back:", error);
        const base64 = await fileToBase64(file); // Fallback to non-normalized
        setRounds(produce(draft => {
            const q = draft[roundIndex].questions![questionIndex];
            q.audioUrl = base64;
            q.audioFileName = file.name;
        }));
    } finally {
        setIsProcessing(false);
    }
  };
  
  const handleCropSave = (cropData: CropData) => {
    handleQuestionChange('cropData', cropData);
    setCropperState({ isOpen: false, imageUrl: '' });
  };
  
  const handleTrimmerChange = (times: { start?: number, end?: number, answerStart?: number }) => {
    setRounds(produce(draft => {
        const q = draft[roundIndex].questions![questionIndex];
        q.audioStartTime = times.start;
        q.audioEndTime = times.end;
        q.answerStartTime = times.answerStart;
    }));
  };

  return (
    <div className="bg-brand-dark/30 p-3 rounded-lg border-2 border-brand-gold/30 space-y-3 shadow-inner">
      {cropperState.isOpen && (
        <ImageCropper 
            imageUrl={cropperState.imageUrl}
            initialCropData={cropperState.initialCrop}
            onSave={handleCropSave}
            onClose={() => setCropperState({ isOpen: false, imageUrl: '' })}
        />
      )}
      <div className='flex justify-between items-center'>
          <h4 className="text-lg font-bold text-brand-light/80">Question {questionIndex + 1}</h4>
          <button onClick={removeQuestion} className="text-brand-burgundy hover:text-red-400">
              <TrashIcon className="h-5 w-5"/>
          </button>
      </div>
       <input
          type="text"
          value={question.questionText}
          onChange={(e) => handleQuestionChange('questionText', e.target.value)}
          placeholder="Question (ex: 'Quelle est cette chanson ?')"
          className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition text-base"
      />
       <input
          type="text"
          value={question.clue || ''}
          onChange={(e) => handleQuestionChange('clue', e.target.value)}
          placeholder="Indice (optionnel, caché pendant le jeu)"
          className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition text-base"
      />
       <input
          type="text"
          value={question.answer}
          onChange={(e) => handleQuestionChange('answer', e.target.value)}
          placeholder="Réponse (pour votre référence)"
          className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition text-base"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center space-x-3">
          <label className="text-base font-medium text-brand-light/70 flex-shrink-0">Points</label>
          <input type="number" value={question.points || ''} min="1" onChange={e => handleQuestionChange('points', e.target.value as any)} placeholder="1" className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base disabled:bg-brand-dark/30 disabled:cursor-not-allowed" disabled={!!question.splitAnswer}/>
        </div>
        <div className="flex items-center space-x-3">
          <label className="text-base font-medium text-brand-light/70 flex-shrink-0">Chrono</label>
          <input type="number" value={question.timer || ''} min="1" onChange={e => handleQuestionChange('timer', e.target.value as any)} placeholder="Aucun" className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base"/>
        </div>
      </div>
      
      {(question.type === QuestionType.AUDIO || question.type === QuestionType.LIVE) && (
          <div className="flex items-center space-x-3 pt-1">
              <input
                  type="checkbox"
                  id={`split-${roundIndex}-${questionIndex}`}
                  checked={!!question.splitAnswer}
                  onChange={(e) => handleQuestionChange('splitAnswer', e.target.checked)}
                  className="h-5 w-5 rounded border-brand-gold/70 bg-brand-dark/50 text-brand-gold focus:ring-2 focus:ring-brand-gold"
              />
              <label htmlFor={`split-${roundIndex}-${questionIndex}`} className="text-base font-medium text-brand-light/90">
                  Séparer Artiste / Titre (1pt + 1pt)
              </label>
          </div>
      )}

      <div className="flex space-x-2 pt-1">
          {[QuestionType.QUIZ, QuestionType.IMAGE, QuestionType.AUDIO, QuestionType.LIVE].map(type => (
              <button
                  key={type}
                  onClick={() => handleQuestionChange('type', type)}
                  className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors uppercase tracking-wider ${question.type === type ? 'bg-brand-gold text-brand-dark' : 'bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20'}`}
              >
                  {type === 'LIVE' ? 'Live' : type}
              </button>
          ))}
      </div>
      {question.type === QuestionType.AUDIO && (
          <div className="mt-2">
              <label className="block text-base font-medium text-brand-light/90 mb-1">Fichier audio</label>
               {isProcessing ? (
                  <div className="flex items-center gap-2 text-brand-light/80 p-2 bg-brand-dark/20 rounded-md">
                      <SpinnerIcon className="animate-spin h-5 w-5" />
                      <span>Normalisation en cours...</span>
                  </div>
              ) : (
                <>
                  <input type="file" accept="audio/*" onChange={e => handleAudioUpload(e.target.files?.[0] || null)} className="text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:font-semibold file:bg-brand-light file:text-brand-dark hover:file:bg-brand-gold"/>
                  {question.audioFileName && !question.audioUrl && (
                       <div className="flex items-center justify-between mt-2 p-2 bg-brand-dark/20 rounded-md border border-red-500/50">
                          <span className="text-red-400/80 text-sm truncate" title={question.audioFileName}>
                              Fichier manquant : {question.audioFileName}
                          </span>
                      </div>
                  )}
                  {question.audioFileName && question.audioUrl && (
                      <div className="flex items-center justify-between mt-2 p-2 bg-brand-dark/20 rounded-md border border-brand-gold/20">
                          <span className="text-brand-light/80 text-sm truncate" title={question.audioFileName}>
                              {question.audioFileName}
                          </span>
                          <button 
                              onClick={() => handleQuestionChange('audioUrl', undefined)} 
                              className="text-brand-burgundy hover:text-red-400 ml-2"
                              aria-label="Supprimer le fichier audio"
                          >
                              <TrashIcon className="h-5 w-5" />
                          </button>
                      </div>
                  )}
                  {question.audioUrl && (
                    <AudioTrimmer
                      src={question.audioUrl}
                      startTime={question.audioStartTime}
                      endTime={question.audioEndTime}
                      answerStartTime={question.answerStartTime}
                      onTimesChange={handleTrimmerChange}
                    />
                  )}
                </>
              )}
          </div>
      )}
      {question.type === QuestionType.IMAGE && (
           <div className="mt-2 space-y-2">
              <label className="block text-base font-medium text-brand-light/90">Image</label>
              {!question.imageUrl ? (
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e.target.files?.[0] || null)} className="text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:font-semibold file:bg-brand-light file:text-brand-dark hover:file:bg-brand-gold"/>
              ) : (
                  <div className="flex items-center gap-4">
                      <div className="w-32 h-32 bg-black rounded-md overflow-hidden">
                         <CroppedImage src={question.imageUrl} cropData={question.cropData} />
                      </div>
                       <div className="space-y-2">
                          <button
                              onClick={() => setCropperState({ isOpen: true, imageUrl: question.imageUrl!, initialCrop: question.cropData })}
                              className="flex items-center gap-2 px-3 py-1.5 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md text-sm font-semibold transition-colors"
                          >
                              <CropIcon className="h-5 w-5" />
                              Modifier le Rognage
                          </button>
                           <button
                              onClick={() => handleQuestionChange('imageUrl', undefined)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-brand-dark/50 border border-brand-burgundy hover:bg-brand-burgundy rounded-md text-sm font-semibold transition-colors"
                          >
                              <TrashIcon className="h-5 w-5" />
                              Supprimer l'Image
                          </button>
                       </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default QuestionSetup;
