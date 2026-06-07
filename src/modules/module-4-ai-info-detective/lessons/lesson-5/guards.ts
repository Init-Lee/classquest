/**
 * 文件说明：模块 4 课时 5 Guard 规则。
 * 职责：定义课时 5 Step1-Step4 进入条件和完成判定，确保学生先有课时4 ready 包，并在 analytics_open 后开放报告与 V3 学习任务。
 * 更新触发：课时 5 步骤开放策略、lesson4 ready 包条件或 lesson5 完成字段变化时，需要同步更新本文件。
 */

import type { Module4Lesson4State, Module4Lesson5State } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON5_STEPS } from "./config"
import { isLesson5Step4Complete } from "./utils/is-lesson5-step4-complete"

export function hasLesson4ReadyPackage(lesson4: Module4Lesson4State): boolean {
  return lesson4.completed === true
    && lesson4.readiness.readyForLesson5 === true
    && lesson4.readiness.exportedPackageJson != null
}

export function canEnterLesson5Step(lesson4: Module4Lesson4State, stepId: number, lesson5?: Module4Lesson5State): boolean {
  if (!LESSON5_STEPS.some(step => step.id === stepId)) return false
  if (!hasLesson4ReadyPackage(lesson4)) return false
  if (stepId < 3) return true
  const phase = lesson5?.connectedSession?.phase
  const feedbackOpen = phase === "analytics_open" || phase === "revision_open" || phase === "closed"
  if (stepId === 3) return feedbackOpen
  return feedbackOpen
}

export function getCurrentLesson5Step(state?: Module4Lesson5State): number {
  if (isLesson5Step4Complete(state)) return 4
  if (
    state?.connectedSession?.phase === "analytics_open"
    || state?.connectedSession?.phase === "revision_open"
    || state?.connectedSession?.phase === "closed"
  ) return 3
  return state?.submissionSummary ? 2 : 1
}

export function getLesson5CompletedSteps(state: Module4Lesson5State): number[] {
  if (!state.submissionSummary) return []
  if (isLesson5Step4Complete(state)) return [1, 2, 3, 4]
  if (state.revision?.submittedCount || state.stageSnapshot) return [1, 2, 3]
  if (
    state.connectedSession?.phase === "analytics_open"
    || state.connectedSession?.phase === "revision_open"
    || state.connectedSession?.phase === "closed"
  ) return [1, 2]
  return [1]
}

export function getLesson5GuardReason(): string {
  return "请先完成课时 4 第 4 关，并保存 V2 就绪包。"
}
