/**
 * 文件说明：模块 4 课时 4 互审恢复 adapter 回归测试。
 * 职责：验证 Step1 进页 recovery endpoint 的查询参数与 requestJson 归一化，确保本地丢失 requestId 时可按学生身份恢复。
 * 更新触发：recovery endpoint、adapter 参数、requestJson 契约或 HTTP 模式开关变化时，需要同步更新本文件。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { recoverMyPeerReviewState } from "./lesson4-peer-review.adapter"

describe("lesson4 peer review recovery adapter", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_MODULE4_LESSON4_PEER_REVIEW_MODE", "http")
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("HTTP 模式下按 classId 与当前学生学号查询 recovery", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      serverNow: "2026-06-05T10:00:00+08:00",
      outbound: {
        requestId: "req_author",
        status: "submitted",
        targetReviewerSeatCode: "0102",
        sentAt: "2026-06-05T09:30:00+08:00",
        reviewJson: { cards: {} },
      },
      inbound: {
        requestId: "req_reviewer",
        status: "claimed",
        authorSeatCode: "0103",
        reviewExpiresAt: "2026-06-05T10:20:00+08:00",
        requestJson: { cards: {} },
      },
    }), { status: 200, headers: { "Content-Type": "application/json" } }))

    const result = await recoverMyPeerReviewState({
      classId: "class-01",
      authorSeatCode: "0101",
      reviewerSeatCode: "0101",
    })

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/module4/lesson4/review-requests/recovery?classId=class-01&authorSeatCode=0101&reviewerSeatCode=0101",
      { method: "GET" },
    )
    expect(result.outbound?.requestId).toBe("req_author")
    expect(result.inbound?.requestJson).toBeUndefined()
  })
})
