import { useState, useCallback } from 'react';
import { processImage, type ProcessingOptions } from '../lib/image-utils';

export function useImageProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const processImages = useCallback(async (
    images: string[], 
    options: ProcessingOptions
  ) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const results: string[] = [];
      const batchSize = 2; // Process 2 images at a time
      
      for (let i = 0; i < images.length; i += batchSize) {
        const batch = images.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(img => processImage(img, options))
        );
        results.push(...batchResults);
        setProgress(((i + batchSize) / images.length) * 100);
        
        // Force garbage collection if available
        if (typeof window.gc === 'function') {
          window.gc();
        }
      }
      
      return results;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, []);

  return {
    processImages,
    isProcessing,
    progress
  };
}
