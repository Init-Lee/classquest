/**
 * 文件说明：课时2步骤间的 Guard 规则
 * 职责：定义课时2每个步骤的进入条件，组长和组员有不同路径
 * 更新触发：步骤进入条件发生变化时
 */

import type { ModulePortfolio } from "@/domains/portfolio/types"

type GuardFn = (portfolio: ModulePortfolio | null) => boolean

export const LESSON2_GUARDS: Record<number, GuardFn> = {
  /** 步骤1：恢复进度，必须课时1有清单数据 */
  1: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson1.evidenceRows.length > 0
  },

  /** 步骤2：同步小组任务，已加载档案即可 */
  2: (portfolio) => !!portfolio,

  /** 步骤3：我的任务，组长直接通过；组员必须完成 leader sync */
  3: (portfolio) => {
    if (!portfolio) return false
    if (portfolio.student.role === "leader") return true
    return portfolio.lesson2.leaderSyncDone
  },

  /** 步骤4：公开资源入库，当前学生至少有1条分配任务 */
  4: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson2.assignments.length > 0
  },

  /** 步骤5：质检，当前学生至少完成1条公开资源草稿 */
  5: (portfolio) => {
    if (!portfolio) return false
    const myRecords = portfolio.lesson2.publicRecords.filter(r => r.owner === portfolio.student.studentName)
    return myRecords.length > 0
  },

  /** 步骤6：回顾导出，质检已通过 */
  6: (portfolio) => {
    if (!portfolio) return false
    const myChecks = portfolio.lesson2.qualityChecks
    return myChecks.length > 0 && myChecks.every(c => c.passed)
  },
}

export function checkLesson2Guard(
  stepId: number,
  portfolio: ModulePortfolio | null
): { allowed: boolean; reason?: string } {
  const guard = LESSON2_GUARDS[stepId]
  if (!guard) return { allowed: false, reason: "步骤不存在" }

  const allowed = guard(portfolio)
  if (allowed) return { allowed: true }

  const reasons: Record<number, string> = {
    1: "请先完成课时1的证据清单（至少3条计划行）",
    2: "请先加载学习档案",
    3: portfolio?.student.role === "leader" ? "" : "请先完成「同步小组任务」（导入组长文件）",
    4: "请先查看并确认你的任务分配",
    5: "请先完成至少 1 条公开资源记录草稿",
    6: "请先完成质量检查",
  }

  return { allowed: false, reason: reasons[stepId] || "请先完成前置步骤" }
}

export function getLesson2CompletedSteps(portfolio: ModulePortfolio | null): number[] {
  if (!portfolio) return []
  const completed: number[] = []
  const { lesson2 } = portfolio

  if (lesson2.resumeDone) completed.push(1)
  if (lesson2.leaderSyncDone || portfolio.student.role === "leader") completed.push(2)
  if (lesson2.assignments.length > 0) completed.push(3)
  if (lesson2.publicRecords.filter(r => r.owner === portfolio.student.studentName).length > 0) completed.push(4)
  if (lesson2.qualityChecks.length > 0 && lesson2.qualityChecks.every(c => c.passed)) completed.push(5)
  if (lesson2.completed) completed.push(6)

  return completed
}
