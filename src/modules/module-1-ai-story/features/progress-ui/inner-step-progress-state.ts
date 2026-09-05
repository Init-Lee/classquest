/**
 * 文件说明：模块 1 课时内 Step 状态计算器。
 * 职责：纯计算每关的完成、当前、可访问、锁定和可点击状态，确保进度 UI 与 Guard 使用同一集合语义。
 * 更新触发：模块 1 Step 状态优先级、回看策略或锁定规则变化时，需要同步更新本文件。
 */

export type Module1InnerStepStatus = "completed" | "current" | "accessible" | "locked"

export interface Module1InnerStepMeta {
  id: number
  label: string
}

export interface Module1InnerStepItem extends Module1InnerStepMeta {
  status: Module1InnerStepStatus
  clickable: boolean
}

export function buildModule1InnerStepItems(
  steps: Module1InnerStepMeta[],
  currentStepId: number,
  completedStepIds: number[],
  accessibleStepIds: number[],
  lockedStepIds: number[] = [],
): Module1InnerStepItem[] {
  return steps.map((step) => {
    const completed = completedStepIds.includes(step.id)
    const current = step.id === currentStepId
    const accessible = accessibleStepIds.includes(step.id) || completed
    const locked = lockedStepIds.includes(step.id) || !accessible
    const status: Module1InnerStepStatus = current
      ? "current"
      : completed
        ? "completed"
        : locked
          ? "locked"
          : "accessible"

    return {
      ...step,
      status,
      clickable: !current && !locked && accessible,
    }
  })
}
