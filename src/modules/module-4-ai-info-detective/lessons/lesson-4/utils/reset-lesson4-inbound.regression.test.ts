/**
 * 文件说明：课时 4 入站重置工具回归测试。
 * 职责：保证陈旧本地 submitted 对齐时全量清空 inbound 字段，避免 IndexedDB 残留 gate 进度。
 * 更新触发：createResetLesson4Inbound 字段或 stale 重置语义变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createResetLesson4Inbound } from "./reset-lesson4-inbound"
import { isLesson4ReviewerSubmissionConfirmed } from "./lesson4-sync-status"

describe("createResetLesson4Inbound", () => {
  it("应回到 idle 并清空提交快照与 completed", () => {
    const reset = createResetLesson4Inbound()
    expect(reset.status).toBe("idle")
    expect(reset.requestId).toBe("")
    expect(reset.submittedReviewJson).toBeUndefined()
    expect(reset.completed).toBe(false)
    expect(reset.claimedRequestJson).toBeUndefined()
    expect(reset.reviewDraftJson).toBeUndefined()
  })
})

describe("isLesson4ReviewerSubmissionConfirmed", () => {
  it("submitted 与 pulled 视为审查者已提交", () => {
    expect(isLesson4ReviewerSubmissionConfirmed("submitted")).toBe(true)
    expect(isLesson4ReviewerSubmissionConfirmed("pulled")).toBe(true)
    expect(isLesson4ReviewerSubmissionConfirmed("claimed")).toBe(false)
  })
})
