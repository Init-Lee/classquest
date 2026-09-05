/**
 * 文件说明：模块 1 课时 1 关卡门禁。
 * 职责：根据已保存字段判断关卡完成与可进入状态，阻止通过直连地址跳过必要任务。
 * 更新触发：课时 1 字段、完成条件或关卡先后关系变化时，需要同步更新本文件。
 */

import {
  hasMeaningfulModule1Lesson1Fields,
  type Module1Lesson1State,
} from "@/modules/module-1-ai-story/domains/portfolio/types"

export function isModule1Lesson1StepComplete(state: Module1Lesson1State, stepId: number): boolean {
  if (stepId === 1) return state.step1Completed
  if (stepId === 2) return state.step2Completed && Boolean(state.sdg.trim() && state.sdgWhy.trim())
  if (stepId === 3) return state.step3Completed && Boolean(state.cityIssue.trim())
  if (stepId === 4) return state.step4Completed && state.completed && hasMeaningfulModule1Lesson1Fields(state)
  return false
}

export function canEnterModule1Lesson1Step(state: Module1Lesson1State, stepId: number): boolean {
  if (stepId === 1) return true
  if (stepId < 2 || stepId > 4) return false
  return isModule1Lesson1StepComplete(state, stepId - 1)
}

export function getCurrentModule1Lesson1Step(state: Module1Lesson1State): number {
  for (let stepId = 1; stepId <= 4; stepId += 1) {
    if (!isModule1Lesson1StepComplete(state, stepId)) return stepId
  }
  return 4
}

export function getModule1Lesson1GuardReason(stepId: number): string {
  if (stepId === 2) return "请先确认未来城市写作任务。"
  if (stepId === 3) return "请先选择 SDG，并说明它与你的生活或社区有什么连接。"
  if (stepId === 4) return "请先写清楚一个具体、可观察的城市问题。"
  return "请先完成前一关。"
}
