/**
 * 文件说明：模块 1 课时 6 关卡门禁。
 * 职责：根据观察、结局类型、结尾安排、合段初稿/确认稿和第 3/4 关必用外部 AI 过程判断关卡完成与可进入状态，并在无档案或未完成课时 5 时给出安全回跳。
 * 更新触发：课时 6 字段、外部 AI 过程必填或关卡先后关系变化时，需要同步更新本文件。
 */

import {
  hasMeaningfulModule1Lesson6Fields,
  hasModule1Lesson6Draft,
  hasModule1Lesson6Observation,
  hasModule1Lesson6Plan,
  type Module1Lesson6State,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { getCurrentModule1Lesson5Step } from "@/modules/module-1-ai-story/lessons/lesson-5/guards"

export function isModule1Lesson6StepComplete(state: Module1Lesson6State, stepId: number): boolean {
  if (stepId === 1) return state.step1Completed && hasModule1Lesson6Observation(state)
  if (stepId === 2) return state.step2Completed && hasModule1Lesson6Plan(state) && !state.reviewNeeded.plan
  if (stepId === 3) return state.step3Completed && hasModule1Lesson6Draft(state) && !state.reviewNeeded.draft
  if (stepId === 4) return state.step4Completed && state.completed && hasMeaningfulModule1Lesson6Fields(state)
  return false
}

export function canEnterModule1Lesson6Step(state: Module1Lesson6State, stepId: number): boolean {
  if (stepId === 1) return true
  if (stepId < 2 || stepId > 4) return false
  return isModule1Lesson6StepComplete(state, stepId - 1)
}

export function getCurrentModule1Lesson6Step(state: Module1Lesson6State): number {
  for (let stepId = 1; stepId <= 4; stepId += 1) {
    if (!isModule1Lesson6StepComplete(state, stepId)) return stepId
  }
  return 4
}

export function getModule1Lesson6GuardReason(stepId: number): string {
  if (stepId === 2) return "请先写下一句有具体内容依据的观察；若已复制提示词，还须把外部 AI 回复贴回来。"
  if (stepId === 3) return "请先选择结局类型，并确认结尾安排和理由；若已复制提示词，还须把外部 AI 回复贴回来。"
  if (stepId === 4) return "请先写下合段初稿，并复制提示词把外部 AI 回复贴回来。"
  return "请先完成前一关。"
}

export function getModule1Lesson6RouteRedirect(
  portfolio: Module1Portfolio | null,
  stepId: number,
  isTeacherMode = false,
): string | null {
  if (!portfolio) return "/module/1"
  if (isTeacherMode) return null
  if (!portfolio.lesson5.completed) {
    return `/module/1/lesson/5/step/${getCurrentModule1Lesson5Step(portfolio.lesson5)}`
  }
  if (canEnterModule1Lesson6Step(portfolio.lesson6, stepId)) return null
  return `/module/1/lesson/6/step/${getCurrentModule1Lesson6Step(portfolio.lesson6)}`
}
