/**
 * 文件说明：模块 4 课时 6 公共挑战完成摘要面板。
 * 职责：展示 summary 端点返回的答题数量、挑战 context 与完成时间，并提供重新开始一轮公共挑战的入口。
 * 更新触发：公共挑战 summary DTO、完成态展示字段、context 命名口径或再来一局重置策略变化时，需要同步更新本文件。
 */

import { CheckCircle2, RotateCcw } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import type { PublicChallengeSummary } from "@/modules/module-4-ai-info-detective/api/lesson6-types"

function contextLabel(context: PublicChallengeSummary["context"]): string {
  return context === "lesson6_class" ? "课时 6 课堂挑战" : "公开展示挑战"
}

function formatCompletedAt(value: string | null | undefined): string {
  if (!value) return "本轮完成时间暂未返回"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function PublicChallengeCompletePanel({
  summary,
  embeddedInLesson6,
  onRestart,
}: {
  summary: PublicChallengeSummary | null
  embeddedInLesson6: boolean
  onRestart: () => void
}) {
  const answeredCount = summary?.answeredCount ?? 0
  const questionCount = summary?.questionCount ?? 6

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-950">
          <CheckCircle2 className="h-5 w-5" />
          公共挑战已完成
        </CardTitle>
        <CardDescription className="text-green-900/80">
          {embeddedInLesson6 ? "你已完成课时内公共挑战，可以继续完成课堂反思。" : "你已完成本轮公共挑战，可以查看摘要或重新开始一轮。"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-green-950">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-green-200 bg-white/75 px-4 py-3">
            <p className="text-xs text-green-800/80">答题进度</p>
            <p className="mt-1 text-lg font-semibold">{answeredCount} / {questionCount} 题</p>
          </div>
          <div className="rounded-2xl border border-green-200 bg-white/75 px-4 py-3">
            <p className="text-xs text-green-800/80">挑战类型</p>
            <p className="mt-1 text-lg font-semibold">{summary ? contextLabel(summary.context) : "公共挑战"}</p>
          </div>
          <div className="rounded-2xl border border-green-200 bg-white/75 px-4 py-3">
            <p className="text-xs text-green-800/80">完成时间</p>
            <p className="mt-1 text-sm font-medium">{formatCompletedAt(summary?.completedAt)}</p>
          </div>
        </div>
        <Button className="rounded-full bg-green-700 text-white hover:bg-green-800" onClick={onRestart}>
          <RotateCcw className="mr-2 h-4 w-4" />
          再来一局
        </Button>
      </CardContent>
    </Card>
  )
}
