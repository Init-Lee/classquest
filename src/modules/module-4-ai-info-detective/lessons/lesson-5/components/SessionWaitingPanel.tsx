/**
 * 文件说明：模块 4 课时 5 课堂等待面板。
 * 职责：醒目展示学生已连接的 session、当前 phase、题量设置、作答/快评进度与手动刷新入口，作为 Step2 试答开放前后的状态区。
 * 更新触发：课时 5 session phase 文案、session 标题视觉、participant 进度字段、刷新交互或 Step2 等待策略变化时，需要同步更新本文件。
 */

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import type { Lesson5SessionStateResponse } from "@/modules/module-4-ai-info-detective/api/lesson5-types"
import type { Module4Lesson5ConnectedSessionState } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

const PHASE_LABELS: Record<string, string> = {
  pool_locked: "等待老师开放试答",
  trial_open: "试答已开放",
  trial_locked: "试答已锁定",
  analytics_open: "反馈统计已开放",
  revision_open: "修订已开放",
  closed: "课堂已结束",
}

export function SessionWaitingPanel({
  session,
  state,
  loading,
  error,
  onRefresh,
}: {
  session: Module4Lesson5ConnectedSessionState
  state?: Lesson5SessionStateResponse
  loading: boolean
  error: string
  onRefresh: () => void
}) {
  const phase = state?.phase ?? session.phase
  const settings = state?.settings ?? {
    questionCount: session.questionCount,
    newsCount: session.newsCount,
    imageCount: session.imageCount,
  }
  const phaseIsOpen = phase === "trial_open"

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle>课堂状态</CardTitle>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">{session.className || session.classId}</p>
              <p className="mt-1 text-xl font-semibold leading-snug text-slate-950">
                {session.title || "课时5课堂"}
              </p>
            </div>
          </div>
          <Badge variant={phaseIsOpen ? "success" : "warning"}>
            {PHASE_LABELS[phase] ?? phase}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">总题量</p>
            <p className="mt-1 font-semibold">{settings.questionCount} 题</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">新闻题卡</p>
            <p className="mt-1 font-semibold">{settings.newsCount} 题</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">图片题卡</p>
            <p className="mt-1 font-semibold">{settings.imageCount} 题</p>
          </div>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-blue-800">
          {phaseIsOpen
            ? "老师已开放试答。请在下方按顺序完成作答、查看解析并提交快评。"
            : "请先等待老师开放试答；本页会先展示你本轮要看到的题卡列表。"}
        </div>

        {state && (
          <p className="text-xs text-muted-foreground">
            当前进度：已作答 {state.participant.answeredCount} 题，已评分 {state.participant.ratedCount} 题。
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          {loading ? "刷新中..." : "刷新课堂状态"}
        </Button>
      </CardContent>
    </Card>
  )
}
