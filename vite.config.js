import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Replaces the hand-rolled public/sw.js: Workbox precaches the built
      // (hashed) assets so the app shell works offline in production.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'Choir Positions',
        short_name: 'Choir',
        description: 'Gestió de posicions i membres del cor',
        id: '/',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#1f2937',
        orientation: 'any',
        categories: ['music', 'productivity'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          { src: '/screenshot-desktop.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide' },
          { src: '/screenshot-mobile.png', sizes: '540x720', type: 'image/png' },
        ],
      },
    }),
  ],
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      }
    }
  }
})
