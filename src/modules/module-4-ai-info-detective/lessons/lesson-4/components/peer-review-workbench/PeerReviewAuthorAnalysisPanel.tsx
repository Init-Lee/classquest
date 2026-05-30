/**
 * 文件说明：课时 4 互审作者解析展示面板（自 lesson-3 反馈面板拷贝）。
 * 职责：试答提交后或评价阶段在左栏展示作者核心解析、来源与选项解析；URL 渲染为短链。
 * 更新触发：解析字段结构、评价阶段是否展示参考答案或链接展示规则变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import type {
  Module4Lesson3OptionKey,
  Module4Lesson3QuestionCardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON4_SOURCE_TYPE_LABELS } from "../../data/source-type-labels"
import { renderTextWithLinks } from "../../utils/render-text-with-links"

export function PeerReviewAuthorAnalysisPanel({
  card,
  mode,
  selectedOptionKey,
  showSelectedRationale = true,
}: {
  card: Module4Lesson3QuestionCardDraft
  /** trial：试答后对照；evaluation：评价阶段完整作者解析。 */
  mode: "trial" | "evaluation"
  selectedOptionKey?: Module4Lesson3OptionKey
  showSelectedRationale?: boolean
}) {
  const [otherOpen, setOtherOpen] = useState(false)
  const correctOption = card.task.options.find(option => option.key === card.task.correctOptionKey)
  const selectedOption = selectedOptionKey
    ? card.task.options.find(option => option.key === selectedOptionKey)
    : undefined
  const otherRationales = card.task.options.filter(
    option => option.key !== card.task.correctOptionKey && option.rationale?.trim(),
  )

  return (
    <div className="space-y-3 border-t bg-green-50/50 px-4 py-4">
      <p className="text-sm font-semibold text-green-900">
        {mode === "trial" ? "作者解析（试答后对照）" : "作者解析与来源"}
      </p>

      {mode === "evaluation" && (
        <div className="rounded-xl border bg-white p-3 text-sm">
          <p className="font-medium text-slate-800">参考答案</p>
          <p className="mt-1 leading-6 text-slate-700">
            {correctOption ? `${correctOption.key}. ${correctOption.label}` : "未选择"}
          </p>
        </div>
      )}

      {mode === "evaluation" && correctOption?.rationale?.trim() && (
        <div className="rounded-xl border bg-white p-3 text-sm">
          <p className="font-medium text-slate-800">正确答案解析</p>
          <p className="mt-1 leading-6 text-slate-700">{renderTextWithLinks(correctOption.rationale.trim())}</p>
        </div>
      )}

      {mode === "trial" && showSelectedRationale && selectedOption?.rationale?.trim() && (
        <div className="rounded-xl border bg-white p-3 text-sm leading-7 text-muted-foreground">
          <p className="font-semibold text-foreground">所选选项解析</p>
          <p className="mt-2">{renderTextWithLinks(selectedOption.rationale.trim())}</p>
        </div>
      )}

      <div className="rounded-xl border bg-white p-3 text-sm">
        <p className="font-semibold text-primary">核心解析</p>
        <p className="mt-2 leading-7 text-muted-foreground">
          {renderTextWithLinks(card.explanation.text || "未填写核心解析")}
        </p>
      </div>

      {mode === "evaluation" && otherRationales.length > 0 && (
        <div className="rounded-xl border bg-white">
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium"
            onClick={() => setOtherOpen(open => !open)}
          >
            其他选项解析（{otherRationales.length}）
            {otherOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {otherOpen && (
            <div className="space-y-2 border-t px-3 py-2.5 text-sm leading-6 text-muted-foreground">
              {otherRationales.map(option => (
                <p key={option.key}>
                  <span className="font-medium text-foreground">{option.key}.</span>{" "}
                  {renderTextWithLinks(option.rationale?.trim() ?? "")}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border bg-white p-3 text-sm leading-6">
        <p className="font-semibold text-primary">来源与核验</p>
        <p className="mt-2">
          <strong>来源类型：</strong>
          {card.source.sourceType ? LESSON4_SOURCE_TYPE_LABELS[card.source.sourceType] : "未选择"}
        </p>
        <p className="mt-1">
          <strong>来源记录：</strong>
          {renderTextWithLinks(card.source.sourceRecord || "未填写")}
        </p>
        <p className="mt-1">
          <strong>核验观察指引：</strong>
          {renderTextWithLinks(card.source.verificationNote || "未填写")}
        </p>
      </div>
    </div>
  )
}
