/**
 * 文件说明：课时 4 Step1 互审连接与同步状态工具。
 * 职责：区分 HTTP 404/410（本地陈旧）与网络离线，供 Step1 统一横幅与 portfolio 重置决策使用。
 * 更新触发：adapter 错误码映射、同步横幅文案或重置边界变化时，需要同步更新本文件。
 */

import { Lesson4PeerReviewHttpError } from "@/modules/module-4-ai-info-detective/api/lesson4-peer-review.adapter"
import { Lesson4ReviewModerationHttpError } from "@/modules/module-4-ai-info-detective/api/lesson4-review-moderation.adapter"

/** Step1 页面级同步横幅阶段。 */
export type Lesson4SyncPhase = "idle" | "syncing" | "ok" | "offline" | "stale_reset"

export type Lesson4PeerReviewErrorKind = "stale" | "offline" | "other"

/** Vite/反向代理在后端未启动时常见 502；503/504 亦视为不可达而非业务错误。 */
const OFFLINE_HTTP_STATUSES = new Set([502, 503, 504])

function classifyLesson4HttpStatusError(status: number): Lesson4PeerReviewErrorKind {
  if (status === 404 || status === 410) return "stale"
  if (OFFLINE_HTTP_STATUSES.has(status)) return "offline"
  return "other"
}

/** 将互审 / 审核 API 错误归类为陈旧（应清本地）、离线或其它业务错误。 */
export function classifyLesson4PeerReviewError(error: unknown): Lesson4PeerReviewErrorKind {
  if (error instanceof Lesson4PeerReviewHttpError) {
    return classifyLesson4HttpStatusError(error.status)
  }
  if (error instanceof Lesson4ReviewModerationHttpError) {
    return classifyLesson4HttpStatusError(error.status)
  }
  if (error instanceof TypeError) return "offline"
  if (error instanceof DOMException && error.name === "AbortError") return "offline"
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (
      message.includes("failed to fetch")
      || message.includes("network")
      || message.includes("load failed")
      || message.includes("econnrefused")
      || message.includes("connection refused")
      || message.includes("proxy error")
      || message.includes("bad gateway")
      || message.includes("service unavailable")
      || message.includes("gateway timeout")
    ) {
      return "offline"
    }
  }
  return "other"
}

export function isLesson4StalePeerReviewError(error: unknown): boolean {
  return classifyLesson4PeerReviewError(error) === "stale"
}

export function isLesson4OfflinePeerReviewError(error: unknown): boolean {
  return classifyLesson4PeerReviewError(error) === "offline"
}

/** 服务端 status 表示记录已结束，应清空本地 outbound/inbound 活跃字段。 */
export function isLesson4TerminalReviewStatus(status: string): boolean {
  return status === "expired" || status === "cancelled"
}

/** 作者侧 status 表明审查者已提交反馈（含作者已拉取 pulled）。 */
export function isLesson4ReviewerSubmissionConfirmed(status: string): boolean {
  return status === "submitted" || status === "pulled"
}
