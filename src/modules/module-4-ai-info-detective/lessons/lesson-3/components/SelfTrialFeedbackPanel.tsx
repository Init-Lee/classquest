/**
 * 文件说明：模块 4 课时 3 第 4 步自测反馈面板。
 * 职责：嵌入自测面板右栏，按答对/答错两种顺序展示解析与来源核验；答错时不单独展示参考答案 rationale。
 * 更新触发：反馈展示顺序、解析字段、来源展示文案或右栏滚动容器适配变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import type {
  Module4Lesson3OptionKey,
  Module4Lesson3QuestionCardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON3_SOURCE_TYPE_LABELS } from "../data/default-options"
import { cn } from "@/shared/utils/cn"

function optionText(
  card: Module4Lesson3QuestionCardDraft,
  key: Module4Lesson3OptionKey,
): string {
  const option = card.task.options.find(item => item.key === key)
  return option ? `${option.key}. ${option.label}` : key
}

export function SelfTrialFeedbackPanel({
  card,
  selectedOptionKey,
  isCorrect,
}: {
  card: Module4Lesson3QuestionCardDraft
  selectedOptionKey: Module4Lesson3OptionKey
  isCorrect: boolean
}) {
  const [otherOpen, setOtherOpen] = useState(false)
  const selectedOption = card.task.options.find(option => option.key === selectedOptionKey)
  const otherRationales = card.task.options.filter(
    option => option.key !== card.task.correctOptionKey && option.rationale?.trim(),
  )

  return (
    <div className="space-y-4 pr-1">
      <div
        className={cn(
          "rounded-xl border p-4",
          isCorrect ? "border-green-200 bg-green-50 text-green-900" : "border-amber-200 bg-amber-50 text-amber-950",
        )}
      >
        <p className="text-sm font-semibold tracking-wide">答题结果</p>
        <p className="mt-2 text-sm"><strong>你的选择：</strong>{optionText(card, selectedOptionKey)}</p>
        {card.task.correctOptionKey && (
          <p className="mt-1 text-sm"><strong>参考判断：</strong>{optionText(card, card.task.correctOptionKey)}</p>
        )}
      </div>

      {!isCorrect && selectedOption?.rationale?.trim() && (
        <div className="rounded-xl border bg-white p-4 text-sm leading-7 text-muted-foreground">
          <p className="font-semibold text-foreground">所选选项解析</p>
          <p className="mt-2">{selectedOption.rationale.trim()}</p>
        </div>
      )}

      <div className="rounded-xl border bg-slate-50/80 p-4">
        <p className="text-sm font-semibold text-primary">核心解析</p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          {card.explanation.text || "未填写核心解析"}
        </p>
      </div>

      <div className="rounded-xl border bg-slate-50/80 p-4 text-sm leading-6">
        <p className="font-semibold text-primary">来源与核验</p>
        <p className="mt-2"><strong>来源类型：</strong>{card.source.sourceType ? LESSON3_SOURCE_TYPE_LABELS[card.source.sourceType] : "未选择"}</p>
        <p className="mt-1"><strong>来源记录：</strong>{card.source.sourceRecord || "未填写"}</p>
        <p className="mt-1"><strong>核验观察指引：</strong>{card.source.verificationNote || "未填写"}</p>
      </div>

      {isCorrect && otherRationales.length > 0 && (
        <div className="rounded-xl border">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
            onClick={() => setOtherOpen(open => !open)}
          >
            查看其他选项解析（{otherRationales.length}）
            {otherOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {otherOpen && (
            <div className="space-y-2 border-t px-4 py-3 text-sm leading-6 text-muted-foreground">
              {otherRationales.map(option => (
                <p key={option.key}>
                  <span className="font-medium text-foreground">{option.key}.</span> {option.rationale?.trim()}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
