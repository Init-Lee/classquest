/**
 * 文件说明：模块 2 课时 1 关卡门禁。
 * 职责：判断关卡编号是否有效、当前档案与模式可否进入、四关进度的“已完成”标记，以及越级时应回到哪一关；第 1 关始终可进，第 2—4 关按 lesson1-update 的真实 gate 放行，教师讲解模式四关全开。
 * 更新触发：四关先后关系、gate 条件、教师放行规则或未解锁提示文案变化时，需要同步更新本文件。
 */

import { MODULE2_LESSON1_STEPS } from "@/modules/module-2-ai-comic/lessons/lesson-1/config"
import {
  computeModule2Lesson1Gates,
  getModule2Lesson1FurthestStep,
} from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import type { Module2PortfolioV1 } from "@/modules/module-2-ai-comic/domains/portfolio/types"

export const MODULE2_LESSON1_ENTRY_PATH = "/module/2/lesson/1/step/1"

export function isValidModule2Lesson1Step(stepId: number): boolean {
  return MODULE2_LESSON1_STEPS.some(step => step.id === stepId)
}

/** 只按已保存字段与确认状态放行，不读取档案中的 completed 标记。 */
export function canEnterModule2Lesson1Step(
  portfolio: Module2PortfolioV1 | null,
  stepId: number,
  isTeacherMode = false,
): boolean {
  if (!isValidModule2Lesson1Step(stepId)) return false
  if (isTeacherMode) return true
  return stepId <= getModule2Lesson1FurthestStep(portfolio)
}

/** 四关进度条的“已完成”标记，同样只按真实 gate 计算。 */
export function isModule2Lesson1StepComplete(portfolio: Module2PortfolioV1 | null, stepId: number): boolean {
  const gates = computeModule2Lesson1Gates(portfolio)
  if (stepId === 1) return gates.step1
  if (stepId === 2) return gates.step2
  if (stepId === 3) return gates.step3
  if (stepId === 4) return gates.step4
  return false
}

export function getModule2Lesson1GuardReason(stepId: number): string {
  if (stepId === 2) return "请先在第 1 关导入并确认你的小说。"
  if (stepId === 3) return "请先完成第 2 关：看懂改编样例。"
  if (stepId === 4) return "请先完成第 3 关：选出四个关键画面。"
  return "请先完成前一关。"
}

export function getModule2Lesson1RouteRedirect(
  portfolio: Module2PortfolioV1 | null,
  stepId: number,
  isTeacherMode = false,
): string | null {
  if (canEnterModule2Lesson1Step(portfolio, stepId, isTeacherMode)) return null
  return `/module/2/lesson/1/step/${getModule2Lesson1FurthestStep(portfolio)}`
}
