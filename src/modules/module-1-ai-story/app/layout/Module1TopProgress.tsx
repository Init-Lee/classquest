/**
 * 文件说明：模块 1 顶部六课时进度组件。
 * 职责：紧凑展示模块级完成、当前、可开始与锁定状态，并只允许安全课时入口导航。
 * 更新触发：模块 1 课时数量、顶栏布局、状态视觉或导航规则变化时，需要同步更新本文件。
 */

import { CheckCircle2, Circle, Lock } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { buildModule1TopProgressItems } from "@/modules/module-1-ai-story/app/layout/module1-top-progress-state"
import { cn } from "@/shared/utils/cn"

export function Module1TopProgress() {
  const { portfolio } = useModule1Portfolio()
  const location = useLocation()
  const navigate = useNavigate()
  const match = location.pathname.match(/^\/module\/1\/lesson\/(\d+)/)
  const currentLessonId = match
    ? Number.parseInt(match[1], 10)
    : portfolio?.progress.lessonId ?? 0
  const items = buildModule1TopProgressItems(portfolio, currentLessonId)

  return (
    <nav aria-label="模块一课时进度" className="max-w-full overflow-x-auto">
      <div className="flex min-w-max items-center gap-1 px-2 py-1.5">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center">
            <button
              type="button"
              disabled={!item.clickable}
              aria-current={item.status === "current" ? "step" : undefined}
              onClick={() => item.target && navigate(item.target)}
              title={`${item.title}：${item.subtitle}`}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                item.status === "completed" && "bg-green-100 text-green-700 hover:bg-green-200",
                item.status === "current" && "bg-primary text-primary-foreground shadow-sm",
                item.status === "available" && "bg-secondary text-secondary-foreground hover:bg-accent",
                item.status === "locked" && "cursor-not-allowed bg-muted text-muted-foreground opacity-60",
              )}
            >
              {item.status === "completed" && <CheckCircle2 className="h-3.5 w-3.5" />}
              {item.status === "locked" && <Lock className="h-3 w-3" />}
              {(item.status === "current" || item.status === "available") && <Circle className="h-3 w-3" />}
              <span>课时{item.id}</span>
            </button>
            {index < items.length - 1 && <span aria-hidden="true" className="mx-0.5 h-px w-2 bg-border" />}
          </div>
        ))}
      </div>
    </nav>
  )
}
