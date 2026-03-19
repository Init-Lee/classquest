/**
 * 文件说明：课时1步骤间的 Guard 规则
 * 职责：定义每个步骤的进入条件，防止学生跳步
 *       Guard 返回 true 表示可以进入该步骤
 * 更新触发：步骤进入条件发生变化时
 */

import type { ModulePortfolio } from "@/domains/portfolio/types"

/** Guard 函数类型 */
type GuardFn = (portfolio: ModulePortfolio | null) => boolean

/** 课时1各步骤的 Guard 规则（key = stepId） */
export const LESSON1_GUARDS: Record<number, GuardFn> = {
  /** 步骤1：任务启动，无条件进入 */
  1: () => true,

  /** 步骤2：我的信息，无条件进入 */
  2: () => true,

  /** 步骤3：个人R1，必须完成步骤2（有 student profile） */
  3: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson1.profileDone
  },

  /** 步骤4：小组讨论，当前学生必须至少有1条 R1 记录 */
  4: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson1.r1ByMember.length > 0
  },

  /** 步骤5：证据清单，必须存在 groupConsensus */
  5: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson1.groupConsensus !== undefined
  },

  /** 步骤6：回顾导出，必须满足：来源≥1条、证据≥3条、承诺已勾选 */
  6: (portfolio) => {
    if (!portfolio) return false
    const { sourceRows, evidenceRows, declarationAgreed } = portfolio.lesson1
    return sourceRows.length >= 1 && evidenceRows.length >= 3 && declarationAgreed
  },
}

/**
 * 检查是否可以进入指定步骤
 * @returns { allowed: boolean, reason?: string }
 */
export function checkLesson1Guard(
  stepId: number,
  portfolio: ModulePortfolio | null
): { allowed: boolean; reason?: string } {
  const guard = LESSON1_GUARDS[stepId]
  if (!guard) return { allowed: false, reason: "步骤不存在" }

  const allowed = guard(portfolio)
  if (allowed) return { allowed: true }

  const reasons: Record<number, string> = {
    3: "请先完成「我的信息」填写",
    4: "请先保存至少 1 条个人 R1 记录",
    5: "请先完成小组讨论并形成共识",
    6: "请先完成：至少 1 条来源、至少 3 条证据计划，并勾选承诺",
  }

  return { allowed: false, reason: reasons[stepId] || "请先完成前置步骤" }
}

/** 获取课时1中已完成的步骤 ID 列表 */
export function getLesson1CompletedSteps(portfolio: ModulePortfolio | null): number[] {
  if (!portfolio) return []

  const completed: number[] = []
  const { lesson1 } = portfolio

  if (lesson1.introDone) completed.push(1)
  if (lesson1.profileDone) completed.push(2)
  if (lesson1.r1ByMember.length > 0) completed.push(3)
  if (lesson1.groupConsensus) completed.push(4)
  if (lesson1.sourceRows.length >= 1 && lesson1.evidenceRows.length >= 3 && lesson1.declarationAgreed) completed.push(5)
  if (lesson1.completed) completed.push(6)

  return completed
}
