/**
 * 文件说明：模块 4 课时 1 Guard 规则。
 * 职责：定义五个 Step 的进入条件、完成条件和当前可学习关卡，防止学生跳过必要学习动作。
 * 更新触发：课时 1 状态字段、Step 解锁规则或课时完成判定变化时，需要同步更新本文件。
 */

import type { Module4Lesson1State } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON1_STEPS } from "./config"

export function canEnterLesson1Step(state: Module4Lesson1State, stepId: number): boolean {
  switch (stepId) {
    case 1:
      return true
    case 2:
      return state.missionAcknowledged && state.outcomeCheckPassed
    case 3:
      return state.step2.completed || (state.newsSampleViewed && state.imageSampleViewed)
    case 4:
      return state.cardAnatomyCompleted && state.cardAnatomyScore >= 4
    case 5:
      return state.fullCardTemplateConfirmed || (state.quizFlowSimulated && state.beforeAfterReason.trim().length > 0)
    default:
      return false
  }
}

export function isLesson1StepComplete(state: Module4Lesson1State, stepId: number): boolean {
  switch (stepId) {
    case 1:
      return state.missionAcknowledged && state.outcomeCheckPassed
    case 2:
      return state.step2.completed || (state.newsSampleViewed && state.imageSampleViewed)
    case 3:
      return state.cardAnatomyCompleted && state.cardAnatomyScore >= 4
    case 4:
      return state.fullCardTemplateConfirmed || (state.quizFlowSimulated && state.beforeAfterReason.trim().length > 0)
    case 5:
      return (
        (state.step5.completed
          && state.step5.newsPlanText.trim().length > 0
          && state.step5.imagePlanText.trim().length > 0
          && Boolean(state.step5.newsPossibleSourceType)
          && Boolean(state.step5.imagePossibleSourceType)
          && state.step5.exitAndAvoidAcknowledged
          && state.completed)
        || (
          state.personalTaskChecklistCompleted
          && state.materialPrepChecklistKeys.length >= 3
          && state.newsSourcePlan.trim().length > 0
          && state.imageSourcePlan.trim().length > 0
          && state.completed
        )
      )
    default:
      return false
  }
}

export function getLesson1CompletedSteps(state: Module4Lesson1State): number[] {
  return LESSON1_STEPS
    .filter(step => isLesson1StepComplete(state, step.id))
    .map(step => step.id)
}

export function getCurrentLesson1Step(state: Module4Lesson1State): number {
  for (const step of LESSON1_STEPS) {
    if (!canEnterLesson1Step(state, step.id)) {
      return Math.max(1, step.id - 1)
    }
    if (!isLesson1StepComplete(state, step.id)) {
      return step.id
    }
  }
  return 5
}

export function getLesson1GuardReason(stepId: number): string {
  const reasons: Record<number, string> = {
    2: "请先完成任务发布中的三题确认。",
    3: "请先看完新闻类和图片类样例。",
    4: "请先完成四部分题目卡结构拆解。",
    5: "请先确认完整题卡模板。",
  }
  return reasons[stepId] ?? "请先完成前一关。"
}
