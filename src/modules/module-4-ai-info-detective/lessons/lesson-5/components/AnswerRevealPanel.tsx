/**
 * 文件说明：模块 4 课时 5 答案揭示面板。
 * 职责：在学生提交作答后展示服务端返回的正解、解析与来源核验，视觉与交互口径对齐课时 3 第 4 关答题反馈。
 * 更新触发：AnswerSubmitResponse 字段、揭示内容展示规则、来源摘要安全口径或与课时 3 反馈样式对齐策略变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { Lesson5AnswerSubmitResponse } from "@/modules/module-4-ai-info-detective/api/lesson5-types"
import { LESSON3_SOURCE_TYPE_LABELS } from "@/modules/module-4-ai-info-detective/lessons/lesson-3/data/default-options"
import { renderTextWithLinks } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/render-text-with-links"
import { cn } from "@/shared/utils/cn"

const SOURCE_LINK_LABEL = "点击链接"

const extraSourceTypeLabels: Record<string, string> = {
  fixture: "本地演示",
}

function sourceTypeText(value: string): string {
  return LESSON3_SOURCE_TYPE_LABELS[value as keyof typeof LESSON3_SOURCE_TYPE_LABELS]
    ?? extraSourceTypeLabels[value]
    ?? value
}

function isSourceRecord(source: unknown): source is Record<string, unknown> {
  return Boolean(source && typeof source === "object" && !Array.isArray(source))
}

function pickText(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return ""
}

function parseSourceFields(source: unknown): {
  sourceType: string
  sourceRecord: string
  verificationNote: string
} {
  if (source == null || source === "") {
    return {
      sourceType: "未提供",
      sourceRecord: "本题未提供额外来源记录。",
      verificationNote: "未提供",
    }
  }
  if (typeof source === "string") {
    return {
      sourceType: "未提供",
      sourceRecord: source,
      verificationNote: "未提供",
    }
  }
  if (!isSourceRecord(source)) {
    return {
      sourceType: "未提供",
      sourceRecord: "来源摘要暂时无法展示，请记录题号后反馈给老师。",
      verificationNote: "未提供",
    }
  }

  const sourceType = pickText(source, ["sourceType", "type", "source_type", "kind"])
  const sourceRecord = pickText(source, ["sourceRecord", "record", "url", "link", "sourceUrl", "source"])
  const verificationNote = pickText(source, ["verificationNote", "note", "verification", "checkNote"])

  return {
    sourceType: sourceType ? sourceTypeText(sourceType) : "未选择",
    sourceRecord: sourceRecord || "未填写",
    verificationNote: verificationNote || "未填写",
  }
}

function optionText(
  options: NonNullable<Lesson5AnswerSubmitResponse["reveal"]["options"]>,
  key: string,
): string {
  const option = options.find(item => item.key === key)
  return option?.key && option.label
    ? `${option.key}. ${option.label}`
    : key
}

export function AnswerRevealPanel({
  answer,
}: {
  answer: Lesson5AnswerSubmitResponse
}) {
  const [otherOpen, setOtherOpen] = useState(false)
  const options = answer.reveal.options ?? []
  const isCorrect = answer.isCorrect
  const selectedOption = options.find(option => option.key === answer.selectedOptionKey)
  const otherRationales = options.filter(
    option => option.key !== answer.correctOptionKey && option.rationale?.trim(),
  )
  const sourceFields = parseSourceFields(answer.reveal.source)
  const coreExplanation = answer.reveal.explanation?.trim()
    || answer.reveal.summary?.trim()
    || "本题暂无核心解析。"

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded-xl border p-4",
          isCorrect ? "border-green-200 bg-green-50 text-green-900" : "border-amber-200 bg-amber-50 text-amber-950",
        )}
      >
        <p className="text-sm font-semibold tracking-wide">答题结果</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-white/80 bg-white/70 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">你的选择</p>
            <p className="mt-1 text-sm font-medium">{optionText(options, answer.selectedOptionKey)}</p>
          </div>
          <div className="rounded-lg border border-white/80 bg-white/70 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">参考判断</p>
            <p className="mt-1 text-sm font-medium">{optionText(options, answer.correctOptionKey)}</p>
          </div>
        </div>
      </div>

      {!isCorrect && selectedOption?.rationale?.trim() && (
        <div className="rounded-xl border bg-white p-4 text-sm leading-7 text-muted-foreground">
          <p className="font-semibold text-foreground">所选选项解析</p>
          <p className="mt-2">{selectedOption.rationale.trim()}</p>
        </div>
      )}

      <div className="rounded-xl border bg-slate-50/80 p-4">
        <p className="text-sm font-semibold text-primary">核心解析</p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{coreExplanation}</p>
        {answer.reveal.summary?.trim()
          && answer.reveal.explanation?.trim()
          && answer.reveal.summary.trim() !== answer.reveal.explanation.trim() && (
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{answer.reveal.summary.trim()}</p>
        )}
      </div>

      <div className="rounded-xl border bg-slate-50/80 p-4 text-sm leading-6">
        <p className="font-semibold text-primary">来源与核验</p>
        <p className="mt-2"><strong>来源类型：</strong>{sourceFields.sourceType}</p>
        <p className="mt-1"><strong>来源记录：</strong>{renderTextWithLinks(sourceFields.sourceRecord, SOURCE_LINK_LABEL)}</p>
        <p className="mt-1"><strong>核验观察指引：</strong>{renderTextWithLinks(sourceFields.verificationNote, SOURCE_LINK_LABEL)}</p>
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
                <p key={option.key ?? option.label}>
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
