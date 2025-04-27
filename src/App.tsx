import { useState, useRef, DragEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { writeFile, readFile } from "@tauri-apps/plugin-fs";

// Helper function to convert file path to base64
async function fileToBase64(filePath: string): Promise<string> {
  const binaryData = await readFile(filePath);
  const base64String = btoa(
    String.fromCharCode(...new Uint8Array(binaryData))
  );
  // Attempt to guess mime type from extension for the data URL
  const extension = filePath.split('.').pop()?.toLowerCase() || 'png';
  const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
  return `data:${mimeType};base64,${base64String}`;
}

// Helper function to decode base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64.split(',')[1]); // Remove data URL prefix
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}


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

function App() {
  const [selectedGrid, setSelectedGrid] = useState<GridSize>(gridOptions[0]);
  const [imagesBase64, setImagesBase64] = useState<string[]>([]);
  const [outputImageBase64, setOutputImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const numRequiredImages = selectedGrid.cols * selectedGrid.rows;

  const handleGridSelect = (grid: GridSize) => {
    setSelectedGrid(grid);
    // Reset images if grid size changes, as the required number changes
    setImagesBase64([]);
    setOutputImageBase64(null);
    setError(null);
    setSuccess(null);
  };

  const handleImageSelect = async () => {
    setError(null);
    setSuccess(null);
    setOutputImageBase64(null);
    try {
      const selectedPaths = await open({
        multiple: true,
        title: `Select ${numRequiredImages} Images`,
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }], // Added webp
      });

      if (selectedPaths) {
        // If user selects more/less than required, inform them.
        // For simplicity, we'll just take the required number if they select more,
        // or show an error if they select less.
        const pathsArray = Array.isArray(selectedPaths) ? selectedPaths : [selectedPaths];

        if (pathsArray.length < numRequiredImages) {
            setError(`Please select exactly ${numRequiredImages} images. You selected ${pathsArray.length}.`);
            setImagesBase64([]); // Clear selection on error
            return;
        }

        // Take only the required number of images
        const requiredPaths = pathsArray.slice(0, numRequiredImages);

        setIsLoading(true); // Show loading while converting
        const base64Promises = requiredPaths.map(path => fileToBase64(path));
        const base64Results = await Promise.all(base64Promises);
        setImagesBase64(base64Results);
        setIsLoading(false);
        
        if (pathsArray.length > numRequiredImages) {
            setError(`Warning: You selected ${pathsArray.length} images, but only the first ${numRequiredImages} were used for the ${selectedGrid.cols}x${selectedGrid.rows} grid.`);
        } else {
            setSuccess(`All ${numRequiredImages} images loaded successfully!`);
        }
      } else {
        // User cancelled dialog
        // setImagesBase64([]); // Optionally clear if you want cancellation to reset
      }
    } catch (err) {
      console.error("Error selecting images:", err);
      setError(`Error selecting images: ${err instanceof Error ? err.message : String(err)}`);
      setIsLoading(false);
    }
  };

  const handleTileImages = async () => {
    if (imagesBase64.length !== numRequiredImages) {
      setError(`Please select exactly ${numRequiredImages} images for a ${selectedGrid.cols}x${selectedGrid.rows} grid.`);
      return;
    }
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    setOutputImageBase64(null);

    try {
      const result = await invoke<string>("tile_images", {
        args: {
          images_base64: imagesBase64,
          grid_cols: selectedGrid.cols,
          grid_rows: selectedGrid.rows,
        }
      });
      setOutputImageBase64(result);
      setSuccess("Image tiled successfully!");
    } catch (err) {
      console.error("Error tiling images:", err);
      setError(`Error tiling images: ${String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

 const handleSaveImage = async () => {
    if (!outputImageBase64) return;
    setError(null);
    setSuccess(null);

    try {
      const defaultPath = `tiled_image_${selectedGrid.cols}x${selectedGrid.rows}.png`;
      const filePath = await save({
        title: 'Save Tiled Image',
        defaultPath: defaultPath,
        filters: [{ name: 'PNG Image', extensions: ['png'] }],
      });

      if (filePath) {
        setIsLoading(true);
        const binaryData = base64ToUint8Array(outputImageBase64);
        await writeFile(filePath, binaryData);
        setSuccess(`Image saved successfully to ${filePath}!`);
      }
    } catch (err) {
      console.error("Error saving image:", err);
      setError(`Error saving image: ${err instanceof Error ? err.message : String(err)}`);
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
      
      if (imageFiles.length < numRequiredImages) {
        setError(`Please drop exactly ${numRequiredImages} images. You dropped ${imageFiles.length}.`);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Take only the required number of images
        const requiredFiles = imageFiles.slice(0, numRequiredImages);
        const base64Results = await readFilesAsBase64(requiredFiles);
        
        setImagesBase64(base64Results);
        
        if (imageFiles.length > numRequiredImages) {
          setError(`Warning: You dropped ${imageFiles.length} images, but only the first ${numRequiredImages} were used for the ${selectedGrid.cols}x${selectedGrid.rows} grid.`);
        } else {
          setSuccess(`All ${numRequiredImages} images loaded successfully!`);
        }
      } catch (err) {
        console.error("Error processing dropped images:", err);
        setError(`Error processing dropped images: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <main className="container mx-auto p-4 flex flex-col items-center space-y-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mt-4">Image Tiler</h1>
      <p className="text-center text-gray-600 dark:text-gray-400 max-w-md">
        Select a grid size, upload images, and generate a tiled output image.
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
            {isLoading ? "Loading..." : `Select Images (${imagesBase64.length} / ${numRequiredImages})`}
          </button>
          
          <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
            {isDragging 
              ? `Drop ${numRequiredImages} images here...` 
              : imagesBase64.length === 0 
                ? `Click to select or drag & drop exactly ${numRequiredImages} images for the ${selectedGrid.cols}x${selectedGrid.rows} grid.`
                : imagesBase64.length === numRequiredImages 
                  ? `${numRequiredImages} images selected.` 
                  : `Select ${numRequiredImages - imagesBase64.length} more images.`
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
        disabled={isLoading || imagesBase64.length !== numRequiredImages}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded text-lg disabled:opacity-50 transition-colors duration-200 shadow-lg"
      >
        {isLoading ? "Processing..." : "Generate Tiled Image"}
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
      {outputImageBase64 && (
        <div className="w-full max-w-3xl p-6 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 flex flex-col items-center space-y-4 shadow-xl">
          <h2 className="text-xl font-semibold">Tiled Output Image</h2>
          <img
            src={outputImageBase64}
            alt="Tiled Output"
            className="max-w-full max-h-[70vh] h-auto rounded shadow-lg"
          />
          <button
            onClick={handleSaveImage}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors duration-200"
          >
            {isLoading ? "Saving..." : "Save Image"}
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
