import React, { useCallback } from 'react'
import * as Progress from '@radix-ui/react-progress'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ImageDropzoneProps {
  onImagesDrop: (files: File[]) => void
  maxFiles?: number
  isLoading?: boolean
  progress?: number
}

export function ImageDropzone({ 
  onImagesDrop, 
  maxFiles = 100,
  isLoading,
  progress
}: ImageDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > maxFiles) {
      // Handle max files exceeded
      return
    }
    onImagesDrop(acceptedFiles)
  }, [maxFiles, onImagesDrop])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles
  })

  return (
    <div 
      {...getRootProps()} 
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
        isDragActive ? "border-primary bg-primary/5" : "border-muted",
        isLoading && "pointer-events-none opacity-50"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <Button variant="ghost" disabled={isLoading}>
          Select Images
        </Button>
        <p className="text-sm text-muted-foreground">
          Drop up to {maxFiles} seamless tiles here
        </p>
        {isLoading && (
          <Progress.Root className="w-full h-2 bg-secondary overflow-hidden rounded-full">
            <Progress.Indicator 
              className="h-full bg-primary transition-all" 
              style={{ transform: `translateX(-${100 - (progress || 0)}%)` }}
            />
          </Progress.Root>
        )}
      </div>
    </div>
  )
}
