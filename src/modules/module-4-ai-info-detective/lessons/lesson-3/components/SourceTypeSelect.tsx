/**
 * 文件说明：模块 4 课时 3 来源类型选择组件。
 * 职责：提供固定四类来源类型选择与对应填写提示，避免各步骤重复维护来源文案。
 * 更新触发：来源类型枚举、提示文本或选择控件样式变化时，需要同步更新本文件。
 */

import type { Module4MaterialSourceType } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON3_SOURCE_TYPE_OPTIONS } from "../data/default-options"

export function SourceTypeSelect({
  value,
  onChange,
}: {
  value?: Module4MaterialSourceType
  onChange: (value?: Module4MaterialSourceType) => void
}) {
  const selected = LESSON3_SOURCE_TYPE_OPTIONS.find(option => option.value === value)
  return (
    <div className="space-y-2">
      <select
        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={value ?? ""}
        onChange={event => onChange(event.target.value ? event.target.value as Module4MaterialSourceType : undefined)}
      >
        <option value="">请选择来源类型</option>
        {LESSON3_SOURCE_TYPE_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-900">
        {selected?.hint ?? "请选择来源类型，系统会给出对应填写提示。"}
      </p>
    </div>
  )
}
