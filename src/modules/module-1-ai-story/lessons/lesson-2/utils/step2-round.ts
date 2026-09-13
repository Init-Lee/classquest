/**
 * 文件说明：模块 1 课时 2 第 2 关关内分页（第一步选参照 / 第二步拆写法）纯函数。
 * 职责：解析 `?round=1|2`、判断第一步是否可前进、第二步是否可进入，以及右侧设定栏是否显示已确认圆点。
 * 更新触发：第 2 关子页编号、第一步选定口径或设定栏圆点规则变化时，需要同步更新本文件。
 */

import {
  canCompleteModule1Lesson2Step2Round1,
  type Module1Lesson1State,
  type Module1Lesson2State,
} from "@/modules/module-1-ai-story/domains/portfolio/types"

export type Module1Lesson2Step2Round = 1 | 2

export function parseModule1Lesson2Step2Round(value: string | null | undefined): Module1Lesson2Step2Round {
  return value === "2" ? 2 : 1
}

export function buildModule1Lesson2Step2Path(round: Module1Lesson2Step2Round): string {
  return `/module/1/lesson/2/step/2?round=${round}`
}

/** 第一步已选定参照且必填满足，或整关已完成，才能进第二步；教师模式不拦。 */
export function canEnterModule1Lesson2Step2Round(
  state: Module1Lesson2State,
  round: Module1Lesson2Step2Round,
  isTeacherMode = false,
): boolean {
  if (round === 1 || isTeacherMode) return true
  if (state.step2Completed) return true
  return canCompleteModule1Lesson2Step2Round1(state)
}

export function canAdvanceModule1Lesson2Step2Round1(state: Module1Lesson2State): boolean {
  return canCompleteModule1Lesson2Step2Round1(state)
}

export function hasModule1Lesson2ConfirmedSummary(
  lesson1: Module1Lesson1State,
  lesson2: Module1Lesson2State,
): boolean {
  return Boolean(
    lesson1.sdg.trim()
    || lesson1.cityIssue.trim()
    || lesson1.audience.trim()
    || lesson2.reference.workTitle.trim()
    || lesson2.writingPlan.trim()
    || lesson2.reason.trim()
    || lesson2.character.who.trim(),
  )
}
