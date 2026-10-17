/**
 * 文件说明：模块 2 课时内四关进度组件。
 * 职责：展示当前、完成、可回看和锁定关卡（图标与文字区分），并把安全的关卡点击交给课时路由处理。
 * 更新触发：模块 2 关卡元数据接口、状态视觉、可访问性或导航交互变化时，需要同步更新本文件。
 */

import { CheckCircle2, Circle, Lock } from "lucide-react"
import {
  buildModule2InnerStepItems,
  type Module2InnerStepMeta,
} from "@/modules/module-2-ai-comic/features/progress-ui/inner-step-progress-state"
import { cn } from "@/shared/utils/cn"

const STATUS_TEXT = {
  completed: "已完成",
  current: "当前关",
  accessible: "可回看",
  locked: "未解锁",
} as const

interface Module2InnerStepProgressProps {
  steps: Module2InnerStepMeta[]
  currentStepId: number
  completedStepIds: number[]
  accessibleStepIds: number[]
  onStepClick: (stepId: number) => void
}

export function Module2InnerStepProgress({
  steps,
  currentStepId,
  completedStepIds,
  accessibleStepIds,
  onStepClick,
}: Module2InnerStepProgressProps) {
  const items = buildModule2InnerStepItems(steps, currentStepId, completedStepIds, accessibleStepIds)

  return (
    <nav aria-label="本课关卡进度" className="max-w-full overflow-x-auto">
      <div className="flex min-w-max items-center gap-1 py-1">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center">
            <button
              type="button"
              disabled={!item.clickable}
              aria-current={item.status === "current" ? "step" : undefined}
              onClick={() => item.clickable && onStepClick(item.id)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                item.status === "completed" && "bg-green-50 text-green-700 hover:bg-green-100",
                item.status === "current" && "bg-primary text-primary-foreground",
                item.status === "accessible" && "bg-secondary text-secondary-foreground hover:bg-accent",
                item.status === "locked" && "cursor-not-allowed bg-muted text-muted-foreground opacity-50",
              )}
              title={`${item.label}（${STATUS_TEXT[item.status]}）`}
            >
              {item.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
              {item.status === "locked" && <Lock className="h-3 w-3" />}
              {(item.status === "current" || item.status === "accessible") && <Circle className="h-3 w-3" />}
              <span>第{item.id}关</span>
              <span className="sr-only">（{STATUS_TEXT[item.status]}）</span>
            </button>
            {index < items.length - 1 && <span aria-hidden="true" className="mx-0.5 h-px w-3 bg-border" />}
          </div>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">
          · {items.find(item => item.id === currentStepId)?.label}
        </span>
      </div>
    </nav>
  )
}
