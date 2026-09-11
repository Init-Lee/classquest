/**
 * 文件说明：模块 1 课时 2 关卡门禁。
 * 职责：根据风格选择、理由和人物四格判断关卡完成与可进入状态，并在无档案或未完成课时 1 时给出安全回跳。
 * 更新触发：课时 2 字段、完成条件、关卡先后关系或教师讲解放行规则变化时，需要同步更新本文件。
 */

import {
  hasMeaningfulModule1Lesson2Fields,
  hasSelectedModule1Lesson2Style,
  type Module1Lesson2State,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { getCurrentModule1Lesson1Step } from "@/modules/module-1-ai-story/lessons/lesson-1/guards"

export function isModule1Lesson2StepComplete(state: Module1Lesson2State, stepId: number): boolean {
  if (stepId === 1) return state.step1Completed
  if (stepId === 2) return state.step2Completed && hasSelectedModule1Lesson2Style(state)
  if (stepId === 3) return state.step3Completed && Boolean(state.styleWhy.trim())
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
  if (stepId === 2) return "请先理解风格选择，并查看预设风格卡。"
  if (stepId === 3) return "请先选择一个预设风格，或完成自定义风格填写。"
  if (stepId === 4) return "请先结合受众与城市问题，说明为什么选择这个风格。"
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
