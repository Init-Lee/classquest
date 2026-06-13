/**
 * 文件说明：模块 4 课时 6 公共挑战答案揭示面板。
 * 职责：在提交答案后展示正解、解析与来源摘要，归一化 string/object 来源并避免显示作者身份。
 * 更新触发：answer response 字段、来源摘要白名单、解析展示规则或公共挑战答后隐私边界变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/shared/utils/cn"
import type {
  PublicChallengeAnswerResponse,
  PublicChallengeCurrentQuestion,
  PublicChallengeOption,
} from "@/modules/module-4-ai-info-detective/api/lesson6-types"

const sourceTypeLabels: Record<string, string> = {
  web: "网页来源",
  local_record: "本地记录",
  fixture: "本地演示",
  ai_generated: "AI 生成记录",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function pickText(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return ""
}

function sourceTypeText(value: string): string {
  return sourceTypeLabels[value] ?? value
}

function parseSourceFields(source: PublicChallengeAnswerResponse["source"]): {
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
  if (!isRecord(source)) {
    return {
      sourceType: "未提供",
      sourceRecord: "来源摘要暂时无法展示，请记录题号后反馈给老师。",
      verificationNote: "未提供",
    }
  }

  const sourceType = pickText(source, ["sourceType", "type", "kind"])
  const sourceRecord = pickText(source, ["sourceRecord", "record", "url", "link", "source"])
  const verificationNote = pickText(source, ["verificationNote", "note", "verification", "checkNote"])

  return {
    sourceType: sourceType ? sourceTypeText(sourceType) : "未选择",
    sourceRecord: sourceRecord || "未填写",
    verificationNote: verificationNote || "未填写",
  }
}

function explanationText(answer: PublicChallengeAnswerResponse): string {
  const explanation = answer.explanation
  if (typeof explanation.text === "string" && explanation.text.trim()) return explanation.text.trim()
  if (typeof explanation.summary === "string" && explanation.summary.trim()) return explanation.summary.trim()
  if (typeof explanation.detail === "string" && explanation.detail.trim()) return explanation.detail.trim()
  return "本题暂无核心解析。"
}

function optionText(options: PublicChallengeOption[], key: string): string {
  const option = options.find(item => item.key === key)
  return option?.key && option.label ? `${option.key}. ${option.label}` : key
}

export function PublicChallengeResultPanel({
  question,
  answer,
  selectedOptionKey,
}: {
  question: PublicChallengeCurrentQuestion
  answer: PublicChallengeAnswerResponse
  selectedOptionKey: string
}) {
  const [otherOpen, setOtherOpen] = useState(false)
  const options = question.task.options ?? []
  const sourceFields = parseSourceFields(answer.source)
  const isCorrect = answer.isCorrect
  const selectedOption = options.find(option => option.key === selectedOptionKey)
  const otherRationales = options.filter(
    option => option.key !== answer.correctOptionKey && option.rationale?.trim(),
  )

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
            <p className="mt-1 text-sm font-medium">{optionText(options, selectedOptionKey)}</p>
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
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{explanationText(answer)}</p>
        {typeof answer.explanation.summary === "string"
          && answer.explanation.summary.trim()
          && answer.explanation.summary.trim() !== explanationText(answer) && (
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{answer.explanation.summary.trim()}</p>
        )}
      </div>

      <div className="rounded-xl border bg-slate-50/80 p-4 text-sm leading-6">
        <p className="font-semibold text-primary">来源与核验</p>
        <p className="mt-2"><strong>来源类型：</strong>{sourceFields.sourceType}</p>
        <p className="mt-1"><strong>来源记录：</strong>{sourceFields.sourceRecord}</p>
        <p className="mt-1"><strong>核验观察指引：</strong>{sourceFields.verificationNote}</p>
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
