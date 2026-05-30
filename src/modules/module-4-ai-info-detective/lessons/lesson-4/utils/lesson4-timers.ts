/**
 * 文件说明：模块 4 课时 4 计时工具。
 * 职责：基于 serverNow 与过期时间计算倒计时和已提交时长，供互审等待区展示。
 * 更新触发：pending/claimed TTL、时间展示格式、异常阈值或后端 serverNow 语义变化时，需要同步更新本文件。
 */

/** pending ~6min + 缓冲、claimed ~20min；超过此值视为 serverNow 与 expiresAt 未对齐。 */
export const LESSON4_MAX_REASONABLE_COUNTDOWN_SECONDS = 25 * 60

/** 解析 serverNow；无效时用客户端时钟近似，避免 hydrate 前出现荒谬剩余秒数。 */
export function resolveLesson4AnchorNow(serverNow: string): string {
  const parsed = Date.parse(serverNow)
  if (Number.isFinite(parsed)) return serverNow
  return new Date().toISOString()
}

/** 计算距 expiresAt 剩余秒数；expiresAt 无效时返回 null。 */
export function computeLesson4RemainingSeconds(serverNow: string, expiresAt: string): number | null {
  if (!expiresAt) return null
  const expiresMs = Date.parse(expiresAt)
  if (!Number.isFinite(expiresMs)) return null
  const nowMs = Date.parse(resolveLesson4AnchorNow(serverNow))
  return Math.max(0, Math.floor((expiresMs - nowMs) / 1000))
}

export function formatLesson4Countdown(serverNow: string, expiresAt: string): string {
  const remainingSeconds = computeLesson4RemainingSeconds(serverNow, expiresAt)
  if (remainingSeconds === null) return "--:--"
  if (remainingSeconds > LESSON4_MAX_REASONABLE_COUNTDOWN_SECONDS) return "同步中"
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function formatLesson4Elapsed(serverNow: string, since: string): string {
  const nowMs = Date.parse(resolveLesson4AnchorNow(serverNow))
  const sinceMs = Date.parse(since)
  if (!Number.isFinite(nowMs) || !Number.isFinite(sinceMs)) return "刚刚"
  const elapsedMinutes = Math.max(0, Math.floor((nowMs - sinceMs) / 60000))
  if (elapsedMinutes < 1) return "刚刚"
  if (elapsedMinutes < 60) return `${elapsedMinutes} 分钟`
  return `${Math.floor(elapsedMinutes / 60)} 小时`
}
