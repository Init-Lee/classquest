/**
 * 文件说明：AppShell 全局外壳组件
 * 职责：包裹所有页面，提供顶部导航栏（课时进度条 + 全局动作区）和主内容区
 *       是应用视觉结构的顶层容器；教师模式下展示醒目横幅，含组长/组员滑动切换；组员仅在课时4第1关、课时5第2关显示「导入前/导入后」演练条
 * 更新触发：顶部导航结构调整时；教师模式 UI、演练入口或路由解析规则变化时
 */

import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { TopLessonProgress } from "./TopLessonProgress"
import { GlobalActions } from "./GlobalActions"
import { usePortfolio } from "@/app/providers/AppProvider"
import {
  applyTeacherDemoPreset,
  applyTeacherMemberImportDrill,
  type TeacherMemberImportDrill,
} from "@/app/teacher-demo-presets"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"
import { getPortfolioGroupDisplayLabel } from "@/shared/utils/group-display"
import type { ModulePortfolio } from "@/domains/portfolio/types"

/** 从路径解析当前课时/关，如 `/lesson/4/step/1` */
function parseLessonStep(pathname: string): { lessonId: number; stepId: number } | null {
  const m = pathname.match(/^\/lesson\/(\d+)\/step\/(\d+)/)
  if (!m) return null
  return { lessonId: Number(m[1]), stepId: Number(m[2]) }
}

/** 教师横幅：双选项滑动样式（左侧 false，右侧 true） */
function TeacherSegmentSwitch({
  valueRight,
  onChange,
  leftLabel,
  rightLabel,
  ariaLabel,
}: {
  valueRight: boolean
  onChange: (nextRight: boolean) => void
  leftLabel: string
  rightLabel: string
  ariaLabel: string
}) {
  return (
    <div
      className="inline-flex rounded-full border-2 border-amber-950 bg-amber-300/50 p-[3px] shadow-inner"
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "min-w-[4.25rem] rounded-full px-3 py-1 text-xs font-semibold transition-all",
          !valueRight ? "bg-amber-50 text-amber-950 shadow" : "text-amber-900/65 hover:text-amber-950",
        )}
      >
        {leftLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "min-w-[4.25rem] rounded-full px-3 py-1 text-xs font-semibold transition-all",
          valueRight ? "bg-amber-50 text-amber-950 shadow" : "text-amber-900/65 hover:text-amber-950",
        )}
      >
        {rightLabel}
      </button>
    </div>
  )
}

export function AppShell() {
  const { portfolio, isTeacherMode, exitTeacherMode, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const location = useLocation()

  const handleTeacherRole = (role: "leader" | "member") => {
    if (!portfolio) return
    void savePortfolio({ ...portfolio, student: { ...portfolio.student, role } })
    navigate("/")
  }

  const handleResetDemo = () => {
    const next = applyTeacherDemoPreset("reset_full")
    void savePortfolio(next)
    navigate("/")
  }

  const applyImportDrill = (p: ModulePortfolio, drill: TeacherMemberImportDrill) => {
    void savePortfolio(applyTeacherMemberImportDrill(p, drill))
  }

  const pos = parseLessonStep(location.pathname)
  const showMemberImportDrill =
    isTeacherMode
    && portfolio
    && portfolio.student.role === "member"
    && pos
    && ((pos.lessonId === 4 && pos.stepId === 1) || (pos.lessonId === 5 && pos.stepId === 2))

  const l4ImportAfter =
    Boolean(portfolio?.lesson4.skeletonImported && portfolio.lesson4.skeletonPackageJson?.trim())
  const l5ImportAfter = Boolean(portfolio?.lesson5.importedVersionChangePackageJson?.trim())

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 教师演示模式横幅 */}
      {isTeacherMode && (
        <div className="bg-amber-400 text-amber-900 sticky top-0 z-50 border-b border-amber-600/30">
          <div className="max-w-7xl mx-auto px-4 py-2 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
              <span className="min-w-0">🎓 教师演示模式 — 数据不会被保存，页面内容仅供演示参考</span>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetDemo}
                  className="h-7 text-xs border-amber-800 text-amber-950 hover:bg-amber-300 bg-amber-200/60"
                >
                  恢复演示数据
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { exitTeacherMode(); navigate("/") }}
                  className="h-7 text-xs border-amber-700 text-amber-900 hover:bg-amber-500 bg-transparent"
                >
                  退出演示
                </Button>
              </div>
            </div>
            {portfolio && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-1 text-xs border-t border-amber-600/25 pt-2">
                <span className="font-semibold text-amber-950 shrink-0">视角</span>
                <TeacherSegmentSwitch
                  valueRight={portfolio.student.role === "member"}
                  onChange={(right) => handleTeacherRole(right ? "member" : "leader")}
                  leftLabel="组长"
                  rightLabel="组员"
                  ariaLabel="教师演示：组长或组员视角"
                />
                {showMemberImportDrill && pos?.lessonId === 4 && (
                  <>
                    <span className="text-amber-800/70 hidden sm:inline">|</span>
                    <span className="font-semibold text-amber-950 shrink-0 w-full sm:w-auto">组员·骨架包</span>
                    <TeacherSegmentSwitch
                      valueRight={l4ImportAfter}
                      onChange={(right) =>
                        applyImportDrill(portfolio, right ? "l4-after" : "l4-before")}
                      leftLabel="导入前"
                      rightLabel="导入后"
                      ariaLabel="组员演练：课时4骨架包导入前后"
                    />
                  </>
                )}
                {showMemberImportDrill && pos?.lessonId === 5 && (
                  <>
                    <span className="text-amber-800/70 hidden sm:inline">|</span>
                    <span className="font-semibold text-amber-950 shrink-0 w-full sm:w-auto">组员·改动汇总包</span>
                    <TeacherSegmentSwitch
                      valueRight={l5ImportAfter}
                      onChange={(right) =>
                        applyImportDrill(portfolio, right ? "l5-after" : "l5-before")}
                      leftLabel="导入前"
                      rightLabel="导入后"
                      ariaLabel="组员演练：课时5改动汇总包导入前后"
                    />
                  </>
                )}
              </div>
            )}
          </div>
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
            <span>小组：{getPortfolioGroupDisplayLabel(portfolio)}</span>
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
