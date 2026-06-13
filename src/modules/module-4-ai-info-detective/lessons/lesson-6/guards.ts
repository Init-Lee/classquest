/**
 * 文件说明：模块 4 课时 6 Guard 规则。
 * 职责：定义课时 6 Step1-Step3 进入条件和完成步骤口径，确保学生先完成课时 5，再按发布状态确认、公共挑战顺序推进。
 * 更新触发：课时 6 步骤开放策略、lesson5 完成条件、公共挑战完成证据或 C4b 复盘完成判定变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson5State,
  Module4Lesson6State,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON6_STEPS } from "./config"

export function hasLesson5Completion(lesson5: Module4Lesson5State): boolean {
  return lesson5.completed === true
}

export function canEnterLesson6Step(lesson5: Module4Lesson5State, stepId: number, lesson6?: Module4Lesson6State): boolean {
  if (!LESSON6_STEPS.some(step => step.id === stepId)) return false
  if (!hasLesson5Completion(lesson5)) return false
  if (lesson6?.completed) return true
  if (stepId === 1) return true
  if (!lesson6?.step1AckAt) return false
  if (stepId === 2) return true
  return lesson6.publicChallenge?.completed === true
}

export function getLesson6CompletedSteps(state: Module4Lesson6State): number[] {
  if (state.completed) return [1, 2, 3]
  if (!state.step1AckAt) return []
  if (state.publicChallenge?.completed) return [1, 2]
  return [1]
}

export function getLesson6GuardReason(): string {
  return "请先完成课时 5，并至少提交 1 张 V3 题卡。"
}
