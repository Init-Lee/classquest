/**
 * 文件说明：模块 4 课时 4 V2 修改台分段 Tab 三态判定单元测试。
 * 职责：验证 getSectionStatus 对必改、采纳、部分采纳与无反馈分区的标签判定。
 * 更新触发：Step3 wizard 分段状态规则或 isSectionRevisionDecision 语义变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import type {
  Lesson4FeedbackDecision,
  Module4Lesson4V2CardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import {
  areAllCardSectionsPass,
  getSectionStatus,
  getSectionStatusLabel,
  isSectionRevisionDecision,
} from "./get-lesson4-v2-revision-sections"

function buildCard(overrides: Partial<Module4Lesson4V2CardDraft["revision"]> = {}): Module4Lesson4V2CardDraft {
  return {
    id: "card-news",
    kind: "news",
    version: "v2",
    status: "draft",
    baseV1CardId: "v1-news",
    baseV1UpdatedAt: "",
    material: { titleOrName: "", displayNote: "", asset: null },
    task: {
      prompt: "",
      options: [],
      correctOptionKey: null,
    },
    explanation: { text: "", editCount: 0, updatedAt: "" },
    source: { sourceRecord: "", verificationNote: "" },
    revision: {
      summary: "",
      decisionIdsResolved: [],
      confirmedAt: "",
      ...overrides,
    },
    createdAt: "",
    updatedAt: "",
  }
}

function buildDecision(
  patch: Partial<Lesson4FeedbackDecision> & Pick<Lesson4FeedbackDecision, "id" | "area" | "action">,
): Lesson4FeedbackDecision {
  return {
    cardKind: "news",
    level: patch.level ?? "minor_fix",
    reviewerReason: "同伴建议",
    authorPlan: "",
    resolved: false,
    resolvedAt: "",
    ...patch,
  }
}

describe("getSectionStatus", () => {
  it("无跟进项时显示通过", () => {
    expect(getSectionStatus([], buildCard(), "news", "material")).toBe("pass")
    expect(getSectionStatusLabel("pass")).toBe("通过")
  })

  it("暂不修改（keep_with_reason）不计为修改项，分区仍显示通过", () => {
    const decisions = [
      buildDecision({ id: "d1", area: "task", action: "keep_with_reason", authorPlan: "当前表述已足够清楚" }),
    ]
    expect(isSectionRevisionDecision(decisions[0])).toBe(false)
    expect(getSectionStatus(decisions, buildCard(), "news", "task")).toBe("pass")
  })

  it("未解决必改项显示待改", () => {
    const decisions = [
      buildDecision({ id: "d1", area: "source", action: "must_revise", level: "major_fix" }),
    ]
    expect(getSectionStatus(decisions, buildCard(), "news", "source")).toBe("pending")
    expect(getSectionStatusLabel("pending")).toBe("待改")
  })

  it("已标记完成的必改项显示已修改", () => {
    const decisions = [
      buildDecision({
        id: "d1",
        area: "source",
        action: "must_revise",
        level: "major_fix",
        resolved: true,
        authorPlan: "已补充出处链接",
      }),
    ]
    const card = buildCard({ decisionIdsResolved: ["d1"] })
    expect(getSectionStatus(decisions, card, "news", "source")).toBe("modified")
    expect(getSectionStatusLabel("modified")).toBe("已修改")
  })

  it("Step2 部分采纳未标记完成时显示待改，不得显示通过", () => {
    const decisions = [
      buildDecision({ id: "d1", area: "explanation", action: "partial_accept", authorPlan: "会参考部分建议" }),
    ]
    expect(getSectionStatus(decisions, buildCard(), "news", "explanation")).toBe("pending")
  })

  it("Step2 采纳修改未标记完成时显示待改", () => {
    const decisions = [
      buildDecision({ id: "d1", area: "material", action: "accept" }),
    ]
    expect(getSectionStatus(decisions, buildCard(), "news", "material")).toBe("pending")
  })

  it("Step2 采纳/部分采纳标记完成后显示已修改", () => {
    const decisions = [
      buildDecision({
        id: "d1",
        area: "material",
        action: "accept",
        resolved: true,
        authorPlan: "已按建议调整素材说明",
      }),
    ]
    const card = buildCard({ decisionIdsResolved: ["d1"] })
    expect(getSectionStatus(decisions, card, "news", "material")).toBe("modified")
  })
})

describe("areAllCardSectionsPass", () => {
  it("四段均为通过时返回 true", () => {
    expect(areAllCardSectionsPass([], buildCard(), "news")).toBe(true)
  })

  it("任一分区非通过时返回 false", () => {
    const decisions = [
      buildDecision({ id: "d1", area: "task", action: "must_revise", level: "major_fix" }),
    ]
    expect(areAllCardSectionsPass(decisions, buildCard(), "news")).toBe(false)
  })
})
