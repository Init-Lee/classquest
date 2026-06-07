/**
 * 文件说明：teacher-console 权限判断工具。
 * 职责：集中封装角色展示、admin 访问、demo 只读和教师班级授权判断，避免页面散落权限字符串。
 * 更新触发：账号角色、班级权限枚举、demo 只读口径或 admin 可访问范围变化时，需要同步更新本文件。
 */

import type { TeacherAccountRole, TeacherClassPermission, TeacherSession } from "@/teacher-console/types"

export function getTeacherRoleLabel(role: TeacherAccountRole): string {
  if (role === "admin") return "管理员"
  if (role === "teacher") return "任课教师"
  return "演示只读"
}

export function getTeacherPermissionLabel(permission: TeacherClassPermission): string {
  return permission === "manage" ? "可管理" : "只读"
}

export function canAccessTeacherAdmin(session: TeacherSession | null): boolean {
  return session?.user.role === "admin"
}

export function isTeacherReadonlySession(session: TeacherSession | null): boolean {
  return session?.user.role === "demo"
}

export function canManageTeacherClass(
  session: TeacherSession | null,
  classId: string,
): boolean {
  if (!session || session.user.role !== "teacher") return false
  return session.classPermissions.some(item => item.classId === classId && item.permission === "manage")
}
