interface TileOptions {
  gridCols: number;
  gridRows: number;
  scale: number;
  addPerlin: boolean;
  isDryRun: boolean;
}

async function tileImage(imageData: string, options: TileOptions): Promise<string> {
  const img = await createImageBitmap(await (await fetch(imageData)).blob());
  const canvas = new OffscreenCanvas(
    img.width * options.gridCols * options.scale,
    img.height * options.gridRows * options.scale
  );
  const ctx = canvas.getContext('2d')!;

  for (let row = 0; row < options.gridRows; row++) {
    for (let col = 0; col < options.gridCols; col++) {
      ctx.drawImage(
        img,
        col * img.width * options.scale,
        row * img.height * options.scale,
        img.width * options.scale,
        img.height * options.scale
      );
    }
  }

  if (options.addPerlin && !options.isDryRun) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    addPerlinNoise(imageData);
    ctx.putImageData(imageData, 0, 0);
  }

  const blob = await canvas.convertToBlob({
    type: 'image/png',
    quality: options.isDryRun ? 0.8 : 1
  });
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function addPerlinNoise(imageData: ImageData, amount = 0.1): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * amount;
    data[i] = Math.max(0, Math.min(255, data[i] + noise * 255));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise * 255));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 255));
  }
}

self.onmessage = async (e: MessageEvent) => {
  try {
    const { image, options } = e.data;
    const result = await tileImage(image, options);
    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};
