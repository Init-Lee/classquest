/**
 * 文件说明：模块 4 课时 4 QuickCheck 评分工具。
 * 职责：只依据课时 4 可观察状态计算 T1/T2/T3 分数、达成情况与证据，不渲染 UI、不组装快照、不写入存储。
 * 更新触发：课时 4 QuickCheck 评分口径、T1/T2/T3 阈值、阻塞规则或证据字段变化时，需要同步更新本文件。
 */

import type {
  Lesson4FeedbackDecision,
  Module4Lesson4QuickCheckLevel,
  Module4Lesson4QuickCheckState,
  Module4Lesson4QuickCheckTarget,
  Module4Lesson4State,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON4_QUICK_CHECK_RUBRIC } from "../data/lesson4-rubric"
import { evaluateLesson4ReadyForLesson5 } from "./evaluate-lesson4-ready-for-lesson5"
import { areAllCardSectionsPass } from "./get-lesson4-v2-revision-sections"

function scoreBooleanEvidence(evidence: Record<string, boolean>, maxScore: number): number {
  const entries = Object.values(evidence)
  if (entries.length === 0) return 0
  const passed = entries.filter(Boolean).length
  return Math.round((passed / entries.length) * maxScore)
}

function buildTarget<TEvidence extends Record<string, unknown>>(
  score: number,
  threshold: number,
  evidence: TEvidence,
): Module4Lesson4QuickCheckTarget<TEvidence> {
  return {
    score,
    achieved: score >= threshold,
    evidence,
  }
}

function getBlockingDecisions(decisions: Lesson4FeedbackDecision[]): Lesson4FeedbackDecision[] {
  return decisions.filter(decision => decision.level === "major_fix" || decision.level === "content_violation")
}

function getUnresolvedBlockingDecisions(decisions: Lesson4FeedbackDecision[]): Lesson4FeedbackDecision[] {
  return getBlockingDecisions(decisions).filter(decision => !decision.resolved)
}

function getMinorDecisionsMissingReason(decisions: Lesson4FeedbackDecision[]): Lesson4FeedbackDecision[] {
  return decisions.filter(
    decision => decision.level === "minor_fix"
      && decision.action === "keep_with_reason"
      && decision.authorPlan.trim().length === 0,
  )
}

function getLevel(totalScore: number, allTargetsAchieved: boolean): Module4Lesson4QuickCheckLevel {
  if (totalScore === 100 && allTargetsAchieved) return "excellent"
  if (totalScore >= LESSON4_QUICK_CHECK_RUBRIC.levels.achieved && allTargetsAchieved) return "achieved"
  if (totalScore >= LESSON4_QUICK_CHECK_RUBRIC.levels.basic) return "basic"
  return "not_achieved"
}

export function evaluateLesson4QuickCheck(
  lesson4: Module4Lesson4State,
  evaluatedAt: string,
): Module4Lesson4QuickCheckState {
  const decisions = lesson4.feedbackInbox.decisions
  const readinessEvaluation = evaluateLesson4ReadyForLesson5({
    v2: lesson4.v2,
    decisions,
    step2Completed: lesson4.step2Completed,
    step3Completed: lesson4.step3Completed,
  })
  const unresolvedBlockingDecisions = getUnresolvedBlockingDecisions(decisions)
  const minorDecisionsMissingReason = getMinorDecisionsMissingReason(decisions)
  const allNewsSectionsPass = areAllCardSectionsPass(decisions, lesson4.v2.newsCard, "news")
  const allImageSectionsPass = areAllCardSectionsPass(decisions, lesson4.v2.imageCard, "image")
  const newsSummaryRequired = !allNewsSectionsPass
  const imageSummaryRequired = !allImageSectionsPass

  const t1Evidence = {
    outboundCompleted: lesson4.outbound.completed,
    inboundCompleted: lesson4.inbound.completed,
    gatePassed: lesson4.gatePassed,
    step1Completed: lesson4.step1Completed,
    receivedReviewPresent: Boolean(lesson4.outbound.receivedReviewJson),
  }
  const T1 = buildTarget(
    scoreBooleanEvidence(t1Evidence, LESSON4_QUICK_CHECK_RUBRIC.targets.T1.maxScore),
    LESSON4_QUICK_CHECK_RUBRIC.targets.T1.achievedThreshold,
    t1Evidence,
  )

  const t2Score = !lesson4.step2Completed
    ? 0
    : Math.max(
      0,
      LESSON4_QUICK_CHECK_RUBRIC.targets.T2.maxScore
        - (lesson4.feedbackInbox.allFeedbackReviewed ? 0 : 12)
        - (unresolvedBlockingDecisions.length > 0 ? 12 : 0)
        - (minorDecisionsMissingReason.length > 0 ? 6 : 0),
    )
  const T2 = buildTarget(
    t2Score,
    LESSON4_QUICK_CHECK_RUBRIC.targets.T2.achievedThreshold,
    {
      step2Completed: lesson4.step2Completed,
      allFeedbackReviewed: lesson4.feedbackInbox.allFeedbackReviewed,
      reviewerPassOnly: decisions.length === 0,
      decisionCount: decisions.length,
      minorFixDecisionCount: decisions.filter(decision => decision.level === "minor_fix").length,
      blockingDecisionCount: getBlockingDecisions(decisions).length,
      unresolvedBlockingDecisionIds: unresolvedBlockingDecisions.map(decision => decision.id),
      minorDecisionsMissingReasonIds: minorDecisionsMissingReason.map(decision => decision.id),
    },
  )

  const t3Score = readinessEvaluation.status === "green"
    ? LESSON4_QUICK_CHECK_RUBRIC.targets.T3.maxScore
    : readinessEvaluation.status === "amber" ? 30 : 0
  const T3 = buildTarget(
    t3Score,
    LESSON4_QUICK_CHECK_RUBRIC.targets.T3.achievedThreshold,
    {
      step3Completed: lesson4.step3Completed,
      newsConfirmed: lesson4.v2.newsConfirmed,
      imageConfirmed: lesson4.v2.imageConfirmed,
      readyForLesson5Status: readinessEvaluation.status,
      newsSummaryRequired,
      imageSummaryRequired,
      newsRevisionSummaryReady: !newsSummaryRequired || lesson4.v2.newsCard.revision.summary.trim().length > 0,
      imageRevisionSummaryReady: !imageSummaryRequired || lesson4.v2.imageCard.revision.summary.trim().length > 0,
      allNewsSectionsPass,
      allImageSectionsPass,
      noRevisionNeeded: allNewsSectionsPass && allImageSectionsPass,
      unresolvedBlockingDecisionIds: unresolvedBlockingDecisions.map(decision => decision.id),
    },
  )

  const totalScore = T1.score + T2.score + T3.score
  const blockers = [
    ...(T1.achieved ? [] : ["T1：同伴互审 gate 或反馈接收证据不足"]),
    ...(T2.achieved ? [] : ["T2：反馈消化未达标或仍有必改/安全项未解决"]),
    ...(T3.achieved ? [] : ["T3：V2 双卡确认或就绪检查未通过"]),
    ...unresolvedBlockingDecisions.map(decision => `未解决必改项：${decision.id}`),
  ]

  return {
    T1,
    T2,
    T3,
    totalScore,
    level: getLevel(totalScore, T1.achieved && T2.achieved && T3.achieved),
    evaluatedAt,
    blockers,
  }
}
