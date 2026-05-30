/**
 * 文件说明：课时 4 互审试答左栏答题结果摘要。
 * 职责：试答提交后在左栏展示选择与参考判断，并提供「重新答题」入口以清除试答状态后再次作答。
 * 更新触发：试答结果文案、重新答题交互或左栏摘要布局变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson3OptionKey,
  Module4Lesson3QuestionCardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"

function optionText(
  card: Module4Lesson3QuestionCardDraft,
  key: Module4Lesson3OptionKey,
): string {
  const option = card.task.options.find(item => item.key === key)
  return option ? `${option.key}. ${option.label}` : key
}

export function PeerReviewTrialResultStrip({
  card,
  selectedOptionKey,
  isCorrect,
  onRetake,
}: {
  card: Module4Lesson3QuestionCardDraft
  selectedOptionKey: Module4Lesson3OptionKey
  isCorrect?: boolean
  onRetake?: () => void
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        isCorrect === true
          ? "border-green-200 bg-green-50 text-green-900"
          : "border-amber-200 bg-amber-50 text-amber-950",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold tracking-wide">答题结果</p>
        {onRetake && (
          <Button type="button" variant="outline" size="sm" onClick={onRetake}>
            重新答题
          </Button>
        )}
      </div>
      <p className="mt-2 text-sm">
        <strong>你的选择：</strong>
        {optionText(card, selectedOptionKey)}
      </p>
      {card.task.correctOptionKey && (
        <p className="mt-1 text-sm">
          <strong>参考判断：</strong>
          {optionText(card, card.task.correctOptionKey)}
        </p>
      )}
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        下方为作者解析对照区；请完成另一张题卡试答并填写右栏评价后再提交审查。
      </p>
    </div>
  )
}
