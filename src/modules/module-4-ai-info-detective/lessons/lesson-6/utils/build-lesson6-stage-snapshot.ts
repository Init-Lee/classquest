/**
 * 文件说明：模块 4 课时 6 阶段快照构建工具。
 * 职责：用白名单字段生成 lesson6-stage-v1 快照与 QuickCheck，供 Step3、继续学习包和 HTML 导出复用。
 * 更新触发：课时 6 完成证据、QuickCheck 口径、快照隐私边界或 portfolio.lesson6 类型变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson6QuickCheckLevel,
  Module4Lesson6QuickCheckTarget,
  Module4Lesson6QuickCheckState,
  Module4Lesson6ReflectionState,
  Module4Lesson6StageSnapshot,
  Module4Lesson6State,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

function buildTarget<TEvidence extends Record<string, unknown>>(
  score: number,
  threshold: number,
  evidence: TEvidence,
): Module4Lesson6QuickCheckTarget<TEvidence> {
  return {
    score,
    achieved: score >= threshold,
    evidence,
  }
}

function getLevel(totalScore: number, allTargetsAchieved: boolean): Module4Lesson6QuickCheckLevel {
  if (totalScore === 100 && allTargetsAchieved) return "excellent"
  if (totalScore >= 75 && allTargetsAchieved) return "achieved"
  if (totalScore >= 60) return "basic"
  return "not_achieved"
}

export function evaluateLesson6QuickCheck(
  lesson6: Module4Lesson6State,
  reflection: Module4Lesson6ReflectionState | undefined,
  evaluatedAt: string,
): Module4Lesson6QuickCheckState {
  const publicationItems = lesson6.publicationStatus?.items ?? []
  const publicChallenge = lesson6.publicChallenge
  const completedReflectionCount = reflection?.principles.filter(item =>
    item.principle.trim() && item.reason.trim() && item.scenario.trim() && item.action.trim()
  ).length ?? 0
  const responsibilityWritten = Boolean(reflection?.responsibilityText.trim())
  const blockers: string[] = []

  if (!lesson6.step1AckAt) blockers.push("尚未确认本人 V3 发布状态。")
  if (!publicChallenge?.completed) blockers.push("尚未完成课时内公共挑战。")
  if (completedReflectionCount < 3) blockers.push("可信复盘需要写满 3 条原则。")
  if (!responsibilityWritten) blockers.push("尚未填写发布责任说明。")

  const T1 = buildTarget(
    lesson6.step1AckAt ? 35 : 0,
    35,
    {
      publicationReviewed: Boolean(lesson6.step1AckAt),
      publicationItemCount: publicationItems.length,
      publishableCount: publicationItems.filter(item => item.status === "publishable").length,
    },
  )
  const T2 = buildTarget(
    publicChallenge?.completed === true ? 30 : 0,
    30,
    {
      context: publicChallenge?.context ?? ("" as const),
      questionCount: publicChallenge?.questionCount ?? 0,
      answeredCount: publicChallenge?.answeredCount ?? 0,
      completedAt: publicChallenge?.completedAt ?? "",
    },
  )
  const T3 = buildTarget(
    completedReflectionCount >= 3 && responsibilityWritten ? 35 : 0,
    35,
    {
      principleCount: completedReflectionCount,
      responsibilityWritten,
    },
  )
  const totalScore = T1.score + T2.score + T3.score

  return {
    evaluatedAt,
    T1,
    T2,
    T3,
    totalScore,
    level: getLevel(totalScore, T1.achieved && T2.achieved && T3.achieved),
    completed: T1.achieved && T2.achieved && T3.achieved,
    blockers,
  }
}

function buildLesson6SnapshotQuickCheck(quickCheck: Module4Lesson6QuickCheckState): Module4Lesson6StageSnapshot["quickCheck"] {
  return {
    totalScore: quickCheck.totalScore,
    level: quickCheck.level,
    evaluatedAt: quickCheck.evaluatedAt,
    targets: {
      T1: { score: quickCheck.T1.score, achieved: quickCheck.T1.achieved },
      T2: { score: quickCheck.T2.score, achieved: quickCheck.T2.achieved },
      T3: { score: quickCheck.T3.score, achieved: quickCheck.T3.achieved },
    },
    blockers: [...quickCheck.blockers],
    evidence: {
      T1: quickCheck.T1.evidence,
      T2: quickCheck.T2.evidence,
      T3: quickCheck.T3.evidence,
    },
  }
}

export function buildLesson6StageSnapshot(
  lesson6: Module4Lesson6State,
  reflection: Module4Lesson6ReflectionState,
  quickCheck: Module4Lesson6QuickCheckState,
  snappedAt: string,
): Module4Lesson6StageSnapshot {
  return {
    version: "lesson6-stage-v1",
    snappedAt,
    publicationStatus: {
      syncedAt: lesson6.publicationStatus?.syncedAt ?? "",
      items: (lesson6.publicationStatus?.items ?? []).map(item => ({
        kind: item.kind,
        status: item.status,
        label: item.label,
        checkedAt: item.checkedAt,
      })),
    },
    publicChallenge: {
      context: "lesson6_class",
      questionCount: lesson6.publicChallenge?.questionCount ?? 0,
      answeredCount: lesson6.publicChallenge?.answeredCount ?? 0,
      completedAt: lesson6.publicChallenge?.completedAt ?? "",
    },
    reflection,
    quickCheck: buildLesson6SnapshotQuickCheck(quickCheck),
    completed: quickCheck.completed,
    completedAt: snappedAt,
  }
}
