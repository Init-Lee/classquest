/**
 * 文件说明：顶部课时进度条组件
 * 职责：横向展示课时1~6的完成状态，是全局导航的核心可视化元素
 *       学生始终可以看到自己在整个模块中所处的位置
 * 更新触发：课时数量变化时；进度条样式调整时
 */

import { useNavigate, useLocation } from "react-router-dom"
import { CheckCircle2, Lock, Circle } from "lucide-react"
import { LESSON_REGISTRY } from "@/app/lesson-registry"
import { usePortfolio } from "@/app/providers/AppProvider"
import { cn } from "@/shared/utils/cn"

export function TopLessonProgress() {
  const { portfolio } = usePortfolio()
  const navigate = useNavigate()
  // Bug3修复：路由使用字面量路径 lesson/1/* 而非 :lessonId 参数，
  // 因此 useParams 无法获取 lessonId；改用 useLocation 从 pathname 解析
  const location = useLocation()
  const lessonMatch = location.pathname.match(/^\/lesson\/(\d+)/)
  const currentLessonId = lessonMatch ? parseInt(lessonMatch[1]) : 0

  const getLessonStatus = (lessonId: number): "completed" | "current" | "available" | "locked" => {
    if (!portfolio) return lessonId === 1 ? "available" : "locked"
    const isEnabled = LESSON_REGISTRY.find(l => l.id === lessonId)?.enabled

    if (!isEnabled) return "locked"
    if (lessonId === 1 && portfolio.lesson1.completed) return "completed"
    if (lessonId === 2 && portfolio.lesson2.completed) return "completed"
    if (lessonId === currentLessonId) return "current"
    if (lessonId < (portfolio.pointer.lessonId)) return "completed"
    return "available"
  }

  return (
    <div className="flex items-center gap-1 py-2 px-4 overflow-x-auto">
      {LESSON_REGISTRY.map((lesson, index) => {
        const status = getLessonStatus(lesson.id)
        const isClickable = status !== "locked"

        return (
          <div key={lesson.id} className="flex items-center">
            <button
              onClick={() => isClickable && navigate(`/lesson/${lesson.id}/step/1`)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                status === "completed" && "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer",
                status === "current" && "bg-primary text-primary-foreground shadow-sm",
                status === "available" && "bg-secondary text-secondary-foreground hover:bg-accent cursor-pointer",
                status === "locked" && "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
              )}
              title={lesson.subtitle}
            >
              {status === "completed" && <CheckCircle2 className="h-3.5 w-3.5" />}
              {status === "locked" && <Lock className="h-3 w-3" />}
              {(status === "current" || status === "available") && <Circle className="h-3 w-3" />}
              <span>课时{lesson.id}</span>
            </button>

            {/* 连接线 */}
            {index < LESSON_REGISTRY.length - 1 && (
              <div className={cn(
                "h-px w-4 mx-0.5",
                getLessonStatus(lesson.id + 1) === "locked" ? "bg-muted" : "bg-border"
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
