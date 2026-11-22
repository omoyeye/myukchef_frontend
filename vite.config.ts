import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Reads the same PORT the Express server uses from .env
  // In development, API calls go to the backend running next door on its .env port.
  const backendEnv = loadEnv(mode, path.resolve(__dirname, "../myukchef_backend"), "");
  const apiTarget = process.env.API_PROXY_TARGET || `http://localhost:${backendEnv.PORT || 3000}`;

  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": apiTarget,
      "/uploads": apiTarget,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'logo.png', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        id: '/',
        name: 'MYUKCHEF: Local Chefs & Home-Cooked Food',
        short_name: 'MYUKCHEF',
        description: 'Order home-cooked food from local chefs, or book a private chef for your event.',
        lang: 'en-GB',
        dir: 'ltr',
        start_url: '/?source=pwa',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#f8620c',
        background_color: '#ffffff',
        categories: ['food', 'lifestyle', 'shopping'],
        // Shown in the install window on Android and desktop Chrome/Edge.
        screenshots: [
          { src: '/app/screen-order.webp', sizes: '1080x1920', type: 'image/webp', form_factor: 'narrow', label: 'Order home-cooked food from local chefs' },
          { src: '/app/screen-track.webp', sizes: '1080x1920', type: 'image/webp', form_factor: 'narrow', label: 'Track your delivery live' },
          { src: '/app/screen-plans.webp', sizes: '1080x1920', type: 'image/webp', form_factor: 'narrow', label: 'Meal plans from 1 week to 6 months' },
          { src: '/app/screen-wide.webp', sizes: '1920x1080', type: 'image/webp', form_factor: 'wide', label: 'MYUKCHEF on your computer' },
        ],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Order food', url: '/menu?source=shortcut', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Book a chef', url: '/events?source=shortcut', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Find my meal', url: '/recommend?source=shortcut', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Track an order', url: '/track-order?source=shortcut', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'My meal plans', url: '/my-plans?source=shortcut', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        importScripts: ['/push-sw.js'],
        globPatterns: ['**/*.{js,css,html,svg,woff2}', 'favicon.png', 'logo.png'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//, /^\/sitemap\.xml$/, /^\/robots\.txt$/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Public menu data stays readable offline. Accounts and orders are never cached.
            urlPattern: ({ url }) => /^\/api\/(products|chefs$|chefs\/products\/public|settings)/.test(url.pathname),
            handler: 'NetworkFirst',
            options: { cacheName: 'menu-data', networkTimeoutSeconds: 4, expiration: { maxEntries: 60, maxAgeSeconds: 86400 } },
          },
          {
            // Only the site's own images. Photos on other sites (chef and dish photos) load straight from
            // the browser: the worker may only fetch from this site, so caching them would break them.
            urlPattern: ({ request, sameOrigin }) => request.destination === 'image' && sameOrigin,
            handler: 'CacheFirst',
            options: { cacheName: 'images', expiration: { maxEntries: 120, maxAgeSeconds: 2592000 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
