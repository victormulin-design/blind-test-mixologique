import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { CropData } from '../../types.ts';

interface ImageCropperProps {
  imageUrl: string;
  initialCropData?: CropData;
  onSave: (crop: CropData) => void;
  onClose: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageUrl, initialCropData, onSave, onClose }) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [crop, setCrop] = useState({ x: 25, y: 25, width: 50, height: 50 }); // In pixels
    const [isDragging, setIsDragging] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent, handle?: string) => {
        e.preventDefault();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        setDragStart({ x: clientX, y: clientY });
        if (handle) {
            setResizeHandle(handle);
        } else {
            setIsDragging(true);
        }
    };
    
    const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, handle: string) => {
        e.stopPropagation();
        handleInteractionStart(e, handle);
    }

    const handleInteractionEnd = useCallback(() => {
        setIsDragging(false);
        setResizeHandle(null);
    }, []);

    const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging && !resizeHandle) return;
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const dx = clientX - dragStart.x;
        const dy = clientY - dragStart.y;
        
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        setCrop(prevCrop => {
            let { x, y, width, height } = { ...prevCrop };
            if (isDragging) {
                x += dx;
                y += dy;
            } else if (resizeHandle) {
                if (resizeHandle.includes('right')) width += dx;
                if (resizeHandle.includes('left')) { x += dx; width -= dx; }
                if (resizeHandle.includes('bottom')) height += dy;
                if (resizeHandle.includes('top')) { y += dy; height -= dy; }
            }

            // Constrain movement and size
            if (width < 20) width = 20;
            if (height < 20) height = 20;

            if (x < 0) x = 0;
            if (y < 0) y = 0;
            if (x + width > rect.width) x = rect.width - width;
            if (y + height > rect.height) y = rect.height - height;
            if (x + width > rect.width) width = rect.width - x;
            if (y + height > rect.height) height = rect.height - y;
            
            return { x, y, width, height };
        });

        setDragStart({ x: clientX, y: clientY });
    }, [isDragging, resizeHandle, dragStart]);


    useEffect(() => {
        window.addEventListener('mousemove', handleInteractionMove);
        window.addEventListener('mouseup', handleInteractionEnd);
        window.addEventListener('touchmove', handleInteractionMove);
        window.addEventListener('touchend', handleInteractionEnd);
        return () => {
            window.removeEventListener('mousemove', handleInteractionMove);
            window.removeEventListener('mouseup', handleInteractionEnd);
            window.removeEventListener('touchmove', handleInteractionMove);
            window.removeEventListener('touchend', handleInteractionEnd);
        };
    }, [handleInteractionMove, handleInteractionEnd]);
    
    // Initialize crop from props
    useEffect(() => {
        const img = imgRef.current;
        if (img && img.naturalWidth > 0) {
            const { width, height } = img.getBoundingClientRect();
             if (initialCropData) {
                setCrop({
                    x: (initialCropData.x / 100) * width,
                    y: (initialCropData.y / 100) * height,
                    width: (initialCropData.width / 100) * width,
                    height: (initialCropData.height / 100) * height,
                });
            } else { // Default to a centered square
                const size = Math.min(width, height) * 0.8;
                setCrop({ x: (width - size) / 2, y: (height - size) / 2, width: size, height: size });
            }
        }
    }, [imageUrl, initialCropData, imgRef.current?.naturalWidth]);

    const handleSave = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const percentCrop: CropData = {
            x: (crop.x / rect.width) * 100,
            y: (crop.y / rect.height) * 100,
            width: (crop.width / rect.width) * 100,
            height: (crop.height / rect.height) * 100,
        };
        onSave(percentCrop);
    };
    
    const handles = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'];

    return (
        <div 
            className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in" 
            onClick={onClose}
        >
           <div 
                className="bg-brand-dark/95 border-2 border-brand-gold/50 rounded-lg shadow-2xl p-6 w-full max-w-4xl m-4 text-brand-light space-y-4" 
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="font-display text-2xl text-brand-gold tracking-widest text-center">Rogner l'image</h3>
                <p className="text-center text-brand-light/70">Sélectionnez la partie de l'image à afficher pour la question.</p>
                
                <div ref={containerRef} className="relative w-full max-h-[60vh] select-none" style={{ touchAction: 'none' }}>
                    <img ref={imgRef} src={imageUrl} className="max-w-full max-h-full object-contain mx-auto" alt="À rogner"/>
                    <div 
                        className="absolute cursor-move border-2 border-brand-gold"
                        style={{ left: crop.x, top: crop.y, width: crop.width, height: crop.height, boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)' }}
                        onMouseDown={(e) => handleInteractionStart(e)}
                        onTouchStart={(e) => handleInteractionStart(e)}
                    >
                        {handles.map(handle => (
                            <div 
                                key={handle}
                                className={`absolute w-3 h-3 bg-brand-gold rounded-full border-2 border-brand-dark 
                                ${handle.includes('left') ? '-left-1.5' : ''} ${handle.includes('right') ? '-right-1.5' : ''}
                                ${handle.includes('top') ? '-top-1.5' : ''} ${handle.includes('bottom') ? '-bottom-1.5' : ''}
                                ${handle.includes('top') && !handle.includes('left') && !handle.includes('right') ? 'left-1/2 -translate-x-1/2' : ''}
                                ${handle.includes('bottom') && !handle.includes('left') && !handle.includes('right') ? 'left-1/2 -translate-x-1/2' : ''}
                                ${handle.includes('left') && !handle.includes('top') && !handle.includes('bottom') ? 'top-1/2 -translate-y-1/2' : ''}
                                ${handle.includes('right') && !handle.includes('top') && !handle.includes('bottom') ? 'top-1/2 -translate-y-1/2' : ''}
                                ${handle.includes('top') || handle.includes('bottom') ? 'cursor-ns-resize' : ''}
                                ${handle.includes('left') || handle.includes('right') ? 'cursor-ew-resize' : ''}
                                ${handle === 'top-left' || handle === 'bottom-right' ? 'cursor-nwse-resize' : ''}
                                ${handle === 'top-right' || handle === 'bottom-left' ? 'cursor-nesw-resize' : ''}
                                `}
                                onMouseDown={(e) => handleResizeStart(e, handle)}
                                onTouchStart={(e) => handleResizeStart(e, handle)}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <button onClick={onClose} className="flex-1 font-display px-6 py-2 bg-brand-dark/50 border border-brand-burgundy hover:bg-brand-burgundy rounded-lg font-bold text-lg tracking-widest uppercase transition-all duration-300">
                        Annuler
                    </button>
                    <button onClick={handleSave} className="flex-1 font-display px-6 py-2 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-lg font-bold text-lg tracking-widest uppercase transition-all duration-300">
                        Sauvegarder
                    </button>
                </div>
           </div>
        </div>
    );
};

export default ImageCropper;