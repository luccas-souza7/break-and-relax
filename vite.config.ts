import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/*
 * The build has to survive being opened straight off the disk, by double
 * clicking dist/index.html, as well as being served from a subpath on GitHub
 * Pages. Three things are needed for that, and all three are needed together:
 *
 *   base: './'   — relative asset URLs. An absolute base resolves against the
 *                  filesystem root under file:// and against the domain root
 *                  anywhere that is not the expected subpath. Relative works
 *                  in every case, GitHub Pages included.
 *   iife output  — a classic script. Browsers refuse `<script type="module">`
 *                  over file:// ("blocked by CORS policy: ... origin 'null'"),
 *                  so a module build can only ever show a blank page there.
 *   iife worker  — matching format for the engine worker, which is inlined at
 *                  its import site so there is no second file to fetch.
 */
/*
 * Vite marks the entry `type="module"` whatever format Rollup produced. The
 * bundle below is an IIFE, so the attribute is not only unnecessary, it is
 * the one thing that keeps the page from running off the disk. `crossorigin`
 * goes with it: it triggers a CORS check that a file:// page cannot pass.
 *
 * `defer` replaces both. A module script is deferred implicitly; a classic
 * one is not, and this script sits in the head — without it React looks for
 * #root before the body has been parsed.
 */
function classicEntryScript() {
  return {
    name: 'classic-entry-script',
    transformIndexHtml(html: string) {
      return html
        .replace(/<script\s+type="module"\s+crossorigin\s+/g, '<script defer ')
        .replace(/<link\s+rel="stylesheet"\s+crossorigin\s+/g, '<link rel="stylesheet" ')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), classicEntryScript()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  worker: {
    format: 'iife',
  },
  build: {
    /*
     * Keep the stylesheet a real file. A non-ES output otherwise gets its CSS
     * injected by JavaScript, which pushes first paint behind the whole
     * bundle — measured as a 15-point Lighthouse performance drop. A plain
     * <link> is not subject to the module CORS rule, so it loads off the disk
     * just as happily.
     */
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
  },
})
