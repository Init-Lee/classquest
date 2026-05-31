/**
 * 文件说明：模块 4 课时 4 单条反馈决策组件。
 * 职责：展示一条需要作者处理的反馈，并在小修场景下承载作者决策控件。
 * 更新触发：Step2 单条反馈展示、决策字段或反馈理由呈现方式变化时，需要同步更新本文件。
 */

import type { Lesson4FeedbackDecision } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { FeedbackDecisionControls } from "./FeedbackDecisionControls"
import { FeedbackLevelBadge } from "./FeedbackLevelBadge"
import { getLesson4FeedbackAreaLabel } from "../../utils/build-lesson4-feedback-digest"

export function FeedbackDecisionItem({
  decision,
  onChange,
}: {
  decision: Lesson4FeedbackDecision
  onChange: (patch: Partial<Lesson4FeedbackDecision>) => void
}) {
  const level = decision.level === "content_violation" ? "content_violation" : decision.level
  return (
    <div className="space-y-3 rounded-xl border bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <FeedbackLevelBadge level={level} />
        <span className="text-sm font-medium">{getLesson4FeedbackAreaLabel(decision.area)}</span>
      </div>
      <div className="flex flex-wrap items-start gap-x-2 gap-y-2">
        <p className="shrink-0 text-sm font-medium">理由</p>
        <div className="min-w-0 flex-1 rounded-lg bg-sky-50 px-3 py-2 text-sm leading-6 text-foreground">
          {decision.reviewerReason || "同伴没有填写详细理由。"}
        </div>
      </div>
      <FeedbackDecisionControls decision={decision} onChange={onChange} />
    </div>
  )
}

