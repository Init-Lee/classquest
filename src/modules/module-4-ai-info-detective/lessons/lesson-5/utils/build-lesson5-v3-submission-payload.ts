/**
 * 文件说明：模块 4 课时 5 V3 提交 payload 构建工具。
 * 职责：把本地 Step4 修订题卡、课堂身份和 revisionPlan 组装为后端 `/v3-submissions` 请求体。
 * 更新触发：后端 V3 提交字段、题卡 JSON 包装方式、revisionPlan 结构或课堂身份字段变化时，需要同步更新本文件。
 */

import type { Lesson5V3SubmissionPayload } from "@/modules/module-4-ai-info-detective/api/lesson5-types"
import type {
  Module4Lesson4V2CardDraft,
  Module4Lesson5ConnectedSessionState,
  Module4Lesson5RevisionPlanState,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

function normalizeFrontendRevisionAction(
  revisionAction: Module4Lesson5RevisionPlanState["revisionAction"],
): "keep" | "minor_fix" | "major_fix" {
  return revisionAction === "keep" || revisionAction === "major_fix" ? revisionAction : "minor_fix"
}

export function buildLesson5V3SubmissionPayload({
  connectedSession,
  lesson5ClientId,
  itemId,
  baseV2VersionId,
  card,
  revisionPlan,
}: {
  connectedSession: Module4Lesson5ConnectedSessionState
  lesson5ClientId: string
  itemId: string
  baseV2VersionId: string
  card: Module4Lesson4V2CardDraft
  revisionPlan: Module4Lesson5RevisionPlanState
}): Lesson5V3SubmissionPayload {
  return {
    sessionId: connectedSession.sessionId,
    participantId: connectedSession.participantId,
    lesson5ClientId,
    itemId,
    baseV2VersionId,
    revisionPlan: {
      revisionAction: normalizeFrontendRevisionAction(revisionPlan.revisionAction),
      diagnosis: {
        selectedProblems: revisionPlan.selectedProblems,
        evidence: revisionPlan.evidence,
      },
      revisionReason: revisionPlan.revisionReason,
      expectedEffect: revisionPlan.expectedEffect,
    },
    v3CardJson: {
      ...card,
      version: "v3",
      revision: {
        ...card.revision,
        lesson5RevisionPlan: revisionPlan,
      },
    },
  }
}
