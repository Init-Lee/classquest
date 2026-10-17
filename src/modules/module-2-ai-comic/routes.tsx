/**
 * 文件说明：模块 2 内部路由表。
 * 职责：分发模块首页与课时 1；未开放课时（课时 2—6）与未知地址一律安全带回模块首页。
 * 更新触发：模块 2 新增开放课时、开放“我的漫画”或模块内部路径变化时，需要同步更新本文件。
 */

import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

const Module2HomePage = lazy(() => import("./pages/Module2HomePage"))
const Module2Lesson1Routes = lazy(() => import("./lessons/lesson-1/routes"))

export default function Module2Routes() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>}>
      <Routes>
        <Route index element={<Module2HomePage />} />
        <Route path="lesson/1/*" element={<Module2Lesson1Routes />} />
        {/* 课时 2—6 尚未开放，/module/2/comic 尚未开放：直连均回首页 */}
        <Route path="*" element={<Navigate to="/module/2" replace />} />
      </Routes>
    </Suspense>
  )
}
