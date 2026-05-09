/**
 * 文件说明：模块 4 课时 2 Guard 规则。
 * 职责：定义课时 2 五个关卡的进入条件、完成判定和当前关卡解析，保证学生按素材体检流程推进。
 * 更新触发：课时 2 状态字段、关卡顺序、解锁条件或完成判定变化时，需要同步更新本文件。
 */

import type { Module4Lesson1State, Module4Lesson2State } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON2_STEPS } from "./config"

export function canEnterLesson2Step(
  lesson1: Module4Lesson1State,
  lesson2: Module4Lesson2State,
  stepId: number,
): boolean {
  if (!lesson1.completed) return false
  switch (stepId) {
    case 1:
      return true
    case 2:
      return lesson2.step1Completed
    case 3:
      return lesson2.step2Completed
    case 4:
      return lesson2.step3Completed
    case 5:
      return lesson2.step3Completed && lesson2.step4Completed
    default:
      return false
  }
}

export function isLesson2StepComplete(state: Module4Lesson2State, stepId: number): boolean {
  switch (stepId) {
    case 1:
      return state.step1Completed
    case 2:
      return state.step2Completed
    case 3:
      return state.step3Completed
    case 4:
      return state.step4Completed
    case 5:
      return state.completed
    default:
      return false
  }
}

export function getLesson2CompletedSteps(state: Module4Lesson2State): number[] {
  return LESSON2_STEPS
    .filter(step => isLesson2StepComplete(state, step.id))
    .map(step => step.id)
}

export function getCurrentLesson2Step(state: Module4Lesson2State): number {
  for (const step of LESSON2_STEPS) {
    if (!isLesson2StepComplete(state, step.id)) return step.id
  }
  return 5
}

export function getLesson2GuardReason(stepId: number): string {
  const reasons: Record<number, string> = {
    2: "请先记录你的素材准备现状。",
    3: "请先完成四关体检标准挑战。",
    4: "请先完成新闻素材工作台。",
    5: "请先完成新闻和图片两类素材初筛。",
  }
  return reasons[stepId] ?? "请先完成前一关。"
}
