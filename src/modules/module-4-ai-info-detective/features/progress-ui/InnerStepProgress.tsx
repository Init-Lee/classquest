/**
 * 文件说明：模块四课内步骤进度条组件。
 * 职责：在每个课时内部展示各关闯关进度（样式与模块三 InnerStepProgress 对齐），标明当前关与已完成关。
 * 更新触发：步骤数量、样式与模块三对齐策略、或 Guard 与点击跳转路径变化时，需要同步更新本文件。
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
  /** 哪些步骤已解锁，可以从进度条直接进入 */
  accessibleStepIds?: number[]
  /** 哪些步骤被锁定（Guard 未满足） */
  lockedStepIds?: number[]
  /** 是否把当前关之前的步骤自动显示为已完成；教师讲解模式下应关闭，避免伪装成学生进度。 */
  markPreviousStepsCompleted?: boolean
}

export function InnerStepProgress({
  lessonId,
  currentStepId,
  steps,
  completedStepIds,
  accessibleStepIds = [],
  lockedStepIds = [],
  markPreviousStepsCompleted = true,
}: InnerStepProgressProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((step, index) => {
        const isCompleted = completedStepIds.includes(step.id) || (markPreviousStepsCompleted && step.id < currentStepId)
        const isCurrent = step.id === currentStepId
        const isLocked = lockedStepIds.includes(step.id) && !isCompleted
        const isAccessible = accessibleStepIds.includes(step.id) || isCompleted
        const isClickable = isAccessible && !isCurrent && !isLocked

        return (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              onClick={() => isClickable && navigate(`/module/4/lesson/${lessonId}/step/${step.id}`)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                isCompleted && !isCurrent && "bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer",
                isCurrent && "bg-primary text-primary-foreground",
                isLocked && "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
                !isCompleted && !isCurrent && !isLocked && "bg-secondary text-secondary-foreground cursor-default",
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

            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-px w-3 mx-0.5",
                  isCompleted ? "bg-green-200" : "bg-border",
                )}
              />
            )}
          </div>
        )
      })}

      <div className="ml-2 text-xs text-muted-foreground">
        · {steps.find(s => s.id === currentStepId)?.label}
      </div>
    </div>
  )
}
