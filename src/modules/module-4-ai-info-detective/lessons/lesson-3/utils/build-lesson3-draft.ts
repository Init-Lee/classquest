/**
 * 文件说明：模块 4 课时 3 草稿生成工具。
 * 职责：从课时 2 新闻/图片素材复制快照并生成课时 3 V1 题卡初稿，不反向修改课时 2。
 * 更新触发：课时 2 素材字段、课时 3 草稿结构或默认题干策略变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson3QuestionCardDraft,
  Module4MaterialKind,
  Module4MaterialScreeningRecord,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { createEmptyModule4Lesson3QuestionCardDraft } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON3_DEFAULT_OPTIONS } from "../data/default-options"
import { buildLesson3AssetFingerprint } from "./asset-fingerprint"
import { evaluateLesson3SelfCheck } from "./evaluate-lesson3-self-check"

function hasDraftContent(card: Module4Lesson3QuestionCardDraft): boolean {
  return Boolean(
    card.sourceMaterialSnapshot.snappedAt
    || card.material.titleOrName.trim()
    || card.explanation.text.trim()
    || card.source.sourceRecord.trim()
    || card.task.correctOptionKey,
  )
}

export function buildLesson3DraftFromLesson2(
  kind: Module4MaterialKind,
  record: Module4MaterialScreeningRecord,
): Module4Lesson3QuestionCardDraft {
  const now = new Date().toISOString()
  const base = createEmptyModule4Lesson3QuestionCardDraft(kind)
  const assetFingerprint = buildLesson3AssetFingerprint(record.asset)
  const draft: Module4Lesson3QuestionCardDraft = {
    ...base,
    sourceMaterialSnapshot: {
      kind,
      lesson2Completed: record.completed,
      lesson2PostCriteriaStatus: record.postCriteriaStatus,
      lesson2TitleOrName: record.titleOrName,
      lesson2SourceType: record.sourceType,
      lesson2SourceRecord: record.sourceRecord,
      lesson2ClueNote: record.clueNote,
      asset: record.asset,
      assetFingerprint,
      snappedAt: now,
    },
    material: {
      titleOrName: record.titleOrName,
      displayNote: record.clueNote ? `课时2疑点提示：${record.clueNote}` : "",
      asset: record.asset,
      assetFingerprint,
    },
    task: {
      ...base.task,
      options: LESSON3_DEFAULT_OPTIONS,
    },
    source: {
      sourceType: record.sourceType,
      sourceRecord: record.sourceRecord,
      verificationNote: "",
    },
    createdAt: now,
    updatedAt: now,
  }
  return { ...draft, selfCheck: evaluateLesson3SelfCheck(draft) }
}

export function ensureLesson3DraftFromLesson2(
  card: Module4Lesson3QuestionCardDraft,
  record: Module4MaterialScreeningRecord,
): Module4Lesson3QuestionCardDraft {
  const currentHasDraftContent = hasDraftContent(card)
  return currentHasDraftContent ? card : buildLesson3DraftFromLesson2(card.kind, record)
}
