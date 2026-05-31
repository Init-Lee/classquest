/**
 * 文件说明：模块 4 课时 4 反馈档位标签组件。
 * 职责：用统一颜色展示通过、小修、重改与内容合规（不合规）四类反馈档位，供 Step2 收件箱复用。
 * 更新触发：反馈档位命名、颜色语义或 Step2 标签文案变化时，需要同步更新本文件。
 */

import { Badge } from "@/shared/ui/badge"
import type { Lesson4FeedbackDigestLevel } from "../../utils/build-lesson4-feedback-digest"

const LABELS: Record<Lesson4FeedbackDigestLevel, string> = {
  pass: "通过",
  minor_fix: "小修",
  major_fix: "重改",
  content_violation: "不合规",
}

export const FEEDBACK_LEVEL_BADGE_CLASSES: Record<Lesson4FeedbackDigestLevel, string> = {
  pass: "bg-green-100 text-green-800",
  minor_fix: "bg-amber-100 text-amber-800",
  major_fix: "bg-red-100 text-red-800",
  content_violation: "bg-red-100 text-red-800",
}

export function FeedbackLevelBadge({ level }: { level: Lesson4FeedbackDigestLevel }) {
  return (
    <Badge variant="outline" className={FEEDBACK_LEVEL_BADGE_CLASSES[level]}>
      {LABELS[level]}
    </Badge>
  )
}

