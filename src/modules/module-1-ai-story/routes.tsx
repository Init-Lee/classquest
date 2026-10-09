/**
 * 文件说明：模块 1 内部路由表。
 * 职责：分发模块首页、课时 1—6 与「我的小说」，并把未知地址安全带回首页。
 * 更新触发：模块 1 新增课时路由、story 页面或模块内部路径变化时，需要同步更新本文件。
 */

import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

const Module1HomePage = lazy(() => import("./pages/Module1HomePage"))
const Module1StoryPage = lazy(() => import("./pages/Module1StoryPage"))
const Module1Lesson1Routes = lazy(() => import("./lessons/lesson-1/routes"))
const Module1Lesson2Routes = lazy(() => import("./lessons/lesson-2/routes"))
const Module1Lesson3Routes = lazy(() => import("./lessons/lesson-3/routes"))
const Module1Lesson4Routes = lazy(() => import("./lessons/lesson-4/routes"))
const Module1Lesson5Routes = lazy(() => import("./lessons/lesson-5/routes"))
const Module1Lesson6Routes = lazy(() => import("./lessons/lesson-6/routes"))

export default function Module1Routes() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>}>
      <Routes>
        <Route index element={<Module1HomePage />} />
        <Route path="lesson/1/*" element={<Module1Lesson1Routes />} />
        <Route path="lesson/2/*" element={<Module1Lesson2Routes />} />
        <Route path="lesson/3/*" element={<Module1Lesson3Routes />} />
        <Route path="lesson/4/*" element={<Module1Lesson4Routes />} />
        <Route path="lesson/5/*" element={<Module1Lesson5Routes />} />
        <Route path="lesson/6/*" element={<Module1Lesson6Routes />} />
        <Route path="story" element={<Module1StoryPage />} />
        <Route path="*" element={<Navigate to="/module/1" replace />} />
      </Routes>
    </Suspense>
  )
}
