/**
 * 文件说明：模块 1 课时 3 关卡门禁。
 * 职责：根据阅读判断、开场、题目初稿和确认稿判断关卡完成与可进入状态，并在无档案或未完成课时 2 时给出安全回跳。
 * 更新触发：课时 3 字段、题目必填、外部 AI 过程必填或关卡先后关系变化时，需要同步更新本文件。
 */

import {
  hasMeaningfulModule1Lesson3Fields,
  hasModule1Lesson3Draft,
  hasModule1Lesson3Observation,
  hasModule1Lesson3Opening,
  type Module1Lesson3State,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { getCurrentModule1Lesson2Step } from "@/modules/module-1-ai-story/lessons/lesson-2/guards"

export function isModule1Lesson3StepComplete(state: Module1Lesson3State, stepId: number): boolean {
  if (stepId === 1) return state.step1Completed && hasModule1Lesson3Observation(state)
  if (stepId === 2) return state.step2Completed && hasModule1Lesson3Opening(state) && !state.reviewNeeded.opening
  if (stepId === 3) return state.step3Completed && hasModule1Lesson3Draft(state) && !state.reviewNeeded.draft
  if (stepId === 4) return state.step4Completed && state.completed && hasMeaningfulModule1Lesson3Fields(state)
  return false
}

export function canEnterModule1Lesson3Step(state: Module1Lesson3State, stepId: number): boolean {
  if (stepId === 1) return true
  if (stepId < 2 || stepId > 4) return false
  return isModule1Lesson3StepComplete(state, stepId - 1)
}

export function getCurrentModule1Lesson3Step(state: Module1Lesson3State): number {
  for (let stepId = 1; stepId <= 4; stepId += 1) {
    if (!isModule1Lesson3StepComplete(state, stepId)) return stepId
  }
  return 4
}

export function getModule1Lesson3GuardReason(stepId: number): string {
  if (stepId === 2) return "请先写下有具体词句依据的阅读判断；若已复制提示词，还须把外部 AI 回复贴回来。"
  if (stepId === 3) return "请先确认开场时刻和本段写法；若已复制提示词，还须把外部 AI 回复贴回来。"
  if (stepId === 4) return "请先写下题目和初稿；若已复制提示词，还须把外部 AI 回复贴回来。"
  return "请先完成前一关。"
}

export function getModule1Lesson3RouteRedirect(
  portfolio: Module1Portfolio | null,
  stepId: number,
  isTeacherMode = false,
): string | null {
  if (!portfolio) return "/module/1"
  if (isTeacherMode) return null
  if (!portfolio.lesson2.completed) {
    return `/module/1/lesson/2/step/${getCurrentModule1Lesson2Step(portfolio.lesson2)}`
  }
  if (canEnterModule1Lesson3Step(portfolio.lesson3, stepId)) return null
  return `/module/1/lesson/3/step/${getCurrentModule1Lesson3Step(portfolio.lesson3)}`
}
