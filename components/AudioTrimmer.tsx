import React, { useState, useRef, useEffect } from 'react';
import { StartMarkerIcon, EndMarkerIcon, ClearIcon, PlayIcon, PauseIcon } from './IconComponents';

interface AudioTrimmerProps {
  src: string;
  startTime?: number;
  endTime?: number;
  onTimesChange: (start?: number, end?: number) => void;
}

const formatTime = (seconds: number | undefined) => {
  if (seconds === undefined || isNaN(seconds)) return '00:00.0';
  const floorSeconds = Math.floor(seconds);
  const minutes = Math.floor(floorSeconds / 60);
  const remainingSeconds = floorSeconds % 60;
  const milliseconds = Math.round((seconds - floorSeconds) * 10);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(1, '0')}`;
};

const AudioTrimmer: React.FC<AudioTrimmerProps> = ({ src, startTime, endTime, onTimesChange }) => {
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
        onTimesChange(Math.max(0, endTime - 0.1), endTime);
    } else {
        onTimesChange(newStartTime, endTime);
    }
  };

  const handleSetEnd = () => {
    const newEndTime = parseFloat(currentTime.toFixed(3));
    if (startTime !== undefined && newEndTime <= startTime) {
        onTimesChange(startTime, startTime + 0.1);
    } else {
        onTimesChange(startTime, newEndTime);
    }
  };

  const handleClear = () => {
    onTimesChange(undefined, undefined);
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button onClick={handleSetStart} className="flex items-center justify-center p-2 bg-blue-800 hover:bg-blue-700 rounded-md text-sm sm:text-base font-semibold">
                <StartMarkerIcon className="h-5 w-5 mr-2" /> Définir le Début
            </button>
            <button onClick={handleSetEnd} className="flex items-center justify-center p-2 bg-green-800 hover:bg-green-700 rounded-md text-sm sm:text-base font-semibold">
                <EndMarkerIcon className="h-5 w-5 mr-2" /> Définir la Fin
            </button>
            <button onClick={handleTestClip} disabled={startTime === undefined || endTime === undefined} className="flex items-center justify-center p-2 bg-brand-burgundy hover:bg-brand-burgundy-dark rounded-md text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                {isTestPlaying ? <PauseIcon className="h-5 w-5 mr-2" /> : <PlayIcon className="h-5 w-5 mr-2" />}
                Tester l'Extrait
            </button>
            <button onClick={handleClear} className="flex items-center justify-center p-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md text-sm sm:text-base font-semibold">
                <ClearIcon className="h-5 w-5 mr-2" /> Effacer
            </button>
        </div>
        <div className="flex items-center gap-4 pt-2">
            <div className="flex-1">
                <label className="block text-sm font-medium text-brand-light/70">Début (s)</label>
                <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={duration}
                    value={startTime === undefined ? '' : startTime.toFixed(3)}
                    onChange={(e) => onTimesChange(parseFloat(e.target.value) || undefined, endTime)}
                    placeholder="Non défini"
                    className="w-full mt-1 bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base"
                />
            </div>
             <div className="flex-1">
                <label className="block text-sm font-medium text-brand-light/70">Fin (s)</label>
                <input
                    type="number"
                    step="0.1"
                    min={startTime !== undefined ? startTime : 0}
                    max={duration}
                    value={endTime === undefined ? '' : endTime.toFixed(3)}
                    onChange={(e) => onTimesChange(startTime, parseFloat(e.target.value) || undefined)}
                    placeholder="Non défini"
                    className="w-full mt-1 bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base"
                />
            </div>
        </div>
    </div>
  );
};

export default AudioTrimmer;