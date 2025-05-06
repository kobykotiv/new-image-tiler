import { createTiledImage } from './canvas-utils';

export interface ProcessingOptions {
  gridSize: { cols: number; rows: number };
  scale: number;
  addPerlin: boolean;
  isDryRun: boolean;
}

export async function processImage(imgBase64: string, options: ProcessingOptions): Promise<string> {
  // Load image and create canvas
  const img = await loadImage(imgBase64);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Calculate dimensions
  const tileWidth = img.width;
  const tileHeight = img.height;
  canvas.width = tileWidth * options.gridSize.cols * options.scale;
  canvas.height = tileHeight * options.gridSize.rows * options.scale;

  // Draw the image in a grid pattern
  for (let row = 0; row < options.gridSize.rows; row++) {
    for (let col = 0; col < options.gridSize.cols; col++) {
      const x = col * tileWidth * options.scale;
      const y = row * tileHeight * options.scale;
      ctx.drawImage(
        img,
        x, y,
        tileWidth * options.scale,
        tileHeight * options.scale
      );
    }
  }

  // Add perlin noise if needed
  if (options.addPerlin && !options.isDryRun) {
    addPerlinNoise(ctx, canvas.width, canvas.height);
  }

  // Return as data URL
  return canvas.toDataURL('image/png', options.isDryRun ? 0.8 : 1.0);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function addPerlinNoise(ctx: CanvasRenderingContext2D, width: number, height: number, amount = 10) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

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

  ctx.putImageData(imageData, 0, 0);
}
