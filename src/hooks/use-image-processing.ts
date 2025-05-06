import { useState, useCallback } from 'react';
import { processImage, type ProcessingOptions } from '../lib/image-utils';

export function useImageProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processImages = useCallback(async (
    images: string[],
    options: ProcessingOptions
  ): Promise<string[]> => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const results: string[] = [];
      const batchSize = 5;

      for (let i = 0; i < images.length; i += batchSize) {
        const batch = images.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(img => processImage(img, options))
        );
        
        results.push(...batchResults);
        
        // Update progress
        setProgress((Math.min(i + batchSize, images.length) / images.length) * 100);
        
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 50));
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
