import { createTiledImage } from './canvas-utils';

export interface ProcessingOptions {
  gridSize: { cols: number; rows: number };
  scale: number;
  addPerlin: boolean;
  isDryRun: boolean;
}

const MAX_PREVIEW_WIDTH = 1000;

export async function processImage(sourceImage: string, options: ProcessingOptions): Promise<string> {
  const img = await loadImage(sourceImage);
  
  // Calculate target dimensions while maintaining aspect ratio
  const aspectRatio = img.height / img.width;
  const targetWidth = Math.min(MAX_PREVIEW_WIDTH, img.width * options.gridSize.cols * options.scale);
  const targetHeight = targetWidth * aspectRatio * (options.gridSize.rows / options.gridSize.cols);

  // Create scaled canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: false })!;
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Draw initial tile to offscreen canvas for better performance
  const tileCanvas = document.createElement('canvas');
  const tileCtx = tileCanvas.getContext('2d', { alpha: false })!;
  const scaledTileWidth = targetWidth / options.gridSize.cols;
  const scaledTileHeight = targetHeight / options.gridSize.rows;
  tileCanvas.width = scaledTileWidth;
  tileCanvas.height = scaledTileHeight;
  tileCtx.drawImage(img, 0, 0, scaledTileWidth, scaledTileHeight);

  // Draw tiles in batches
  const BATCH_SIZE = 4;
  for (let row = 0; row < options.gridSize.rows; row++) {
    for (let col = 0; col < options.gridSize.cols; col += BATCH_SIZE) {
      const batchEnd = Math.min(col + BATCH_SIZE, options.gridSize.cols);
      
      // Draw batch of tiles
      for (let x = col; x < batchEnd; x++) {
        ctx.drawImage(
          tileCanvas,
          x * scaledTileWidth,
          row * scaledTileHeight,
          scaledTileWidth,
          scaledTileHeight
        );
      }
      
      // Allow event loop to continue
      if (col + BATCH_SIZE < options.gridSize.cols) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  if (options.addPerlin && !options.isDryRun) {
    await addNoiseInChunks(canvas);
  }

  // Clean up and return result
  const result = canvas.toDataURL('image/jpeg', options.isDryRun ? 0.8 : 0.92);
  tileCanvas.width = tileCanvas.height = 0;
  canvas.width = canvas.height = 0;
  return result;
}

async function addNoiseInChunks(canvas: HTMLCanvasElement): Promise<void> {
  const ctx = canvas.getContext('2d')!;
  const CHUNK_SIZE = 100;
  
  for (let y = 0; y < canvas.height; y += CHUNK_SIZE) {
    for (let x = 0; x < canvas.width; x += CHUNK_SIZE) {
      const w = Math.min(CHUNK_SIZE, canvas.width - x);
      const h = Math.min(CHUNK_SIZE, canvas.height - y);
      const imageData = ctx.getImageData(x, y, w, h);
      addNoise(imageData.data);
      ctx.putImageData(imageData, x, y);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

function addNoise(data: Uint8ClampedArray, amount = 8): void {
  for (let i = 0; i < data.length; i += 16) {
    const noise = (Math.random() - 0.5) * amount;
    for (let j = 0; j < 4; j++) {
      const idx = i + (j * 4);
      if (idx < data.length) {
        data[idx] = Math.max(0, Math.min(255, data[idx] + noise));
        data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + noise));
        data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + noise));
      }
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
