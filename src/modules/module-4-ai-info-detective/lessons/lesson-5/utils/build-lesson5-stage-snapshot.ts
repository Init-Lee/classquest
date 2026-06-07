/**
 * 文件说明：模块 4 课时 5 阶段快照构建工具。
 * 职责：基于 my-completion-summary 与 QuickCheck 组装本地 lesson5.stageSnapshot，供继续学习包与 HTML 导出复用。
 * 更新触发：completion-summary 字段、Lesson5 stageSnapshot 结构、QuickCheck 证据或课时 6 准备度规则变化时，需要同步更新本文件。
 */

import type { Lesson5MyCompletionSummaryResponse } from "@/modules/module-4-ai-info-detective/api/lesson5-types"
import type {
  Module4Lesson5QuickCheckState,
  Module4Lesson5StageSnapshot,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export function buildLesson5StageSnapshot(
  completionSummary: Lesson5MyCompletionSummaryResponse,
  quickCheck: Module4Lesson5QuickCheckState,
  snappedAt: string,
): Module4Lesson5StageSnapshot {
  return {
    version: "lesson5-stage-v1",
    snappedAt,
    sessionId: completionSummary.sessionId,
    participantId: completionSummary.participantId,
    v2Submit: completionSummary.v2Submit,
    trial: completionSummary.trial,
    revision: {
      readyForLesson6: completionSummary.revision.readyForLesson6,
      submittedCount: completionSummary.revision.submittedCount,
      submittedItemIds: completionSummary.revision.submittedItems.map(item => item.itemId),
    },
    quickCheck: {
      totalScore: quickCheck.totalScore,
      level: quickCheck.level,
      evaluatedAt: quickCheck.evaluatedAt,
      targets: {
        T1: { score: quickCheck.T1.score, achieved: quickCheck.T1.achieved },
        T2: { score: quickCheck.T2.score, achieved: quickCheck.T2.achieved },
        T3: { score: quickCheck.T3.score, achieved: quickCheck.T3.achieved },
      },
      blockers: [...quickCheck.blockers],
    },
  }
}
