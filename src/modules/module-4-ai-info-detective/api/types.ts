/**
 * 文件说明：模块 4 前端 API 类型。
 * 职责：定义课时 3 题卡自检助手请求与响应结构，供 adapter 和后端契约对齐。
 * 更新触发：模块 4 API endpoint、课时 3 AI review 字段或响应状态变化时，需要同步更新本文件。
 */

import type {
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
    options: Array<{ key: string; label: string }>
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
