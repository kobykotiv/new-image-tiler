import { useState, useRef, DragEvent } from "react";
import JSZip from 'jszip';
import { useImageProcessing } from './hooks/use-image-processing';

// Helper function to read file as base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Create blob URL for download
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Remove unused base64ToUint8Array function

interface GridSize {
  cols: number;
  rows: number;
}

const gridOptions: GridSize[] = [
  { cols: 2, rows: 2 },
  { cols: 4, rows: 4 },
  { cols: 6, rows: 6 },
  { cols: 8, rows: 8 },
  { cols: 10, rows: 10 },
  { cols: 12, rows: 12 },
];

const scaleOptions = [0.25, 0.5, 1, 2, 4, 8];

function App() {
  const [selectedGrid, setSelectedGrid] = useState<GridSize>(gridOptions[0]);
  const [imagesBase64, setImagesBase64] = useState<string[]>([]);
  const [outputImages, setOutputImages] = useState<string[]>([]); // Store all outputs
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedScale, setSelectedScale] = useState(1);
  const [isDryRun, setIsDryRun] = useState(false);
  const [addPerlin, setAddPerlin] = useState(false);

  const { processImages, isProcessing: processing, progress } = useImageProcessing();

  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleGridSelect = (grid: GridSize) => {
    setSelectedGrid(grid);
    setImagesBase64([]);
    setOutputImages([]);
    setError(null);
    setSuccess(null);
  };

  const handleImageSelect = async () => {
    setError(null);
    setSuccess(null);
    setOutputImages([]);
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*';
      
      input.onchange = async (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        if (files.length > 100) {
          setError("You can upload up to 100 images at once.");
          setImagesBase64([]);
          return;
        }
        
        setIsLoading(true);
        const base64Promises = files.map(file => fileToBase64(file));
        const base64Results = await Promise.all(base64Promises);
        setImagesBase64(base64Results);
        setIsLoading(false);
        setSuccess(`${base64Results.length} images loaded successfully!`);
      };
      
      input.click();
    } catch (err) {
      console.error("Error selecting images:", err);
      setError(`Error selecting images: ${err instanceof Error ? err.message : String(err)}`);
      setIsLoading(false);
    }
  };

  const handleTileImages = async () => {
    if (imagesBase64.length === 0) {
      setError("Please upload at least one seamless tile image.");
      return;
    }
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    setOutputImages([]);

    try {
      const results = await processImages(imagesBase64, {
        gridSize: selectedGrid,
        scale: selectedScale,
        addPerlin,
        isDryRun
      });
      
      setOutputImages(results);
      setSuccess(isDryRun
        ? `Dry run previews generated for ${results.length} images!`
        : `Tiled outputs generated for ${results.length} images!`
      );
    } catch (err) {
      console.error("Error tiling images:", err);
      setError(`Error tiling images: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setIsLoading(true);
      const zip = new JSZip();

      // Only add tiled outputs to zip
      outputImages.forEach((img, index) => {
        const imgData = img.split(',')[1];
        zip.file(
          `tiled_${index + 1}_${selectedGrid.cols}x${selectedGrid.rows}_scale${selectedScale}${addPerlin ? '_perlin' : ''}.png`,
          imgData,
          { base64: true }
        );
      });

      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, "tiled-outputs.zip");
      setSuccess("All tiled outputs saved successfully!");
    } catch (err) {
      console.error("Error creating zip:", err);
      setError(`Error creating zip file: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to read files as base64
  const readFilesAsBase64 = async (files: File[]): Promise<string[]> => {
    return Promise.all(
      Array.from(files).map(
        (file) => 
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('Could not read file'));
              }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    );
  };
  
  // Drag and drop event handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set isDragging to false if we're leaving the drop zone (not entering a child element)
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Set dataTransfer.dropEffect to 'copy' to show a "+" cursor
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };
  
  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);
    setSuccess(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = e.dataTransfer.files;
      const imageFiles = Array.from(fileList).filter(file =>
        file.type.startsWith('image/')
      );

      if (imageFiles.length === 0) {
        setError("No image files were dropped. Please drop image files only.");
        return;
      }
      if (imageFiles.length > 100) {
        setError("You can upload up to 100 images at once.");
        return;
      }

      try {
        setIsLoading(true);
        const base64Results = await readFilesAsBase64(imageFiles);
        setImagesBase64(base64Results);
        setIsLoading(false);
        setSuccess(`${base64Results.length} images loaded successfully!`);
      } catch (err) {
        console.error("Error processing dropped images:", err);
        setError(`Error processing dropped images: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
      }
    }
  };

  return (
    <main className="container mx-auto p-4 flex flex-col items-center space-y-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mt-4">Batch Seamless Tile Renderer</h1>
      <p className="text-center text-gray-600 dark:text-gray-400 max-w-md">
        Upload up to 100 seamless tiles (1024x1024), select a grid, and generate repeated tiled outputs for each image.
      </p>

      {/* Grid Selection */}
      <div className="flex flex-wrap justify-center gap-2">
        <span className="self-center mr-2 font-medium">Grid Size:</span>
        {gridOptions.map((grid) => (
          <button
            key={`${grid.cols}x${grid.rows}`}
            onClick={() => handleGridSelect(grid)}
            className={`px-4 py-2 rounded transition-colors duration-200 ${
              selectedGrid.cols === grid.cols && selectedGrid.rows === grid.rows
                ? "bg-blue-600 text-white"
                : "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
            }`}
          >
            {grid.cols}x{grid.rows}
          </button>
        ))}
      </div>

      {/* Scale Selection */}
      <div className="flex flex-wrap justify-center gap-2">
        <span className="self-center mr-2 font-medium">Scale:</span>
        {scaleOptions.map((scale) => (
          <button
            key={scale}
            onClick={() => setSelectedScale(scale)}
            className={`px-4 py-2 rounded transition-colors duration-200 ${
              selectedScale === scale
                ? "bg-blue-600 text-white"
                : "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
            }`}
          >
            {scale}x
          </button>
        ))}
      </div>

      {/* Dry Run Toggle */}
      <div className="flex items-center space-x-2">
        <span className="font-medium">Dry Run Mode:</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isDryRun}
            onChange={() => setIsDryRun(!isDryRun)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
        <span className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
          {isDryRun 
            ? "Preview only: Faster but lower quality" 
            : "Full process: High quality but slower"}
        </span>
      </div>

      {/* Perlin Noise Toggle */}
      <div className="flex items-center space-x-2">
        <span className="font-medium">Add Perlin Noise:</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={addPerlin}
            onChange={() => setAddPerlin(!addPerlin)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
        <span className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
          {addPerlin
            ? "Subtle Perlin noise will be added to each tile."
            : "No noise: output is a pure repeat."}
        </span>
      </div>

      {/* Image Selection with Drag & Drop */}
      <div 
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full max-w-2xl p-6 border-2 ${
          isDragging 
            ? "border-blue-500 bg-blue-100/50 dark:bg-blue-900/30" 
            : "border-dashed border-gray-400 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50"
        } rounded-lg text-center transition-colors duration-200 shadow-lg`}
      >
        <div className="flex flex-col items-center">
          <button
            onClick={handleImageSelect}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors duration-200"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : `Select Images (${imagesBase64.length} / 100)`}
          </button>
          
          <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
            {isDragging 
              ? `Drop up to 100 seamless tiles here...` 
              : imagesBase64.length === 0 
                ? `Click to select or drag & drop up to 100 seamless tiles (1024x1024). Each will be repeated in a ${selectedGrid.cols}x${selectedGrid.rows} grid.`
                : `${imagesBase64.length} images selected.`
            }
          </p>
        </div>
        
        {/* Preview of selected images */}
        {imagesBase64.length > 0 && (
          <div className="mt-6 overflow-hidden">
            <h3 className="text-lg font-medium mb-2">Selected Images Preview</h3>
            <div 
              className="grid gap-2 max-h-64 overflow-y-auto p-2 bg-gray-200 dark:bg-gray-700 rounded" 
              style={{ 
                gridTemplateColumns: `repeat(${Math.min(4, selectedGrid.cols)}, minmax(0, 1fr))` 
              }}
            >
              {imagesBase64.map((src, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={src} 
                    alt={`Selected ${index + 1}`} 
                    className="w-full h-20 object-cover rounded border border-gray-300 dark:border-gray-600" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tiling Button */}
      <button
        onClick={handleTileImages}
        disabled={isLoading || imagesBase64.length === 0}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded text-lg disabled:opacity-50 transition-colors duration-200 shadow-lg"
      >
        {isLoading ? "Processing..." : "Generate Tiled Outputs"}
      </button>

      {/* Success Message */}
      {success && !error && (
        <p className="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 p-3 rounded w-full max-w-2xl text-center">
          {success}
        </p>
      )}

      {/* Error Display */}
      {error && (
        <p className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 p-3 rounded w-full max-w-2xl text-center">
          {error}
        </p>
      )}

      {/* Output Display */}
      {outputImages.length > 0 && (
        <div className="w-full max-w-3xl p-6 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 flex flex-col items-center space-y-4 shadow-xl">
          <h2 className="text-xl font-semibold">Tiled Output Images</h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {outputImages.map((img, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <img
                  src={img}
                  alt={`Tiled Output ${idx + 1}`}
                  className="max-w-full max-h-48 h-auto rounded shadow-lg"
                />
                <span className="text-xs mt-1">Output {idx + 1}</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleDownloadZip}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors duration-200"
          >
            {isLoading ? "Creating Zip..." : "Download Tiled Outputs"}
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center pb-6">
        Built with Tauri, React, TypeScript, and Tailwind CSS
      </footer>
    </main>
  );
}

export default App;
