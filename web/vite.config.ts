import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        dashboard: resolve(__dirname, 'public/dashboard.html'),
        claim: resolve(__dirname, 'public/claim.html'),
        leaderboard: resolve(__dirname, 'public/leaderboard.html'),
      },
    },
  },
  server: {
    port: 3000,
  },
})