import React, { useRef, useState, useEffect } from 'react';
import { PlayIcon, PauseIcon } from '../IconComponents';

interface CustomAudioPlayerProps {
  src: string;
  startTime?: number;
  endTime?: number;
}

const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ src, startTime, endTime }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef<number | null>(null);

    const stopChecking = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const startChecking = () => {
            stopChecking();
            intervalRef.current = window.setInterval(() => {
                if (audio && endTime !== undefined && audio.currentTime >= endTime) {
                    audio.pause();
                }
            }, 50); // Increased frequency for better accuracy
        };

        const handlePlay = () => {
            setIsPlaying(true);
            startChecking();
        };
        const handlePause = () => {
            setIsPlaying(false);
            stopChecking();
        };
        const handleEnded = () => {
            setIsPlaying(false);
            stopChecking();
            if (audio && startTime !== undefined) {
                audio.currentTime = startTime;
            }
        };

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        // Reset time if src changes
        if (audio.src !== src) {
          audio.src = src;
        }
        audio.currentTime = startTime || 0;


        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
            stopChecking();
        };
    }, [src, startTime, endTime]);

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
             if (
                (startTime !== undefined && audio.currentTime < startTime) ||
                (endTime !== undefined && audio.currentTime >= endTime) ||
                audio.ended
            ) {
                audio.currentTime = startTime || 0;
            }

            if (endTime !== undefined && audio.currentTime >= endTime) {
                return;
            }

            const playPromise = audio.play();
             if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Audio play prevented:", error);
                    setIsPlaying(false);
                });
            }
        } else {
            audio.pause();
        }
    };

    return (
        <div className="flex justify-center">
            <audio ref={audioRef} src={src} preload="auto" style={{ display: 'none' }} />
            <button onClick={togglePlayPause} className="flex items-center justify-center w-20 h-20 [&[data-screen-profile=small]]:w-16 [&[data-screen-profile=small]]:h-16 rounded-full bg-brand-gold hover:bg-brand-light text-brand-dark transition-transform transform hover:scale-110 shadow-lg">
                {isPlaying ? <PauseIcon className="w-10 h-10 [&[data-screen-profile=small]]:w-8 [&[data-screen-profile=small]]:h-8"/> : <PlayIcon className="w-10 h-10 [&[data-screen-profile=small]]:w-8 [&[data-screen-profile=small]]:h-8 ml-1"/>}
            </button>
        </div>
    );
};

export default CustomAudioPlayer;
