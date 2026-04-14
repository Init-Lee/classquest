/**
 * 文件说明：课时5步骤间的 Guard 规则
 * 职责：定义课时5每个步骤（共2关）的进入条件
 * 更新触发：步骤进入条件发生变化时
 */

import type { ModulePortfolio } from "@/domains/portfolio/types"

type GuardFn = (portfolio: ModulePortfolio | null) => boolean

export const LESSON5_GUARDS: Record<number, GuardFn> = {
  /** 第1关：意见入池，需先完成课时4 */
  1: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson4.completed
  },

  /** 第2关：改动落地，需第1关已完成（填写一条优先修改等校验后点「完成」） */
  2: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson5.feedbackCompleted
  },
}

export function checkLesson5Guard(
  stepId: number,
  portfolio: ModulePortfolio | null
): { allowed: boolean; reason?: string } {
  const guard = LESSON5_GUARDS[stepId]
  if (!guard) return { allowed: false, reason: "步骤不存在" }

  const allowed = guard(portfolio)
  if (allowed) return { allowed: true }

  const reasons: Record<number, string> = {
    1: "请先完成课时4的所有关卡",
    2: "请先完成第1关：填写四维度与「本轮优先修改」后，再点「完成」进入第2关",
  }

  return { allowed: false, reason: reasons[stepId] || "请先完成前置步骤" }
}

export function getLesson5CompletedSteps(portfolio: ModulePortfolio | null): number[] {
  if (!portfolio) return []
  const completed: number[] = []
  const { lesson5 } = portfolio

  if (lesson5.feedbackCompleted) completed.push(1)
  if (lesson5.completed) completed.push(2)

  return completed
}
