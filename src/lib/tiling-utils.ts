interface TileOptions {
  gridCols: number;
  gridRows: number;
  scale: number;
}

export async function createTilePreview(sourceImage: string, options: TileOptions): Promise<string> {
  const img = await loadImage(sourceImage);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Set preview canvas size based on source image and grid
  const tileWidth = img.width;
  const tileHeight = img.height;
  canvas.width = tileWidth * options.gridCols * options.scale;
  canvas.height = tileHeight * options.gridRows * options.scale;

  // Draw the tiles
  for (let row = 0; row < options.gridRows; row++) {
    for (let col = 0; col < options.gridCols; col++) {
      ctx.drawImage(
        img,
        0, 0, img.width, img.height,  // Source rectangle
        col * tileWidth * options.scale,
        row * tileHeight * options.scale,
        tileWidth * options.scale,
        tileHeight * options.scale
      );
    }
  }

  return canvas.toDataURL('image/png', 0.8);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
    img.crossOrigin = 'anonymous';  // Handle CORS images
  });
}
