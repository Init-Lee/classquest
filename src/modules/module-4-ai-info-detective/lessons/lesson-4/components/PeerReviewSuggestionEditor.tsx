/**
 * 文件说明：模块 4 课时 4 互审建议编辑组件。
 * 职责：编辑单张题卡的具体修改建议列表，帮助审查者给出可定位的反馈。
 * 更新触发：建议条数、默认建议、输入校验或 reviewJson.suggestions 字段变化时，需要同步更新本文件。
 */

import { Button } from "@/shared/ui/button"
import { Textarea } from "@/shared/ui/textarea"

export function PeerReviewSuggestionEditor({
  suggestions,
  onChange,
}: {
  suggestions: string[]
  onChange: (suggestions: string[]) => void
}) {
  const value = suggestions.join("\n")
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">具体建议</p>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...suggestions, ""])}>
          添加一条
        </Button>
      </div>
      <Textarea
        rows={4}
        placeholder="每行写一条建议：指出问题位置，并给出修改方向。"
        value={value}
        onChange={event => onChange(event.target.value.split("\n").map(item => item.trim()).filter(Boolean))}
      />
    </div>
  )
}
