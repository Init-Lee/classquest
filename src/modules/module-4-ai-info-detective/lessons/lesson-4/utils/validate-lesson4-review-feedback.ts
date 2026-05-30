/**
 * 文件说明：模块 4 课时 4 互审反馈校验工具。
 * 职责：按题卡校验试答、各维度档位与原因、该卡总体建议与内容违规；双卡均 approved 后允许整体提交。
 * 更新触发：reviewJson 契约、量规维度、分卡提交流程或校验文案变化时，需要同步更新本文件。
 */

import type {
  Lesson4ReviewRubricDimensionKey,
  Module4Lesson4ReviewJson,
  Module4MaterialKind,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON4_REVIEW_CRITERIA, LESSON4_VERDICT_LEVELS } from "../data/lesson4-rubric"
import type { Lesson4ReviewFieldKey } from "./collect-lesson4-review-texts"
import { buildReviewFieldKey } from "./collect-lesson4-review-texts"

export interface Lesson4FeedbackValidationResult {
  valid: boolean
  message: string
}

export interface Lesson4CardValidationResult extends Lesson4FeedbackValidationResult {
  fieldErrors: Partial<Record<Lesson4ReviewFieldKey, string>>
}

const CARD_LABEL: Record<Module4MaterialKind, string> = {
  news: "新闻题卡",
  image: "图片题卡",
}

const LEVEL_LABEL = Object.fromEntries(
  LESSON4_VERDICT_LEVELS.map(level => [level.level, level.label]),
) as Record<string, string>

/** 校验单张题卡是否可提交本卡审查。 */
export function validateLesson4ReviewCardFeedback(
  reviewJson: Module4Lesson4ReviewJson,
  kind: Module4MaterialKind,
): Lesson4CardValidationResult {
  const fieldErrors: Partial<Record<Lesson4ReviewFieldKey, string>> = {}
  const card = reviewJson.cards[kind]

  if (!card.trialAnswer) {
    return {
      valid: false,
      message: `请先完成${CARD_LABEL[kind]}的试答并提交。`,
      fieldErrors,
    }
  }

  for (const criterion of LESSON4_REVIEW_CRITERIA) {
    const entry = card.rubric[criterion.area]
    const reasonKey = buildReviewFieldKey(kind, `${criterion.area}.reason` as `${Lesson4ReviewRubricDimensionKey}.reason`)
    if (!entry.level) {
      fieldErrors[reasonKey] = `请为「${criterion.title}」选择评价档位。`
    } else if (entry.reason.trim().length === 0) {
      const levelLabel = LEVEL_LABEL[entry.level] ?? "该档位"
      fieldErrors[reasonKey] = `请填写「${criterion.title}」（${levelLabel}）的原因。`
    }
  }

  if (card.overallComment.trim().length === 0) {
    fieldErrors[buildReviewFieldKey(kind, "overallComment")] = "请填写本题卡的总体建议。"
  }
  if (card.contentViolation === null) {
    fieldErrors[buildReviewFieldKey(kind, "contentViolation")] = "请确认本题卡内容是否存在违规。"
  }
  if (card.contentViolation === true && card.contentViolationNote.trim().length === 0) {
    fieldErrors[buildReviewFieldKey(kind, "contentViolationNote")] = "判定存在违规内容时，请填写违规说明。"
  }

  const valid = Object.keys(fieldErrors).length === 0
  return {
    valid,
    message: valid ? "" : `${CARD_LABEL[kind]}尚有未填项，请查看输入框下方红色提示。`,
    fieldErrors,
  }
}

/** 整体提交前校验：两张题卡均已通过分卡审查。 */
export function validateLesson4ReviewFeedback(reviewJson: Module4Lesson4ReviewJson): Lesson4FeedbackValidationResult {
  const cardKinds: Module4MaterialKind[] = ["news", "image"]
  for (const kind of cardKinds) {
    if (!reviewJson.cards[kind].approved) {
      return {
        valid: false,
        message: `请先分别提交并通过${CARD_LABEL[kind]}的审查，再整体提交。`,
      }
    }
  }
  return { valid: true, message: "" }
}
