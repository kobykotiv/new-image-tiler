# New Image Tiler

A modern, cross-platform desktop application built with Tauri, Bun, TypeScript, and Tailwind CSS that allows users to upload multiple images and generate a tiled output image based on selectable grid sizes.

## Features

- Select from predefined grid sizes (2x2, 4x4, 6x6, 8x8, 10x10, 12x12)
- Upload the exact number of images required for the selected grid
- Preview uploaded images before processing
- Generate a tiled output image with all images arranged in a grid
- Save the output image to your local filesystem
- Dark mode support

## Getting Started

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Bun](https://bun.sh/docs/installation)
- For Windows: Microsoft Visual C++ Build Tools

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd image-tiler

# Install dependencies
bun install
```

### Development

```bash
# Start the development server
bun run tauri dev
```

### Building

```bash
# Build the application for production
bun run tauri build
```

## How to Use

1. **Select a Grid Size**: Choose from one of the predefined grid layouts (e.g., 2x2, 4x4, etc.)
2. **Upload Images**: Click the "Select Images" button to choose exactly the number of images required for your grid
3. **Generate**: Click the "Generate Tiled Image" button to process your images
4. **Save**: Once the tiled image is generated, click "Save Image" to save it to your local filesystem

## Technical Details

The application uses:
- Tauri for the native shell and Rust-powered backend
- React and TypeScript for the frontend UI
- Tailwind CSS for styling
- Image processing is done in Rust for optimal performance

## Release Information

**Version 1.0.0** is the first official release of New Image Tiler!

## Installation

```bash
# Add installation instructions here
# For example:
npm install new-image-tiler
# or if it's a CLI tool:
npm install -g new-image-tiler
```

## Usage

```javascript
// Add usage examples here
// For example, if it's a library:
const tiler = require('new-image-tiler');

tiler.tileImage('input.jpg', 'output_dir', { tileSize: 256 })
  .then(() => console.log('Tiling complete!'))
  .catch(err => console.error('Error tiling image:', err));

// Or if it's a CLI tool:
new-image-tiler --input input.jpg --output output_dir --tile-size 256
```

## License

[MIT](LICENSE)

## Releasing New Versions

To release a new version of Image Tiler:

1. Update the version in `package.json` and `src-tauri/Cargo.toml`
2. Commit your changes
3. Create and push a new tag:
   ```bash
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   ```
4. The GitHub Actions workflow will automatically:
   - Create a new release on GitHub
   - Build the application for Windows, macOS, and Linux
   - Attach the installers to the release

## Installation Instructions for Users

### Windows
1. Download the latest `image-tiler-v0.1.0-windows.msi` installer from the [Releases](https://github.com/yourusername/image-tiler/releases) page
2. Double-click the MSI file and follow the installation wizard
3. Launch "Image Tiler" from your Start Menu

### macOS
1. Download the latest `image-tiler-v0.1.0-macos.dmg` from the [Releases](https://github.com/yourusername/image-tiler/releases) page
2. Open the DMG file and drag the app to your Applications folder
3. Right-click the app and select "Open" the first time you run it

### Linux (Debian/Ubuntu)
1. Download the latest `image-tiler-v0.1.0-linux_amd64.deb` from the [Releases](https://github.com/yourusername/image-tiler/releases) page
2. Install with:
   ```bash
   sudo dpkg -i image-tiler-v0.1.0-linux_amd64.deb
   ```
3. Launch from your applications menu or terminal