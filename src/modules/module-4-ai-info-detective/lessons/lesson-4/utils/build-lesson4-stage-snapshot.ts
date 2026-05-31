/**
 * 文件说明：模块 4 课时 4 阶段快照构建工具。
 * 职责：在 Step4 保存入库包时写入 lesson4.stageSnapshot，复用 QuickCheck 结果组装可观察摘要。
 * 更新触发：课时 4 完成字段、QuickCheck 字段、ready_for_lesson5 包结构或快照摘要口径变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson4QuickCheckState,
  Module4Lesson4StageSnapshot,
  Module4Lesson4State,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

function buildRubricObservationSummary(lesson4: Module4Lesson4State): Module4Lesson4StageSnapshot["rubricObservationSummary"] {
  const cards = lesson4.outbound.receivedReviewJson?.cards
  const rubricEntries = cards
    ? [...Object.values(cards.news.rubric), ...Object.values(cards.image.rubric)]
    : []
  const contentViolationCount = cards
    ? [cards.news, cards.image].filter(card => card.contentViolation === true).length
    : 0
  const blockingDecisions = lesson4.feedbackInbox.decisions.filter(
    decision => decision.level === "major_fix" || decision.level === "content_violation",
  )

  return {
    passCount: rubricEntries.filter(entry => entry.level === "pass").length,
    minorFixCount: rubricEntries.filter(entry => entry.level === "minor_fix").length,
    majorFixCount: rubricEntries.filter(entry => entry.level === "major_fix").length,
    contentViolationCount,
    unresolvedBlockingCount: blockingDecisions.filter(decision => !decision.resolved).length,
  }
}

export function buildLesson4StageSnapshot(
  lesson4: Module4Lesson4State,
  snappedAt: string,
  quickCheck: Module4Lesson4QuickCheckState = lesson4.quickCheck,
): Module4Lesson4StageSnapshot {
  const decisions = lesson4.feedbackInbox.decisions

  return {
    version: "lesson4-stage-v1",
    snappedAt,
    stepsCompleted: {
      step1: lesson4.step1Completed,
      step2: lesson4.step2Completed,
      step3: lesson4.step3Completed,
      step4: lesson4.step4Completed,
    },
    gatePassed: lesson4.gatePassed,
    v2: {
      newsConfirmed: lesson4.v2.newsConfirmed,
      imageConfirmed: lesson4.v2.imageConfirmed,
      newsStatus: lesson4.v2.newsCard.status,
      imageStatus: lesson4.v2.imageCard.status,
      newsRevisionSummary: lesson4.v2.newsCard.revision.summary,
      imageRevisionSummary: lesson4.v2.imageCard.revision.summary,
      newsDecisionIdsResolved: [...lesson4.v2.newsCard.revision.decisionIdsResolved],
      imageDecisionIdsResolved: [...lesson4.v2.imageCard.revision.decisionIdsResolved],
    },
    receivedReviewPresent: Boolean(lesson4.outbound.receivedReviewJson),
    quickCheck: {
      totalScore: quickCheck.totalScore,
      level: quickCheck.level,
      evaluatedAt: quickCheck.evaluatedAt,
      targets: {
        T1: { score: quickCheck.T1.score, achieved: quickCheck.T1.achieved },
        T2: { score: quickCheck.T2.score, achieved: quickCheck.T2.achieved },
        T3: { score: quickCheck.T3.score, achieved: quickCheck.T3.achieved },
      },
      blockers: [...quickCheck.blockers],
    },
    rubricObservationSummary: buildRubricObservationSummary(lesson4),
    decisionsSummary: decisions.map(decision => ({
      id: decision.id,
      cardKind: decision.cardKind,
      area: decision.area,
      level: decision.level,
      action: decision.action,
      resolved: decision.resolved,
      authorPlan: decision.authorPlan,
    })),
    readiness: {
      newsReady: lesson4.readiness.newsReady,
      imageReady: lesson4.readiness.imageReady,
      readyForLesson5: lesson4.readiness.readyForLesson5,
      checkedAt: lesson4.readiness.checkedAt,
    },
    readyForLesson5EvaluationStatus: quickCheck.T3.evidence.readyForLesson5Status,
  }
}
