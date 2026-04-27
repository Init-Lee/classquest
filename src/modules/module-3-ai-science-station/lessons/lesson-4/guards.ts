/**
 * 文件说明：课时4步骤间的 Guard 规则
 * 职责：定义课时4每个步骤（共5关）的进入条件
 * 更新触发：步骤进入条件发生变化时；调整角色分离逻辑时
 */

import type { ModulePortfolio } from "@/modules/module-3-ai-science-station/domains/portfolio/types"

type GuardFn = (portfolio: ModulePortfolio | null) => boolean

export const LESSON4_GUARDS: Record<number, GuardFn> = {
  /** 步骤1：小组合并，需先完成课时3 */
  1: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson3.completed
  },

  /** 步骤2：个人草稿，需组长已完成合并并导出骨架包（组员需已导入） */
  2: (portfolio) => {
    if (!portfolio) return false
    const isLeader = portfolio.student.role === "leader"
    if (isLeader) {
      return portfolio.lesson4.groupMergeCompleted && portfolio.lesson4.skeletonExported
    }
    // 组员：需已导入骨架包
    return portfolio.lesson4.skeletonImported
  },

  /** 步骤3：制作方案，需个人草稿已完成 */
  3: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson4.personalDraftCompleted
  },

  /** 步骤4：协商生成，需方案单已完成（组长）或步骤3已过（组员） */
  4: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson4.planCompleted
  },

  /** 步骤5：升级提交，需协作已完成 */
  5: (portfolio) => {
    if (!portfolio) return false
    return portfolio.lesson4.collabCompleted
  },
}

export function checkLesson4Guard(
  stepId: number,
  portfolio: ModulePortfolio | null
): { allowed: boolean; reason?: string } {
  const guard = LESSON4_GUARDS[stepId]
  if (!guard) return { allowed: false, reason: "步骤不存在" }

  const allowed = guard(portfolio)
  if (allowed) return { allowed: true }

  const reasons: Record<number, string> = {
    1: "请先完成课时3的个人整理与导出",
    2: "请先完成第1关（组长需导出骨架包，组员需在第1关导入骨架包）",
    3: "请先完成个人网页草稿并确认提交",
    4: "请先完成小组制作方案单",
    5: "请先完成第4关协商生成流程",
  }

  return { allowed: false, reason: reasons[stepId] || "请先完成前置步骤" }
}

export function getLesson4CompletedSteps(portfolio: ModulePortfolio | null): number[] {
  if (!portfolio) return []
  const completed: number[] = []
  const { lesson4, student } = portfolio
  const isLeader = student.role === "leader"

  // 第1关：组长以骨架包已导出为完成；组员以骨架包已导入为完成
  if (isLeader) {
    if (lesson4.groupMergeCompleted && lesson4.skeletonExported) completed.push(1)
  } else {
    if (lesson4.skeletonImported) completed.push(1)
  }

  if (lesson4.personalDraftCompleted) completed.push(2)
  if (lesson4.planCompleted) completed.push(3)
  if (lesson4.collabCompleted) completed.push(4)
  if (lesson4.finalExported) completed.push(5)

  return completed
}
