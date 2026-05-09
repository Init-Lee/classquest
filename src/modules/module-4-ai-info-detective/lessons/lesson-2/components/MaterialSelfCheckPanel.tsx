/**
 * 文件说明：模块 4 课时 2 素材自检面板。
 * 职责：让学生确认类型符合、内容合规、具备判断价值三项自检；来源可追溯由系统格式检查处理，不在此处提供勾选。
 * 更新触发：素材自检字段、文案或完成判定变化时，需要同步更新本文件。
 */

import type { Module4MaterialSelfChecks } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

interface MaterialSelfCheckPanelProps {
  value: Module4MaterialSelfChecks
  labels: {
    typeFits: string
    contentCompliant: string
    hasJudgmentValue: string
  }
  onChange: (next: Module4MaterialSelfChecks) => void
}

export function MaterialSelfCheckPanel({ value, labels, onChange }: MaterialSelfCheckPanelProps) {
  const items: Array<keyof Module4MaterialSelfChecks> = ["typeFits", "contentCompliant", "hasJudgmentValue"]
  return (
    <div className="space-y-3 rounded-2xl border bg-white p-4">
      <p className="font-medium">三项素材自检</p>
      {items.map(key => (
        <label key={key} className="flex items-start gap-3 rounded-xl border p-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={value[key]}
            onChange={event => onChange({ ...value, [key]: event.target.checked })}
          />
          <span>{labels[key]}</span>
        </label>
      ))}
    </div>
  )
}
