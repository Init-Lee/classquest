/**
 * 文件说明：模块 4 课时 3 自测记录失效工具。
 * 职责：在 Step2/Step3 保存或 Step4 加载时，根据题卡 contentFingerprint 判定并清理过期的 selfTrial 与 V1 保存状态。
 * 更新触发：selfTrial 字段、指纹策略、返回编辑器重置或 V1 完成态回滚规则变化时，需要同步更新本文件。
 */

import type {
  Lesson3CardSelfTrialRecord,
  Module4Lesson3QuestionCardDraft,
  Module4Lesson3State,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { createEmptyLesson3CardSelfTrialRecord } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { buildLesson3CardContentFingerprint } from "./build-lesson3-card-fingerprint"

type Lesson3SelfTrialCardKey = "news" | "image"

function getCardByKey(lesson3: Module4Lesson3State, key: Lesson3SelfTrialCardKey): Module4Lesson3QuestionCardDraft {
  return key === "news" ? lesson3.newsCard : lesson3.imageCard
}

/** 判断单张题卡的自测记录是否因内容变更而失效 */
export function isLesson3SelfTrialStale(
  card: Module4Lesson3QuestionCardDraft,
  record: Lesson3CardSelfTrialRecord,
): boolean {
  if (!record.submitted && !record.confirmed) return false

  const currentFingerprint = buildLesson3CardContentFingerprint(card)

  if (record.confirmed) {
    return !record.contentFingerprint || record.contentFingerprint !== currentFingerprint
  }

  if (record.submitted && record.contentFingerprint) {
    return record.contentFingerprint !== currentFingerprint
  }

  return false
}

/** 重置单张题卡自测记录并回滚 V1 完成态（内容指纹失效或主动返回编辑器时共用） */
function resetCardSelfTrialAndRollbackV1(
  lesson3: Module4Lesson3State,
  key: Lesson3SelfTrialCardKey,
  recordOverride?: Lesson3CardSelfTrialRecord,
): Module4Lesson3State {
  const card = getCardByKey(lesson3, key)
  const nextCard = card.status === "ready_for_lesson4"
    ? { ...card, status: "draft" as const }
    : card

  return {
    ...lesson3,
    selfTrial: {
      ...lesson3.selfTrial,
      [key]: recordOverride ?? createEmptyLesson3CardSelfTrialRecord(),
    },
    newsCard: key === "news" ? nextCard : lesson3.newsCard,
    imageCard: key === "image" ? nextCard : lesson3.imageCard,
    step4Completed: false,
    finalPreviewConfirmed: false,
    finalPreviewConfirmedAt: "",
    completed: false,
    completedAt: "",
  }
}

/** 清理单张题卡自测记录，并在需要时回滚 V1 完成态 */
function invalidateCardSelfTrial(
  lesson3: Module4Lesson3State,
  key: Lesson3SelfTrialCardKey,
): Module4Lesson3State {
  const card = getCardByKey(lesson3, key)
  const record = lesson3.selfTrial[key]
  if (!isLesson3SelfTrialStale(card, record)) return lesson3

  return resetCardSelfTrialAndRollbackV1(lesson3, key, {
    ...createEmptyLesson3CardSelfTrialRecord(),
    needsRetrial: record.submitted || record.confirmed || record.selectedOptionKey !== undefined,
  })
}

/** Step4 点击「返回编辑器」：强制重置对应题卡自测，标记需重新作答，并回滚 V1 完成态 */
export function resetLesson3SelfTrialForReturnToEditor(
  lesson3: Module4Lesson3State,
  key: Lesson3SelfTrialCardKey,
): Module4Lesson3State {
  const record = lesson3.selfTrial[key]
  const hadProgress = record.submitted || record.confirmed || record.selectedOptionKey !== undefined

  return resetCardSelfTrialAndRollbackV1(lesson3, key, {
    ...createEmptyLesson3CardSelfTrialRecord(),
    needsRetrial: hadProgress,
  })
}

/** Step4 加载或批量校验：两张题卡自测记录一并失效处理 */
export function invalidateStaleLesson3SelfTrials(lesson3: Module4Lesson3State): Module4Lesson3State {
  let next = lesson3
  next = invalidateCardSelfTrial(next, "news")
  next = invalidateCardSelfTrial(next, "image")
  return next
}

/** Step2/Step3 保存后：仅失效对应题卡的 selfTrial，并在内容变更时回滚 V1 完成态 */
export function invalidateLesson3SelfTrialOnCardSave(
  lesson3: Module4Lesson3State,
  key: Lesson3SelfTrialCardKey,
  previousCard: Module4Lesson3QuestionCardDraft,
  nextCard: Module4Lesson3QuestionCardDraft,
): Module4Lesson3State {
  const previousFingerprint = buildLesson3CardContentFingerprint(previousCard)
  const nextFingerprint = buildLesson3CardContentFingerprint(nextCard)
  if (previousFingerprint === nextFingerprint) return lesson3

  const record = lesson3.selfTrial[key]
  if (!record.submitted && !record.confirmed) return lesson3

  return invalidateCardSelfTrial(lesson3, key)
}
