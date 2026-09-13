/**
 * 文件说明：模块 1 课时 2 关卡门禁。
 * 职责：根据观察、参照、写法和人物五项判断关卡完成与可进入状态，并在无档案、未完成课时 1 或第 2 关未选定参照时给出安全回跳。
 * 更新触发：课时 2 字段、第 2 关整关完成条件、关内子页门禁、关卡先后关系或教师讲解放行规则变化时，需要同步更新本文件。
 */

import {
  hasMeaningfulModule1Lesson2Fields,
  hasModule1Lesson2Reason,
  hasModule1Lesson2StudyFields,
  type Module1Lesson2State,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { getCurrentModule1Lesson1Step } from "@/modules/module-1-ai-story/lessons/lesson-1/guards"
import {
  canCompleteModule1Lesson2Step2Gate,
  canEnterModule1Lesson2Step2Round,
} from "@/modules/module-1-ai-story/lessons/lesson-2/utils/step2-round"

export function isModule1Lesson2StepComplete(state: Module1Lesson2State, stepId: number): boolean {
  if (stepId === 1) return state.step1Completed && hasModule1Lesson2StudyFields(state) && !state.reviewNeeded.study
  if (stepId === 2) {
    return state.step2Completed
      && canCompleteModule1Lesson2Step2Gate(state)
      && !state.reviewNeeded.reference
      && !state.reviewNeeded.writingPlan
  }
  if (stepId === 3) return state.step3Completed && hasModule1Lesson2Reason(state) && !state.reviewNeeded.reason
  if (stepId === 4) return state.step4Completed && state.completed && hasMeaningfulModule1Lesson2Fields(state)
  return false
}

export function canEnterModule1Lesson2Step(state: Module1Lesson2State, stepId: number): boolean {
  if (stepId === 1) return true
  if (stepId < 2 || stepId > 4) return false
  return isModule1Lesson2StepComplete(state, stepId - 1)
}

export function getCurrentModule1Lesson2Step(state: Module1Lesson2State): number {
  for (let stepId = 1; stepId <= 4; stepId += 1) {
    if (!isModule1Lesson2StepComplete(state, stepId)) return stepId
  }
  return 4
}

export function getModule1Lesson2GuardReason(stepId: number): string {
  if (stepId === 2) return "请先写下自己的片段观察；若已复制提示词，还须把外部 AI 回复贴回来。"
  if (stepId === 3) return "请先记录文学参照，并确认准备采用的 2—3 条写法。"
  if (stepId === 4) return "请先写下与主题和写法有关的选择理由；若已复制提示词，还须把外部 AI 回复贴回来。"
  return "请先完成前一关。"
}

export function getModule1Lesson2RouteRedirect(
  portfolio: Module1Portfolio | null,
  stepId: number,
  isTeacherMode = false,
): string | null {
  if (!portfolio) return "/module/1"
  if (isTeacherMode) return null
  if (!portfolio.lesson1.completed) {
    return `/module/1/lesson/1/step/${getCurrentModule1Lesson1Step(portfolio.lesson1)}`
  }
  if (canEnterModule1Lesson2Step(portfolio.lesson2, stepId)) return null
  return `/module/1/lesson/2/step/${getCurrentModule1Lesson2Step(portfolio.lesson2)}`
}

export function getModule1Lesson2Step2RoundRedirect(
  state: Module1Lesson2State,
  round: 1 | 2,
  isTeacherMode = false,
): string | null {
  if (isTeacherMode || canEnterModule1Lesson2Step2Round(state, round, isTeacherMode)) return null
  return "/module/1/lesson/2/step/2?round=1"
}
