import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

import dc from 'node:diagnostics_channel';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';

try {
  if (!('crypto' in globalThis)) {
    Object.defineProperty(globalThis, 'crypto', {
      value: crypto.webcrypto || crypto,
      configurable: true,
      writable: true,
    });
  }
} catch (e) {
  // Ignore if already getter
}

if (dc && typeof (dc as any).tracingChannel !== 'function') {
  (dc as any).tracingChannel = () => ({
    traceSync: (fn: any, context: any) => fn(context),
    tracePromise: (fn: any, context: any) => fn(context),
    traceCallback: (fn: any, _position: any, context: any) => fn(context),
    hasSubscribers: false,
    subscribe: () => {},
    unsubscribe: () => {},
  });
}

if (typeof (globalThis as any).require === 'undefined') {
  (globalThis as any).require = createRequire(import.meta.url);
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    headers: {
      'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss:;"
    }
  },
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
