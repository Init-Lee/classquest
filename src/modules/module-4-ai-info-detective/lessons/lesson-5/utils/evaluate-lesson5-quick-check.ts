/**
 * 文件说明：模块 4 课时 5 QuickCheck 评估工具。
 * 职责：把 completion-summary 与本地 revision 状态压缩为 T1/T2/T3 分项评分、完成证据与阻塞说明，供 Step4 保存与 HTML 快照复用。
 * 更新触发：课时 5 完成摘要字段、readyForLesson6 口径、QuickCheck 评分口径或阶段快照证据变化时，需要同步更新本文件。
 */

import type { Lesson5MyCompletionSummaryResponse } from "@/modules/module-4-ai-info-detective/api/lesson5-types"
import type {
  Module4Lesson5QuickCheckLevel,
  Module4Lesson5QuickCheckState,
  Module4Lesson5QuickCheckTarget,
  Module4Lesson5ReadyForLesson6,
  Module4Lesson5State,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

function buildTarget<TEvidence extends Record<string, unknown>>(
  score: number,
  threshold: number,
  evidence: TEvidence,
): Module4Lesson5QuickCheckTarget<TEvidence> {
  return {
    score,
    achieved: score >= threshold,
    evidence,
  }
}

function getLevel(totalScore: number, allTargetsAchieved: boolean): Module4Lesson5QuickCheckLevel {
  if (totalScore === 100 && allTargetsAchieved) return "excellent"
  if (totalScore >= 75 && allTargetsAchieved) return "achieved"
  if (totalScore >= 60) return "basic"
  return "not_achieved"
}

export function evaluateLesson5QuickCheck(
  lesson5: Module4Lesson5State,
  evaluatedAt: string,
  completionSummary?: Lesson5MyCompletionSummaryResponse,
): Module4Lesson5QuickCheckState {
  const readyForLesson6 = (completionSummary?.revision.readyForLesson6 ?? lesson5.revision?.readyForLesson6 ?? "none") as Module4Lesson5ReadyForLesson6
  const submittedCount = completionSummary?.revision.submittedCount ?? lesson5.revision?.submittedCount ?? 0
  const submittedItemIds = new Set(completionSummary?.revision.submittedItems.map(item => item.itemId) ?? [])
  const newsSubmitted = Boolean(
    lesson5.revision?.cards.news.v3VersionId
      || lesson5.revision?.cards.news.submittedAt
      || completionSummary?.revision.submittedItems.some(item => item.cardKind === "news" || submittedItemIds.has(lesson5.revision?.cards.news.itemId ?? "")),
  )
  const imageSubmitted = Boolean(
    lesson5.revision?.cards.image.v3VersionId
      || lesson5.revision?.cards.image.submittedAt
      || completionSummary?.revision.submittedItems.some(item => item.cardKind === "image" || submittedItemIds.has(lesson5.revision?.cards.image.itemId ?? "")),
  )
  const t1HasV2Submission = completionSummary?.quickCheck.t1HasV2Submission ?? Boolean(lesson5.submissionSummary)
  const reportItems = completionSummary?.myItemStats ?? lesson5.myReport?.items ?? []
  const hasNewsStats = reportItems.some(item => item.kind === "news")
  const hasImageStats = reportItems.some(item => item.kind === "image")
  const t2HasTrialStats = completionSummary?.quickCheck.t2HasTrialStats ?? reportItems.length > 0
  const t3HasV3Submission = completionSummary?.quickCheck.t3HasV3Submission ?? (submittedCount > 0 || newsSubmitted || imageSubmitted)
  const T1 = buildTarget(
    t1HasV2Submission ? 35 : 0,
    35,
    {
      v2Submitted: t1HasV2Submission,
      hasNewsItem: Boolean(completionSummary?.v2Submit.hasNews ?? lesson5.submissionSummary?.items.news.itemId),
      hasImageItem: Boolean(completionSummary?.v2Submit.hasImage ?? lesson5.submissionSummary?.items.image.itemId),
    },
  )
  const T2 = buildTarget(
    t2HasTrialStats ? 30 : 0,
    30,
    {
      trialStatsReady: t2HasTrialStats,
      reportItemCount: reportItems.length,
      hasNewsStats,
      hasImageStats,
    },
  )
  const T3 = buildTarget(
    readyForLesson6 === "full" ? 35 : t3HasV3Submission ? 30 : 0,
    30,
    {
      v3Submitted: t3HasV3Submission,
      submittedCount,
      readyForLesson6,
      newsSubmitted,
      imageSubmitted,
    },
  )
  const totalScore = T1.score + T2.score + T3.score
  const blockers = [
    ...(T1.achieved ? [] : ["T1：尚未确认 V2 双卡已入池"]),
    ...(T2.achieved ? [] : ["T2：尚未保存本人试答统计报告"]),
    ...(T3.achieved ? [] : ["T3：尚未提交 V3 修订"]),
  ]

  return {
    t1HasV2Submission,
    t2HasTrialStats,
    t3HasV3Submission,
    readyForLesson6,
    evaluatedAt,
    T1,
    T2,
    T3,
    totalScore,
    level: getLevel(totalScore, T1.achieved && T2.achieved && T3.achieved),
    blockers,
  }
}
