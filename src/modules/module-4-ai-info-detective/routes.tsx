/**
 * 文件说明：模块 4 前端路由表。
 * 职责：在模块 4 独立 Shell 下分发首页与课时 1 子路由，后续课时、提交页和画廊页也从这里扩展。
 * 更新触发：模块 4 新增课时、页面路径、答题页或画廊页时，需要同步扩展本文件。
 */

import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router-dom"

const Module4HomePage = lazy(() => import("./pages/Module4HomePage"))
const Lesson1Routes = lazy(() => import("./lessons/lesson-1/routes"))

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
    加载中...
  </div>
)

export default function Module4Routes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route index element={<Module4HomePage />} />
        <Route path="lesson/1/*" element={<Lesson1Routes />} />
        <Route path="*" element={<Module4HomePage />} />
      </Routes>
    </Suspense>
  )
}
