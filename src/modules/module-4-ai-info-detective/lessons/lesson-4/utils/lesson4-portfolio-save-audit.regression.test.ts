/**
 * 文件说明：模块 4 课时 4 进度落盘完整性回归测试。
 * 职责：断言 Step4 保存入库包经 normalizeModule4Portfolio 往返后，关键字段不丢失；全通过题卡 revision.summary 允许空字符串。
 * 更新触发：Module4Lesson4State 字段、Step4 保存载荷或 normalize 规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  createNewModule4Portfolio,
  normalizeModule4Portfolio,
  type Lesson4FeedbackDecision,
  type Module4Lesson4ReviewJson,
  type Module4Lesson4V2CardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { buildLesson4ReadyPackage } from "./build-lesson4-ready-package"
import { buildLesson4StageSnapshot } from "./build-lesson4-stage-snapshot"
import { evaluateLesson4QuickCheck } from "./evaluate-lesson4-quick-check"

function buildReadyCard(kind: "news" | "image", summary = ""): Module4Lesson4V2CardDraft {
  return {
    id: `lesson4-${kind}-v2`,
    kind,
    version: "v2",
    status: "confirmed",
    baseV1CardId: `v1-${kind}`,
    baseV1UpdatedAt: "2026-05-30T08:00:00.000Z",
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
    source: { sourceRecord: "来源", verificationNote: "" },
    revision: {
      summary,
      decisionIdsResolved: summary ? ["d1"] : [],
      confirmedAt: "2026-05-30T09:00:00.000Z",
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
        overallComment: "整体不错",
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

function buildDecision(): Lesson4FeedbackDecision {
  return {
    id: "d1",
    cardKind: "news",
    area: "task",
    level: "major_fix",
    reviewerReason: "任务表述不清",
    action: "must_revise",
    authorPlan: "已调整题干",
    resolved: true,
    resolvedAt: "2026-05-30T08:30:00.000Z",
  }
}

/** 模拟 Step4 saveReadyPackage 写入的 portfolio 载荷（audit 锚点）。 */
function buildStep4SavePayload(allPass: boolean) {
  const base = createNewModule4Portfolio({ studentName: "测试", clazz: "初一（1）班", classSeatCode: "0101" })
  const now = "2026-05-30T10:00:00.000Z"
  const decisions = allPass ? [] : [buildDecision()]
  const newsCard = buildReadyCard("news", allPass ? "" : "已根据反馈调整新闻题卡")
  const imageCard = buildReadyCard("image", "")
  const receivedReviewJson = buildReviewJson()
  const readiness = {
    newsReady: true,
    imageReady: true,
    readyForLesson5: true,
    checkedAt: now,
    exportedPackageJson: undefined as unknown,
  }
  const readyPackage = buildLesson4ReadyPackage({
    createdAt: now,
    student: base.student,
    newsCard,
    imageCard,
    receivedReviewPresent: Boolean(receivedReviewJson),
    feedbackDecisions: decisions,
    readiness,
  })
  const nextLesson4 = {
    ...base.lesson4,
    outbound: {
      ...base.lesson4.outbound,
      receivedReviewJson,
      completed: true,
    },
    inbound: { ...base.lesson4.inbound, completed: true },
    gatePassed: true,
    step1Completed: true,
    step2Completed: true,
    step3Completed: true,
    step4Completed: true,
    feedbackInbox: {
      digestedAt: now,
      decisions,
      allFeedbackReviewed: true,
    },
    v2: {
      newsCard,
      imageCard,
      newsConfirmed: true,
      imageConfirmed: true,
      confirmedAt: now,
    },
    readiness: { ...readiness, exportedPackageJson: readyPackage },
    completed: true,
    completedAt: now,
  }
  const quickCheck = evaluateLesson4QuickCheck(nextLesson4, now)
  return {
    ...base,
    progress: { lessonId: 4, stepId: 4 },
    lesson4: {
      ...nextLesson4,
      quickCheck,
      stageSnapshot: buildLesson4StageSnapshot({ ...nextLesson4, quickCheck }, now, quickCheck),
    },
  }
}

describe("lesson4 Step4 进度落盘 audit", () => {
  it("有修改路径：关键字段 normalize 往返不丢失", () => {
    const saved = normalizeModule4Portfolio(buildStep4SavePayload(false))
    const l4 = saved.lesson4

    expect(l4.step2Completed).toBe(true)
    expect(l4.step3Completed).toBe(true)
    expect(l4.v2.newsConfirmed).toBe(true)
    expect(l4.v2.imageConfirmed).toBe(true)
    expect(l4.v2.newsCard.revision.summary).toBe("已根据反馈调整新闻题卡")
    expect(l4.v2.newsCard.revision.decisionIdsResolved).toEqual(["d1"])
    expect(l4.feedbackInbox.decisions[0]?.authorPlan).toBe("已调整题干")
    expect(l4.outbound.receivedReviewJson?.cards.news.overallComment).toBe("整体不错")
    expect(l4.readiness.readyForLesson5).toBe(true)
    expect(l4.quickCheck.totalScore).toBeGreaterThanOrEqual(75)
    expect(l4.stageSnapshot?.stepsCompleted.step4).toBe(true)
    expect(l4.stageSnapshot?.quickCheck.totalScore).toBe(l4.quickCheck.totalScore)
    expect(l4.readiness.exportedPackageJson).toBeTruthy()
  })

  it("全通过题卡：revision.summary 空字符串自洽，evaluate 不要求修改说明", () => {
    const saved = normalizeModule4Portfolio(buildStep4SavePayload(true))
    const l4 = saved.lesson4

    expect(l4.v2.newsCard.revision.summary).toBe("")
    expect(l4.v2.imageCard.revision.summary).toBe("")
    expect(l4.feedbackInbox.decisions).toEqual([])
    expect(l4.stageSnapshot?.readyForLesson5EvaluationStatus).toBe("green")
    expect(l4.quickCheck.T3.evidence.noRevisionNeeded).toBe(true)
  })
})
