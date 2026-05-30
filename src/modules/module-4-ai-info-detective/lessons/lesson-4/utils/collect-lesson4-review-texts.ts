/**
 * 文件说明：模块 4 课时 4 互审文字采集工具。
 * 职责：从 reviewJson 按题卡、按字段聚合待审核文字，供分卡 AI/规则审核 endpoint 使用。
 * 更新触发：reviewJson 字段、量规维度或分卡/分字段审核策略变化时，需要同步更新本文件。
 */

import type {
  Lesson4ReviewRubricDimensionKey,
  Module4Lesson4ReviewJson,
  Module4MaterialKind,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON4_REVIEW_CRITERIA } from "../data/lesson4-rubric"

/** 兼容后端 moderate-text 的题卡键（整体提交时不再使用 overall）。 */
export type Lesson4ReviewModerationCardKey = Module4MaterialKind

export type Lesson4ReviewFieldKey =
  | `${Module4MaterialKind}.${Lesson4ReviewRubricDimensionKey}.reason`
  | `${Module4MaterialKind}.overallComment`
  | `${Module4MaterialKind}.contentViolation`
  | `${Module4MaterialKind}.contentViolationNote`

export function buildReviewFieldKey(
  kind: Module4MaterialKind,
  suffix: `${Lesson4ReviewRubricDimensionKey}.reason` | "overallComment" | "contentViolationNote" | "contentViolation",
): Lesson4ReviewFieldKey {
  return `${kind}.${suffix}` as Lesson4ReviewFieldKey
}

export interface Lesson4ReviewModerationTextItem {
  fieldKey: Lesson4ReviewFieldKey
  /** 后端 HTTP 仍按题卡分组时使用。 */
  card: Lesson4ReviewModerationCardKey
  label: string
  content: string
}

const CARD_LABEL: Record<Module4MaterialKind, string> = {
  news: "新闻题卡",
  image: "图片题卡",
}

/** 采集单张题卡各字段待审核文字（分卡提交时使用）。 */
export function collectLesson4ReviewCardModerationTexts(
  reviewJson: Module4Lesson4ReviewJson,
  kind: Module4MaterialKind,
): Lesson4ReviewModerationTextItem[] {
  const card = reviewJson.cards[kind]
  const items: Lesson4ReviewModerationTextItem[] = LESSON4_REVIEW_CRITERIA.map(criterion => {
    const entry = card.rubric[criterion.area]
    const fieldKey = buildReviewFieldKey(kind, `${criterion.area}.reason`)
    const level = entry.level ?? "未选"
    const reason = entry.reason.trim()
    return {
      fieldKey,
      card: kind,
      label: `${CARD_LABEL[kind]}·${criterion.title}·原因`,
      content: `【${criterion.title}·${level}】${reason}`,
    }
  })

  items.push({
    fieldKey: buildReviewFieldKey(kind, "overallComment"),
    card: kind,
    label: `${CARD_LABEL[kind]}·总体建议`,
    content: card.overallComment.trim(),
  })

  if (card.contentViolation === true && card.contentViolationNote.trim()) {
    items.push({
      fieldKey: buildReviewFieldKey(kind, "contentViolationNote"),
      card: kind,
      label: `${CARD_LABEL[kind]}·违规说明`,
      content: card.contentViolationNote.trim(),
    })
  }

  return items
}

/** 采集单卡合并文本，供 HTTP 模式整卡送审。 */
export function collectLesson4ReviewCardCombinedText(
  reviewJson: Module4Lesson4ReviewJson,
  kind: Module4MaterialKind,
): string {
  return collectLesson4ReviewCardModerationTexts(reviewJson, kind)
    .map(item => item.content)
    .join("\n")
}
