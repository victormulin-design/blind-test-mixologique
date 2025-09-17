import React from 'react';
import type { CropData } from '../../types.ts';

interface CroppedImageProps {
  src?: string;
  cropData?: CropData;
  alt?: string;
  className?: string;
}

const CroppedImage: React.FC<CroppedImageProps> = ({ src, cropData, alt = "Image recadrée", className = '' }) => {
  if (!src) {
    return <div className={`w-full h-full bg-brand-dark/50 flex items-center justify-center text-brand-light/50 ${className}`}>Pas d'image</div>;
  }
  
  // If no crop data, or if crop data is invalid, just display the full image, contained.
  if (!cropData || cropData.width === 0 || cropData.height === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <img src={src} alt={alt} className="max-w-full max-h-full object-contain" />
      </div>
    );
  }
  
  const aspectRatio = cropData.width / cropData.height;

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    aspectRatio: `${aspectRatio}`,
  };
  
  const imageStyle: React.CSSProperties = {
    position: 'absolute',
    top: `-${(cropData.y / cropData.height) * 100}%`,
    left: `-${(cropData.x / cropData.width) * 100}%`,
    width: `${(100 / cropData.width) * 100}%`,
    height: `${(100 / cropData.height) * 100}%`,
    maxWidth: 'none',
    maxHeight: 'none',
  };

  return (
    <div style={containerStyle} className={className}>
      <img
        src={src}
        alt={alt}
        style={imageStyle}
      />
    </div>
  );
};

export default CroppedImage;