import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'proun.svg'],
      manifest: {
        name: 'ПРОУН: Заводная орнитология',
        short_name: 'ПРОУН',
        description: 'Аудио-управляемая игра в визуальном мире Эль Лисицкого',
        theme_color: '#F2EBD9',
        background_color: '#F2EBD9',
        display: 'standalone',
        icons: [
          {
            src: 'proun-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'proun-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'proun-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
});
