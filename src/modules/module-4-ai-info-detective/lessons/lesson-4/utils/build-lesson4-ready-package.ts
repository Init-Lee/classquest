/**
 * 文件说明：模块 4 课时 4 ready_for_lesson5 包构建工具。
 * 职责：把学生信息、两张 V2 题卡和最小就绪摘要组成本地课时五准备包。
 * 更新触发：课时五入参结构、Step4 导出字段或 ready_for_lesson5 包版本变化时，需要同步更新本文件。
 */

import type {
  Lesson4FeedbackDecision,
  Module4Lesson4ReadinessState,
  Module4Lesson4V2CardDraft,
  Module4StudentProfile,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export interface Lesson4ReadyForLesson5Package {
  packageVersion: "lesson4-ready-for-lesson5-v1"
  createdAt: string
  student: Module4StudentProfile
  cards: {
    news: Module4Lesson4V2CardDraft
    image: Module4Lesson4V2CardDraft
  }
  peerReviewSummary: {
    receivedReviewPresent: boolean
    feedbackDecisionCount: number
    unresolvedBlockingCount: number
  }
  readiness: Module4Lesson4ReadinessState
}

export function buildLesson4ReadyPackage({
  createdAt,
  student,
  newsCard,
  imageCard,
  receivedReviewPresent,
  feedbackDecisions,
  readiness,
}: {
  createdAt: string
  student: Module4StudentProfile
  newsCard: Module4Lesson4V2CardDraft
  imageCard: Module4Lesson4V2CardDraft
  receivedReviewPresent: boolean
  feedbackDecisions: Lesson4FeedbackDecision[]
  readiness: Module4Lesson4ReadinessState
}): Lesson4ReadyForLesson5Package {
  const unresolvedBlockingCount = feedbackDecisions.filter(
    decision => (decision.level === "major_fix" || decision.level === "content_violation") && !decision.resolved,
  ).length

  return {
    packageVersion: "lesson4-ready-for-lesson5-v1",
    createdAt,
    student,
    cards: {
      news: newsCard,
      image: imageCard,
    },
    peerReviewSummary: {
      receivedReviewPresent,
      feedbackDecisionCount: feedbackDecisions.length,
      unresolvedBlockingCount,
    },
    readiness,
  }
}

