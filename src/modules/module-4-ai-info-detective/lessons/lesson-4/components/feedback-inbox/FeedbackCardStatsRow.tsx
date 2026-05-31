/**
 * 文件说明：模块 4 课时 4 单卡反馈统计行。
 * 职责：在题卡标题右侧以彩色 Badge 展示通过、小修、重改数量及内容合规 ✓/✗ 状态。
 * 更新触发：Step2 摘要指标、反馈档位命名或顶部统计布局变化时，需要同步更新本文件。
 */

import { Badge } from "@/shared/ui/badge"
import type { Lesson4FeedbackDigestCard } from "../../utils/build-lesson4-feedback-digest"
import { RUBRIC_DIMENSION_KEYS } from "../../utils/build-lesson4-feedback-digest"
import { FEEDBACK_LEVEL_BADGE_CLASSES } from "./FeedbackLevelBadge"

function countRubricLevel(card: Lesson4FeedbackDigestCard, level: "pass" | "minor_fix" | "major_fix"): number {
  return card.items.filter(
    item => RUBRIC_DIMENSION_KEYS.includes(item.area as typeof RUBRIC_DIMENSION_KEYS[number])
      && item.level === level,
  ).length
}

function renderContentComplianceMark(violation: boolean | null): string {
  if (violation === false) return "✓"
  if (violation === true) return "✗"
  return "—"
}

function getContentComplianceBadgeClass(violation: boolean | null): string {
  if (violation === true) return FEEDBACK_LEVEL_BADGE_CLASSES.content_violation
  if (violation === false) return FEEDBACK_LEVEL_BADGE_CLASSES.pass
  return "bg-muted text-muted-foreground"
}

export function FeedbackCardStatsRow({ card }: { card: Lesson4FeedbackDigestCard }) {
  const passCount = countRubricLevel(card, "pass")
  const minorCount = countRubricLevel(card, "minor_fix")
  const majorCount = countRubricLevel(card, "major_fix")
  const complianceMark = renderContentComplianceMark(card.contentViolation)

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Badge variant="outline" className={FEEDBACK_LEVEL_BADGE_CLASSES.pass}>
        通过 {passCount}
      </Badge>
      <Badge variant="outline" className={FEEDBACK_LEVEL_BADGE_CLASSES.minor_fix}>
        小修 {minorCount}
      </Badge>
      <Badge variant="outline" className={FEEDBACK_LEVEL_BADGE_CLASSES.major_fix}>
        重改 {majorCount}
      </Badge>
      <Badge variant="outline" className={getContentComplianceBadgeClass(card.contentViolation)}>
        内容合规 {complianceMark}
      </Badge>
    </div>
  )
}
