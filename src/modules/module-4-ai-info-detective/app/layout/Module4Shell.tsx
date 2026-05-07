/**
 * 文件说明：模块 4 顶层应用外壳。
 * 职责：包裹模块 4 的 Provider、顶部导航、教师讲解横幅、全局动作区和课时内容区，是模块 4 的视觉与状态入口。
 * 更新触发：模块 4 顶栏结构、主内容区高度传递（课时内滚动）、教师模式交互、全局操作或 Provider 边界变化时，需要同步更新本文件。
 */

import { useLayoutEffect, useRef } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Module4Provider, useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { Module4GlobalActions } from "@/modules/module-4-ai-info-detective/app/layout/Module4GlobalActions"
import { Module4TopProgress } from "@/modules/module-4-ai-info-detective/app/layout/Module4TopProgress"

function Module4ShellInner() {
  const { portfolio, isTeacherMode, exitTeacherMode, resetTeacherMode } = useModule4Portfolio()
  const navigate = useNavigate()
  const teacherBannerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  // 把「教师横幅 + 顶栏」的总高度写成 CSS 变量，供课时内 sticky 条对齐，避免出现缝隙或压住正文。
  useLayoutEffect(() => {
    const update = () => {
      const teacherBannerHeight = isTeacherMode ? teacherBannerRef.current?.offsetHeight ?? 0 : 0
      let h = headerRef.current?.offsetHeight ?? 0
      h += teacherBannerHeight
      document.documentElement.style.setProperty("--module4-teacher-banner-height", `${teacherBannerHeight}px`)
      document.documentElement.style.setProperty("--module4-sticky-stack-height", `${h}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    if (teacherBannerRef.current) ro.observe(teacherBannerRef.current)
    if (headerRef.current) ro.observe(headerRef.current)
    window.addEventListener("resize", update)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", update)
      document.documentElement.style.removeProperty("--module4-teacher-banner-height")
      document.documentElement.style.removeProperty("--module4-sticky-stack-height")
    }
  }, [isTeacherMode])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isTeacherMode && (
        <div
          ref={teacherBannerRef}
          className="bg-amber-400 text-amber-900 sticky top-0 z-50 border-b border-amber-600/30"
        >
          <div className="max-w-7xl mx-auto px-4 py-2 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
              <span className="min-w-0">教师讲解模式 — 可直接浏览全部关卡；客观题答案默认隐藏，可按需显示</span>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { resetTeacherMode(); navigate("/module/4") }}
                  className="h-7 text-xs border-amber-800 text-amber-950 hover:bg-amber-300 bg-amber-200/60"
                >
                  重置讲解状态
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { exitTeacherMode(); navigate("/module/4") }}
                  className="h-7 text-xs border-amber-700 text-amber-900 hover:bg-amber-500 bg-transparent"
                >
                  退出演示
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header
        ref={headerRef}
        className="sticky z-40 border-b bg-white shadow-sm"
        style={{ top: isTeacherMode ? "var(--module4-teacher-banner-height, 0px)" : 0 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 py-2">
          <button
            type="button"
            onClick={() => navigate("/module/4")}
            className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
            aria-label="回到模块四首页"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              CQ
            </div>
            <div className="hidden sm:block min-w-0 text-left">
              <div className="text-sm font-semibold truncate">AI 信息辨识员</div>
              <div className="text-xs text-muted-foreground">七年级 · 模块四</div>
            </div>
          </button>

          <div className="flex-1 flex justify-center overflow-hidden">
            <Module4TopProgress />
          </div>

          <div className="flex-shrink-0">
            <Module4GlobalActions />
          </div>
        </div>

        {portfolio && (
          <div className="bg-muted/30 px-4 py-1 flex items-center gap-4 text-xs text-muted-foreground max-w-7xl mx-auto w-full">
            {isTeacherMode && <span className="text-amber-600 font-medium">【演示】</span>}
            <span>
              {portfolio.student.clazz || "—"}
              {" · "}
              {portfolio.student.studentName || "—"}
              {" · "}
              {portfolio.student.classSeatCode || ""}
            </span>
            <span className="text-border">|</span>
            <span>任务进度：课时{portfolio.progress.lessonId} · 第{portfolio.progress.stepId}关</span>
          </div>
        )}
      </header>

      <main className="flex min-h-0 w-full flex-1 flex-col">
        <Outlet />
      </main>

      <footer className="border-t py-3 text-center text-xs text-muted-foreground">
        ClassQuest · AI 信息辨识员 · MIT License
      </footer>
    </div>
  )
}

export function Module4Shell() {
  return (
    <Module4Provider>
      <Module4ShellInner />
    </Module4Provider>
  )
}
