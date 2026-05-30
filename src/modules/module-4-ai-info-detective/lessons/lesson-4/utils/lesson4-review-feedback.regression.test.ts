/**
 * 文件说明：模块 4 课时 4 互审总体建议校验与本地审核最小回归测试。
 * 职责：确保中文总体建议 trim 后非空时，表单校验与本地规则审核均通过。
 * 更新触发：overallComment 校验路径、有效字数统计或本地审核规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  createEmptyModule4Lesson4ReviewJson,
  type Module4Lesson4ReviewJson,
  type Module4MaterialKind,
} from "../../../domains/portfolio/types"
import { buildReviewFieldKey } from "./collect-lesson4-review-texts"
import { countMeaningfulReviewChars } from "./count-meaningful-review-chars"
import { collectLesson4ReviewCardModerationTexts } from "./collect-lesson4-review-texts"
import {
  moderateLesson4ReviewFieldsLocally,
  sanitizeLesson4RemoteModerationReasons,
} from "./lesson4-review-moderation-local"
import { validateLesson4ReviewCardFeedback } from "./validate-lesson4-review-feedback"

const SAMPLE_OVERALL = "整体完整性很高，不需要大改，请你修改来源即可。"

function buildValidReviewJson(
  kind: Module4MaterialKind,
  overallComment: string,
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

describe("lesson4 overallComment regression", () => {
  it("中文总体建议应计入有效字数", () => {
    expect(countMeaningfulReviewChars(SAMPLE_OVERALL)).toBeGreaterThan(0)
  })

  it("trim 后非空的总体建议应通过表单校验", () => {
    const reviewJson = buildValidReviewJson("news", SAMPLE_OVERALL)
    const result = validateLesson4ReviewCardFeedback(reviewJson, "news")
    expect(result.valid).toBe(true)
    expect(result.fieldErrors[buildReviewFieldKey("news", "overallComment")]).toBeUndefined()
  })

  it("量纲原因「请作者补充出处」类互审句应通过本地规则", () => {
    const sample = "【来源·小修】来源表述不是很清楚，可以罗列对应的网页出处"
    const moderation = moderateLesson4ReviewFieldsLocally([
      {
        fieldKey: buildReviewFieldKey("news", "source.reason"),
        card: "news",
        label: "来源",
        content: sample,
      },
    ])
    const result = moderation.byField[buildReviewFieldKey("news", "source.reason")]
    expect(result?.pass).toBe(true)
  })

  it("应过滤 AI 复述用户评语的误判理由", () => {
    const content = "【来源·小修】来源表述不是很清楚，可以罗列对应的网页出处"
    const sanitized = sanitizeLesson4RemoteModerationReasons(
      content,
      false,
      ["来源表述不是很清楚，建议补充具体网页出处"],
      [],
    )
    expect(sanitized.pass).toBe(true)
    expect(sanitized.reasons).toHaveLength(0)
  })

  it("灌水与不文明词应不通过本地规则", () => {
    expect(
      moderateLesson4ReviewFieldsLocally([
        {
          fieldKey: buildReviewFieldKey("news", "material.reason"),
          card: "news",
          label: "素材",
          content: "aaaaaa",
        },
      ]).pass,
    ).toBe(false)
    expect(
      moderateLesson4ReviewFieldsLocally([
        {
          fieldKey: buildReviewFieldKey("news", "material.reason"),
          card: "news",
          label: "素材",
          content: "傻逼",
        },
      ]).pass,
    ).toBe(false)
  })

  it("【任务·通过】下次下次下次 应被本地规则拦截", () => {
    const fieldKey = buildReviewFieldKey("news", "task.reason")
    const moderation = moderateLesson4ReviewFieldsLocally([
      {
        fieldKey,
        card: "news",
        label: "任务",
        content: "【任务·通过】下次下次下次",
      },
    ])
    const result = moderation.byField[fieldKey]
    expect(result?.pass).toBe(false)
    expect(result?.reasons.some(reason => reason.includes("实质"))).toBe(true)
  })

  it("正常互审句「来源不清楚，请罗列网页出处」仍应通过", () => {
    const fieldKey = buildReviewFieldKey("news", "source.reason")
    const moderation = moderateLesson4ReviewFieldsLocally([
      {
        fieldKey,
        card: "news",
        label: "来源",
        content: "【来源·小修】来源不清楚，请罗列网页出处",
      },
    ])
    expect(moderation.byField[fieldKey]?.pass).toBe(true)
  })

  it("trim 后非空的总体建议应通过本地规则审核", () => {
    const reviewJson = buildValidReviewJson("news", SAMPLE_OVERALL)
    const texts = collectLesson4ReviewCardModerationTexts(reviewJson, "news")
    const overallItem = texts.find(item => item.fieldKey === buildReviewFieldKey("news", "overallComment"))
    expect(overallItem?.content).toBe(SAMPLE_OVERALL)

    const moderation = moderateLesson4ReviewFieldsLocally(texts)
    const overallResult = moderation.byField[buildReviewFieldKey("news", "overallComment")]
    expect(overallResult?.pass).toBe(true)
    expect(overallResult?.reasons).not.toContain("请填写总体建议。")
  })

  it("图片题卡应采集与新闻对称的待审核文字", () => {
    const reviewJson = buildValidReviewJson("image", "图片清晰度不错，来源说明可再具体。")
    const texts = collectLesson4ReviewCardModerationTexts(reviewJson, "image")
    expect(texts.length).toBeGreaterThanOrEqual(5)
    expect(texts.every(item => item.card === "image" && item.fieldKey.startsWith("image."))).toBe(true)
    expect(texts.some(item => item.fieldKey === buildReviewFieldKey("image", "overallComment"))).toBe(true)
    expect(moderateLesson4ReviewFieldsLocally(texts).pass).toBe(true)
  })
})
