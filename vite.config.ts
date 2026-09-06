import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 部署時由環境變數 VITE_BASE_URL 設定
  // 本地開發時為 '/'（預設值）
  base: process.env.VITE_BASE_URL ?? '/',
  plugins: [react(), tailwindcss()],
})
