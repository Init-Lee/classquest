/**
 * 文件说明：模块 4 课时 4 QuickCheck 评分回归测试。
 * 职责：锁定 T1/T2/T3 分值、阻塞规则、全通过免 summary 与小修/重改路径的达成口径。
 * 更新触发：QuickCheck 分值阈值、反馈决策动作、V2 就绪规则或 evidence 字段变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  createNewModule4Portfolio,
  type Lesson4FeedbackDecision,
  type Module4Lesson4ReviewJson,
  type Module4Lesson4State,
  type Module4Lesson4V2CardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { evaluateLesson4QuickCheck } from "./evaluate-lesson4-quick-check"

const EVALUATED_AT = "2026-05-31T04:00:00.000Z"

function buildReadyCard(kind: "news" | "image", summary = "", resolvedIds: string[] = []): Module4Lesson4V2CardDraft {
  return {
    id: `lesson4-${kind}-v2`,
    kind,
    version: "v2",
    status: "confirmed",
    baseV1CardId: `lesson3-${kind}-v1`,
    baseV1UpdatedAt: "",
    material: { titleOrName: "标题", displayNote: "说明", assetFingerprint: "" },
    task: {
      prompt: "判断任务",
      options: [
        { key: "A", label: "A", rationale: "" },
        { key: "B", label: "B", rationale: "" },
      ],
      correctOptionKey: "A",
    },
    explanation: { text: "解析", editCount: 0, updatedAt: "" },
    source: { sourceRecord: "来源", verificationNote: "核验说明" },
    revision: {
      summary,
      decisionIdsResolved: resolvedIds,
      confirmedAt: EVALUATED_AT,
    },
    createdAt: "",
    updatedAt: "",
  }
}

function buildReviewJson(): Module4Lesson4ReviewJson {
  return {
    cards: {
      news: {
        rubric: {
          material: { level: "pass", reason: "ok" },
          task: { level: "pass", reason: "ok" },
          explanation: { level: "pass", reason: "ok" },
          source: { level: "pass", reason: "ok" },
        },
        overallComment: "",
        contentViolation: false,
        contentViolationNote: "",
      },
      image: {
        rubric: {
          material: { level: "pass", reason: "ok" },
          task: { level: "pass", reason: "ok" },
          explanation: { level: "pass", reason: "ok" },
          source: { level: "pass", reason: "ok" },
        },
        overallComment: "",
        contentViolation: false,
        contentViolationNote: "",
      },
    },
  }
}

function buildDecision(
  patch: Partial<Lesson4FeedbackDecision> & Pick<Lesson4FeedbackDecision, "id" | "cardKind" | "area" | "level" | "action">,
): Lesson4FeedbackDecision {
  return {
    reviewerReason: "同伴建议",
    authorPlan: "",
    resolved: false,
    resolvedAt: "",
    ...patch,
  }
}

function buildLesson4({
  decisions = [],
  newsCard = buildReadyCard("news"),
  imageCard = buildReadyCard("image"),
}: {
  decisions?: Lesson4FeedbackDecision[]
  newsCard?: Module4Lesson4V2CardDraft
  imageCard?: Module4Lesson4V2CardDraft
} = {}): Module4Lesson4State {
  const base = createNewModule4Portfolio().lesson4
  return {
    ...base,
    outbound: {
      ...base.outbound,
      completed: true,
      receivedReviewJson: buildReviewJson(),
    },
    inbound: {
      ...base.inbound,
      completed: true,
    },
    gatePassed: true,
    step1Completed: true,
    step2Completed: true,
    step3Completed: true,
    feedbackInbox: {
      digestedAt: EVALUATED_AT,
      decisions,
      allFeedbackReviewed: true,
    },
    v2: {
      newsCard,
      imageCard,
      newsConfirmed: true,
      imageConfirmed: true,
      confirmedAt: EVALUATED_AT,
    },
  }
}

describe("evaluateLesson4QuickCheck", () => {
  it("全通过题卡：T1/T2/T3 满分，summary 可为空", () => {
    const quickCheck = evaluateLesson4QuickCheck(buildLesson4(), EVALUATED_AT)

    expect(quickCheck.T1.score).toBe(35)
    expect(quickCheck.T2.score).toBe(30)
    expect(quickCheck.T3.score).toBe(35)
    expect(quickCheck.totalScore).toBe(100)
    expect(quickCheck.level).toBe("excellent")
    expect(quickCheck.T2.evidence.reviewerPassOnly).toBe(true)
    expect(quickCheck.T3.evidence.noRevisionNeeded).toBe(true)
    expect(quickCheck.T3.evidence.newsRevisionSummaryReady).toBe(true)
    expect(quickCheck.blockers).toEqual([])
  })

  it("minor_fix 保留且有理由：不阻塞 T2/T3，等级为 achieved", () => {
    const quickCheck = evaluateLesson4QuickCheck(
      buildLesson4({
        decisions: [
          buildDecision({
            id: "d-minor",
            cardKind: "image",
            area: "explanation",
            level: "minor_fix",
            action: "keep_with_reason",
            authorPlan: "解析已经能支持判断，保留原表述。",
          }),
        ],
      }),
      EVALUATED_AT,
    )

    expect(quickCheck.T2.achieved).toBe(true)
    expect(quickCheck.T3.achieved).toBe(true)
    expect(quickCheck.T3.score).toBe(30)
    expect(quickCheck.level).toBe("achieved")
  })

  it("major_fix 未解决：阻塞 T2/T3 并记录 blocker", () => {
    const quickCheck = evaluateLesson4QuickCheck(
      buildLesson4({
        decisions: [
          buildDecision({
            id: "d-major",
            cardKind: "news",
            area: "task",
            level: "major_fix",
            action: "must_revise",
          }),
        ],
      }),
      EVALUATED_AT,
    )

    expect(quickCheck.T2.achieved).toBe(false)
    expect(quickCheck.T3.achieved).toBe(false)
    expect(quickCheck.T2.evidence.unresolvedBlockingDecisionIds).toEqual(["d-major"])
    expect(quickCheck.blockers).toContain("未解决必改项：d-major")
  })

  it("major_fix 已解决且填写 summary：T2/T3 恢复达成", () => {
    const quickCheck = evaluateLesson4QuickCheck(
      buildLesson4({
        newsCard: buildReadyCard("news", "已按反馈调整题干", ["d-major"]),
        decisions: [
          buildDecision({
            id: "d-major",
            cardKind: "news",
            area: "task",
            level: "major_fix",
            action: "must_revise",
            authorPlan: "已调整题干",
            resolved: true,
            resolvedAt: EVALUATED_AT,
          }),
        ],
      }),
      EVALUATED_AT,
    )

    expect(quickCheck.T2.achieved).toBe(true)
    expect(quickCheck.T3.achieved).toBe(true)
    expect(quickCheck.T3.evidence.newsSummaryRequired).toBe(true)
    expect(quickCheck.T3.evidence.newsRevisionSummaryReady).toBe(true)
  })

  it("全通过题卡 summary not needed：T3 evidence 标记 ready/无需修改", () => {
    const quickCheck = evaluateLesson4QuickCheck(buildLesson4(), EVALUATED_AT)

    expect(quickCheck.T3.evidence.newsSummaryRequired).toBe(false)
    expect(quickCheck.T3.evidence.imageSummaryRequired).toBe(false)
    expect(quickCheck.T3.evidence.allNewsSectionsPass).toBe(true)
    expect(quickCheck.T3.evidence.allImageSectionsPass).toBe(true)
    expect(quickCheck.T3.evidence.readyForLesson5Status).toBe("green")
  })
})
