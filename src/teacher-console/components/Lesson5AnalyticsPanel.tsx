/**
 * 文件说明：课时 5 教师 analytics 面板。
 * 职责：读取并展示 C6 题卡级统计结果，使用零依赖 CSS 条形呈现正确率、问题标记率和三维评分，供教师判断统计开放后和修订期的班级反馈质量。
 * 更新触发：教师 analytics API 字段、C6/C7 统计展示口径、statsStatus 三色规则或控制台布局位置变化时，需要同步更新本文件。
 */

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { cn } from "@/shared/utils/cn"
import { teacherLesson5Adapter } from "@/teacher-console/api/teacher-lesson5.adapter"
import type { Lesson5ItemStatsDto, Lesson5SessionAnalyticsResponse, Lesson5StatsStatus } from "@/teacher-console/types"

interface Lesson5AnalyticsPanelProps {
  token: string
  sessionId: string
  phase: string
  refreshKey?: number
  embedded?: boolean
}

const statusLabels: Record<Lesson5StatsStatus, string> = {
  insufficient: "样本不足",
  preliminary: "初步参考",
  stable: "较稳定",
}

const statusClasses: Record<Lesson5StatsStatus, string> = {
  insufficient: "border-amber-200 bg-amber-50 text-amber-800",
  preliminary: "border-sky-200 bg-sky-50 text-sky-800",
  stable: "border-emerald-200 bg-emerald-50 text-emerald-800",
}

function formatRate(value: number | null): string {
  return value == null ? "暂无" : `${Math.round(value * 100)}%`
}

function statsCardTitle(item: Lesson5ItemStatsDto): string {
  const shortName = item.itemShortName?.trim()
  if (shortName) return shortName
  return item.kind === "news" ? "新闻题卡" : "图片题卡"
}

function MetricBar({ label, value, max, legendClass }: { label: string; value: number | null; max: number; legendClass: string }) {
  const normalized = value == null ? 0 : Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value == null ? "暂无" : value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full", legendClass)} style={{ width: `${normalized}%` }} />
      </div>
    </div>
  )
}

function TripleMetricRow({ item }: { item: Lesson5ItemStatsDto }) {
  return (
    <div className="min-w-[140px] space-y-2">
      <MetricBar label="清晰" value={item.avgClarity} max={3} legendClass="bg-sky-600" />
      <MetricBar label="思考" value={item.avgThinkingValue} max={3} legendClass="bg-violet-600" />
      <MetricBar label="解析" value={item.avgExplanationHelpfulness} max={3} legendClass="bg-emerald-600" />
    </div>
  )
}

function ItemRow({ item }: { item: Lesson5ItemStatsDto }) {
  return (
    <tr className="border-b align-top last:border-b-0">
      <td className="py-3 pr-4">
        <div className="space-y-1">
          <Badge variant={item.kind === "news" ? "secondary" : "warning"}>{item.kind === "news" ? "新闻" : "图片"}</Badge>
          <p className="max-w-[180px] truncate text-xs text-muted-foreground">{statsCardTitle(item)}</p>
        </div>
      </td>
      <td className="py-3 pr-4">
        <Badge variant="outline" className={statusClasses[item.statsStatus]}>{statusLabels[item.statsStatus]}</Badge>
        <p className="mt-1 text-xs text-muted-foreground">有效作答 {item.validAnswerCount}</p>
      </td>
      <td className="py-3 pr-4">
        <p className="font-medium">{formatRate(item.correctRate)}</p>
        <p className="text-xs text-muted-foreground">{item.correctCount} / {item.validAnswerCount}</p>
      </td>
      <td className="min-w-[140px] py-3 pr-4">
        <TripleMetricRow item={item} />
      </td>
      <td className="py-3 pr-4">
        <p className="font-medium">{formatRate(item.issueFlagRate)}</p>
        <p className="mt-1 max-w-[220px] text-xs leading-5 text-muted-foreground">
          {item.issueFlags.length > 0 ? item.issueFlags.join("、") : "暂无集中问题标记"}
        </p>
      </td>
      <td className="py-3">
        <p className="max-w-[260px] text-xs leading-5 text-muted-foreground">
          {item.sampleComments[0] || "暂无样例评论。"}
        </p>
      </td>
    </tr>
  )
}

export function Lesson5AnalyticsPanel({
  token,
  sessionId,
  phase,
  refreshKey = 0,
  embedded = false,
}: Lesson5AnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<Lesson5SessionAnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const nextAnalytics = await teacherLesson5Adapter.fetchSessionAnalytics(token, sessionId)
      setAnalytics(nextAnalytics)
    } catch (err) {
      setAnalytics(null)
      setError(err instanceof Error ? err.message : "统计面板加载失败，请先计算统计或稍后重试。")
    } finally {
      setLoading(false)
    }
  }, [sessionId, token])

  const canReadAnalytics = phase === "trial_locked" || phase === "analytics_open" || phase === "revision_open" || phase === "closed"

  useEffect(() => {
    if (canReadAnalytics) {
      void loadAnalytics()
    } else {
      setAnalytics(null)
      setError("")
    }
  }, [canReadAnalytics, loadAnalytics, refreshKey])

  const body = (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => void loadAnalytics()} disabled={loading || !canReadAnalytics}>
          {loading ? "刷新中..." : "刷新统计"}
        </Button>
      </div>
      {!canReadAnalytics && (
        <p className="rounded-lg border border-dashed bg-slate-50 p-4 text-sm text-muted-foreground">
          锁定试答后可计算统计；开放统计后学生才能查看本人报告。
        </p>
      )}
        {error && (
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}
        {analytics && (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">题卡数</p>
                <p className="mt-1 text-xl font-semibold">{analytics.summary.itemCount}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">有效作答</p>
                <p className="mt-1 text-xl font-semibold">{analytics.summary.validAnswerCount}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">平均正确率</p>
                <p className="mt-1 text-xl font-semibold">{formatRate(analytics.summary.averageCorrectRate)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">平均问题标记率</p>
                <p className="mt-1 text-xl font-semibold">{formatRate(analytics.summary.averageIssueFlagRate)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className={statusClasses.insufficient}>样本不足 {analytics.summary.statsStatusBreakdown.insufficient}</Badge>
              <Badge variant="outline" className={statusClasses.preliminary}>初步参考 {analytics.summary.statsStatusBreakdown.preliminary}</Badge>
              <Badge variant="outline" className={statusClasses.stable}>较稳定 {analytics.summary.statsStatusBreakdown.stable}</Badge>
              <span className="self-center text-muted-foreground">生成时间：{new Date(analytics.generatedAt).toLocaleString()}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-medium">题卡</th>
                    <th className="py-2 pr-4 font-medium">样本状态</th>
                    <th className="py-2 pr-4 font-medium">正确率</th>
                    <th className="py-2 pr-4 font-medium">三维均值</th>
                    <th className="py-2 pr-4 font-medium">问题标记</th>
                    <th className="py-2 font-medium">样例评论</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.items.map(item => (
                    <ItemRow key={item.itemVersionId} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
    </div>
  )

  if (embedded) return body

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>统计分析</CardTitle>
            <CardDescription>展示 compute-stats 后的题卡级统计；不暴露题卡作者身份。</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadAnalytics()} disabled={loading || !canReadAnalytics}>
            {loading ? "刷新中..." : "刷新统计"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
