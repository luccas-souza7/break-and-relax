import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource-variable/bricolage-grotesque/wght.css'
import '@fontsource-variable/public-sans/wght.css'
import '@fontsource-variable/martian-mono/wght.css'
import './index.css'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/*
 * Offline only, and strictly optional. Registered after paint so it never
 * delays the first screen, and skipped outside http(s) — a page opened off
 * the disk cannot have a service worker, and failing to get one there is not
 * an error worth putting in the console.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL
    void navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      // The game does not need it; everything is already in the bundle.
    })
  })
}
