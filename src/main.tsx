/**
 * 文件说明：应用入口文件
 * 职责：初始化 React 应用，挂载路由和全局 Provider
 * 更新触发：新增全局 Provider 时；修改根渲染配置时
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppProvider } from '@/app/providers/AppProvider'
import { router } from '@/app/router/index'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  </StrictMode>,
)
