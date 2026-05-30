/**
 * 文件说明：课时 4 审查者侧入站状态重置工具。
 * 职责：在记录不存在、过期或本地与服务端 claimed 不一致时，将 inbound 恢复为可刷新待审的 idle 形态。
 * 更新触发：inbound 字段结构（含 reviewDraftJson）、领取/超时语义或 portfolio 归一化规则变化时，需要同步更新本文件。
 */

import type { Module4Lesson4State } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

/** 生成可刷新待审的 idle 入站状态；清空领取/草稿/已提交快照，与 outbound 全量重置对称。 */
export function createResetLesson4Inbound(): Module4Lesson4State["inbound"] {
  return {
    status: "idle",
    requestId: "",
    authorSeatCode: "",
    reviewExpiresAt: "",
    claimedRequestJson: undefined,
    reviewDraftJson: undefined,
    submittedReviewJson: undefined,
    completed: false,
  }
}
