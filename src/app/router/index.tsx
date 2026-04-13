/**
 * 文件说明：应用路由定义
 * 职责：集中定义所有路由，每个课时单独懒加载，避免一次性打包
 * 更新触发：新增课时或页面时在此注册路由
 */

import { lazy, Suspense } from "react"
import { createBrowserRouter } from "react-router-dom"
import { AppShell } from "@/app/layout/AppShell"

const HomePage = lazy(() => import("@/pages/HomePage"))
const LegacyImportPage = lazy(() => import("@/pages/LegacyImportPage"))
const Lesson1Page = lazy(() => import("@/lessons/lesson-1/routes"))
const Lesson2Page = lazy(() => import("@/lessons/lesson-2/routes"))
const Lesson3Page = lazy(() => import("@/lessons/lesson-3/routes"))
const Lesson4Page = lazy(() => import("@/lessons/lesson-4/routes"))
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"))

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
    加载中...
  </div>
)

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: "legacy-import",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LegacyImportPage />
          </Suspense>
        ),
      },
      {
        path: "lesson/1/*",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Lesson1Page />
          </Suspense>
        ),
      },
      {
        path: "lesson/2/*",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Lesson2Page />
          </Suspense>
        ),
      },
      {
        path: "lesson/3/*",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Lesson3Page />
          </Suspense>
        ),
      },
      {
        path: "lesson/4/*",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Lesson4Page />
          </Suspense>
        ),
      },
      {
        path: "*",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
])
