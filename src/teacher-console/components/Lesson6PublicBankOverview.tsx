/**
 * 文件说明：课时 6 公共题库概览卡。
 * 职责：展示教师可见范围内已确认可发布题卡与待确认审核题卡的总量、新闻题和图片题分布。
 * 更新触发：Lesson6 overview.publicBank/pendingReview 字段、顶部概览信息架构或 C2/C5 发布审核口径变化时，需要同步更新本文件。
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import type { Lesson6Overview } from "@/teacher-console/types"

interface Lesson6PublicBankOverviewProps {
  overview: Lesson6Overview | null
  loading?: boolean
}

function CountPill({ label, value }: { label: string, value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export function Lesson6PublicBankOverview({
  overview,
  loading = false,
}: Lesson6PublicBankOverviewProps) {
  if (loading && !overview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>公共题库概览</CardTitle>
          <CardDescription>正在加载已确认可发布与待确认题卡数量...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!overview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>公共题库概览</CardTitle>
          <CardDescription>暂无公共题库概览数据，请刷新或稍后重试。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>公共题库概览</CardTitle>
        <CardDescription>
          汇总当前账号可见班级中已确认可发布的 V3 题卡，以及仍待教师确认的审核队列规模。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <section className="rounded-2xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium">已确认可发布</h2>
              <p className="mt-1 text-xs text-muted-foreground">可进入公共挑战候选池的题卡</p>
            </div>
            {loading && <span className="text-xs text-muted-foreground">刷新中...</span>}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <CountPill label="总数" value={overview.publicBank.totalPublishable} />
            <CountPill label="新闻题" value={overview.publicBank.newsCount} />
            <CountPill label="图片题" value={overview.publicBank.imageCount} />
          </div>
        </section>

        <section className="rounded-2xl border p-4">
          <div>
            <h2 className="text-sm font-medium">待确认审核</h2>
            <p className="mt-1 text-xs text-muted-foreground">仍需教师预览并确认是否发布的 V3 题卡</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <CountPill label="总数" value={overview.pendingReview.totalPending} />
            <CountPill label="新闻题" value={overview.pendingReview.newsCount} />
            <CountPill label="图片题" value={overview.pendingReview.imageCount} />
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
