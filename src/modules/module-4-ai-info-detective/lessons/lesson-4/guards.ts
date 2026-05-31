/**
 * 文件说明：模块 4 课时 4 Guard 规则。
 * 职责：定义课时 4 四步递进流程的进入条件、完成判定和当前步骤解析，确保 Step1-4 按本地档案状态依次开放。
 * 更新触发：课时 4 状态字段、步骤开放策略、解锁条件或完成判定变化时，需要同步更新本文件。
 */

import type { Module4Lesson3State, Module4Lesson4State } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON4_STEPS } from "./config"

export function canEnterLesson4Step(
  lesson3: Module4Lesson3State,
  lesson4: Module4Lesson4State,
  stepId: number,
): boolean {
  if (!lesson3.completed) return false
  if (!LESSON4_STEPS.some(step => step.id === stepId)) return false
  if (stepId === 1) return true
  if (stepId === 2) return lesson4.step1Completed
  if (stepId === 3) return lesson4.step2Completed
  if (stepId === 4) return lesson4.step3Completed
  return false
}

export function isLesson4StepComplete(state: Module4Lesson4State, stepId: number): boolean {
  switch (stepId) {
    case 1:
      return state.step1Completed
    case 2:
      return state.step2Completed
    case 3:
      return state.step3Completed
    case 4:
      return state.step4Completed
    default:
      return false
  }
}

export function getLesson4CompletedSteps(state: Module4Lesson4State): number[] {
  return LESSON4_STEPS
    .filter(step => isLesson4StepComplete(state, step.id))
    .map(step => step.id)
}

export function getCurrentLesson4Step(state: Module4Lesson4State): number {
  if (!state.step1Completed) return 1
  if (!state.step2Completed) return 2
  if (!state.step3Completed) return 3
  if (!state.step4Completed) return 4
  return 4
}

export function getLesson4GuardReason(stepId: number): string {
  if (stepId === 1) return "请先完成课时 3 的 V1 题卡保存。"
  if (stepId === 2) return "请先完成第 1 关互审中转站，拿到同伴反馈。"
  if (stepId === 3) return "请先在第 2 关看懂反馈并完成作者决策。"
  if (stepId === 4) return "请先在第 3 关确认两张 V2 题卡。"
  return "请按课时 4 的步骤顺序继续。"
}
