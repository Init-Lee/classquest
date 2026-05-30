/**
 * 文件说明：模块 4 课时 4 互审 AI/校验不通过原因标签。
 * 职责：按 fieldKey 在对应输入框下方以红色 Badge 展示不通过原因（校验或 AI 审核）。
 * 更新触发：字段级提示 UX、标签样式或 fieldKey 映射变化时，需要同步更新本文件。
 */

import { Badge } from "@/shared/ui/badge"
import type { Lesson4ReviewFieldKey } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/collect-lesson4-review-texts"
import type { Lesson4ReviewModerationByField } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/lesson4-review-moderation-local"

export function getFieldIssueReasons(
  fieldKey: Lesson4ReviewFieldKey,
  fieldErrors: Partial<Record<Lesson4ReviewFieldKey, string>>,
  moderationByField: Lesson4ReviewModerationByField,
): string[] {
  const moderation = moderationByField[fieldKey]
  if (moderation && !moderation.pass) {
    return [...new Set(moderation.reasons.filter(reason => reason.trim().length > 0))]
  }
  const validationError = fieldErrors[fieldKey]
  return validationError ? [validationError] : []
}

export function PeerReviewFieldIssueBadges({
  fieldKey,
  fieldErrors,
  moderationByField,
}: {
  fieldKey: Lesson4ReviewFieldKey
  fieldErrors: Partial<Record<Lesson4ReviewFieldKey, string>>
  moderationByField: Lesson4ReviewModerationByField
}) {
  const reasons = getFieldIssueReasons(fieldKey, fieldErrors, moderationByField)
  if (reasons.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {reasons.map(reason => (
        <Badge key={`${fieldKey}-${reason}`} variant="destructive" className="text-xs font-normal">
          {reason}
        </Badge>
      ))}
    </div>
  )
}
