/**
 * 文件说明：课内步骤进度条组件
 * 职责：在每个课时内部展示步骤1~6的闯关进度，提示当前步骤和已完成步骤
 *       让学生清楚"我现在在第几关，还差什么"
 * 更新触发：步骤数量或样式变化时；Guard 规则联动 UI 时
 */

import { useNavigate } from "react-router-dom"
import { CheckCircle2, Circle, Lock } from "lucide-react"
import { cn } from "@/shared/utils/cn"

interface StepConfig {
  id: number
  label: string
}

interface InnerStepProgressProps {
  lessonId: number
  currentStepId: number
  steps: StepConfig[]
  /** 哪些步骤可以点击跳转（已完成的步骤） */
  completedStepIds: number[]
  /** 哪些步骤被锁定（Guard 未满足） */
  lockedStepIds?: number[]
}

export function InnerStepProgress({
  lessonId,
  currentStepId,
  steps,
  completedStepIds,
  lockedStepIds = [],
}: InnerStepProgressProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((step, index) => {
        const isCompleted = completedStepIds.includes(step.id)
        const isCurrent = step.id === currentStepId
        const isLocked = lockedStepIds.includes(step.id) && !isCompleted
        const isClickable = isCompleted && !isCurrent

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => isClickable && navigate(`/lesson/${lessonId}/step/${step.id}`)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                isCompleted && !isCurrent && "bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer",
                isCurrent && "bg-primary text-primary-foreground",
                isLocked && "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
                !isCompleted && !isCurrent && !isLocked && "bg-secondary text-secondary-foreground cursor-default"
              )}
            >
              {isCompleted && !isCurrent ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : isLocked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
              <span>第{step.id}关</span>
            </button>

            {/* 连接线 */}
            {index < steps.length - 1 && (
              <div className={cn(
                "h-px w-3 mx-0.5",
                isCompleted ? "bg-green-200" : "bg-border"
              )} />
            )}
          </div>
        )
      })}

      {/* 当前步骤标签 */}
      <div className="ml-2 text-xs text-muted-foreground">
        · {steps.find(s => s.id === currentStepId)?.label}
      </div>
    </div>
  )
}
