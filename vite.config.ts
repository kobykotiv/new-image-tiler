import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  // Explicitly set base path to root
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'Image Tiler',
        short_name: 'ImageTiler',
        description: 'Create tiled patterns from seamless tiles',
        theme_color: '#4f46e5',
        icons: [
          {
            src: '/icons/icon-192x192.png', // Use absolute paths
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png', // Use absolute paths
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Tauri specific settings
  server: {
    port: 1420,
    strictPort: true,
    // Allow host header for deployment environments
    host: true
  },
  preview: {
    port: 1420,
    host: true
  },
  build: {
    // Output directory
    outDir: 'dist',
    // Clean output directory before building
    emptyOutDir: true,
    // Minify options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
    // Ensure proper chunks
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['jszip', '@tanstack/react-virtual']
        }
      }
    }
  }
});
