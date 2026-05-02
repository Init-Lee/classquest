/**
 * 文件说明：ClassQuest 平台路由定义。
 * 职责：组合平台门户、模块入口和旧路径重定向；不承载任何模块内部业务逻辑。
 * 更新触发：新增模块、调整模块基础路径或改变旧路径兼容策略时，需要同步更新本文件。
 */
/* eslint-disable react-refresh/only-export-components */

import { lazy, Suspense, type ReactNode } from "react"
import { createBrowserRouter, Navigate, useLocation } from "react-router-dom"
import { PlatformShell } from "@/platform/layout/PlatformShell"
import { AppShell as Module3Shell } from "@/modules/module-3-ai-science-station/app/layout/AppShell"
import { Module4Shell } from "@/modules/module-4-ai-info-detective/app/layout/Module4Shell"

const PortalHomePage = lazy(() => import("@/platform/pages/PortalHomePage"))
const PlatformNotFoundPage = lazy(() => import("@/platform/pages/NotFoundPage"))
const Module3HomePage = lazy(() => import("@/modules/module-3-ai-science-station/pages/HomePage"))
const LegacyImportPage = lazy(() => import("@/modules/module-3-ai-science-station/pages/LegacyImportPage"))
const Lesson1Page = lazy(() => import("@/modules/module-3-ai-science-station/lessons/lesson-1/routes"))
const Lesson2Page = lazy(() => import("@/modules/module-3-ai-science-station/lessons/lesson-2/routes"))
const Lesson3Page = lazy(() => import("@/modules/module-3-ai-science-station/lessons/lesson-3/routes"))
const Lesson4Page = lazy(() => import("@/modules/module-3-ai-science-station/lessons/lesson-4/routes"))
const Lesson5Page = lazy(() => import("@/modules/module-3-ai-science-station/lessons/lesson-5/routes"))
const Lesson6Page = lazy(() => import("@/modules/module-3-ai-science-station/lessons/lesson-6/routes"))
const Module4Routes = lazy(() => import("@/modules/module-4-ai-info-detective/routes"))

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
    加载中...
  </div>
)

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<LoadingFallback />}>{element}</Suspense>
}

function LegacyLessonRedirect() {
  const location = useLocation()
  return <Navigate to={`/module/3${location.pathname}${location.search}${location.hash}`} replace />
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PlatformShell />,
    children: [
      { index: true, element: withSuspense(<PortalHomePage />) },
      { path: "legacy-import", element: <Navigate to="/module/3/legacy-import" replace /> },
      { path: "lesson/*", element: <LegacyLessonRedirect /> },
      { path: "*", element: withSuspense(<PlatformNotFoundPage />) },
    ],
  },
  {
    path: "/module/3",
    element: <Module3Shell />,
    children: [
      { index: true, element: withSuspense(<Module3HomePage />) },
      { path: "legacy-import", element: withSuspense(<LegacyImportPage />) },
      { path: "lesson/1/*", element: withSuspense(<Lesson1Page />) },
      { path: "lesson/2/*", element: withSuspense(<Lesson2Page />) },
      { path: "lesson/3/*", element: withSuspense(<Lesson3Page />) },
      { path: "lesson/4/*", element: withSuspense(<Lesson4Page />) },
      { path: "lesson/5/*", element: withSuspense(<Lesson5Page />) },
      { path: "lesson/6/*", element: withSuspense(<Lesson6Page />) },
      { path: "*", element: withSuspense(<PlatformNotFoundPage />) },
    ],
  },
  {
    path: "/module/4",
    element: <Module4Shell />,
    children: [
      { index: true, element: withSuspense(<Module4Routes />) },
      { path: "*", element: withSuspense(<Module4Routes />) },
    ],
  },
])
