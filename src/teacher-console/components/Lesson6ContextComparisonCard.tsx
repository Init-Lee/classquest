/**
 * 文件说明：课时 6 公共挑战 context 对比卡。
 * 职责：基于全量 item-stats 前端派生课上学生与访客的整体正确率对比，并用中性文案提示足量样本下的逐题 context 差异。
 * 更新触发：Lesson6 item-stats 字段、context 差异阈值、公共挑战统计隐私边界或 C5 统计面板信息架构变化时，需要同步更新本文件。
 */

import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import type { Lesson6PublicItemStat } from "@/teacher-console/types"
import {
  buildLesson6ContextComparisonSummary,
  getLesson6ContextRateDifference,
  LESSON6_DEFAULT_CONTEXT_DIFFERENCE_THRESHOLDS,
} from "@/teacher-console/utils/lesson6-stat-signals"

interface Lesson6ContextComparisonCardProps {
  items: Lesson6PublicItemStat[]
  loading?: boolean
  publicBankCount?: number
}

function formatRate(value: number | null | undefined): string {
  return value == null ? "暂无" : `${Math.round(value * 100)}%`
}

function formatRatePoint(value: number | null | undefined): string {
  return value == null ? "暂无" : `${Math.round(value * 100)} 个百分点`
}

function itemTitle(item: Lesson6PublicItemStat): string {
  return item.itemShortName.trim() || item.itemVersionId || item.itemId
}

function ContextStatCard({
  label,
  rate,
  answerCount,
  correctCount,
}: {
  label: string
  rate: number | null
  answerCount: number
  correctCount: number
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{formatRate(rate)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{correctCount} / {answerCount} 次作答</p>
    </div>
  )
}

export function Lesson6ContextComparisonCard({
  items,
  loading = false,
  publicBankCount = items.length,
}: Lesson6ContextComparisonCardProps) {
  const notReady = publicBankCount < 6
  const summary = buildLesson6ContextComparisonSummary(items)
  const hasAnyAnswer = summary.lesson6ClassAnswerCount + summary.publicShowcaseAnswerCount > 0
  const hasBothContexts = summary.lesson6ClassAnswerCount > 0 && summary.publicShowcaseAnswerCount > 0
  const minContextAnswerCount = LESSON6_DEFAULT_CONTEXT_DIFFERENCE_THRESHOLDS.minContextAnswerCount

  if (loading && items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>课上 vs 访客对比</CardTitle>
          <CardDescription>正在加载公共挑战 context 对比数据...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>课上 vs 访客对比</CardTitle>
            <CardDescription>
              基于全量公共题库逐题统计前端聚合，只展示匿名题目简称与 context 汇总，不展示作者或应答者身份。
            </CardDescription>
          </div>
          {loading && <span className="text-xs text-muted-foreground">刷新中...</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {notReady && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            公共题库当前少于 6 题，公共挑战完整抽题还未就绪；对比数据会随公共题库与作答样本继续积累。
          </p>
        )}

        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-slate-50 p-4 text-sm text-muted-foreground">
            还没有公共题库逐题统计数据；确认发布并产生作答后，再查看课上与访客的对比。
          </p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <ContextStatCard
                label="课上学生正确率"
                rate={summary.lesson6ClassCorrectRate}
                answerCount={summary.lesson6ClassAnswerCount}
                correctCount={summary.lesson6ClassCorrectCount}
              />
              <ContextStatCard
                label="访客正确率"
                rate={summary.publicShowcaseCorrectRate}
                answerCount={summary.publicShowcaseAnswerCount}
                correctCount={summary.publicShowcaseCorrectCount}
              />
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-muted-foreground">整体差异</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{formatRatePoint(summary.rateDifference)}</p>
                <p className="mt-1 text-xs text-muted-foreground">仅作 context 观察，不作为题目质量结论。</p>
              </div>
            </div>

            {!hasAnyAnswer && (
              <p className="rounded-lg border border-dashed bg-slate-50 p-3 text-sm text-muted-foreground">
                当前题目已有公共题库记录，但还没有作答样本；统计信号会在真实运行后出现。
              </p>
            )}

            {hasAnyAnswer && !hasBothContexts && (
              <p className="rounded-lg border border-dashed bg-slate-50 p-3 text-sm text-muted-foreground">
                目前只有单侧 context 产生作答；请等待课上学生和访客两侧都有样本后再比较差异。
              </p>
            )}

            {hasBothContexts && summary.highlightedItems.length === 0 && (
              <p className="rounded-lg border border-dashed bg-slate-50 p-3 text-sm text-muted-foreground">
                暂无两侧均达到 {minContextAnswerCount} 次作答且差异显著的题目；小样本阶段不下绝对结论。
              </p>
            )}

            {summary.highlightedItems.length > 0 && (
              <section className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">context 差异提示</h3>
                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-800">
                    两侧均不少于 {minContextAnswerCount} 次作答
                  </Badge>
                </div>
                <div className="mt-3 divide-y">
                  {summary.highlightedItems.map(item => (
                    <div key={item.itemVersionId} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{itemTitle(item)}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            这道题在课上学生和访客中的正确率差异较大。
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">{formatRatePoint(getLesson6ContextRateDifference(item))}</p>
                          <p className="text-xs text-muted-foreground">
                            课上 {formatRate(item.lesson6ClassCorrectRate)} · 访客 {formatRate(item.publicShowcaseCorrectRate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
