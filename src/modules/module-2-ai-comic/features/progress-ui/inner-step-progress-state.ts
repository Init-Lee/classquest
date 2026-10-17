/**
 * 文件说明：模块 2 课时内四关状态计算器。
 * 职责：纯计算每关的完成、当前、可访问、锁定和可点击状态，确保进度 UI 与关卡门禁使用同一集合语义。
 * 更新触发：模块 2 关卡状态优先级、回看策略或锁定规则变化时，需要同步更新本文件。
 */

export type Module2InnerStepStatus = "completed" | "current" | "accessible" | "locked"

export interface Module2InnerStepMeta {
  id: number
  label: string
}

export interface Module2InnerStepItem extends Module2InnerStepMeta {
  status: Module2InnerStepStatus
  clickable: boolean
}

export function buildModule2InnerStepItems(
  steps: Module2InnerStepMeta[],
  currentStepId: number,
  completedStepIds: number[],
  accessibleStepIds: number[],
): Module2InnerStepItem[] {
  return steps.map((step) => {
    const completed = completedStepIds.includes(step.id)
    const current = step.id === currentStepId
    const accessible = accessibleStepIds.includes(step.id) || completed
    const status: Module2InnerStepStatus = current
      ? "current"
      : completed
        ? "completed"
        : accessible
          ? "accessible"
          : "locked"

    return {
      ...step,
      status,
      clickable: !current && accessible,
    }
  })
}
