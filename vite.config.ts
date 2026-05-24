/**
 * 文件说明：ClassQuest 前端 Vite 配置。
 * 职责：配置 React 插件、源码别名和本地联调 API 代理。
 * 更新触发：前端构建工具、路径别名、开发服务器代理或部署联调目标变化时，需要同步更新本文件。
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const API_PROXY_TARGET = process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
      },
    },
  },
})
