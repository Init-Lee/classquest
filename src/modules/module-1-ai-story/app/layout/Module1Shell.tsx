/**
 * 文件说明：模块 1 顶层应用外壳。
 * 职责：挂载 Provider、模块导航、学生身份、全局档案操作与子路由内容。
 * 更新触发：模块 1 顶栏、身份展示、全局操作或 Provider 边界变化时，需要同步更新本文件。
 */

import { Outlet, useNavigate } from "react-router-dom"
import { Module1Provider, useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { Module1GlobalActions } from "@/modules/module-1-ai-story/features/global-actions/Module1GlobalActions"

function Module1ShellInner() {
  const { portfolio, saveError } = useModule1Portfolio()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2">
          <button type="button" onClick={() => navigate("/module/1")} className="flex min-w-0 items-center gap-3 text-left">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">CQ</span>
            <span className="hidden sm:block">
              <span className="block text-sm font-semibold">未来来信</span>
              <span className="block text-xs text-muted-foreground">七年级 · 模块一</span>
            </span>
          </button>
          <Module1GlobalActions />
        </div>
        {portfolio && (
          <div className="mx-auto flex w-full max-w-7xl flex-wrap gap-x-4 bg-muted/30 px-4 py-1 text-xs text-muted-foreground">
            <span>{portfolio.student.clazz} · {portfolio.student.studentName} · {portfolio.student.classSeatCode}</span>
            <span>课时 {portfolio.progress.lessonId} · 第 {portfolio.progress.stepId} 关</span>
          </div>
        )}
      </header>
      {saveError && (
        <div role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-800">
          {saveError}
        </div>
      )}
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t py-3 text-center text-xs text-muted-foreground">ClassQuest · 未来来信 · MIT License</footer>
    </div>
  )
}

export function Module1Shell() {
  return <Module1Provider><Module1ShellInner /></Module1Provider>
}
