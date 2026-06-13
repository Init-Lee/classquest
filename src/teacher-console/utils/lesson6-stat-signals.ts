/**
 * 文件说明：课时 6 公共挑战统计信号工具。
 * 职责：按公共题库逐题统计派生中性质量信号、context 正确率差异与整体课上/访客对比，供教师端统计表和对比卡共用。
 * 更新触发：Lesson6 item-stats 字段、样本量阈值、context 差异阈值或 doc 07 中统计展示口径变化时，需要同步更新本文件。
 */

import type { Lesson6PublicItemStat } from "@/teacher-console/types"

export type Lesson6QualitySignalId =
  | "no_answers"
  | "insufficient_sample"
  | "collecting_data"
  | "stable_performance"

export interface Lesson6QualitySignal {
  id: Lesson6QualitySignalId
  label: string
  description: string
}

export interface Lesson6QualitySignalThresholds {
  insufficientSampleMaxAnswers: number
  stableMinAnswers: number
}

export interface Lesson6ContextDifferenceThresholds {
  minContextAnswerCount: number
  significantRateDifference: number
}

export interface Lesson6ContextComparisonSummary {
  lesson6ClassAnswerCount: number
  lesson6ClassCorrectCount: number
  lesson6ClassCorrectRate: number | null
  publicShowcaseAnswerCount: number
  publicShowcaseCorrectCount: number
  publicShowcaseCorrectRate: number | null
  rateDifference: number | null
  highlightedItems: Lesson6PublicItemStat[]
}

export const LESSON6_DEFAULT_QUALITY_SIGNAL_THRESHOLDS: Lesson6QualitySignalThresholds = {
  insufficientSampleMaxAnswers: 2,
  stableMinAnswers: 10,
}

export const LESSON6_DEFAULT_CONTEXT_DIFFERENCE_THRESHOLDS: Lesson6ContextDifferenceThresholds = {
  minContextAnswerCount: 5,
  significantRateDifference: 0.25,
}

export const LESSON6_QUALITY_SIGNAL_BADGE_CLASSES: Record<Lesson6QualitySignalId, string> = {
  no_answers: "border-slate-200 bg-slate-50 text-slate-700",
  insufficient_sample: "border-amber-200 bg-amber-50 text-amber-800",
  collecting_data: "border-sky-200 bg-sky-50 text-sky-800",
  stable_performance: "border-emerald-200 bg-emerald-50 text-emerald-800",
}

const LESSON6_QUALITY_SIGNAL_ORDER: Record<Lesson6QualitySignalId, number> = {
  no_answers: 0,
  insufficient_sample: 1,
  collecting_data: 2,
  stable_performance: 3,
}

function safeRate(correctCount: number, answerCount: number): number | null {
  return answerCount <= 0 ? null : correctCount / answerCount
}

export function getLesson6QualitySignal(
  answerCount: number,
  thresholds: Lesson6QualitySignalThresholds = LESSON6_DEFAULT_QUALITY_SIGNAL_THRESHOLDS,
): Lesson6QualitySignal {
  if (answerCount <= 0) {
    return {
      id: "no_answers",
      label: "0 作答",
      description: "还没有可用于判断的作答样本。",
    }
  }

  if (answerCount <= thresholds.insufficientSampleMaxAnswers) {
    return {
      id: "insufficient_sample",
      label: "样本不足",
      description: "样本量较小，仅适合作为观察入口。",
    }
  }

  if (answerCount < thresholds.stableMinAnswers) {
    return {
      id: "collecting_data",
      label: "正在积累数据",
      description: "已有一些作答，但暂不下绝对结论。",
    }
  }

  return {
    id: "stable_performance",
    label: "表现稳定",
    description: "样本量已达到当前观察阈值，可作为相对稳定参考。",
  }
}

export function getLesson6QualitySignalSortValue(
  signal: Lesson6QualitySignal,
): number {
  return LESSON6_QUALITY_SIGNAL_ORDER[signal.id]
}

export function getLesson6ContextRateDifference(item: Lesson6PublicItemStat): number | null {
  if (item.lesson6ClassAnswerCount <= 0 || item.publicShowcaseAnswerCount <= 0) return null
  return Math.abs(item.lesson6ClassCorrectRate - item.publicShowcaseCorrectRate)
}

export function hasLesson6SignificantContextDifference(
  item: Lesson6PublicItemStat,
  thresholds: Lesson6ContextDifferenceThresholds = LESSON6_DEFAULT_CONTEXT_DIFFERENCE_THRESHOLDS,
): boolean {
  const rateDifference = getLesson6ContextRateDifference(item)
  if (rateDifference == null) return false
  return item.lesson6ClassAnswerCount >= thresholds.minContextAnswerCount
    && item.publicShowcaseAnswerCount >= thresholds.minContextAnswerCount
    && rateDifference >= thresholds.significantRateDifference
}

export function buildLesson6ContextComparisonSummary(
  items: Lesson6PublicItemStat[],
  thresholds: Lesson6ContextDifferenceThresholds = LESSON6_DEFAULT_CONTEXT_DIFFERENCE_THRESHOLDS,
): Lesson6ContextComparisonSummary {
  const lesson6ClassAnswerCount = items.reduce((sum, item) => sum + item.lesson6ClassAnswerCount, 0)
  const lesson6ClassCorrectCount = items.reduce((sum, item) => sum + item.lesson6ClassCorrectCount, 0)
  const publicShowcaseAnswerCount = items.reduce((sum, item) => sum + item.publicShowcaseAnswerCount, 0)
  const publicShowcaseCorrectCount = items.reduce((sum, item) => sum + item.publicShowcaseCorrectCount, 0)
  const lesson6ClassCorrectRate = safeRate(lesson6ClassCorrectCount, lesson6ClassAnswerCount)
  const publicShowcaseCorrectRate = safeRate(publicShowcaseCorrectCount, publicShowcaseAnswerCount)

  return {
    lesson6ClassAnswerCount,
    lesson6ClassCorrectCount,
    lesson6ClassCorrectRate,
    publicShowcaseAnswerCount,
    publicShowcaseCorrectCount,
    publicShowcaseCorrectRate,
    rateDifference: lesson6ClassCorrectRate == null || publicShowcaseCorrectRate == null
      ? null
      : Math.abs(lesson6ClassCorrectRate - publicShowcaseCorrectRate),
    highlightedItems: items.filter(item => hasLesson6SignificantContextDifference(item, thresholds)),
  }
}
