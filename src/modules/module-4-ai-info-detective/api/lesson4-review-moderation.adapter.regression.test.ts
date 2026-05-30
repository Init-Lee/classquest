/**
 * 文件说明：模块 4 课时 4 互审文字 AI 审核 adapter 回归测试。
 * 职责：验证 HTTP 模式下必须成功 moderate-text 才能通过，后端不可用时不得 approved。
 * 更新触发：moderate-text adapter 行为、环境变量开关或 offline/unavailable 映射变化时，需要同步更新本文件。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  createEmptyModule4Lesson4ReviewJson,
  type Module4Lesson4ReviewJson,
  type Module4MaterialKind,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { buildReviewFieldKey } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/collect-lesson4-review-texts"
import {
  isLesson4ReviewModerationHttpEnabled,
  moderateLesson4ReviewCard,
} from "./lesson4-review-moderation.adapter"

const SAMPLE_OVERALL = "整体完整性很高，不需要大改，请你修改来源即可。"

function buildValidReviewJson(
  kind: Module4MaterialKind,
  overallComment: string = SAMPLE_OVERALL,
): Module4Lesson4ReviewJson {
  const base = createEmptyModule4Lesson4ReviewJson()
  base.cards[kind].trialAnswer = "A"
  for (const area of Object.keys(base.cards[kind].rubric) as Array<keyof typeof base.cards.news.rubric>) {
    base.cards[kind].rubric[area] = { level: "pass", reason: "表述清楚，符合课堂互审要求。" }
  }
  base.cards[kind].overallComment = overallComment
  base.cards[kind].contentViolation = false
  return base
}

describe("lesson4 review moderation adapter", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_MODULE4_LESSON4_PEER_REVIEW_MODE", "http")
    vi.stubEnv("VITE_MODULE4_LESSON4_REVIEW_MODERATION_MODE", "")
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("peer review http 时应启用 moderation http", () => {
    expect(isLesson4ReviewModerationHttpEnabled()).toBe(true)
  })

  it("moderation=local 且 peer 非 http 时允许纯本地", () => {
    vi.stubEnv("VITE_MODULE4_LESSON4_PEER_REVIEW_MODE", "")
    vi.stubEnv("VITE_MODULE4_LESSON4_REVIEW_MODERATION_MODE", "local")
    expect(isLesson4ReviewModerationHttpEnabled()).toBe(false)
  })

  it("moderation=local 但 peer http 时仍须走后端", () => {
    vi.stubEnv("VITE_MODULE4_LESSON4_REVIEW_MODERATION_MODE", "local")
    expect(isLesson4ReviewModerationHttpEnabled()).toBe(true)
  })

  it("HTTP 模式下后端不可达时必须 offline 且不通过", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"))
    const reviewJson = buildValidReviewJson("news")
    const result = await moderateLesson4ReviewCard(reviewJson, "news")
    expect(result.pass).toBe(false)
    expect(result.offline).toBe(true)
    expect(result.unavailable).toBe(true)
    expect(result.byField).toEqual({})
  })

  it("HTTP 模式下 502 必须 offline 且不通过", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("Bad Gateway", { status: 502 }))
    const reviewJson = buildValidReviewJson("news")
    const result = await moderateLesson4ReviewCard(reviewJson, "news")
    expect(result.pass).toBe(false)
    expect(result.offline).toBe(true)
    expect(result.unavailable).toBe(true)
  })

  it("HTTP 模式下 moderate-text 200 且 pass=true 才可通过", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      pass: true,
      byField: {
        [buildReviewFieldKey("news", "material.reason")]: { pass: true, reasons: [] },
      },
    }), { status: 200, headers: { "Content-Type": "application/json" } }))
    const reviewJson = buildValidReviewJson("news")
    const result = await moderateLesson4ReviewCard(reviewJson, "news")
    expect(result.pass).toBe(true)
    expect(result.unavailable).toBeUndefined()
  })

  it("HTTP 模式下 moderate-text pass=false 应返回字段原因", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      pass: false,
      byField: {
        [buildReviewFieldKey("news", "task.reason")]: {
          pass: false,
          reasons: ["评语无实质内容，请补充具体理由。"],
        },
      },
    }), { status: 200, headers: { "Content-Type": "application/json" } }))
    const reviewJson = buildValidReviewJson("news")
    const result = await moderateLesson4ReviewCard(reviewJson, "news")
    expect(result.pass).toBe(false)
    expect(result.byField[buildReviewFieldKey("news", "task.reason")]?.pass).toBe(false)
  })

  it("纯本地模式不发起 fetch 且本地规则通过即可", async () => {
    vi.stubEnv("VITE_MODULE4_LESSON4_PEER_REVIEW_MODE", "")
    vi.stubEnv("VITE_MODULE4_LESSON4_REVIEW_MODERATION_MODE", "local")
    const reviewJson = buildValidReviewJson("news")
    const result = await moderateLesson4ReviewCard(reviewJson, "news")
    expect(result.pass).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })
})
