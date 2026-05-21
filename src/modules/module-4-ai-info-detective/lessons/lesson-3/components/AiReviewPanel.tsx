/**
 * 文件说明：模块 4 课时 3 题卡自检助手面板。
 * 职责：通过模块 API adapter 发起题卡质量自检并展示短建议，失败时提示不影响保存 V1。
 * 更新触发：AI review adapter、展示状态、错误文案或保存阻断策略变化时，需要同步更新本文件。
 */

import { Loader2 } from "lucide-react"
import type { Module4Lesson3AiReviewState, Module4Lesson3QuestionCardDraft } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { reviewLesson3QuestionCard } from "@/modules/module-4-ai-info-detective/api/lesson3-ai-review.adapter"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"

function reviewLabel(status?: string): string {
  if (status === "pass") return "可以保存为 V1"
  if (status === "blocked") return "缺少必要信息"
  return "建议补充后保存"
}

export function AiReviewPanel({
  card,
  onReviewStateChange,
}: {
  card: Module4Lesson3QuestionCardDraft
  onReviewStateChange: (next: Module4Lesson3AiReviewState) => void
}) {
  const running = card.aiReview.status === "pending"
  const runReview = async () => {
    const requestNo = card.metrics.aiReviewRequestCount + 1
    onReviewStateChange({ ...card.aiReview, status: "pending", errorMessage: "" })
    try {
      const response = await reviewLesson3QuestionCard({
        cardId: card.id,
        kind: card.kind,
        material: {
          titleOrName: card.material.titleOrName,
          displayNote: card.material.displayNote,
          assetDataUrl: card.material.asset?.dataUrl,
          assetMimeType: card.material.asset?.mimeType,
          assetFingerprint: card.material.assetFingerprint,
        },
        task: {
          prompt: card.task.prompt,
          options: card.task.options,
          correctOptionKey: card.task.correctOptionKey,
        },
        explanation: { text: card.explanation.text },
        source: {
          sourceType: card.source.sourceType,
          sourceRecord: card.source.sourceRecord,
          verificationNote: card.source.verificationNote,
        },
        clientContext: { lessonId: 3, version: "v1", requestNo },
      })
      onReviewStateChange({
        enabled: true,
        status: "completed",
        lastRequestId: response.requestId,
        lastReviewedAt: response.reviewedAt,
        result: response.result,
        errorMessage: "",
      })
    } catch (error) {
      onReviewStateChange({
        ...card.aiReview,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "自检助手暂时不可用，不影响保存 V1。",
      })
    }
  }

  const result = card.aiReview.result
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">题卡自检助手</p>
          <p className="text-xs text-muted-foreground">只检查题卡结构与表达质量，不替你判定真伪。</p>
        </div>
        <Button type="button" variant="outline" onClick={runReview} disabled={running}>
          {running && <Loader2 className="h-4 w-4 animate-spin" />}
          检查这张题卡是否完整
        </Button>
      </div>
      {result && (
        <div className="mt-4 space-y-3">
          <p className={cn(
            "rounded-xl px-3 py-2 text-sm font-medium",
            result.status === "pass" ? "bg-green-50 text-green-800" : result.status === "blocked" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900",
          )}
          >
            {reviewLabel(result.status)}：{result.summary}
          </p>
          <div className="space-y-2">
            {result.checks.slice(0, 3).map((check, index) => (
              <p key={`${check.area}-${index}`} className="text-sm leading-6 text-slate-700">
                {check.message}{check.suggestion ? ` 建议：${check.suggestion}` : ""}
              </p>
            ))}
          </div>
        </div>
      )}
      {card.aiReview.status === "failed" && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{card.aiReview.errorMessage}</p>
      )}
    </div>
  )
}
