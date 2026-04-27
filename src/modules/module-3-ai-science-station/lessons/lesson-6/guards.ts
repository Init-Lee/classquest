/**
 * 文件说明：课时6步骤间的 Guard 规则
 * 职责：定义课时6每个步骤（共2关）的进入条件
 * 更新触发：步骤进入条件发生变化时
 */

import type { ModulePortfolio } from "@/modules/module-3-ai-science-station/domains/portfolio/types"

type GuardFn = (portfolio: ModulePortfolio | null) => boolean

export const LESSON6_GUARDS: Record<number, GuardFn> = {
  /** 第1关：需先完成课时5 */
  1: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson5.completed
  },

  /** 第2关：需已确认理解四步流程 */
  2: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson6.exampleAcknowledged
  },
}

export function checkLesson6Guard(
  stepId: number,
  portfolio: ModulePortfolio | null
): { allowed: boolean; reason?: string } {
  const guard = LESSON6_GUARDS[stepId]
  if (!guard) return { allowed: false, reason: "步骤不存在" }

  const allowed = guard(portfolio)
  if (allowed) return { allowed: true }

  const reasons: Record<number, string> = {
    1: "请先完成课时5的所有关卡",
    2: "请先完成第1关：阅读四步流程并点击「我已理解四步讲解流程」",
  }

  return { allowed: false, reason: reasons[stepId] || "请先完成前置步骤" }
}

export function getLesson6CompletedSteps(portfolio: ModulePortfolio | null): number[] {
  if (!portfolio) return []
  const completed: number[] = []
  const { lesson6 } = portfolio

  if (lesson6.exampleAcknowledged) completed.push(1)
  if (lesson6.completed) completed.push(2)

  return completed
}
