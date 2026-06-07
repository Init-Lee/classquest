/**
 * 文件说明：teacher-console 角色标签组件。
 * 职责：把 admin/teacher/demo 角色转换为统一视觉标签，供外壳、首页和授权页展示当前身份。
 * 更新触发：角色枚举、角色文案或教师控制台标签视觉规范变化时，需要同步更新本文件。
 */

import { Badge } from "@/shared/ui/badge"
import { getTeacherRoleLabel } from "@/teacher-console/app/teacher-permissions"
import type { TeacherAccountRole } from "@/teacher-console/types"

export function RoleBadge({ role }: { role: TeacherAccountRole }) {
  if (role === "admin") {
    return <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">{getTeacherRoleLabel(role)}</Badge>
  }
  if (role === "teacher") {
    return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{getTeacherRoleLabel(role)}</Badge>
  }
  return <Badge variant="outline">{getTeacherRoleLabel(role)}</Badge>
}
