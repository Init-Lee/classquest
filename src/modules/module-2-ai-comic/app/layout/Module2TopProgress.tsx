/**
 * 文件说明：模块 2 顶部六课时进度组件。
 * 职责：紧凑展示完成、当前、可进入、未解锁与待开发状态（图标与文字区分，不只靠颜色），只允许可访问课时导航。
 * 更新触发：模块 2 课时数量、顶栏布局、状态视觉或导航规则变化时，需要同步更新本文件。
 */

import { CheckCircle2, Circle, Clock, Lock } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { useModule2State } from "@/modules/module-2-ai-comic/app/providers/Module2Provider"
import { buildModule2TopProgressItems } from "@/modules/module-2-ai-comic/app/layout/module2-top-progress-state"
import { cn } from "@/shared/utils/cn"

export function Module2TopProgress() {
  const { portfolio, isTeacherMode } = useModule2State()
  const location = useLocation()
  const navigate = useNavigate()
  const match = location.pathname.match(/^\/module\/2\/lesson\/(\d+)/)
  const currentLessonId = match ? Number.parseInt(match[1], 10) : 0
  const items = buildModule2TopProgressItems(portfolio, currentLessonId, isTeacherMode)

  return (
    <nav aria-label="模块二课时进度" className="max-w-full overflow-x-auto">
      <div className="flex min-w-max items-center gap-1 px-2 py-1.5">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center">
            <button
              type="button"
              disabled={!item.clickable}
              aria-current={item.status === "current" ? "step" : undefined}
              onClick={() => item.target && navigate(item.target)}
              title={`课时 ${item.id}：${item.title}（${item.statusLabel}）`}
              className={cn(
                "relative flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                item.status === "completed" && "bg-green-100 text-green-700 hover:bg-green-200",
                item.status === "current" && "bg-primary text-primary-foreground shadow-sm",
                item.status === "available" && "bg-secondary text-secondary-foreground hover:bg-accent",
                item.status === "locked" && "cursor-not-allowed bg-muted text-muted-foreground opacity-60",
                item.status === "upcoming" && "cursor-not-allowed border border-dashed bg-transparent text-muted-foreground",
              )}
            >
              {item.status === "completed" && <CheckCircle2 className="h-3.5 w-3.5" />}
              {item.status === "locked" && <Lock className="h-3 w-3" />}
              {item.status === "upcoming" && <Clock className="h-3 w-3" />}
              {(item.status === "current" || item.status === "available") && <Circle className="h-3 w-3" />}
              <span>课时{item.id}</span>
              <span className="sr-only">（{item.statusLabel}）</span>
            </button>
            {index < items.length - 1 && <span aria-hidden="true" className="mx-0.5 h-px w-2 bg-border" />}
          </div>
        ))}
        {items.some(item => item.status === "upcoming") && (
          <span aria-hidden="true" className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            待开发
          </span>
        )}
      </div>
    </nav>
  )
}
