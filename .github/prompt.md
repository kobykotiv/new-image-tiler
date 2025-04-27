# Tauri + Bun + TypeScript + Tailwind CSS Application Development Prompt

## Project Goal
Create a modern, performant cross-platform desktop application using Tauri as the native shell, Bun as the JavaScript runtime, TypeScript for type safety, and Tailwind CSS for styling. The application will allow users to upload one or more images and generate a tiled output image based on selectable grid sizes (e.g., 2x2, 4x4, 6x6, 8x8, 10x10, 12x12).

## Tech Stack Requirements

- **Tauri**: For creating lightweight, secure native applications with web frontends
- **Bun**: As the JavaScript runtime and package manager for improved performance
- **TypeScript**: For type safety and improved developer experience
- **Tailwind CSS**: For utility-first styling with minimal CSS overhead

## Development Guidelines

### Project Setup

```bash
# Install Tauri prerequisites first (Rust, etc.)
# Initialize project
mkdir my-tauri-app && cd my-tauri-app
bun create tauri-app

# Add TypeScript and Tailwind CSS
bun add -d typescript tailwindcss postcss autoprefixer
bun x tailwindcss init -p
```

### Configuration Priorities

1. **Performance**: Optimize for startup time and runtime performance
2. **Developer Experience**: Set up hot reload, debugging tools, and clear error messages
3. **Bundle Size**: Keep dependencies minimal and use code splitting
4. **Type Safety**: Use strict TypeScript configurations and proper type definitions

### Styling Approach

- Use Tailwind's utility classes as primary styling method
- Create reusable components for complex UI patterns
- Implement a consistent dark/light theme system
- Follow atomic design principles for component organization

### Code Organization

```
src/
├── components/  # Reusable UI components
├── pages/       # Main application screens
├── lib/         # Core business logic
├── utils/       # Helper functions
├── hooks/       # React/custom hooks
├── types/       # TypeScript type definitions
└── styles/      # Tailwind configuration and global styles
```

### Performance Considerations

- Implement proper memoization for expensive computations
- Lazy load components and routes
- Use Tauri's IPC commands for heavy processing in Rust
- Leverage Bun's optimized runtime for server operations

### Testing Strategy

- Component tests with Vitest
- E2E tests with Playwright
- Unit tests for business logic

## MVP Backend API (Tauri Command)

The core image tiling logic is exposed via a Tauri command:

**Command Name:** `tile_images`

**Arguments:** An object with the following properties:
- `images_base64` (`string[]`): An array of base64 encoded image strings (potentially with data URL prefixes like `data:image/png;base64,...`). The number of images *must* exactly match `grid_cols * grid_rows`. The order of images in the array corresponds to filling the grid row by row, left to right.
- `grid_cols` (`number`): The number of columns in the desired output grid.
- `grid_rows` (`number`): The number of rows in the desired output grid.

**Returns:**
- **Success:** (`Promise<string>`) A Promise resolving to a base64 encoded PNG data URL (`data:image/png;base64,...`) representing the tiled output image. All input images will be resized to the dimensions of the largest input image before tiling.
- **Error:** (`Promise<never>`) A Promise rejecting with an error message string if processing fails (e.g., invalid input, decoding error, processing error).

**Example Frontend Usage (TypeScript):**

```typescript
import { invoke } from '@tauri-apps/api/core'; // Updated import for Tauri v2

interface TileArgs {
  images_base64: string[];
  grid_cols: number;
  grid_rows: number;
}

async function generateTiledImage(args: TileArgs): Promise<string> {
  try {
    const result = await invoke<string>('tile_images', { args });
    console.log('Tiled image generated:', result); // result is the base64 data URL
    return result;
  } catch (error) {
    console.error('Error generating tiled image:', error);
    throw new Error(error as string);
  }
}
```

## Expected Deliverables

- Well-documented, clean code following the project structure
- Responsive UI that works across different screen sizes
- Proper error handling and user feedback
- Comprehensive test coverage
- Build and packaging configuration for multiple platforms

## Getting Started

Begin by setting up the development environment and implementing the core application shell with proper Tauri integration and Tailwind styling.