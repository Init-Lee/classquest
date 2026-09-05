/**
 * 文件说明：模块 1 顶层应用外壳。
 * 职责：挂载 Provider、模块导航、学生身份、教师讲解横幅、全局档案操作与子路由内容。
 * 更新触发：模块 1 顶栏、教师横幅、身份展示、全局操作或 Provider 边界变化时，需要同步更新本文件。
 */

import { useLayoutEffect, useRef } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Module1Provider, useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { Module1GlobalActions } from "@/modules/module-1-ai-story/features/global-actions/Module1GlobalActions"
import { Module1TopProgress } from "@/modules/module-1-ai-story/app/layout/Module1TopProgress"

function Module1ShellInner() {
  const { portfolio, saveError, isTeacherMode, exitTeacherMode, resetTeacherMode } = useModule1Portfolio()
  const navigate = useNavigate()
  const teacherBannerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const update = () => {
      const bannerHeight = isTeacherMode ? teacherBannerRef.current?.offsetHeight ?? 0 : 0
      const headerHeight = headerRef.current?.offsetHeight ?? 0
      document.documentElement.style.setProperty("--module1-teacher-banner-height", `${bannerHeight}px`)
      document.documentElement.style.setProperty("--module1-sticky-stack-height", `${bannerHeight + headerHeight}px`)
    }
    update()
    const observer = new ResizeObserver(update)
    if (teacherBannerRef.current) observer.observe(teacherBannerRef.current)
    if (headerRef.current) observer.observe(headerRef.current)
    window.addEventListener("resize", update)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", update)
      document.documentElement.style.removeProperty("--module1-teacher-banner-height")
      document.documentElement.style.removeProperty("--module1-sticky-stack-height")
    }
  }, [isTeacherMode])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {isTeacherMode && (
        <div
          ref={teacherBannerRef}
          className="sticky top-0 z-50 border-b border-amber-600/30 bg-amber-400 text-amber-900"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm font-medium">
            <span className="min-w-0">教师讲解模式 — 可浏览课时 1 全部关卡；演示不写入学生本机档案</span>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { resetTeacherMode(); navigate("/module/1") }}
                className="h-7 bg-amber-200/60 text-xs text-amber-950 hover:bg-amber-300 border-amber-800"
              >
                重置讲解状态
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { exitTeacherMode(); navigate("/module/1") }}
                className="h-7 bg-transparent text-xs text-amber-900 hover:bg-amber-500 border-amber-700"
              >
                退出演示
              </Button>
            </div>
          </div>
        </div>
      )}
      <header
        ref={headerRef}
        className="sticky z-40 border-b bg-white shadow-sm"
        style={{ top: isTeacherMode ? "var(--module1-teacher-banner-height, 0px)" : 0 }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2">
          <button type="button" onClick={() => navigate("/module/1")} className="flex min-w-0 items-center gap-3 text-left">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">CQ</span>
            <span className="hidden sm:block">
              <span className="block text-sm font-semibold">未来来信</span>
              <span className="block text-xs text-muted-foreground">七年级 · 模块一</span>
            </span>
          </button>
          <div className="hidden min-w-0 flex-1 justify-center overflow-hidden lg:flex">
            <Module1TopProgress />
          </div>
          <div className="shrink-0">
            <Module1GlobalActions />
          </div>
        </div>
        <div className="border-t px-2 lg:hidden">
          <Module1TopProgress />
        </div>
        {portfolio && (
          <div className="mx-auto flex w-full max-w-7xl flex-wrap gap-x-4 bg-muted/30 px-4 py-1 text-xs text-muted-foreground">
            {isTeacherMode && <span className="font-medium text-amber-600">【演示】</span>}
            <span>{portfolio.student.clazz} · {portfolio.student.studentName} · {portfolio.student.classSeatCode}</span>
            <span>课时 {portfolio.progress.lessonId} · 第 {portfolio.progress.stepId} 关</span>
          </div>
        )}
      </header>
      {saveError && !isTeacherMode && (
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
