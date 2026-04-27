/**
 * 文件说明：ClassQuest 前端应用入口文件。
 * 职责：初始化 React 应用，挂载平台路由和模块 3 的本地学习档案 Provider。
 * 更新触发：新增全局 Provider、替换路由入口或调整根渲染配置时，需要同步更新本文件。
 */

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { AppProvider } from "@/modules/module-3-ai-science-station/app/providers/AppProvider"
import { router } from "@/platform/router"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </AppProvider>
  </StrictMode>,
)
