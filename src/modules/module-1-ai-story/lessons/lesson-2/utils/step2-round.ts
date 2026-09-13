/**
 * 文件说明：模块 1 课时 2 第 2 关关内分页（第一轮 / 选定片段）纯函数。
 * 职责：解析 `?round=1|2`、判断第一页是否可继续、第二页是否可进入，以及右侧设定栏是否显示已确认圆点。
 * 更新触发：第 2 关子页编号、第一页完成/跳过口径或设定栏圆点规则变化时，需要同步更新本文件。
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

/** 第一页已通过（保存并继续或跳过）后才能进第二页；教师模式不拦。 */
export function canEnterModule1Lesson2Step2Round(
  state: Module1Lesson2State,
  round: Module1Lesson2Step2Round,
  isTeacherMode = false,
): boolean {
  if (round === 1 || isTeacherMode) return true
  return state.step2Round1Passed || state.step2Completed
}

export function canAdvanceModule1Lesson2Step2Round1(state: Module1Lesson2State): boolean {
  return canCompleteModule1Lesson2Step2Round1(state)
}

/** 跳过第一轮不要求第一轮回复，只打通第二页。 */
export function canSkipModule1Lesson2Step2Round1(): boolean {
  return true
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
