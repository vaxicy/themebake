import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ThemeBake is a fully static, client-side app.
// `npm run build` emits a plain static bundle into ./dist, which is what
// Cloudflare Pages should be pointed at (build command: `npm run build`).
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    // Keep the bundle small: everything is client-side, no SSR, no server runtime.
    target: 'es2020',
  },
  server: {
    port: 5173,
    open: false,
  },
})
