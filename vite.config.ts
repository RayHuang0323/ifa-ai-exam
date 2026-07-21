import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const sanitizePublicQuestionSources = () => ({
  name: 'sanitize-public-question-sources',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!id.replaceAll('\\', '/').includes('/src/data/questions/source-verified') || !id.replace(/\\/g, '/').endsWith('.json')) return null
    const questions = JSON.parse(code) as Array<Record<string, unknown>>
    const publicQuestions = questions.map((question) => ({
      ...question,
      // 前端只需要可追蹤的證據索引，不把 private DOCX/PDF 路徑帶入 production bundle。
      sourceFile: `教材證據索引/${String(question.sourceCandidateId ?? question.id)}`,
    }))
    // 回傳 JSON 原始碼，交由 Vite 內建 JSON plugin 轉成 module。
    return { code: JSON.stringify(publicQuestions), map: null }
  },
})

export default defineConfig({
  // 加上這行，確保在 GitHub Pages 上的子目錄路徑正確
  base: '/ifa-ai-exam/',
  plugins: [
    sanitizePublicQuestionSources(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'IFA AI 考官系統',
        short_name: 'IFA 模擬考',
        description: 'IFA 芳療師離線模擬考系統',
        theme_color: '#4f46e5',
        background_color: '#f9fafb',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
      }
    })
  ]
})
