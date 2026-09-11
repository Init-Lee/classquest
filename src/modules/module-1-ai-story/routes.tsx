/**
 * 文件说明：模块 1 内部路由表。
 * 职责：分发模块首页、课时 1、课时 2、后续 story 占位，并把未知地址安全带回首页。
 * 更新触发：模块 1 新增课时路由、story 页面或模块内部路径变化时，需要同步更新本文件。
 */

import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

const Module1HomePage = lazy(() => import("./pages/Module1HomePage"))
const Module1Lesson1Routes = lazy(() => import("./lessons/lesson-1/routes"))
const Module1Lesson2Routes = lazy(() => import("./lessons/lesson-2/routes"))

function StoryComingSoon() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Card>
        <CardHeader><CardTitle>完整小说视图将在后续阶段开放</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">本阶段开放课时 1 与课时 2。完整小说不是第七课，将在六课时内容完成后由已有作品派生。</CardContent>
      </Card>
    </div>
  )
}

export default function Module1Routes() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>}>
      <Routes>
        <Route index element={<Module1HomePage />} />
        <Route path="lesson/1/*" element={<Module1Lesson1Routes />} />
        <Route path="lesson/2/*" element={<Module1Lesson2Routes />} />
        <Route path="story" element={<StoryComingSoon />} />
        <Route path="*" element={<Navigate to="/module/1" replace />} />
      </Routes>
    </Suspense>
  )
}
