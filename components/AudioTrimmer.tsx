
import React, { useState, useRef, useEffect } from 'react';
import { StartMarkerIcon, EndMarkerIcon, ClearIcon, PlayIcon, PauseIcon, AnswerMarkerIcon } from './IconComponents';

interface AudioTrimmerProps {
  src: string;
  startTime?: number;
  endTime?: number;
  answerStartTime?: number;
  onTimesChange: (times: { start?: number; end?: number; answerStart?: number }) => void;
}

const formatTime = (seconds: number | undefined) => {
  if (seconds === undefined || isNaN(seconds)) return '00:00.0';
  const floorSeconds = Math.floor(seconds);
  const minutes = Math.floor(floorSeconds / 60);
  const remainingSeconds = floorSeconds % 60;
  const milliseconds = Math.round((seconds - floorSeconds) * 10);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(1, '0')}`;
};

const AudioTrimmer: React.FC<AudioTrimmerProps> = ({ src, startTime, endTime, answerStartTime, onTimesChange }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const checkIntervalRef = useRef<number | null>(null);
  const isTestPlayRequestRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const stopChecking = () => {
        if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
        }
    };
    
    const startChecking = () => {
        stopChecking();
        checkIntervalRef.current = window.setInterval(() => {
            if (audio && endTime !== undefined && audio.currentTime >= endTime) {
                audio.pause();
            }
        }, 50);
    };

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);
    
    const handlePlay = () => {
      setIsPlaying(true);
      if (isTestPlayRequestRef.current) {
          setIsTestPlaying(true);
          startChecking();
      }
    };
    const handlePause = () => {
      setIsPlaying(false);
      setIsTestPlaying(false);
      isTestPlayRequestRef.current = false;
      stopChecking();
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handlePause);
      stopChecking();
    };
  }, [endTime]);

  const handleSetStart = () => {
    const newStartTime = parseFloat(currentTime.toFixed(3));
    if (endTime && newStartTime >= endTime) {
        onTimesChange({ start: Math.max(0, endTime - 0.1), end: endTime, answerStart: answerStartTime });
    } else {
        onTimesChange({ start: newStartTime, end: endTime, answerStart: answerStartTime });
    }
  };

  const handleSetEnd = () => {
    const newEndTime = parseFloat(currentTime.toFixed(3));
    if (startTime !== undefined && newEndTime <= startTime) {
        onTimesChange({ start: startTime, end: startTime + 0.1, answerStart: answerStartTime });
    } else {
        onTimesChange({ start: startTime, end: newEndTime, answerStart: answerStartTime });
    }
  };
  
  const handleSetAnswerStart = () => {
    const newAnswerStartTime = parseFloat(currentTime.toFixed(3));
    onTimesChange({ start: startTime, end: endTime, answerStart: newAnswerStartTime });
  };

  const handleClear = () => {
    onTimesChange({ start: undefined, end: undefined, answerStart: undefined });
  };
  
  const handleTestClip = () => {
      const audio = audioRef.current;
      if (!audio) return;
      
      if (isTestPlaying) {
          audio.pause();
      } else {
          const effectiveStartTime = startTime || 0;
          if (endTime !== undefined && effectiveStartTime >= endTime) {
              return;
          }
          
          isTestPlayRequestRef.current = true;
          audio.currentTime = effectiveStartTime;
          
          const playPromise = audio.play();
          if (playPromise !== undefined) {
              playPromise.catch(error => {
                  console.error("Audio clip play prevented:", error);
                  isTestPlayRequestRef.current = false;
                  setIsTestPlaying(false);
              });
          }
      }
  };

  return (
    <div className="mt-4 p-4 bg-brand-dark/50 border border-brand-gold/30 rounded-lg space-y-3">
        <audio ref={audioRef} src={src} controls className="w-full" />
        <div className="flex items-center justify-between text-base sm:text-lg font-mono">
            <span>Actuel: {formatTime(currentTime)}</span>
            <span>Durée: {formatTime(duration)}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button onClick={handleSetStart} className="flex items-center justify-center p-2 bg-blue-800 hover:bg-blue-700 rounded-md text-sm sm:text-base font-semibold">
                <StartMarkerIcon className="h-5 w-5 mr-2" /> Début (Question)
            </button>
            <button onClick={handleSetEnd} className="flex items-center justify-center p-2 bg-green-800 hover:bg-green-700 rounded-md text-sm sm:text-base font-semibold">
                <EndMarkerIcon className="h-5 w-5 mr-2" /> Fin (Question)
            </button>
            <button onClick={handleSetAnswerStart} className="flex items-center justify-center p-2 bg-purple-800 hover:bg-purple-700 rounded-md text-sm sm:text-base font-semibold">
                <AnswerMarkerIcon className="h-5 w-5 mr-2" /> Début (Réponse)
            </button>
            <button onClick={handleTestClip} disabled={startTime === undefined || endTime === undefined} className="flex items-center justify-center p-2 bg-brand-burgundy hover:bg-brand-burgundy-dark rounded-md text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                {isTestPlaying ? <PauseIcon className="h-5 w-5 mr-2" /> : <PlayIcon className="h-5 w-5 mr-2" />}
                Tester Extrait
            </button>
            <button onClick={handleClear} className="col-span-2 sm:col-span-2 flex items-center justify-center p-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md text-sm sm:text-base font-semibold">
                <ClearIcon className="h-5 w-5 mr-2" /> Tout Effacer
            </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 pt-2">
            <div className="flex-1">
                <label className="block text-sm font-medium text-brand-light/70">Début Question (s)</label>
                <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={duration}
                    value={startTime === undefined ? '' : startTime.toFixed(3)}
                    onChange={(e) => onTimesChange({ start: parseFloat(e.target.value) || undefined, end: endTime, answerStart: answerStartTime })}
                    placeholder="Non défini"
                    className="w-full mt-1 bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base"
                />
            </div>
             <div className="flex-1">
                <label className="block text-sm font-medium text-brand-light/70">Fin Question (s)</label>
                <input
                    type="number"
                    step="0.1"
                    min={startTime !== undefined ? startTime : 0}
                    max={duration}
                    value={endTime === undefined ? '' : endTime.toFixed(3)}
                    onChange={(e) => onTimesChange({ start: startTime, end: parseFloat(e.target.value) || undefined, answerStart: answerStartTime })}
                    placeholder="Non défini"
                    className="w-full mt-1 bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base"
                />
            </div>
            <div className="flex-1">
                <label className="block text-sm font-medium text-brand-light/70">Début Réponse (s)</label>
                <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={duration}
                    value={answerStartTime === undefined ? '' : answerStartTime.toFixed(3)}
                    onChange={(e) => onTimesChange({ start: startTime, end: endTime, answerStart: parseFloat(e.target.value) || undefined })}
                    placeholder="Début du morceau"
                    className="w-full mt-1 bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base"
                />
            </div>
        </div>
    </div>
  );
};

export default AudioTrimmer;
