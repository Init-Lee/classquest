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
import {
  appendLesson3Option,
  LESSON3_MAX_OPTIONS,
  LESSON3_MIN_OPTIONS,
  removeLastLesson3Option,
} from "../data/default-options"
import { useImeSafeDraftValue } from "./useImeSafeDraftValue"

function TaskOptionRow({
  cardId,
  option,
  index,
  correctOptionKey,
  onOptionChange,
  onSelectCorrectOption,
}: {
  cardId: string
  option: JudgmentOption
  index: number
  correctOptionKey?: Module4Lesson3OptionKey
  onOptionChange: (index: number, patch: Partial<JudgmentOption>) => void
  onSelectCorrectOption: (key: Module4Lesson3OptionKey) => void
}) {
  const labelField = useImeSafeDraftValue({
    value: option.label,
    onCommit: label => onOptionChange(index, { label }),
  })
  const rationaleField = useImeSafeDraftValue({
    value: option.rationale ?? "",
    onCommit: rationale => onOptionChange(index, { rationale }),
  })

  return (
    <div className="grid min-w-[720px] grid-cols-[2.5rem_minmax(12rem,1.2fr)_5rem_minmax(12rem,1fr)] items-center gap-2 border-b px-3 py-2 last:border-b-0">
      <span className="flex h-9 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
        {option.key}
      </span>
      <Input
        {...labelField}
        placeholder={`填写选项 ${option.key} 文案`}
        className="h-9 min-w-0 text-sm"
      />
      <label className="flex h-9 cursor-pointer items-center justify-center">
        <input
          type="radio"
          name={`${cardId}-correct-answer`}
          className="h-4 w-4 accent-primary"
          checked={correctOptionKey === option.key}
          onChange={() => onSelectCorrectOption(option.key as Module4Lesson3OptionKey)}
          aria-label={`将选项 ${option.key} 设为参考答案`}
        />
      </label>
      <Input
        {...rationaleField}
        placeholder="选项解析"
        className="h-9 min-w-0 text-sm"
      />
    </div>
  )
}

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

      <div className="overflow-x-auto rounded-xl border bg-white" role="radiogroup" aria-label="请选择正确答案">
        <div className="grid min-w-[720px] grid-cols-[2.5rem_minmax(12rem,1.2fr)_5rem_minmax(12rem,1fr)] items-center gap-2 border-b bg-slate-50 px-3 py-2 text-xs font-medium text-muted-foreground">
          <span>选项</span>
          <span>答案</span>
          <span className="text-center">正确答案</span>
          <span>选项解析</span>
        </div>
        {options.map((option, index) => (
          <TaskOptionRow
            key={option.key}
            cardId={cardId}
            option={option}
            index={index}
            correctOptionKey={correctOptionKey}
            onOptionChange={updateOption}
            onSelectCorrectOption={selectCorrectOption}
          />
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
