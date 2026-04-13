/**
 * 文件说明：课时3步骤间的 Guard 规则
 * 职责：定义课时3每个步骤（共5关）的进入条件
 * 更新触发：步骤进入条件发生变化时；新增步骤4/5的 guard 时
 * 注：当前已实现步骤1~3的 guard；步骤4/5为预留占位
 */

import type { ModulePortfolio } from "@/domains/portfolio/types"

type GuardFn = (portfolio: ModulePortfolio | null) => boolean

export const LESSON3_GUARDS: Record<number, GuardFn> = {
  /** 步骤1：继承前序成果，无额外前置条件（课时2有数据即可进入） */
  1: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson2.completed || portfolio.lesson2.assignments.length > 0
  },

  /** 步骤2：方法工具箱，需先确认本课任务（步骤1完成） */
  2: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson3.missionAcknowledged
  },

  /** 步骤3：筛选材料，需已完成方法工具箱（步骤2完成） */
  3: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson3.toolboxCompleted
  },

  /** 步骤4：加工工坊（预留），需已完成筛选（步骤3完成，至少选了1条材料） */
  4: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson3.selectedMaterials.length > 0
  },

  /** 步骤5：预览导出（预留），需已有证据卡 */
  5: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson3.evidenceCards.length > 0
  },
}

export function checkLesson3Guard(
  stepId: number,
  portfolio: ModulePortfolio | null
): { allowed: boolean; reason?: string } {
  const guard = LESSON3_GUARDS[stepId]
  if (!guard) return { allowed: false, reason: "步骤不存在" }

  const allowed = guard(portfolio)
  if (allowed) return { allowed: true }

  const reasons: Record<number, string> = {
    1: "请先完成课时2的证据采集",
    2: "请先确认本课任务目标",
    3: "请先了解材料加工方法",
    4: "请先完成材料筛选（至少选择1条材料）",
    5: "请先完成证据加工工坊",
  }

  return { allowed: false, reason: reasons[stepId] || "请先完成前置步骤" }
}

export function getLesson3CompletedSteps(portfolio: ModulePortfolio | null): number[] {
  if (!portfolio) return []
  const completed: number[] = []
  const { lesson3 } = portfolio

  // 步骤1完成：已确认本课任务
  if (lesson3.missionAcknowledged) completed.push(1)

  // 步骤2完成：已完成方法工具箱
  if (lesson3.toolboxCompleted) completed.push(2)

  // 步骤3完成：已筛选至少1条材料且每条都有说明句
  if (
    lesson3.selectedMaterials.length > 0 &&
    lesson3.selectedMaterials.every((m) => m.explanation.trim().length > 0)
  )
    completed.push(3)

  // 步骤4完成（预留）：已有证据卡
  if (lesson3.evidenceCards.length > 0) completed.push(4)

  // 步骤5完成：已完成课时3（组长和组员均以 completed 为准）
  if (lesson3.completed) completed.push(5)

  return completed
}
