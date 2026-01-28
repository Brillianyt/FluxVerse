import React from 'react';
import { cn } from '../lib/utils';

interface ParticleAuroraProps {
  className?: string;
}

export const ParticleAurora = ({ className }: ParticleAuroraProps) => {
  return (
    <div className={cn("fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#f8f9fc]", className)}>
      {/* Background Gradients - Adjusted for full screen coverage */}
      <div className="absolute inset-0 z-0 opacity-60">
        {/* Warm Orange Blob - Top Left */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-orange-200/40 blur-[120px] animate-blob mix-blend-multiply filter" />
        
        {/* Bright Yellow Blob - Top Right */}
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-yellow-200/40 blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply filter" />
        
        {/* Purple/Pink Blob - Bottom/Center */}
        <div className="absolute bottom-[-20%] left-[20%] w-[70%] h-[80%] rounded-full bg-purple-200/40 blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply filter" />
        
        {/* Blue Blob - Center/Right */}
        <div className="absolute top-[40%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-200/40 blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply filter" />
      </div>

      {/* Noise Overlay - Global Grain */}
      <div className="absolute inset-0 z-[1] opacity-50">
        <svg className="w-full h-full">
          <filter id="noiseFilter">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.8" 
              stitchTiles="stitch" 
              numOctaves="3" 
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>
      
      {/* Soft gradient overlay to fade to white at the very bottom if needed, or keep full */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/50 z-[2]" />
    </div>
  );
};
