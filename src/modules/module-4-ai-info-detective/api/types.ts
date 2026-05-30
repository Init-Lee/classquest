/**
 * 文件说明：模块 4 前端 API 类型。
 * 职责：定义课时 3 题卡自检助手与课时 4 同伴互审请求/响应结构，供 adapter 和后端契约对齐。
 * 更新触发：模块 4 API endpoint、课时 3 AI review 字段、课时 4 互审字段或响应状态变化时，需要同步更新本文件。
 */

import type {
  Lesson4OutboundStatus,
  Module4Lesson3QuestionCardDraft,
  Module4Lesson4ReviewJson,
  Module4Lesson3AiReviewResult,
  Module4MaterialKind,
  Module4MaterialSourceType,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export interface Lesson3AiReviewRequest {
  cardId: string
  kind: Module4MaterialKind
  material: {
    titleOrName: string
    displayNote: string
    assetDataUrl?: string
    assetMimeType?: string
    assetFingerprint?: string
  }
  task: {
    prompt: string
    options: Array<{ key: string; label: string; rationale?: string }>
    correctOptionKey?: string
  }
  explanation: {
    text: string
  }
  source: {
    sourceType?: Module4MaterialSourceType
    sourceRecord: string
    verificationNote: string
  }
  clientContext: {
    lessonId: 3
    version: "v1"
    requestNo: number
  }
}

export interface Lesson3AiReviewResponse {
  requestId: string
  provider: "mock" | "qwen"
  reviewedAt: string
  result: Module4Lesson3AiReviewResult
}

export interface Lesson4ReviewRequestJson {
  cards: Record<Module4MaterialKind, Module4Lesson3QuestionCardDraft>
  snapshotMeta: {
    version: "v1"
    snapshotCreatedAt: string
  }
}

export interface Lesson4CreateReviewRequestPayload {
  classId: string
  authorSeatCode: string
  targetReviewerSeatCode: string
  requestJson: Lesson4ReviewRequestJson
}

export interface Lesson4CreateReviewRequestResponse {
  requestId: string
  status: Extract<Lesson4OutboundStatus, "pending">
  inviteCode: string
  serverNow: string
  pendingExpiresAt: string
}

export interface Lesson4CancelReviewRequestPayload {
  requestId: string
  authorSeatCode: string
}

export interface Lesson4ReviewerInboxPayload {
  classId: string
  reviewerSeatCode: string
}

export interface Lesson4ReviewerInboxTask {
  requestId: string
  authorSeatCode: string
  status: Extract<Lesson4OutboundStatus, "pending" | "claimed" | "expired">
  pendingExpiresAt?: string
}

export interface Lesson4ReviewerInboxResponse {
  serverNow: string
  tasks: Lesson4ReviewerInboxTask[]
}

export interface Lesson4ClaimReviewRequestPayload {
  requestId: string
  reviewerSeatCode: string
  inviteCode: string
}

export interface Lesson4ClaimReviewRequestResponse {
  requestId: string
  status: Extract<Lesson4OutboundStatus, "claimed" | "expired">
  serverNow: string
  reviewExpiresAt?: string
  requestJson?: Lesson4ReviewRequestJson
}

export interface Lesson4SubmitReviewFeedbackPayload {
  requestId: string
  reviewerSeatCode: string
  reviewJson: Module4Lesson4ReviewJson
}

export interface Lesson4SubmitReviewFeedbackResponse {
  requestId: string
  status: Extract<Lesson4OutboundStatus, "submitted" | "expired">
  serverNow: string
  submittedAt?: string
}

export interface Lesson4FetchReviewRequestStatusPayload {
  requestId: string
  authorSeatCode: string
}

export interface Lesson4FetchReviewRequestStatusResponse {
  requestId: string
  status: Extract<Lesson4OutboundStatus, "pending" | "claimed" | "submitted" | "pulled" | "cancelled" | "expired">
  serverNow: string
  pendingExpiresAt?: string
  reviewExpiresAt?: string
  submittedAt?: string
  reviewJson?: Module4Lesson4ReviewJson
}

export interface Lesson4PullReviewFeedbackPayload {
  requestId: string
  authorSeatCode: string
}

export interface Lesson4PullReviewFeedbackResponse {
  requestId: string
  status: Extract<Lesson4OutboundStatus, "pulled">
  serverNow: string
  pulledAt: string
  reviewJson: Module4Lesson4ReviewJson
}
