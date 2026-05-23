/**
 * 文件说明：模块 4 课时 3 判断任务选项编辑器。
 * 职责：在题卡编辑工作台「判断任务」Tab 内提供 A–F 可编辑选项、选项解析、单选正确答案与增减选项交互。
 * 更新触发：选项数量上下限、行内布局、选项解析字段、正确答案选择规则或默认选项文案变化时，需要同步更新本文件。
 */

import { Minus, Plus } from "lucide-react"
import type { Module4Lesson3OptionKey } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import type { JudgmentOption } from "@/modules/module-4-ai-info-detective/domains/question-card/types"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/utils/cn"
import {
  appendLesson3Option,
  LESSON3_MAX_OPTIONS,
  LESSON3_MIN_OPTIONS,
  removeLastLesson3Option,
} from "../data/default-options"

export function TaskOptionsEditor({
  cardId,
  options,
  correctOptionKey,
  onChange,
}: {
  cardId: string
  options: JudgmentOption[]
  correctOptionKey?: Module4Lesson3OptionKey
  onChange: (next: { options: JudgmentOption[]; correctOptionKey?: Module4Lesson3OptionKey }) => void
}) {
  const canAdd = options.length < LESSON3_MAX_OPTIONS
  const canRemove = options.length > LESSON3_MIN_OPTIONS

  const updateOption = (index: number, patch: Partial<JudgmentOption>) => {
    const nextOptions = options.map((option, optionIndex) => (
      optionIndex === index ? { ...option, ...patch } : option
    ))
    onChange({ options: nextOptions, correctOptionKey })
  }

  const selectCorrectOption = (key: Module4Lesson3OptionKey) => {
    onChange({ options, correctOptionKey: key })
  }

  const handleAddOption = () => {
    if (!canAdd) return
    onChange({ options: appendLesson3Option(options), correctOptionKey })
  }

  const handleRemoveOption = () => {
    if (!canRemove) return
    onChange(removeLastLesson3Option(options, correctOptionKey))
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">请选择正确答案（单选）</p>
        <p className="text-xs text-muted-foreground">编辑各选项文案，点选右侧 radio 标记参考答案。</p>
      </div>

      <div className="space-y-2.5" role="radiogroup" aria-label="请选择正确答案">
        {options.map((option, index) => (
          <div
            key={option.key}
            className={cn(
              "space-y-2 rounded-xl px-2.5 py-2 transition",
              correctOptionKey === option.key
                ? "bg-primary/5 ring-1 ring-primary/40"
                : "bg-slate-50/60",
            )}
          >
            <div className="flex flex-nowrap items-center gap-2">
              <span className="w-8 shrink-0 text-center text-sm font-semibold">{option.key}</span>
              <Input
                value={option.label}
                onChange={event => updateOption(index, { label: event.target.value })}
                placeholder={`填写选项 ${option.key} 文案`}
                className="h-9 min-w-0 flex-1 text-sm"
              />
              <label className="flex shrink-0 cursor-pointer items-center justify-center p-1">
                <input
                  type="radio"
                  name={`${cardId}-correct-answer`}
                  className="h-4 w-4 accent-primary"
                  checked={correctOptionKey === option.key}
                  onChange={() => selectCorrectOption(option.key as Module4Lesson3OptionKey)}
                  aria-label={`将选项 ${option.key} 设为参考答案`}
                />
              </label>
            </div>
            <label className="block w-full space-y-1.5">
              <span className="text-xs text-muted-foreground">选项解析（选填）</span>
              <Textarea
                value={option.rationale ?? ""}
                onChange={event => updateOption(index, { rationale: event.target.value })}
                placeholder="说明为什么选 / 为什么不选该选项，帮助学生理解错在哪里。"
                rows={2}
                className="min-h-[3.5rem] resize-y text-sm"
              />
            </label>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={!canAdd}
          onClick={handleAddOption}
          aria-label="增加选项"
        >
          <Plus className="h-4 w-4" />
          增加选项
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={!canRemove}
          onClick={handleRemoveOption}
          aria-label="删除最后一项"
        >
          <Minus className="h-4 w-4" />
          删除末项
        </Button>
        <span className="text-xs text-muted-foreground">
          最少 {LESSON3_MIN_OPTIONS} 项，最多 {LESSON3_MAX_OPTIONS} 项（A–F）
        </span>
      </div>
    </div>
  )
}
