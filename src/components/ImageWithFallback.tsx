import React, { useState, useEffect } from 'react';
import { getFallbackImage } from '../lib/utils';
import { cn } from '../lib/utils';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSeed: string;
  fallbackWidth?: number;
  fallbackHeight?: number;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  fallbackSeed,
  fallbackWidth = 400,
  fallbackHeight = 300,
  className,
  src,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const imgRef = React.useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) {
      setCurrentSrc(getFallbackImage(fallbackSeed, fallbackWidth, fallbackHeight));
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    setError(false);
    setCurrentSrc(src);

    // Check if image is already complete (cached)
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }

    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 8000); // Reduce timeout to 8s for better UX

    return () => clearTimeout(timer);
  }, [src, fallbackSeed, fallbackWidth, fallbackHeight]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
    setCurrentSrc(getFallbackImage(fallbackSeed, fallbackWidth, fallbackHeight));
    setIsLoaded(true);
  };

  return (
    <div className={cn("relative overflow-hidden w-full h-full bg-slate-50", className)}>
      {/* Skeleton Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center z-10">
           <div className="w-1/3 h-1/3 bg-slate-200 rounded-full opacity-30"></div>
        </div>
      )}
      
      <img
        {...props}
        ref={imgRef}
        src={currentSrc}
        onLoad={handleLoad}
        onError={handleError}
        crossOrigin="anonymous"
        className={cn(
          "w-full h-full object-cover transition-opacity duration-500 ease-in-out",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
};