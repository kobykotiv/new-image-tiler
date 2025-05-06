# Seamless Tile Generator PWA Development Guide

## Project Goal
Create a modern, performant Progressive Web Application that allows users to generate tiled patterns from seamless tiles. Users can upload images and create grid-based compositions with various options like scale factors and noise effects, all while maintaining offline functionality.

## Tech Stack
- **Vite**: For fast development and optimal production builds
- **React**: UI framework with hooks for state management
- **TypeScript**: For type safety and improved developer experience
- **Tailwind CSS**: For utility-first styling
- **Radix UI**: For accessible, unstyled components
- **IndexedDB**: For client-side storage and offline support

## Key PWA Features
- **Offline Support**: Service worker for caching and offline functionality
- **Installable**: Web app manifest for native-like installation
- **Memory Efficient**: Chunked processing for large image sets
- **Persistent Storage**: IndexedDB for saving user preferences and recent work

## Project Setup
```bash
# Create Vite project with React and TypeScript
npm create vite@latest image-tiler -- --template react-ts

# Add required dependencies
npm install @radix-ui/react-* tailwindcss idb
npm install -D autoprefixer postcss vite-plugin-pwa
```

## Development Guidelines

### PWA Architecture
```
src/
├── components/     # Reusable UI components
│   ├── ui/        # Radix-based components
│   └── features/  # Feature-specific components
├── hooks/         # Custom hooks for business logic
├── lib/          # Core utilities & storage
├── types/        # TypeScript definitions
└── workers/      # Web workers for image processing
```

### Key Features Implementation

1. **Image Processing**
   - Use Web Workers for heavy computation
   - Implement chunked processing for memory efficiency
   - Support offline processing capabilities

2. **Storage Strategy**
   - Use IndexedDB for image caching
   - Implement automatic cleanup of old data
   - Store user preferences and recent configurations

3. **PWA Requirements**
   - Comprehensive service worker setup
   - Proper cache management
   - Clear offline usage indicators

4. **Optimizations**
   - Image compression before processing
   - Lazy loading of features
   - Memory-conscious batch processing

### Example Service Worker Strategy
```typescript
// Basic cache configuration
const CACHE_VERSION = 'v1';
const CACHE_NAME = `image-tiler-${CACHE_VERSION}`;

const CACHED_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css'
];

// Cache core assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHED_ASSETS))
  );
});

// Cache processed images for offline use
self.addEventListener('fetch', (event) => {
  // Cache strategy implementation
});
```

## Testing Focus
- Browser compatibility
- Offline functionality
- Memory usage monitoring
- Performance benchmarking

Start with the core image processing functionality and progressively enhance with PWA features.