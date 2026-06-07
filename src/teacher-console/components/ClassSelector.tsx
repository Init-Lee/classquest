/**
 * 文件说明：teacher-console 班级选择器组件。
 * 职责：为 admin 授权页提供班级下拉选择，保持 classId/className/active 字段展示口径统一。
 * 更新触发：班级字段、选择器交互、禁用规则或 admin 授权页班级展示方式变化时，需要同步更新本文件。
 */

import type { TeacherAdminClass } from "@/teacher-console/types"

interface ClassSelectorProps {
  classes: TeacherAdminClass[]
  value: string
  onChange: (classId: string) => void
  disabled?: boolean
}

export function ClassSelector({ classes, value, onChange, disabled = false }: ClassSelectorProps) {
  return (
    <select
      value={value}
      onChange={event => onChange(event.target.value)}
      disabled={disabled}
      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">选择班级</option>
      {classes.map(item => (
        <option key={item.classId} value={item.classId} disabled={!item.active}>
          {item.className}
          {!item.active ? "（停用）" : ""}
        </option>
      ))}
    </select>
  )
}
