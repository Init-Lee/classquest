/**
 * 文件说明：模块 4 课时 4 倒计时展示组件。
 * 职责：统一展示 pending/claimed 阶段剩余时间；基于 serverNow 本地每秒 tick，与后端轮询互补。
 * 更新触发：互审计时文案、倒计时样式、expiresAt/serverNow 重锚与 tick 策略、onExpire 触发条件变化时，需要同步更新本文件。
 */

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/shared/ui/badge"
import {
  computeLesson4RemainingSeconds,
  formatLesson4Countdown,
  resolveLesson4AnchorNow,
} from "../utils/lesson4-timers"

export function ReviewCountdown({
  label,
  serverNow,
  expiresAt,
  onExpire,
}: {
  label: string
  serverNow: string
  expiresAt: string
  /** 倒计时归零时触发一次，供父组件立即拉取 status/inbox。 */
  onExpire?: () => void
}) {
  const [displayNow, setDisplayNow] = useState(() => resolveLesson4AnchorNow(serverNow))
  const expiredFiredRef = useRef(false)

  /** serverNow 由 hydrate/轮询更新时需重锚 displayNow；与 expiresAt 一并作为 tick 起点。重锚时重置 expire 守卫，避免 hydrate 前误触发后不再刷新。 */
  useEffect(() => {
    expiredFiredRef.current = false
    const anchorNow = resolveLesson4AnchorNow(serverNow)
    setDisplayNow(anchorNow)

    const baseMs = Date.parse(anchorNow)
    if (!Number.isFinite(baseMs)) return

    const startedAt = Date.now()
    const timerId = window.setInterval(() => {
      const elapsedMs = Date.now() - startedAt
      setDisplayNow(new Date(baseMs + elapsedMs).toISOString())
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [expiresAt, serverNow])

  useEffect(() => {
    if (!onExpire) return
    const remaining = computeLesson4RemainingSeconds(displayNow, expiresAt)
    if (remaining === null) return
    if (remaining <= 0 && !expiredFiredRef.current) {
      expiredFiredRef.current = true
      onExpire()
    }
  }, [displayNow, expiresAt, onExpire])

  return (
    <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant="warning">{formatLesson4Countdown(displayNow, expiresAt)}</Badge>
    </div>
  )
}
