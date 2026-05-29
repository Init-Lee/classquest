/**
 * 文件说明：模块 4 课时 3 课时 2 素材快照同步工具。
 * 职责：检测课时 2 素材记录与课时 3 题卡快照是否存在差异，并在学生确认后只同步素材/来源相关字段。
 * 更新触发：课时 2 素材字段、课时 3 题卡快照字段、AI 自检失效规则或手动同步范围变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson3QuestionCardDraft,
  Module4MaterialScreeningRecord,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { buildLesson3AssetFingerprint } from "./asset-fingerprint"
import { evaluateLesson3SelfCheck } from "./evaluate-lesson3-self-check"

function lesson2DisplayNoteFromClue(clueNote: string): string {
  return clueNote.trim() ? `课时2疑点提示：${clueNote}` : ""
}

function shouldRefreshDisplayNote(card: Module4Lesson3QuestionCardDraft): boolean {
  const previousAutoNote = lesson2DisplayNoteFromClue(card.sourceMaterialSnapshot.lesson2ClueNote)
  return !card.material.displayNote.trim() || card.material.displayNote === previousAutoNote
}

/** 判断课时 2 素材记录是否已不同于课时 3 当前快照 */
export function hasLesson2SnapshotDrift(
  card: Module4Lesson3QuestionCardDraft,
  record: Module4MaterialScreeningRecord,
): boolean {
  const nextAssetFingerprint = buildLesson3AssetFingerprint(record.asset)
  const snapshot = card.sourceMaterialSnapshot
  return snapshot.lesson2Completed !== record.completed
    || snapshot.lesson2PostCriteriaStatus !== record.postCriteriaStatus
    || snapshot.lesson2TitleOrName !== record.titleOrName
    || snapshot.lesson2SourceType !== record.sourceType
    || snapshot.lesson2SourceRecord !== record.sourceRecord
    || snapshot.lesson2ClueNote !== record.clueNote
    || snapshot.assetFingerprint !== nextAssetFingerprint
}

/** 手动同步课时 2 最新素材快照；不覆盖题干、选项、答案、核心解析和核验观察指引 */
export function syncLesson3CardWithLesson2Snapshot(
  card: Module4Lesson3QuestionCardDraft,
  record: Module4MaterialScreeningRecord,
): Module4Lesson3QuestionCardDraft {
  const now = new Date().toISOString()
  const assetFingerprint = buildLesson3AssetFingerprint(record.asset)
  const displayNote = shouldRefreshDisplayNote(card)
    ? lesson2DisplayNoteFromClue(record.clueNote)
    : card.material.displayNote
  const nextCard: Module4Lesson3QuestionCardDraft = {
    ...card,
    status: "draft",
    sourceMaterialSnapshot: {
      kind: card.kind,
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
      ...card.material,
      titleOrName: record.titleOrName,
      displayNote,
      asset: record.asset,
      assetFingerprint,
    },
    source: {
      ...card.source,
      sourceType: record.sourceType,
      sourceRecord: record.sourceRecord,
    },
    aiReview: card.aiReview.result
      ? {
        ...card.aiReview,
        status: "completed",
        isStale: true,
        errorMessage: "课时 2 素材已重新带入，请重新运行题卡自检助手。",
      }
      : card.aiReview,
    updatedAt: now,
  }
  return { ...nextCard, selfCheck: evaluateLesson3SelfCheck(nextCard) }
}
