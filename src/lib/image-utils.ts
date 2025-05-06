import { createTiledImage } from './canvas-utils';

export interface ProcessingOptions {
  gridSize: { cols: number; rows: number };
  scale: number;
  addPerlin: boolean;
  isDryRun: boolean;
}

export async function processImage(
  imgBase64: string, 
  options: ProcessingOptions
): Promise<string> {
  try {
    return await createTiledImage(
      imgBase64,
      options.gridSize.cols,
      options.gridSize.rows,
      options.scale,
      options.addPerlin && !options.isDryRun
    );
  } catch (err) {
    console.error('Error processing image:', err);
    throw err;
  }
}

function addNoise(data: Uint8ClampedArray, amount = 10): void {
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
