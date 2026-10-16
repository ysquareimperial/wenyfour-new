import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Own port so a service worker from another local project (e.g. a PWA on
  // :5173) can't hijack this app's index.html.
  server: {
    port: 5175,
    strictPort: true,
  },
  preview: {
    port: 4175,
  },
  build: {
    outDir: 'build' // Change from 'dist' to 'build'
  }
})