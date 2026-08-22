import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * The index.html at the repo root is the development entry and carries a note
 * for anyone who opens it straight off the disk. The build has no use for it.
 */
function stripDevEntryNotice() {
  return {
    name: 'strip-dev-entry-notice',
    transformIndexHtml(html: string) {
      return html.replace(
        /[ \t]*<!-- dev-entry-notice:start -->[\s\S]*?<!-- dev-entry-notice:end -->\n?/,
        '',
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/break-and-relax/',
  plugins: [
    react(),
    tailwindcss(),
    stripDevEntryNotice(),
    /*
     * Offline after the first visit, and nothing else: no manifest, no install
     * prompt, no update banner. Just a precache, so a dropped connection never
     * interrupts a break. The default glob covers js/css/html only — the fonts
     * and the pieces have to be named or they would be fetched over the wire.
     */
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2}'] },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
