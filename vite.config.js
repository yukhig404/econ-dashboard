import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/econ-dashboard/',  // ← GitHubリポジトリ名に合わせて変更
  server: {
    proxy: {
      '/api/fred': {
        target: 'https://api.stlouisfed.org/fred',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fred/, ''),
      },
    },
  },
})
