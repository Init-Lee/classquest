/**
 * 文件说明：模块 4 课时 5 学生本人题卡统计卡片。
 * 职责：以零依赖 CSS 条形和状态标签展示 my-report 中单张 news/image 题卡的正确率、评分均值、问题标记与样例评论。
 * 更新触发：my-report 题卡统计字段、statsStatus 三色口径、Step3 信息结构或学生反馈说明变化时，需要同步更新本文件。
 */

import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import type { Lesson5MaterialKind, Lesson5MyReportItemStatsDto, Lesson5StatsStatus } from "@/modules/module-4-ai-info-detective/api/lesson5-types"
import { DiagnosisHintPanel } from "./DiagnosisHintPanel"

const kindLabels: Record<Lesson5MaterialKind, string> = {
  news: "新闻题卡",
  image: "图片题卡",
}

function statsCardTitle(item: Lesson5MyReportItemStatsDto): string {
  const shortName = item.itemShortName?.trim()
  return shortName || kindLabels[item.kind]
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

function formatRate(value: number): string {
  return `${Math.round(value * 100)}%`
}

function MetricBar({ label, value, max, suffix = "" }: { label: string; value: number | null; max: number; suffix?: string }) {
  const normalized = value == null ? 0 : Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value == null ? "暂无" : `${value.toFixed(1)}${suffix}`}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-900" style={{ width: `${normalized}%` }} />
      </div>
    </div>
  )
}

interface MyItemStatsCardProps {
  item: Lesson5MyReportItemStatsDto
}

export function MyItemStatsCard({ item }: MyItemStatsCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{statsCardTitle(item)}</CardTitle>
          </div>
          <Badge variant="outline" className={statusClasses[item.statsStatus]}>
            {statusLabels[item.statsStatus]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground">有效作答</p>
            <p className="mt-1 text-2xl font-semibold">{item.validAnswerCount}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground">正确率</p>
            <p className="mt-1 text-2xl font-semibold">{formatRate(item.correctRate)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground">问题标记率</p>
            <p className="mt-1 text-2xl font-semibold">{formatRate(item.issueFlagRate)}</p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border bg-white p-4">
          <MetricBar label="题干清晰度" value={item.avgClarity} max={3} suffix=" / 3" />
          <MetricBar label="思考价值" value={item.avgThinkingValue} max={3} suffix=" / 3" />
          <MetricBar label="解析帮助度" value={item.avgExplanationHelpfulness} max={3} suffix=" / 3" />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-700">问题标记</p>
            <p className="mt-2 leading-6 text-muted-foreground">
              {item.issueFlags.length > 0 ? item.issueFlags.join("、") : "暂无集中问题标记"}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-700">样例评论</p>
            <p className="mt-2 leading-6 text-muted-foreground">
              {item.sampleComments[0] || "暂无样例评论。"}
            </p>
          </div>
        </div>

        <DiagnosisHintPanel hints={item.diagnosisHints} />
        <p className="text-xs leading-5 text-muted-foreground">
          本报告用于指导修订，不作为分数或排名；样本状态越稳定，越适合参考整体趋势。
        </p>
      </CardContent>
    </Card>
  )
}
