/**
 * 文件说明：课时 6 公共挑战基础统计面板。
 * 职责：展示 overview.challengeStats 的核心运行数字，以及 topStats 中答题最多、正确率最低、正确率最高的 Top N 简表。
 * 更新触发：Lesson6 overview.challengeStats/topStats 字段、基础统计展示口径或完整题目统计表拆分边界变化时，需要同步更新本文件。
 */

import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import type { Lesson6Overview, Lesson6PublicQuestionTopStatsItem } from "@/teacher-console/types"

interface Lesson6ChallengeStatsPanelProps {
  overview: Lesson6Overview | null
  loading?: boolean
  topLimit?: number
}

function formatRate(value: number | null | undefined): string {
  return value == null ? "暂无" : `${Math.round(value * 100)}%`
}

function itemTitle(item: Lesson6PublicQuestionTopStatsItem): string {
  return item.itemShortName?.trim()
    || item.itemVersionId
    || item.itemId
    || (item.cardKind === "image" ? "图片题卡" : "新闻题卡")
}

function StatCard({ label, value, hint }: { label: string, value: string | number, hint: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function TopStatsTable({
  title,
  items,
  emptyText,
}: {
  title: string
  items: Lesson6PublicQuestionTopStatsItem[]
  emptyText: string
}) {
  return (
    <section className="rounded-2xl border p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed bg-slate-50 p-3 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b text-xs text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-medium">题卡</th>
                <th className="py-2 pr-4 font-medium">类型</th>
                <th className="py-2 pr-4 font-medium">作答数</th>
                <th className="py-2 font-medium">正确率</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={`${item.itemId || item.itemVersionId || itemTitle(item)}-${index}`} className="border-b last:border-b-0">
                  <td className="py-3 pr-4">
                    <p className="max-w-[180px] truncate font-medium">{itemTitle(item)}</p>
                    {item.itemVersionId && (
                      <p className="mt-1 max-w-[180px] truncate text-xs text-muted-foreground">{item.itemVersionId}</p>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={item.cardKind === "image" ? "warning" : "secondary"}>
                      {item.cardKind === "image" ? "图片" : "新闻"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">{item.totalAnswerCount ?? 0}</td>
                  <td className="py-3">{formatRate(item.totalCorrectRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function Lesson6ChallengeStatsPanel({
  overview,
  loading = false,
  topLimit = 3,
}: Lesson6ChallengeStatsPanelProps) {
  if (loading && !overview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>公共挑战基础统计</CardTitle>
          <CardDescription>正在加载运行次数、作答量与 Top N 题卡...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!overview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>公共挑战基础统计</CardTitle>
          <CardDescription>暂无公共挑战统计数据；确认发布并产生作答后，将显示运行次数、正确率与 Top 题卡。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { challengeStats, topStats } = overview

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>公共挑战基础统计</CardTitle>
            <CardDescription>
              展示课时 6 运行与作答的核心数字；逐题统计与 context 对比使用匿名 item 标签。
            </CardDescription>
          </div>
          {loading && <span className="text-xs text-muted-foreground">刷新中...</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-5">
          <StatCard label="总运行" value={challengeStats.totalRuns} hint="课堂 + 公共展示" />
          <StatCard label="课时 6 课堂运行" value={challengeStats.lesson6ClassRuns} hint="教师课堂场景" />
          <StatCard label="公共展示运行" value={challengeStats.publicShowcaseRuns} hint="公共挑战场景" />
          <StatCard label="总作答" value={challengeStats.totalAnswers} hint="所有题卡作答数" />
          <StatCard label="整体正确率" value={formatRate(challengeStats.overallCorrectRate)} hint="按后端聚合口径" />
        </div>

        {challengeStats.totalRuns === 0 && challengeStats.totalAnswers === 0 && (
          <p className="rounded-lg border border-dashed bg-slate-50 p-3 text-sm text-muted-foreground">
            目前还没有公共挑战运行或作答数据；确认发布后需等待真实运行产生统计。
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <TopStatsTable
            title="作答最多"
            items={topStats.mostAnswered.slice(0, topLimit)}
            emptyText="暂无作答最多题卡。"
          />
          <TopStatsTable
            title="正确率最低"
            items={topStats.lowestCorrectRate.slice(0, topLimit)}
            emptyText="暂无正确率最低题卡。"
          />
          <TopStatsTable
            title="正确率最高"
            items={topStats.highestCorrectRate.slice(0, topLimit)}
            emptyText="暂无正确率最高题卡。"
          />
        </div>
      </CardContent>
    </Card>
  )
}
