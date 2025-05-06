const MAX_TEXTURE_SIZE = 4096;
const CHUNK_SIZE = 1024;

export async function createTiledImage(
  sourceImage: string,
  cols: number,
  rows: number,
  scale: number,
  addNoise = false
): Promise<string> {
  // Load and validate image
  const img = await loadImage(sourceImage);
  const scaledSize = calculateScaledSize(img.width, img.height, scale);
  
  // Create intermediate canvas for a single scaled tile
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = scaledSize.width;
  tileCanvas.height = scaledSize.height;
  const tileCtx = tileCanvas.getContext('2d', { willReadFrequently: true })!;
  tileCtx.drawImage(img, 0, 0, scaledSize.width, scaledSize.height);

  // Create final canvas
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = scaledSize.width * cols;
  finalCanvas.height = scaledSize.height * rows;
  const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true })!;

  // Process in chunks
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      await processChunk(finalCtx, tileCanvas, x, y, scaledSize);
    }
  }

  if (addNoise) {
    await addNoiseInChunks(finalCtx, finalCanvas.width, finalCanvas.height);
  }

  return finalCanvas.toDataURL('image/png');
}

function calculateScaledSize(width: number, height: number, scale: number) {
  const maxSize = MAX_TEXTURE_SIZE / Math.max(2, Math.sqrt(scale));
  const scaledWidth = Math.min(width * scale, maxSize);
  const scaledHeight = Math.min(height * scale, maxSize);
  return { width: scaledWidth, height: scaledHeight };
}

async function processChunk(
  ctx: CanvasRenderingContext2D,
  tileCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  size: { width: number; height: number }
) {
  return new Promise<void>(resolve => {
    requestAnimationFrame(() => {
      ctx.drawImage(
        tileCanvas,
        x * size.width,
        y * size.height,
        size.width,
        size.height
      );
      resolve();
    });
  });
}

async function addNoiseInChunks(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  for (let y = 0; y < height; y += CHUNK_SIZE) {
    for (let x = 0; x < width; x += CHUNK_SIZE) {
      const w = Math.min(CHUNK_SIZE, width - x);
      const h = Math.min(CHUNK_SIZE, height - y);
      const imageData = ctx.getImageData(x, y, w, h);
      addNoiseToData(imageData.data);
      ctx.putImageData(imageData, x, y);
      // Allow other operations to process
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

function addNoiseToData(data: Uint8ClampedArray, amount = 8) {
  for (let i = 0; i < data.length; i += 16) {
    const noise = (Math.random() - 0.5) * amount;
    for (let j = 0; j < 4; j++) {
      const idx = i + (j * 4);
      if (idx < data.length) {
        data[idx] = Math.min(255, Math.max(0, data[idx] + noise));
        data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + noise));
        data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + noise));
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
