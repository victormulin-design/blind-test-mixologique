import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import {
    ClearIcon, PlayIcon, PauseIcon, LoopIcon, EditIcon, CheckIcon,
    StartMarkerIcon, EndMarkerIcon, AnswerMarkerIcon, SpinnerIcon,
    ZoomInIcon, ZoomOutIcon
} from './IconComponents.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';

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
  if (milliseconds === 10) {
    return `${minutes.toString().padStart(2, '0')}:${(remainingSeconds + 1).toString().padStart(2, '0')}.0`;
  }
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(1, '0')}`;
};


const AudioTrimmer: React.FC<AudioTrimmerProps> = ({ src, startTime, endTime, answerStartTime, onTimesChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsRef = useRef<any>(null);
    const regionRef = useRef<any>(null);
    const answerRegionRef = useRef<any>(null);
    const activeRegionRef = useRef<any>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [zoom, setZoom] = useState(1);
    const t = useTranslations();
    
    const isInteractingRef = useRef(false);
    const isLoopingRef = useRef(isLooping);

    useEffect(() => {
        isLoopingRef.current = isLooping;
    }, [isLooping]);

    const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
      // FIX: Use ReturnType<typeof setTimeout> for browser compatibility instead of NodeJS.Timeout
      let timeout: ReturnType<typeof setTimeout> | null = null;
      const debounced = (...args: Parameters<F>) => {
        if (timeout !== null) {
          clearTimeout(timeout);
          timeout = null;
        }
        timeout = setTimeout(() => func(...args), waitFor);
      };
      return debounced;
    };
    
    useEffect(() => {
        if (!containerRef.current) return;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: 'rgba(212, 175, 55, 0.6)',
            progressColor: '#D4AF37',
            cursorColor: '#F5EFE6',
            barWidth: 2,
            barRadius: 2,
            height: isEditing ? 112 : 64,
            dragToSeek: true,
        });
        wavesurferRef.current = ws;

        const wsRegions = ws.registerPlugin(RegionsPlugin.create());
        regionsRef.current = wsRegions;

        ws.load(src).then(() => {
            setIsLoading(false);
            setDuration(ws.getDuration());

            if (startTime !== undefined && endTime !== undefined) {
              regionRef.current = wsRegions.addRegion({
                  start: startTime,
                  end: endTime,
                  color: 'rgba(128, 0, 32, 0.4)',
                  drag: true,
                  resize: true,
              });
            } else {
              regionRef.current = null;
            }

            if (answerStartTime !== undefined) {
              answerRegionRef.current = wsRegions.addRegion({
                  start: answerStartTime,
                  color: 'rgba(148, 0, 211, 0.9)',
                  drag: true,
                  resize: false,
              });
            } else {
              answerRegionRef.current = null;
            }
        });

        // Event Listeners
        ws.on('audioprocess', time => setCurrentTime(time));
        ws.on('seeking', time => setCurrentTime(time));
        ws.on('play', () => setIsPlaying(true));
        
        ws.on('pause', () => {
            setIsPlaying(false);
            activeRegionRef.current = null;
        });
        ws.on('finish', () => {
            setIsPlaying(false);
            activeRegionRef.current = null;
        });
        
        const handleRegionOut = (region: any) => {
          if (activeRegionRef.current === region) {
            if (isLoopingRef.current) {
              region.play();
            } else {
              ws.pause();
              activeRegionRef.current = null;
            }
          }
        };
        wsRegions.on('region-out', handleRegionOut);

        const debouncedTimesChange = debounce(onTimesChange, 200);

        const onRegionUpdate = () => {
          isInteractingRef.current = true;
          const mainRegion = regionRef.current;
          const answerRegion = answerRegionRef.current;
          
          debouncedTimesChange({
              start: mainRegion ? mainRegion.start : undefined,
              end: mainRegion ? mainRegion.end : undefined,
              answerStart: answerRegion ? answerRegion.start : undefined,
          });
          setTimeout(() => { isInteractingRef.current = false; }, 300);
        };
        
        wsRegions.on('region-updated', onRegionUpdate);

        return () => {
            wsRegions.un('region-out', handleRegionOut);
            wsRegions.un('region-updated', onRegionUpdate);
            ws.destroy();
        };
    }, [src, isEditing]);

    useEffect(() => {
        if (isInteractingRef.current || !regionsRef.current) return;
        
        if (startTime !== undefined && endTime !== undefined) {
            if (!regionRef.current) {
                regionRef.current = regionsRef.current.addRegion({
                    start: startTime,
                    end: endTime,
                    color: 'rgba(128, 0, 32, 0.4)',
                    drag: true,
                    resize: true,
                });
            } else {
                regionRef.current.setOptions({ start: startTime, end: endTime });
            }
        } else if (regionRef.current) {
            regionRef.current.remove();
            regionRef.current = null;
        }

        if (answerStartTime !== undefined) {
            if (!answerRegionRef.current) {
                answerRegionRef.current = regionsRef.current.addRegion({
                    start: answerStartTime,
                    color: 'rgba(148, 0, 211, 0.9)',
                    drag: true,
                    resize: false,
                });
            } else {
                answerRegionRef.current.setOptions({ start: answerStartTime });
            }
        } else if (answerRegionRef.current) {
            answerRegionRef.current.remove();
            answerRegionRef.current = null;
        }
    }, [startTime, endTime, answerStartTime]);


    const handleTimeInputChange = (part: 'start' | 'end' | 'answerStart', value: string) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            onTimesChange({ start: startTime, end: endTime, answerStart: answerStartTime, [part]: undefined });
            return;
        }
        
        const newTimes = { start: startTime, end: endTime, answerStart: answerStartTime };
        if (part === 'start') newTimes.start = numValue;
        if (part === 'end') newTimes.end = numValue;
        if (part === 'answerStart') newTimes.answerStart = numValue;
        onTimesChange(newTimes);
    };

    const playQuestionClip = () => {
        if (regionRef.current) {
            activeRegionRef.current = regionRef.current;
            regionRef.current.play();
        }
    };

    const setMarkerAtCurrentTime = (part: 'start' | 'end' | 'answerStart') => {
        const ws = wavesurferRef.current;
        if (!ws) return;
        
        const currentPlayTime = ws.getCurrentTime();
        let newTimes = { start: startTime, end: endTime, answerStart: answerStartTime };

        if (part === 'start') {
            newTimes.start = currentPlayTime;
            if (newTimes.end === undefined || newTimes.end <= currentPlayTime) {
                newTimes.end = Math.min(duration, currentPlayTime + 10);
            }
        } else if (part === 'end') {
            newTimes.end = currentPlayTime;
            if (newTimes.start === undefined || newTimes.start >= currentPlayTime) {
                newTimes.start = Math.max(0, currentPlayTime - 10);
            }
        } else if (part === 'answerStart') {
            newTimes.answerStart = currentPlayTime;
        }
        onTimesChange(newTimes);
    };
    
    const handleZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = Number(e.target.value);
        setZoom(newZoom);
        if (wavesurferRef.current) {
            wavesurferRef.current.zoom(newZoom);
        }
    };
    
    const playAnswerClip = () => {
        const ws = wavesurferRef.current;
        if (!ws) return;
        
        activeRegionRef.current = null;
        
        const targetTime = answerStartTime !== undefined ? answerStartTime : endTime;
        if (targetTime !== undefined) {
            ws.setTime(targetTime);
            ws.play();
        }
    };

    // TODO: Translate these strings
    const trimmerTitle = isEditing ? "Éditeur de l'extrait" : "Aperçu de l'extrait";
    const editButtonText = isEditing ? 'Terminé' : 'Modifier';

    return (
        <div className="mt-4 p-4 bg-brand-dark/50 border border-brand-gold/30 rounded-lg">
             <div className="flex justify-between items-center mb-2">
                <div className="text-brand-light/80 font-semibold">
                    {trimmerTitle}
                </div>
                <button onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-2 px-3 py-1 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md text-sm font-semibold transition-colors">
                    {isEditing ? <CheckIcon className="h-5 w-5" /> : <EditIcon className="h-5 w-5" />}
                    {editButtonText}
                </button>
            </div>
            {isLoading && (
              <div className="h-[60px] flex items-center justify-center text-brand-light/80">
                <SpinnerIcon className="h-6 w-6 mr-2 animate-spin"/>
                Analyse de l'audio...
              </div>
            )}
            <div ref={containerRef} className={`${isLoading ? 'hidden' : ''}`} />
            
             {isEditing && !isLoading && (
                <div className="mt-3 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between text-base font-mono">
                        <span className="text-brand-light">{formatTime(currentTime)}</span>
                        <span className="text-brand-light/70">{formatTime(duration)}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        <button onClick={() => wavesurferRef.current?.playPause()} className="flex items-center justify-center p-2 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-md text-sm font-semibold transition-colors">
                            {isPlaying ? <PauseIcon className="h-5 w-5 mr-2" /> : <PlayIcon className="h-5 w-5 mr-2" />}
                            {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        <button onClick={playQuestionClip} disabled={!regionRef.current} className="flex items-center justify-center p-2 bg-brand-burgundy hover:bg-brand-burgundy-dark rounded-md text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                            <PlayIcon className="h-5 w-5 mr-2" />
                            Tester Extrait
                        </button>
                        <button onClick={playAnswerClip} className="flex items-center justify-center p-2 bg-purple-800 hover:bg-purple-700 rounded-md text-sm font-semibold">
                            <PlayIcon className="h-5 w-5 mr-2" />
                            Tester Réponse
                        </button>
                        <button onClick={() => setIsLooping(l => !l)} className={`flex items-center justify-center p-2 rounded-md text-sm font-semibold transition-colors ${isLooping ? 'bg-blue-600 text-white' : 'bg-blue-800/70 hover:bg-blue-700'}`}>
                            <LoopIcon className="h-5 w-5 mr-2" />
                            Boucle
                        </button>
                        <button onClick={() => onTimesChange({})} className="flex items-center justify-center p-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md text-sm font-semibold">
                            <ClearIcon className="h-5 w-5 mr-2" /> Tout Effacer
                        </button>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <ZoomOutIcon className="h-6 w-6 text-brand-light/70"/>
                        <input type="range" min="1" max="500" value={zoom} onChange={handleZoom} className="w-full h-2 bg-brand-dark/50 rounded-lg appearance-none cursor-pointer range-lg accent-brand-gold" />
                        <ZoomInIcon className="h-6 w-6 text-brand-light/70"/>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4 pt-2">
                        <div>
                            <label className="block text-sm font-medium text-brand-light/70 mb-1">Début Question (s)</label>
                            <div className="flex items-center gap-2">
                                 <input type="number" step="0.1" min="0" max={duration} value={startTime === undefined ? '' : startTime} onChange={(e) => handleTimeInputChange('start', e.target.value)} placeholder="Non défini" className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base" />
                                 <button onClick={() => setMarkerAtCurrentTime('start')} className="p-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md" title="Définir le début sur la tête de lecture"><StartMarkerIcon className="h-5 w-5 text-brand-light/80"/></button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-light/70 mb-1">Fin Question (s)</label>
                             <div className="flex items-center gap-2">
                                <input type="number" step="0.1" min={startTime !== undefined ? startTime : 0} max={duration} value={endTime === undefined ? '' : endTime} onChange={(e) => handleTimeInputChange('end', e.target.value)} placeholder="Non défini" className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base" />
                                <button onClick={() => setMarkerAtCurrentTime('end')} className="p-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md" title="Définir la fin sur la tête de lecture"><EndMarkerIcon className="h-5 w-5 text-brand-light/80"/></button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-light/70 mb-1">Début Réponse (s)</label>
                             <div className="flex items-center gap-2">
                                <input type="number" step="0.1" min="0" max={duration} value={answerStartTime === undefined ? '' : answerStartTime} onChange={(e) => handleTimeInputChange('answerStart', e.target.value)} placeholder="Fin de l'extrait" className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base" />
                                <button onClick={() => setMarkerAtCurrentTime('answerStart')} className="p-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md" title="Définir le début de la réponse sur la tête de lecture"><AnswerMarkerIcon className="h-5 w-5 text-brand-light/80"/></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AudioTrimmer;