/**
 * 文件说明：模块 4 课时 6 公共挑战匿名存储工具。
 * 职责：为独立公共挑战页生成并持久化匿名 session id，并提供当前 runId 的轻量缓存能力。
 * 更新触发：匿名标识 localStorage key、run 恢复策略、隐私边界或公共挑战运行时缓存规则变化时，需要同步更新本文件。
 */

const ANON_SESSION_KEY = "classquest:module4:lesson6:anon-session"
const ACTIVE_RUN_KEY = "classquest:module4:lesson6:active-run"

function fallbackAnonSessionId(): string {
  return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`
}

export function ensureAnonSessionId(): string {
  if (typeof window === "undefined") return fallbackAnonSessionId()
  const existing = window.localStorage.getItem(ANON_SESSION_KEY)
  if (existing?.trim()) return existing.trim()

  const next = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : fallbackAnonSessionId()
  window.localStorage.setItem(ANON_SESSION_KEY, next)
  return next
}

export function readActivePublicChallengeRunId(context: string): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(ACTIVE_RUN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { context?: string; runId?: string }
    return parsed.context === context && parsed.runId ? parsed.runId : null
  } catch {
    return null
  }
}

export function writeActivePublicChallengeRunId(context: string, runId: string): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify({ context, runId }))
}

export function clearActivePublicChallengeRunId(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(ACTIVE_RUN_KEY)
}
