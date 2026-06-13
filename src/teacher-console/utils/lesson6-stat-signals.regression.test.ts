/**
 * 文件说明：课时 6 公共挑战统计信号回归测试。
 * 职责：锁定中性质量信号阈值、context 差异阈值与整体课上/访客聚合口径。
 * 更新触发：Lesson6 统计信号阈值、item-stats 字段或对比卡展示口径变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import type { Lesson6PublicItemStat } from "@/teacher-console/types"
import {
  buildLesson6ContextComparisonSummary,
  getLesson6QualitySignal,
  hasLesson6SignificantContextDifference,
} from "./lesson6-stat-signals"

function buildItem(patch: Partial<Lesson6PublicItemStat>): Lesson6PublicItemStat {
  return {
    itemId: "item-1",
    itemVersionId: "item-1-v3",
    publishStatus: "publishable",
    cardKind: "news",
    itemShortName: "题目 1",
    totalAnswerCount: 0,
    totalCorrectCount: 0,
    totalCorrectRate: 0,
    lesson6ClassAnswerCount: 0,
    lesson6ClassCorrectCount: 0,
    lesson6ClassCorrectRate: 0,
    publicShowcaseAnswerCount: 0,
    publicShowcaseCorrectCount: 0,
    publicShowcaseCorrectRate: 0,
    lastAnsweredAt: null,
    ...patch,
  }
}

describe("lesson6-stat-signals", () => {
  it("按中性样本阈值派生质量信号", () => {
    expect(getLesson6QualitySignal(0).id).toBe("no_answers")
    expect(getLesson6QualitySignal(2).id).toBe("insufficient_sample")
    expect(getLesson6QualitySignal(3).id).toBe("collecting_data")
    expect(getLesson6QualitySignal(10).id).toBe("stable_performance")
  })

  it("仅在两侧样本足量且正确率差异显著时标记 context 差异", () => {
    expect(hasLesson6SignificantContextDifference(buildItem({
      lesson6ClassAnswerCount: 5,
      lesson6ClassCorrectRate: 0.9,
      publicShowcaseAnswerCount: 5,
      publicShowcaseCorrectRate: 0.5,
    }))).toBe(true)

    expect(hasLesson6SignificantContextDifference(buildItem({
      lesson6ClassAnswerCount: 4,
      lesson6ClassCorrectRate: 0.9,
      publicShowcaseAnswerCount: 5,
      publicShowcaseCorrectRate: 0.5,
    }))).toBe(false)

    expect(hasLesson6SignificantContextDifference(buildItem({
      lesson6ClassAnswerCount: 5,
      lesson6ClassCorrectRate: 0.7,
      publicShowcaseAnswerCount: 5,
      publicShowcaseCorrectRate: 0.55,
    }))).toBe(false)
  })

  it("按全量 item-stats 聚合课上与访客正确率", () => {
    const summary = buildLesson6ContextComparisonSummary([
      buildItem({
        itemId: "item-a",
        itemVersionId: "item-a-v3",
        lesson6ClassAnswerCount: 8,
        lesson6ClassCorrectCount: 6,
        lesson6ClassCorrectRate: 0.75,
        publicShowcaseAnswerCount: 6,
        publicShowcaseCorrectCount: 2,
        publicShowcaseCorrectRate: 1 / 3,
      }),
      buildItem({
        itemId: "item-b",
        itemVersionId: "item-b-v3",
        lesson6ClassAnswerCount: 2,
        lesson6ClassCorrectCount: 1,
        lesson6ClassCorrectRate: 0.5,
        publicShowcaseAnswerCount: 0,
        publicShowcaseCorrectCount: 0,
        publicShowcaseCorrectRate: 0,
      }),
    ])

    expect(summary.lesson6ClassAnswerCount).toBe(10)
    expect(summary.lesson6ClassCorrectRate).toBe(0.7)
    expect(summary.publicShowcaseAnswerCount).toBe(6)
    expect(summary.publicShowcaseCorrectRate).toBe(1 / 3)
    expect(summary.highlightedItems).toHaveLength(1)
  })
})
