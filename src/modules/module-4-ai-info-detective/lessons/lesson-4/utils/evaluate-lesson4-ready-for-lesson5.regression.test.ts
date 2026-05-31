/**
 * 文件说明：模块 4 课时 4 Step4 V2 就绪评估单元测试。
 * 职责：锁定全通过/有修改题卡的分组清单逻辑，与 Step3 areAllCardSectionsPass 联动一致。
 * 更新触发：evaluate-lesson4-ready-for-lesson5.ts 阻塞项、分组或 areAllCardSectionsPass 联动规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import type {
  Lesson4FeedbackDecision,
  Module4Lesson4V2CardDraft,
  Module4Lesson4V2State,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { evaluateLesson4ReadyForLesson5 } from "./evaluate-lesson4-ready-for-lesson5"

function buildReadyCard(kind: "news" | "image"): Module4Lesson4V2CardDraft {
  return {
    id: `card-${kind}`,
    kind,
    version: "v2",
    status: "confirmed",
    baseV1CardId: `v1-${kind}`,
    baseV1UpdatedAt: "",
    material: { titleOrName: "标题", displayNote: "说明", asset: null },
    task: {
      prompt: "判断任务",
      options: [
        { key: "a", label: "选项 A" },
        { key: "b", label: "选项 B" },
      ],
      correctOptionKey: "a",
    },
    explanation: { text: "解析", editCount: 0, updatedAt: "" },
    source: { sourceRecord: "来源", verificationNote: "" },
    revision: {
      summary: "",
      decisionIdsResolved: [],
      confirmedAt: "",
    },
    createdAt: "",
    updatedAt: "",
  }
}

function buildV2(overrides: Partial<Module4Lesson4V2State> = {}): Module4Lesson4V2State {
  return {
    newsCard: buildReadyCard("news"),
    imageCard: buildReadyCard("image"),
    newsConfirmed: true,
    imageConfirmed: true,
    confirmedAt: "",
    ...overrides,
  }
}

function buildDecision(
  patch: Partial<Lesson4FeedbackDecision> & Pick<Lesson4FeedbackDecision, "id" | "cardKind" | "area" | "action">,
): Lesson4FeedbackDecision {
  return {
    level: patch.level ?? "minor_fix",
    reviewerReason: "同伴建议",
    authorPlan: "",
    resolved: false,
    resolvedAt: "",
    ...patch,
  }
}

function getSectionTitles(
  evaluation: ReturnType<typeof evaluateLesson4ReadyForLesson5>,
  kind: "news" | "image",
) {
  return evaluation.cards[kind].checkSections.map(section => section.title)
}

function getCheck(
  evaluation: ReturnType<typeof evaluateLesson4ReadyForLesson5>,
  kind: "news" | "image",
  label: string,
) {
  return evaluation.cards[kind].checks.find(check => check.label === label)
}

describe("evaluateLesson4ReadyForLesson5 — 全通过题卡", () => {
  it("四段均为通过时仅展示「原本即 OK」分组，不含修改路径项", () => {
    const evaluation = evaluateLesson4ReadyForLesson5({
      v2: buildV2(),
      decisions: [],
      step2Completed: true,
      step3Completed: true,
    })

    expect(getSectionTitles(evaluation, "image")).toEqual(["原本即 OK"])
    expect(getCheck(evaluation, "image", "四段互审均为通过")?.detail).toBe("四段均为通过，无需修改")
    expect(getCheck(evaluation, "image", "修改说明完整")).toBeUndefined()
    expect(getCheck(evaluation, "image", "重改/安全反馈已解决")).toBeUndefined()
    expect(getCheck(evaluation, "image", "小修保留理由已记录")).toBeUndefined()
    expect(evaluation.cards.image.status).toBe("green")
  })

  it("新闻题卡全通过时分组与图片题卡一致", () => {
    const evaluation = evaluateLesson4ReadyForLesson5({
      v2: buildV2(),
      decisions: [],
      step2Completed: true,
      step3Completed: true,
    })

    expect(getSectionTitles(evaluation, "news")).toEqual(["原本即 OK"])
    expect(getCheck(evaluation, "news", "互审无必改或安全项")?.detail).toBe("互审未提出必改或安全反馈")
  })
})

describe("evaluateLesson4ReadyForLesson5 — 有修改题卡", () => {
  it("任一分区非通过且无修改说明时，「修改与确认」分组阻塞", () => {
    const evaluation = evaluateLesson4ReadyForLesson5({
      v2: buildV2(),
      decisions: [
        buildDecision({
          id: "d1",
          cardKind: "image",
          area: "task",
          action: "must_revise",
          level: "major_fix",
        }),
      ],
      step2Completed: true,
      step3Completed: true,
    })

    expect(getSectionTitles(evaluation, "image")).toEqual(["修改与确认", "基础就绪"])
    expect(getCheck(evaluation, "image", "修改说明完整")?.passed).toBe(false)
    expect(getCheck(evaluation, "image", "重改/安全反馈已解决")?.passed).toBe(false)
    expect(evaluation.cards.image.status).toBe("red")
  })

  it("有未通过分区但已填写修改说明时，修改路径项通过", () => {
    const evaluation = evaluateLesson4ReadyForLesson5({
      v2: buildV2({
        imageCard: {
          ...buildReadyCard("image"),
          revision: {
            summary: "已根据同伴反馈调整任务表述",
            decisionIdsResolved: ["d1"],
            confirmedAt: "",
          },
        },
      }),
      decisions: [
        buildDecision({
          id: "d1",
          cardKind: "image",
          area: "task",
          action: "must_revise",
          level: "major_fix",
          resolved: true,
        }),
      ],
      step2Completed: true,
      step3Completed: true,
    })

    expect(getCheck(evaluation, "image", "修改说明完整")?.passed).toBe(true)
    expect(getCheck(evaluation, "image", "重改/安全反馈已解决")?.passed).toBe(true)
    expect(getSectionTitles(evaluation, "image")).toEqual(["修改与确认", "基础就绪"])
  })
})

describe("evaluateLesson4ReadyForLesson5 — 全通过但保留小修", () => {
  it("四段通过且有小修保留时，「修改与确认」仅含小修理由项", () => {
    const evaluation = evaluateLesson4ReadyForLesson5({
      v2: buildV2(),
      decisions: [
        buildDecision({
          id: "d-minor",
          cardKind: "image",
          area: "explanation",
          action: "keep_with_reason",
          level: "minor_fix",
          authorPlan: "解析已足够清晰",
        }),
      ],
      step2Completed: true,
      step3Completed: true,
    })

    expect(getSectionTitles(evaluation, "image")).toEqual(["修改与确认", "原本即 OK"])
    expect(getCheck(evaluation, "image", "修改说明完整")).toBeUndefined()
    expect(getCheck(evaluation, "image", "小修保留理由已记录")?.passed).toBe(true)
    expect(evaluation.cards.image.status).toBe("amber")
  })
})
