import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa'; // Import VitePWA

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  base: '/', // Ensures asset paths are absolute from the root
  plugins: [
    react(),
    VitePWA({ // Add PWA plugin configuration
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'], // Adjust paths if these are in public/icons
      manifest: {
        name: 'Image Tiler',
        short_name: 'ImageTiler',
        description: 'Create tiled patterns from seamless tiles',
        theme_color: '#4f46e5', // Example color, update as needed
        icons: [
          {
            src: 'icons/icon-192x192.png', // Ensure these paths are relative to your public directory
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png', // Ensure these paths are relative to your public directory
            sizes: '512x512',
            type: 'image/png'
          }
          // Add more icons as needed, e.g., for maskable icons
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
