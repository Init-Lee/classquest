/**
 * 文件说明：模块 4 课时 6 公共挑战不可用空态。
 * 职责：为公共题库不足和匿名访问限流提供友好说明、可见题量信息与重试入口。
 * 更新触发：公共挑战错误类型、题库可用题量口径、限流提示文案或空态交互策略变化时，需要同步更新本文件。
 */

import { AlertTriangle, Clock3, RotateCcw } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

type NotReadyReason = "public_bank_not_ready" | "rate_limited"

export function PublicChallengeNotReadyState({
  reason,
  message,
  availableCount,
  onRetry,
}: {
  reason: NotReadyReason
  message: string
  availableCount?: number
  onRetry: () => void
}) {
  const isRateLimited = reason === "rate_limited"
  const Icon = isRateLimited ? Clock3 : AlertTriangle

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-950">
          <Icon className="h-5 w-5" />
          {isRateLimited ? "公共挑战请求太频繁" : "公共题库还在准备中"}
        </CardTitle>
        <CardDescription className="text-amber-900/80">
          {message || (isRateLimited ? "请稍等一会儿再重新开始公共挑战。" : "当前公开题卡数量不足，暂时无法组成 6 题挑战。")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-amber-950">
        {!isRateLimited && (
          <div className="rounded-2xl border border-amber-200 bg-white/70 px-4 py-3">
            <p className="text-xs text-amber-800/80">当前可用公开题卡</p>
            <p className="mt-1 text-2xl font-semibold">
              {typeof availableCount === "number" ? availableCount : 0}
              <span className="ml-1 text-sm font-normal text-amber-800/80">/ 6 题</span>
            </p>
          </div>
        )}
        <Button variant="outline" className="rounded-full border-amber-300 text-amber-950" onClick={onRetry}>
          <RotateCcw className="mr-2 h-4 w-4" />
          重新检查
        </Button>
      </CardContent>
    </Card>
  )
}
