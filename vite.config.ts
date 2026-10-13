/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { travelApiDevPlugin } from './server/devApiPlugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), travelApiDevPlugin()],
  // lucide-react 個 barrel 有幾千個 icon，開機時預先 pre-bundle，避免 dev 中途 re-optimize 卡住
  optimizeDeps: {
    include: ['lucide-react'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // 清理檔放 _to_delete/（gitignore）。唔排除嘅話 vitest 會執到入面舊 test。
    exclude: ['**/node_modules/**', '**/.git/**', '**/_to_delete/**'],
  },
})
