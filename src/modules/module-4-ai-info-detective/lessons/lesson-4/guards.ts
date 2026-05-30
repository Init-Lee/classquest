/**
 * 文件说明：模块 4 课时 4 Guard 规则。
 * 职责：定义课时 4 四步流程的进入条件、完成判定和当前步骤解析；本阶段只开放第 1 关，Step2-4 由路由渲染锁定占位。
 * 更新触发：课时 4 状态字段、步骤开放策略、解锁条件或完成判定变化时，需要同步更新本文件。
 */

import type { Module4Lesson3State, Module4Lesson4State } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON4_STEPS } from "./config"

export function canEnterLesson4Step(
  lesson3: Module4Lesson3State,
  stepId: number,
): boolean {
  if (!lesson3.completed) return false
  return LESSON4_STEPS.some(step => step.id === stepId)
}

export function isLesson4StepComplete(state: Module4Lesson4State, stepId: number): boolean {
  switch (stepId) {
    case 1:
      return state.step1Completed
    case 2:
    case 3:
    case 4:
      return false
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
  return 1
}

export function getLesson4GuardReason(stepId: number): string {
  if (stepId === 1) return "请先完成课时 3 的 V1 题卡保存。"
  return "课时 4 后续步骤本版暂未开放。"
}
