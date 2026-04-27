/**
 * 文件说明：课时2步骤间的 Guard 规则
 * 职责：定义课时2每个步骤（共5关）的进入条件
 * 更新触发：步骤进入条件发生变化时
 * 注：原步骤1+2已合并为新步骤1；后续步骤编号整体左移一位
 */

import type { ModulePortfolio } from "@/modules/module-3-ai-science-station/domains/portfolio/types"

type GuardFn = (portfolio: ModulePortfolio | null) => boolean

export const LESSON2_GUARDS: Record<number, GuardFn> = {
  /** 步骤1（合并）：确认进度与任务领取，必须课时1有清单数据 */
  1: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson1.evidenceRows.length > 0
  },

  /** 步骤2：我的任务，组长直接通过；组员必须完成 leader sync */
  2: (portfolio) => {
    if (!portfolio) return false
    if (portfolio.student.role === "leader") return true
    return portfolio.lesson2.leaderSyncDone
  },

  /** 步骤3：证据入库，当前学生至少有1条分配任务 */
  3: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson2.assignments.length > 0
  },

  /** 步骤4：质检，当前学生至少保存过1条公开资源或1条现场采集 */
  4: (portfolio) => {
    if (!portfolio) return false
    // 优先用 confirmedOwnerName（组长文件确认的名字），防止注册名与存储 owner 不一致
    const name = portfolio.lesson1.confirmedOwnerName || portfolio.student.studentName
    const hasPublic = portfolio.lesson2.publicRecords.some(r => r.owner === name)
    const hasField = portfolio.lesson2.fieldTasks.some(t => t.owner === name)
    return hasPublic || hasField
  },

  /** 步骤5：回顾导出；有公开资源需全部质检通过；纯现场采集直接放行 */
  5: (portfolio) => {
    if (!portfolio) return false
    // 优先用 confirmedOwnerName（组长文件确认的名字），防止注册名与存储 owner 不一致
    const name = portfolio.lesson1.confirmedOwnerName || portfolio.student.studentName
    const myPublic = portfolio.lesson2.publicRecords.filter(r => r.owner === name)
    if (myPublic.length === 0) {
      return portfolio.lesson2.fieldTasks.some(t => t.owner === name)
    }
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
    2: portfolio?.student.role === "leader" ? "" : "请先完成「确认进度」步骤（导入组长文件后完成身份确认）",
    3: "请先查看并确认你的任务分配",
    4: "请先完成至少 1 条证据记录",
    5: "请先完成质量检查",
  }

  return { allowed: false, reason: reasons[stepId] || "请先完成前置步骤" }
}

export function getLesson2CompletedSteps(portfolio: ModulePortfolio | null): number[] {
  if (!portfolio) return []
  const completed: number[] = []
  const { lesson2 } = portfolio
  // 优先用 confirmedOwnerName，与 Step3Evidence 等组件保持一致的 owner 命名
  const name = portfolio.lesson1.confirmedOwnerName || portfolio.student.studentName

  // 步骤1完成：leaderSyncDone 已设置（合并后，两个状态同时写入）
  if (lesson2.leaderSyncDone || portfolio.student.role === "leader") completed.push(1)

  // 步骤2完成：已生成任务分配
  if (lesson2.assignments.length > 0) completed.push(2)

  // 步骤3完成：当前用户有公开记录或现场任务
  if (
    lesson2.publicRecords.some(r => r.owner === name) ||
    lesson2.fieldTasks.some(t => t.owner === name)
  ) completed.push(3)

  // 步骤4完成：纯现场有任务即完成；有公开记录则需质检通过
  const myPublic = lesson2.publicRecords.filter(r => r.owner === name)
  if (myPublic.length === 0) {
    if (lesson2.fieldTasks.some(t => t.owner === name)) completed.push(4)
  } else {
    if (lesson2.qualityChecks.length > 0 && lesson2.qualityChecks.every(c => c.passed)) completed.push(4)
  }

  // 步骤5完成
  if (lesson2.completed) completed.push(5)

  return completed
}
