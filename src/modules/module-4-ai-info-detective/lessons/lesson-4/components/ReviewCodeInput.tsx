/**
 * 文件说明：模块 4 课时 4 审查码输入组件。
 * 职责：收集四位审查码并做数字过滤，供入站领取互审任务时复用。
 * 更新触发：审查码长度、输入校验、错误提示或领取交互变化时，需要同步更新本文件。
 */

import { Input } from "@/shared/ui/input"

export function ReviewCodeInput({
  value,
  error,
  onChange,
}: {
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1">
      <Input
        inputMode="numeric"
        maxLength={4}
        placeholder="输入 4 位审查码"
        value={value}
        onChange={event => onChange(event.target.value.replace(/\D/g, "").slice(0, 4))}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
