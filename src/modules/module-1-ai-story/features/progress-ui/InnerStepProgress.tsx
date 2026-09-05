/**
 * 文件说明：模块 1 课时内通用 Step 进度组件。
 * 职责：展示当前、完成、可访问和锁定关卡，并把安全回看点击交给课时路由处理。
 * 更新触发：模块 1 各课时 Step 元数据接口、状态视觉、可访问性或导航交互变化时，需要同步更新本文件。
 */

import { CheckCircle2, Circle, Lock } from "lucide-react"
import {
  buildModule1InnerStepItems,
  type Module1InnerStepMeta,
} from "@/modules/module-1-ai-story/features/progress-ui/inner-step-progress-state"
import { cn } from "@/shared/utils/cn"

interface Module1InnerStepProgressProps {
  steps: Module1InnerStepMeta[]
  currentStepId: number
  completedStepIds: number[]
  accessibleStepIds: number[]
  lockedStepIds?: number[]
  onStepClick: (stepId: number) => void
}

export function InnerStepProgress({
  steps,
  currentStepId,
  completedStepIds,
  accessibleStepIds,
  lockedStepIds = [],
  onStepClick,
}: Module1InnerStepProgressProps) {
  const items = buildModule1InnerStepItems(
    steps,
    currentStepId,
    completedStepIds,
    accessibleStepIds,
    lockedStepIds,
  )

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
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                item.status === "completed" && "bg-green-50 text-green-700 hover:bg-green-100",
                item.status === "current" && "bg-primary text-primary-foreground",
                item.status === "accessible" && "bg-secondary text-secondary-foreground hover:bg-accent",
                item.status === "locked" && "cursor-not-allowed bg-muted text-muted-foreground opacity-50",
              )}
              title={item.label}
            >
              {item.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
              {item.status === "locked" && <Lock className="h-3 w-3" />}
              {(item.status === "current" || item.status === "accessible") && <Circle className="h-3 w-3" />}
              <span>第{item.id}关</span>
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
