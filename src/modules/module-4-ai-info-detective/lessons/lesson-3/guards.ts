/**
 * 文件说明：模块 4 课时 3 Guard 规则。
 * 职责：定义课时 3 四步流程的进入条件、完成判定和当前步骤解析，保证学生先完成课时 2 再制作 V1 题卡。
 * 更新触发：课时 3 状态字段、步骤顺序、解锁条件或完成判定变化时，需要同步更新本文件。
 */

import type { Module4Lesson2State, Module4Lesson3State } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON3_STEPS } from "./config"

export function canEnterLesson3Step(
  lesson2: Module4Lesson2State,
  lesson3: Module4Lesson3State,
  stepId: number,
): boolean {
  if (!lesson2.completed) return false
  switch (stepId) {
    case 1:
      return true
    case 2:
      return lesson3.step1Acknowledged
    case 3:
      return lesson3.step2Completed
    case 4:
      return lesson3.step2Completed && lesson3.step3Completed
    default:
      return false
  }
}

export function isLesson3StepComplete(state: Module4Lesson3State, stepId: number): boolean {
  switch (stepId) {
    case 1:
      return state.step1Acknowledged
    case 2:
      return state.step2Completed
    case 3:
      return state.step3Completed
    case 4:
      return state.completed
    default:
      return false
  }
}

export function getLesson3CompletedSteps(state: Module4Lesson3State): number[] {
  return LESSON3_STEPS
    .filter(step => isLesson3StepComplete(state, step.id))
    .map(step => step.id)
}

export function getCurrentLesson3Step(state: Module4Lesson3State): number {
  for (const step of LESSON3_STEPS) {
    if (!isLesson3StepComplete(state, step.id)) return step.id
  }
  return 4
}

export function getLesson3GuardReason(stepId: number): string {
  const reasons: Record<number, string> = {
    2: "请先确认课时 3 的 V1 制作边界。",
    3: "请先完成新闻题卡 V1。",
    4: "请先完成新闻题卡 V1 和图片题卡 V1。",
  }
  return reasons[stepId] ?? "请先完成前一步。"
}
