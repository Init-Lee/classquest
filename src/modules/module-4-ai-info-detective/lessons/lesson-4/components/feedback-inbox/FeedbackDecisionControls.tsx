/**
 * 文件说明：模块 4 课时 4 小修决策控件。
 * 职责：为 Step2 的 minor_fix 反馈提供采纳、部分采纳、暂不修改单选与说明输入，不处理重改/内容合规的锁定动作。
 * 更新触发：小修作者决策选项、说明必填规则或 Step2 表单交互变化时，需要同步更新本文件。
 */

import type { Lesson4FeedbackDecision, Lesson4FeedbackDecisionAction } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { cn } from "@/shared/utils/cn"
import { Textarea } from "@/shared/ui/textarea"

const ACTIONS: Array<{ value: Lesson4FeedbackDecisionAction; label: string }> = [
  { value: "accept", label: "采纳修改" },
  { value: "partial_accept", label: "部分采纳" },
  { value: "keep_with_reason", label: "暂不修改，说明理由" },
]

const AUTHOR_PLAN_PLACEHOLDERS: Partial<Record<Lesson4FeedbackDecisionAction, string>> = {
  partial_accept: "写一句：你会参考这条建议的哪些部分，哪些不会完全照改。",
  keep_with_reason: "写一句：为什么认为当前表达可以保留。",
}

export function FeedbackDecisionControls({
  decision,
  onChange,
}: {
  decision: Lesson4FeedbackDecision
  onChange: (patch: Partial<Lesson4FeedbackDecision>) => void
}) {
  if (decision.level !== "minor_fix") {
    return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">必须重改：这类问题进入 V2 前必须处理。</p>
  }

  const radioName = `feedback-decision-${decision.id}`

  return (
    <div className="space-y-3">
      <div
        className="flex flex-wrap items-center gap-x-6 gap-y-2"
        role="radiogroup"
        aria-label="小修反馈处理决策"
      >
        {ACTIONS.map(action => (
          <label
            key={action.value}
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 text-sm",
              decision.action === action.value ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            <input
              type="radio"
              name={radioName}
              value={action.value}
              checked={decision.action === action.value}
              onChange={() => onChange({ action: action.value })}
              className="h-4 w-4 shrink-0 accent-primary"
            />
            <span>{action.label}</span>
          </label>
        ))}
      </div>
      {(decision.action === "partial_accept" || decision.action === "keep_with_reason") && (
        <Textarea
          value={decision.authorPlan}
          onChange={event => onChange({ authorPlan: event.target.value })}
          placeholder={AUTHOR_PLAN_PLACEHOLDERS[decision.action]}
          className={cn(
            decision.authorPlan.trim().length < 4
              && "border-amber-400 bg-amber-50/50 ring-2 ring-amber-300 ring-offset-0 focus-visible:ring-amber-300",
          )}
        />
      )}
    </div>
  )
}
