/**
 * 文件说明：模块 4 课时 4 互审表单变更字段检测工具。
 * 职责：对比前后 reviewJson，找出发生编辑的 fieldKey，供清除对应校验/审核提示。
 * 更新触发：reviewJson.cards 字段结构、fieldKey 命名或互审工作台输入项增减时，需要同步更新本文件。
 */

import type {
  Module4Lesson4ReviewJson,
  Module4MaterialKind,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON4_REVIEW_CRITERIA } from "../data/lesson4-rubric"
import { buildReviewFieldKey, type Lesson4ReviewFieldKey } from "./collect-lesson4-review-texts"

const CARD_KINDS: Module4MaterialKind[] = ["news", "image"]

/** 检测 reviewJson 更新中实际改动的 fieldKey 列表。 */
export function detectChangedReviewFieldKeys(
  previous: Module4Lesson4ReviewJson,
  next: Module4Lesson4ReviewJson,
): Lesson4ReviewFieldKey[] {
  const changed: Lesson4ReviewFieldKey[] = []

  for (const kind of CARD_KINDS) {
    const prevCard = previous.cards[kind]
    const nextCard = next.cards[kind]

    if (prevCard.overallComment !== nextCard.overallComment) {
      changed.push(buildReviewFieldKey(kind, "overallComment"))
    }
    if (prevCard.contentViolation !== nextCard.contentViolation) {
      changed.push(buildReviewFieldKey(kind, "contentViolation"))
    }
    if (prevCard.contentViolationNote !== nextCard.contentViolationNote) {
      changed.push(buildReviewFieldKey(kind, "contentViolationNote"))
    }

    for (const criterion of LESSON4_REVIEW_CRITERIA) {
      const area = criterion.area
      const prevEntry = prevCard.rubric[area]
      const nextEntry = nextCard.rubric[area]
      if (prevEntry.level !== nextEntry.level || prevEntry.reason !== nextEntry.reason) {
        changed.push(buildReviewFieldKey(kind, `${area}.reason`))
      }
    }
  }

  return changed
}

/** 从 fieldErrors / moderationByField 中移除指定 fieldKey 的提示。 */
export function omitReviewFieldIssues<T extends Partial<Record<Lesson4ReviewFieldKey, unknown>>>(
  source: T,
  fieldKeys: Lesson4ReviewFieldKey[],
): T {
  if (fieldKeys.length === 0) return source
  const next = { ...source }
  for (const fieldKey of fieldKeys) {
    delete next[fieldKey]
  }
  return next
}
