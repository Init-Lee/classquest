/**
 * 文件说明：模块 4 课时 4 作者侧送审面板。
 * 职责：展示我的题卡送审状态、目标同伴输入、审查码、等待倒计时、刷新/撤回/拉取反馈动作。
 * 更新触发：出站状态机、送审表单字段、按钮动作或等待文案变化时，需要同步更新本文件。
 */

import type { Module4Lesson4State } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { getLesson4OutboundStatusLabel } from "../utils/normalize-lesson4-review-status"
import { formatLesson4Elapsed } from "../utils/lesson4-timers"
import { ReviewCountdown } from "./ReviewCountdown"

export function OutboundReviewPanel({
  state,
  serverNow,
  classPrefix,
  targetSeatSuffix,
  error,
  busy,
  onTargetSeatSuffixChange,
  onCreate,
  onRefresh,
  onCancel,
  onPull,
  onCountdownExpire,
}: {
  state: Module4Lesson4State["outbound"]
  serverNow: string
  classPrefix: string
  targetSeatSuffix: string
  error: string
  busy: boolean
  onTargetSeatSuffixChange: (value: string) => void
  onCreate: () => void
  onRefresh: () => void
  onCancel: () => void
  onPull: () => void
  onCountdownExpire?: () => void
}) {
  const statusLabel = getLesson4OutboundStatusLabel(state.status)
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">我的题卡送审</CardTitle>
          <Badge variant={state.completed ? "success" : "secondary"}>{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">只填写同伴学号后两位，将你的新闻题卡 V1 和图片题卡 V1 打包送给同班同学审查。</p>

        {(state.status === "not_sent" || state.status === "cancelled" || state.status === "expired") && (
          <div className="space-y-3">
            {state.status === "expired" && <p className="rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800">本次送审已过期，请重新选择审查同伴。</p>}
            {state.status === "cancelled" && <p className="rounded-md bg-muted px-3 py-2 text-sm">你已撤回本次送审，可以重新选择审查同伴。</p>}
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="lesson4-target-seat-suffix">目标同伴班学号</label>
              <div className="flex items-stretch gap-2">
                <div
                  className="flex h-10 min-w-[3.25rem] shrink-0 items-center justify-center rounded-md border border-input bg-muted px-3 font-mono text-sm font-semibold tabular-nums text-foreground"
                  title={classPrefix ? `当前班级前缀 ${classPrefix}` : undefined}
                >
                  {classPrefix || "—"}
                </div>
                <Input
                  id="lesson4-target-seat-suffix"
                  className="flex-1 min-w-0 font-mono tabular-nums"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="后两位：01～50"
                  value={targetSeatSuffix}
                  onChange={event => onTargetSeatSuffixChange(event.target.value.replace(/\D/g, "").slice(0, 2))}
                  aria-describedby="lesson4-target-seat-hint"
                  aria-label="目标同伴学号后两位（当前班级前缀已在左侧显示）"
                />
              </div>
              <p id="lesson4-target-seat-hint" className="text-xs text-muted-foreground">
                左侧为你当前班级的前两位前缀；右侧只填写同班同伴学号后两位，送审时合成为完整 4 位班学号。
              </p>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button className="w-full" disabled={busy} onClick={onCreate}>打包并送审</Button>
          </div>
        )}

        {state.status === "pending" && (
          <div className="space-y-3">
            <p className="text-sm">已送达给：<span className="font-semibold">{state.targetReviewerSeatCode}</span></p>
            <p className="rounded-md border bg-muted px-3 py-2 text-sm">审查码：<span className="text-lg font-semibold tracking-widest">{state.inviteCode}</span></p>
            <ReviewCountdown label="等待领取剩余" serverNow={serverNow} expiresAt={state.pendingExpiresAt} onExpire={onCountdownExpire} />
            <p className="text-xs text-muted-foreground">请把审查码告诉同伴，对方输入正确审查码后才能领取。</p>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" disabled={busy} onClick={onRefresh}>手动刷新</Button>
              <Button variant="outline" disabled={busy} onClick={onCancel}>撤回并重新选择</Button>
            </div>
          </div>
        )}

        {state.status === "claimed" && (
          <div className="space-y-3">
            <p className="text-sm">{state.targetReviewerSeatCode} 已领取你的题卡，正在审查。</p>
            <ReviewCountdown label="同伴审查剩余" serverNow={serverNow} expiresAt={state.reviewExpiresAt} onExpire={onCountdownExpire} />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button variant="outline" disabled={busy} onClick={onRefresh}>手动刷新</Button>
          </div>
        )}

        {state.status === "submitted" && (
          <div className="space-y-3">
            <p className="text-sm font-medium">同伴已提交反馈。</p>
            <p className="text-xs text-muted-foreground">已提交：{formatLesson4Elapsed(serverNow, state.sentAt)} 前</p>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button disabled={busy} onClick={onPull}>拉取反馈</Button>
          </div>
        )}

        {state.status === "pulled" && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">你的题卡已收到同伴反馈。</p>
        )}
      </CardContent>
    </Card>
  )
}
