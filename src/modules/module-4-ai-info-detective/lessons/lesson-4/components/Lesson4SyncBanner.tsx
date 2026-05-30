/**
 * 文件说明：课时 4 Step1 互审页面级同步状态横幅。
 * 职责：在标题下统一展示「正在同步」「已连接」「离线」「本地已对齐」等状态，避免仅出现在出站/入站一侧。
 * 更新触发：lesson4-sync-status 阶段枚举、横幅文案或展示样式变化时，需要同步更新本文件。
 */

import type { Lesson4SyncPhase } from "../utils/lesson4-sync-status"

export function Lesson4SyncBanner({
  phase,
  serverReachable,
  httpMode,
}: {
  phase: Lesson4SyncPhase
  /** 最近一次成功 sync 后视为已连接，用于 idle 时轻量常驻提示。 */
  serverReachable: boolean
  httpMode: boolean
}) {
  if (!httpMode) return null

  if (phase === "syncing") {
    return (
      <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
        正在与服务器同步…
      </p>
    )
  }

  if (phase === "offline") {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        无法连接服务器，请检查网络或确认后端已启动。
      </p>
    )
  }

  if (phase === "stale_reset") {
    return (
      <p className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        本地互审记录已与服务器对齐，可重新送审或刷新待审任务。
      </p>
    )
  }

  if (phase === "ok") {
    return (
      <p className="rounded-md border border-green-300/60 bg-green-50 px-3 py-2 text-sm text-green-800">
        已与服务器同步
      </p>
    )
  }

  // idle 且曾成功连通过才轻量常驻「已连接」；offline 阶段 serverReachable 已为 false。
  if (phase === "idle" && serverReachable) {
    return (
      <p className="rounded-md border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        服务器已连接
      </p>
    )
  }

  return null
}
