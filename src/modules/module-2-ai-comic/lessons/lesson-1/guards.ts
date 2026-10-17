/**
 * 文件说明：模块 2 课时 1 关卡门禁（阶段 A）。
 * 职责：判断关卡编号是否有效、当前模式可否进入，以及越级时应回到哪一关；阶段 A 学生只能进入第 1 关，教师讲解模式四关全开。
 * 更新触发：阶段 B/D 按已保存的来源、选景、视觉方向字段重算门禁，或关卡先后关系、教师放行规则变化时，需要同步更新本文件。
 */

import { MODULE2_LESSON1_STEPS } from "@/modules/module-2-ai-comic/lessons/lesson-1/config"

export const MODULE2_LESSON1_ENTRY_PATH = "/module/2/lesson/1/step/1"

export function isValidModule2Lesson1Step(stepId: number): boolean {
  return MODULE2_LESSON1_STEPS.some(step => step.id === stepId)
}

/** 阶段 A 第 1 关尚无可完成的任务，因此学生不能进入第 2—4 关；不以任何占位状态冒充完成。 */
export function canEnterModule2Lesson1Step(stepId: number, isTeacherMode = false): boolean {
  if (!isValidModule2Lesson1Step(stepId)) return false
  if (isTeacherMode) return true
  return stepId === 1
}

export function getModule2Lesson1GuardReason(stepId: number): string {
  if (stepId === 2) return "请先在第 1 关导入并确认你的小说。"
  if (stepId === 3) return "请先完成第 2 关：看懂改编样例。"
  if (stepId === 4) return "请先完成第 3 关：选出四个关键画面。"
  return "请先完成前一关。"
}

export function getModule2Lesson1RouteRedirect(stepId: number, isTeacherMode = false): string | null {
  if (canEnterModule2Lesson1Step(stepId, isTeacherMode)) return null
  return MODULE2_LESSON1_ENTRY_PATH
}
