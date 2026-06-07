/**
 * 文件说明：teacher-console 会话持久化工具。
 * 职责：把登录 token 与用户快照保存到 sessionStorage，支持刷新保活，并在解析失败或登出时清理本地会话。
 * 更新触发：会话字段、存储介质、刷新保活策略或安全边界变化时，需要同步更新本文件。
 */

import type { TeacherSession } from "@/teacher-console/types"

const TEACHER_SESSION_STORAGE_KEY = "classquest.teacherConsole.session.v1"

function isTeacherSession(value: unknown): value is TeacherSession {
  if (!value || typeof value !== "object") return false
  const record = value as Partial<TeacherSession>
  return (
    typeof record.token === "string"
    && !!record.user
    && typeof record.user.userId === "string"
    && typeof record.user.account === "string"
    && typeof record.user.displayName === "string"
    && typeof record.user.role === "string"
    && Array.isArray(record.classPermissions)
  )
}

export function loadTeacherSession(): TeacherSession | null {
  if (typeof window === "undefined") return null
  const raw = window.sessionStorage.getItem(TEACHER_SESSION_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (isTeacherSession(parsed)) return parsed
  } catch {
    // 存储内容损坏时清理，避免刷新后反复进入异常状态。
  }
  window.sessionStorage.removeItem(TEACHER_SESSION_STORAGE_KEY)
  return null
}

export function saveTeacherSession(session: TeacherSession): void {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(TEACHER_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearTeacherSession(): void {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(TEACHER_SESSION_STORAGE_KEY)
}
