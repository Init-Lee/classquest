/**
 * 文件说明：模块 4 课时 5 第 4 关完成判定工具。
 * 职责：集中判断学生是否已经提交至少 1 张 V3，并把该稳定口径提供给首页入口、课内进度条和 Step4 出口复用。
 * 更新触发：lesson5.completed 语义、V3 提交字段、readyForLesson6 口径或 QuickCheck/阶段快照结构变化时，需要同步更新本文件。
 */

import type { Module4Lesson5State } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

function hasSubmittedRevisionCard(state: Module4Lesson5State): boolean {
  return Boolean(
    state.revision?.cards.news.v3VersionId
      || state.revision?.cards.news.submittedAt
      || state.revision?.cards.image.v3VersionId
      || state.revision?.cards.image.submittedAt,
  )
}

export function isLesson5Step4Complete(state?: Module4Lesson5State): boolean {
  if (!state?.submissionSummary) return false
  if (state.completed) return true
  if ((state.revision?.submittedCount ?? 0) >= 1) return true
  if (state.revision?.readyForLesson6 === "partial" || state.revision?.readyForLesson6 === "full") return true
  if (hasSubmittedRevisionCard(state)) return true
  if ((state.quickCheck.T3.evidence.submittedCount ?? 0) >= 1) return true
  if (state.quickCheck.T3.evidence.readyForLesson6 !== "none") return true
  if (state.quickCheck.T3.achieved && state.quickCheck.T3.evidence.v3Submitted) return true
  if ((state.stageSnapshot?.revision.submittedCount ?? 0) >= 1) return true
  if (state.stageSnapshot?.revision.readyForLesson6 === "partial" || state.stageSnapshot?.revision.readyForLesson6 === "full") return true
  return state.stageSnapshot?.quickCheck.targets.T3.achieved === true
}
