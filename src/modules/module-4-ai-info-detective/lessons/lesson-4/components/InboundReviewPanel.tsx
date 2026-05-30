/**
 * 文件说明：模块 4 课时 4 审查者侧任务面板。
 * 职责：展示发给我的互审任务、审查码领取入口；claimed 时始终展示整体提交按钮（双卡通过前灰色 disabled）。
 * 更新触发：入站任务状态、分卡/整体提交流程、claimed 审查倒计时或审查码校验变化时，需要同步更新本文件。
 */

import type { Module4Lesson4State } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import type { Lesson4ReviewerInboxTask } from "@/modules/module-4-ai-info-detective/api/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import {
  getLesson4InboundStatusLabel,
  getLesson4RequestStatusLabel,
} from "../utils/normalize-lesson4-review-status"
import { ReviewCodeInput } from "./ReviewCodeInput"
import { ReviewCountdown } from "./ReviewCountdown"

export function InboundReviewPanel({
  state,
  tasks,
  serverNow,
  reviewCode,
  error,
  busy,
  bothCardsApproved,
  finalSubmitMessage,
  onReviewCodeChange,
  onRefresh,
  onClaim,
  onFinalSubmit,
  onCountdownExpire,
}: {
  state: Module4Lesson4State["inbound"]
  tasks: Lesson4ReviewerInboxTask[]
  serverNow: string
  reviewCode: string
  error: string
  busy: boolean
  bothCardsApproved: boolean
  finalSubmitMessage: string
  onReviewCodeChange: (value: string) => void
  onRefresh: () => void
  onClaim: (task: Lesson4ReviewerInboxTask) => void
  onFinalSubmit: () => void
  onCountdownExpire?: () => void
}) {
  const firstTask = tasks[0]
  /** 仅 idle/available 展示领取表单；claimed 后 tasks 可能仍残留 pending 行，不可再依赖 firstTask 判断。 */
  const showClaimForm =
    firstTask != null && (state.status === "idle" || state.status === "available")
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">我要审查别人</CardTitle>
          <Badge variant={state.completed ? "success" : "secondary"}>{getLesson4InboundStatusLabel(state.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(state.status === "idle" || state.status === "available") && (
          <>
            <p className="text-sm text-muted-foreground">点击刷新，查看是否有发给你的审查任务。</p>
            <Button variant="outline" disabled={busy} onClick={onRefresh}>刷新待审任务</Button>
          </>
        )}

        {!firstTask && state.status !== "submitted" && state.status !== "claimed" && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm">暂时没有发给你的审查任务。请确认同伴是否已填写你的学号后两位。</p>
        )}

        {showClaimForm && (
          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">来自 {firstTask.authorSeatCode} 的题卡审查请求</p>
            <p className="text-xs text-muted-foreground">
              状态：{getLesson4RequestStatusLabel(firstTask.status)}
              {firstTask.status === "pending" ? " · 需向同伴索取 4 位审查码后才能领取完整题卡。" : ""}
            </p>
            {firstTask.pendingExpiresAt && (
              <ReviewCountdown label="等待领取剩余" serverNow={serverNow} expiresAt={firstTask.pendingExpiresAt} onExpire={onCountdownExpire} />
            )}
            <ReviewCodeInput value={reviewCode} error={error} onChange={onReviewCodeChange} />
            <Button className="w-full" disabled={busy} onClick={() => onClaim(firstTask)}>领取并开始审查</Button>
          </div>
        )}

        {state.status === "claimed" && (
          <div className="space-y-3">
            {state.authorSeatCode && (
              <p className="text-sm">正在审查 {state.authorSeatCode} 的题卡。</p>
            )}
            {state.reviewExpiresAt && (
              <ReviewCountdown label="审查剩余" serverNow={serverNow} expiresAt={state.reviewExpiresAt} onExpire={onCountdownExpire} />
            )}
            <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
              请在下方工作台逐卡完成试答与审查；两张题卡均通过后可整体提交。
            </p>
            <div className="space-y-2 rounded-lg border p-3">
              {bothCardsApproved ? (
                <p className="text-sm font-medium text-green-900">两张题卡审查均已通过</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  整体提交将在新闻与图片题卡均通过「提交本卡审查」后启用。
                </p>
              )}
              <Button
                className="w-full"
                variant={bothCardsApproved ? "default" : "secondary"}
                disabled={!bothCardsApproved || busy}
                onClick={onFinalSubmit}
              >
                整体提交
              </Button>
            </div>
            {finalSubmitMessage && (
              <p className="text-sm text-destructive">{finalSubmitMessage}</p>
            )}
          </div>
        )}

        {state.status === "submitted" && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">你已完成一次同伴题卡审查。</p>
        )}
      </CardContent>
    </Card>
  )
}
