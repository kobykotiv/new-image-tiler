import { useState, useCallback } from 'react'
import { processImage } from '@/lib/image-utils'

interface ProcessingOptions {
  gridSize: { cols: number; rows: number }
  scale: number
  addPerlin: boolean
  isDryRun: boolean
}

export function useImageProcessing() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const processImages = useCallback(async (
    images: File[], 
    options: ProcessingOptions
  ) => {
    setIsProcessing(true)
    setProgress(0)
    
    try {
      const results = []
      const total = images.length
      
      for (let i = 0; i < total; i++) {
        const result = await processImage(images[i], options)
        results.push(result)
        setProgress(((i + 1) / total) * 100)
      }
      
      return results
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }, [])

  return {
    processImages,
    isProcessing,
    progress
  }
}
