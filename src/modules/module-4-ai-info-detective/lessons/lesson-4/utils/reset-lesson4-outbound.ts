/**
 * 文件说明：课时 4 作者侧出站状态重置工具。
 * 职责：在撤回成功、过期或本地/服务端状态不一致时，将 outbound 恢复为可重新送审的 not_sent 形态。
 * 更新触发：outbound 字段结构、撤回后重发语义或 portfolio 归一化规则变化时，需要同步更新本文件。
 */

import type { Module4Lesson4State } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

/** 生成空的 not_sent 出站状态，不含 requestId，允许立即再次 POST create。 */
export function createResetLesson4Outbound(): Module4Lesson4State["outbound"] {
  return {
    status: "not_sent",
    requestId: "",
    targetReviewerSeatCode: "",
    inviteCode: "",
    sentAt: "",
    pendingExpiresAt: "",
    reviewExpiresAt: "",
    receivedReviewJson: undefined,
    completed: false,
  }
}
