import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/beetle-creator-studio/', // GitHub Pages repo name
  build: {
    // Build into docs/ so GitHub Pages can serve from main branch /docs
    outDir: 'docs',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        onboarding: resolve(__dirname, 'onboarding.html'),
      },
    },
  },
})
