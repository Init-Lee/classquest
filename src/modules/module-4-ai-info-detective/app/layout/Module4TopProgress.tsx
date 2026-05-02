/**
 * 文件说明：模块四顶部课时进度条组件。
 * 职责：横向展示课时 1～6 的完成与锁定状态（样式与模块三 TopLessonProgress 对齐），作为全局导航可视化。
 * 更新触发：课时数量、注册表策略或进度条样式与模块三对齐策略变化时，需要同步更新本文件。
 */

import { useNavigate, useLocation } from "react-router-dom"
import { CheckCircle2, Circle, Lock } from "lucide-react"
import { MODULE4_LESSON_REGISTRY } from "@/modules/module-4-ai-info-detective/app/lesson-registry"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { cn } from "@/shared/utils/cn"

export function Module4TopProgress() {
  const { portfolio, isTeacherMode } = useModule4Portfolio()
  const navigate = useNavigate()
  const location = useLocation()
  const lessonMatch = location.pathname.match(/^\/module\/4\/lesson\/(\d+)/)
  const currentLessonId = lessonMatch ? Number.parseInt(lessonMatch[1], 10) : 0

  const getLessonStatus = (lessonId: number): "completed" | "current" | "available" | "locked" => {
    const entry = MODULE4_LESSON_REGISTRY.find(l => l.id === lessonId)
    if (!entry) return "locked"

    if (!portfolio && !isTeacherMode) {
      return lessonId === 1 ? "available" : "locked"
    }

    if (!entry.available && !isTeacherMode) {
      return "locked"
    }

    if (portfolio && entry.isComplete(portfolio)) {
      return "completed"
    }

    if (lessonId === currentLessonId && currentLessonId > 0) {
      return "current"
    }

    if (portfolio && lessonId < portfolio.progress.lessonId) {
      return "completed"
    }

    return "available"
  }

  return (
    <div className="flex items-center gap-1 py-2 px-4 overflow-x-auto">
      {MODULE4_LESSON_REGISTRY.map((lesson, index) => {
        const status = getLessonStatus(lesson.id)
        const isClickable = status !== "locked"

        return (
          <div key={lesson.id} className="flex items-center">
            <button
              type="button"
              onClick={() => isClickable && navigate(lesson.path)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                status === "completed" && "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer",
                status === "current" && "bg-primary text-primary-foreground shadow-sm",
                status === "available" && "bg-secondary text-secondary-foreground hover:bg-accent cursor-pointer",
                status === "locked" && "bg-muted text-muted-foreground cursor-not-allowed opacity-60",
              )}
              title={lesson.subtitle}
            >
              {status === "completed" && <CheckCircle2 className="h-3.5 w-3.5" />}
              {status === "locked" && <Lock className="h-3 w-3" />}
              {(status === "current" || status === "available") && <Circle className="h-3 w-3" />}
              <span>课时{lesson.id}</span>
            </button>

            {index < MODULE4_LESSON_REGISTRY.length - 1 && (
              <div
                className={cn(
                  "h-px w-4 mx-0.5",
                  getLessonStatus(lesson.id + 1) === "locked" ? "bg-muted" : "bg-border",
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
