/**
 * 文件说明：AppShell 全局外壳组件
 * 职责：包裹所有页面，提供顶部导航栏（课时进度条 + 全局动作区）和主内容区
 *       是应用视觉结构的顶层容器；教师模式下展示醒目横幅
 * 更新触发：顶部导航结构调整时；新增全局 UI 区域时；教师模式 UI 调整时
 */

import { Outlet, useNavigate } from "react-router-dom"
import { TopLessonProgress } from "./TopLessonProgress"
import { GlobalActions } from "./GlobalActions"
import { usePortfolio } from "@/app/providers/AppProvider"
import { Button } from "@/shared/ui/button"

export function AppShell() {
  const { portfolio, isTeacherMode, exitTeacherMode } = usePortfolio()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 教师演示模式横幅 */}
      {isTeacherMode && (
        <div className="bg-amber-400 text-amber-900 px-4 py-1.5 flex items-center justify-between text-sm font-medium sticky top-0 z-50">
          <span>🎓 教师演示模式 — 数据不会被保存，页面内容仅供演示参考</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { exitTeacherMode(); navigate("/") }}
            className="h-6 text-xs border-amber-700 text-amber-900 hover:bg-amber-500 bg-transparent"
          >
            退出演示
          </Button>
        </div>
      )}

      {/* 顶部导航栏 */}
      <header className="border-b bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
          {/* Logo + 模块标题（可点击跳转首页） */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
            aria-label="回到首页"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              CQ
            </div>
            <div className="hidden sm:block min-w-0">
              <div className="text-sm font-semibold truncate">AI 科学传播站</div>
              <div className="text-xs text-muted-foreground">七年级 · 模块三</div>
            </div>
          </button>

          {/* 课时进度条（居中） */}
          <div className="flex-1 flex justify-center overflow-hidden">
            <TopLessonProgress />
          </div>

          {/* 全局动作区 */}
          <div className="flex-shrink-0">
            <GlobalActions />
          </div>
        </div>

        {/* 当前学生状态条（有档案时显示） */}
        {portfolio && (
          <div className="border-t bg-muted/30 px-4 py-1 flex items-center gap-4 text-xs text-muted-foreground max-w-7xl mx-auto w-full">
            {isTeacherMode && (
              <span className="text-amber-600 font-medium">【演示】</span>
            )}
            <span>{portfolio.student.clazz} · {portfolio.student.studentName}</span>
            <span className="text-border">|</span>
            <span>小组：{portfolio.student.groupName}</span>
            <span className="text-border">|</span>
            <span>{portfolio.student.role === "leader" ? "组长" : "组员"}</span>
            <span className="text-border">|</span>
            <span>任务进度：课时{portfolio.pointer.lessonId} · 第{portfolio.pointer.stepId}关</span>
          </div>
        )}
      </header>

      {/* 主内容区 */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {/* 底部 */}
      <footer className="border-t py-3 text-center text-xs text-muted-foreground">
        ClassQuest · 程序化教学闯关平台 · MIT License
      </footer>
    </div>
  )
}
