/**
 * 文件说明：课时1步骤间的 Guard 规则
 * 职责：定义每个步骤的进入条件，防止学生跳步
 *       课时1共5关，第2关（身份登记）已合并到首页，从此文件移除
 *       Guard 返回 true 表示可以进入该步骤
 * 更新触发：步骤进入条件发生变化时
 */

import type { ModulePortfolio } from "@/domains/portfolio/types"

/** Guard 函数类型 */
type GuardFn = (portfolio: ModulePortfolio | null) => boolean

/** 课时1各步骤的 Guard 规则（key = stepId，现为5步） */
export const LESSON1_GUARDS: Record<number, GuardFn> = {
  /** 步骤1：任务启动，无条件进入 */
  1: () => true,

  /** 步骤2：个人R1，完成了步骤1任务启动即可进入 */
  2: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson1.introDone
  },

  /** 步骤3：小组讨论，当前学生必须至少有1条 R1 记录 */
  3: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson1.r1ByMember.length > 0
  },

  /** 步骤4：证据清单，必须存在 groupConsensus（组长、组员均只检查共识卡是否存在） */
  4: (portfolio) => {
    if (!portfolio) return false
    return !!portfolio.lesson1.groupConsensus
  },

  /** 步骤5：回顾导出，必须满足：组员已登记(≥1人)、证据≥3条、承诺已勾选 */
  5: (portfolio) => {
    if (!portfolio) return false
    const { groupMembers, evidenceRows, declarationAgreed } = portfolio.lesson1
    return groupMembers.length > 0
      && evidenceRows.filter(r => r.item.trim()).length >= 3
      && declarationAgreed
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
    2: "请先完成「任务启动」确认",
    3: "请先保存至少 1 条个人 R1 记录",
    4: "请先完成小组讨论并形成共识卡",
    5: "请先完成：登记组员名单、至少 3 条证据计划，并勾选安全承诺",
  }

  return { allowed: false, reason: reasons[stepId] || "请先完成前置步骤" }
}

/** 获取课时1中已完成的步骤 ID 列表 */
export function getLesson1CompletedSteps(portfolio: ModulePortfolio | null): number[] {
  if (!portfolio) return []

  const completed: number[] = []
  const { lesson1 } = portfolio

  if (lesson1.introDone) completed.push(1)
  if (lesson1.r1ByMember.length > 0) completed.push(2)
  // 第3关：组长、组员均只需完成共识卡
  if (lesson1.groupConsensus) completed.push(3)
  // 第4关：组员已登记(≥1人)、证据≥3条、安全承诺已勾选
  const step4Done = lesson1.groupMembers.length > 0
    && lesson1.evidenceRows.filter(r => r.item.trim()).length >= 3
    && lesson1.declarationAgreed
  if (step4Done) completed.push(4)
  // 第5关：step4Done 满足时即可访问（Bug2 修复：不再等待 lesson1.completed）
  if (step4Done || lesson1.completed) completed.push(5)

  return completed
}
