/**
 * 文件说明：模块 4 课时 3 题卡自检助手面板。
 * 职责：通过模块 API adapter 发起题卡质量自检并展示短建议，失败时提示不影响保存 V1。
 * 更新触发：AI review adapter、展示状态、错误文案或保存阻断策略变化时，需要同步更新本文件。
 */

import { Loader2 } from "lucide-react"
import type {
  Module4Lesson3AiReviewArea,
  Module4Lesson3AiReviewHistoryEntry,
  Module4Lesson3AiReviewLevel,
  Module4Lesson3AiReviewResult,
  Module4Lesson3AiReviewState,
  Module4Lesson3QuestionCardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON3_AI_REVIEW_HISTORY_LIMIT } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import {
  reviewLesson3QuestionCard,
  sanitizeLesson3AiReviewAssetDataUrl,
} from "@/modules/module-4-ai-info-detective/api/lesson3-ai-review.adapter"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"
import { deriveLesson3AiReviewTier, getLesson3AiReviewTierLabel } from "../utils/derive-lesson3-ai-review-tier"

function reviewLabel(status?: string): string {
  if (status === "pass") return "可以保存为 V1"
  if (status === "blocked") return "缺少必要信息"
  return "建议补充后保存"
}

const AREA_LABELS = {
  material: "素材展示",
  task: "判断任务",
  explanation: "核心解析",
  source: "来源核验",
} as const

const AREA_ORDER = ["material", "task", "explanation", "source"] as const

const TIER_STANDARD_COPY = {
  excellent: "四项均通过，可以进入自测与保存。",
  good: "具备 V1 基本结构，可以保存；建议课时4继续优化。",
  blocked: "存在必须修改的板块，请先按原因和建议修改。",
  not_checked: "请先运行自检，系统会按四个板块逐项给出通过或修改建议。",
} as const

function getAreaCheck(result: NonNullable<Module4Lesson3QuestionCardDraft["aiReview"]["result"]>, area: typeof AREA_ORDER[number]) {
  return result.checks.find(check => check.area === area)
}

function areaPassed(result: NonNullable<Module4Lesson3QuestionCardDraft["aiReview"]["result"]>, area: typeof AREA_ORDER[number]): boolean {
  const check = getAreaCheck(result, area)
  if (result.missingRequiredFields.includes(area)) return false
  return !check || check.level === "ok"
}

function buildHistoryEntry(
  result: Module4Lesson3AiReviewResult,
  requestId: string,
  reviewedAt: string,
): Module4Lesson3AiReviewHistoryEntry {
  const tier = deriveLesson3AiReviewTier(result)
  const safeTier: Module4Lesson3AiReviewHistoryEntry["tier"] = tier === "not_checked" ? "good" : tier
  const pickLevel = (area: Module4Lesson3AiReviewArea): Module4Lesson3AiReviewLevel => {
    if (result.missingRequiredFields.includes(area)) return "error"
    const check = result.checks.find(item => item.area === area)
    return check?.level ?? "ok"
  }
  return {
    requestId,
    reviewedAt,
    status: result.status,
    tier: safeTier,
    areaLevels: {
      material: pickLevel("material"),
      task: pickLevel("task"),
      explanation: pickLevel("explanation"),
      source: pickLevel("source"),
    },
    suggestedEditCount: result.suggestedEdits.length,
  }
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
    onReviewStateChange({ ...card.aiReview, status: "pending", isStale: false, errorMessage: "" })
    try {
      const response = await reviewLesson3QuestionCard({
        cardId: card.id,
        kind: card.kind,
        material: {
          titleOrName: card.material.titleOrName,
          displayNote: card.material.displayNote,
          assetDataUrl: sanitizeLesson3AiReviewAssetDataUrl(card.material.asset?.dataUrl),
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
      const historyEntry = buildHistoryEntry(response.result, response.requestId, response.reviewedAt)
      const nextHistory = [historyEntry, ...card.aiReview.history].slice(0, LESSON3_AI_REVIEW_HISTORY_LIMIT)
      onReviewStateChange({
        enabled: true,
        status: "completed",
        lastRequestId: response.requestId,
        lastReviewedAt: response.reviewedAt,
        result: response.result,
        isStale: false,
        errorMessage: "",
        history: nextHistory,
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
  const tier = deriveLesson3AiReviewTier(result)
  const tierLabel = getLesson3AiReviewTierLabel(tier)
  const stale = card.aiReview.isStale
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">题卡自检助手</p>
        </div>
        <Button type="button" variant="outline" onClick={runReview} disabled={running}>
          {running && <Loader2 className="h-4 w-4 animate-spin" />}
          检查这张题卡是否完整
        </Button>
      </div>
      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
        <p className="font-medium text-slate-800">评价标准</p>
        <p>按“素材展示、判断任务、核心解析、来源核验”四项检查；✅ 表示该项已通过，❌ 表示需要修改后重新自检。</p>
      </div>
      {result && (
        <div className="mt-4 space-y-3">
          {stale && (
            <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
              题卡内容已修改，下方是上次自检结果，仅供参考；请重新运行题卡自检助手。
            </p>
          )}
          <div
            className={cn(
              "rounded-xl px-3 py-2 text-sm",
              stale ? "bg-slate-50 text-slate-700" : tier === "excellent" ? "bg-green-50 text-green-800" : tier === "blocked" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900",
            )}
          >
            <p className="font-medium">整体结果：{tierLabel}。</p>
            <p className="mt-1 leading-6">
              {TIER_STANDARD_COPY[tier]} {reviewLabel(result.status)}：{result.summary}
            </p>
          </div>
          <div className="space-y-2.5">
            {AREA_ORDER.map(area => {
              const check = getAreaCheck(result, area)
              const passed = areaPassed(result, area)
              return (
                <div key={area} className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm leading-6",
                  passed ? "border-green-100 bg-green-50/70" : "border-red-100 bg-red-50/70",
                )}
                >
                  <p className={cn("font-medium", passed ? "text-green-800" : "text-red-800")}>
                    {AREA_LABELS[area]} {passed ? "✅" : "❌"}
                  </p>
                  {!passed && (
                    <div className="mt-1 space-y-1 text-slate-700">
                      <p><span className="font-medium">理由：</span>{check?.message || "这一项还没有满足题卡 V1 要求。"}</p>
                      <p><span className="font-medium">建议：</span>{check?.suggestion || "请补充更具体的信息后重新自检。"}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {card.aiReview.status === "failed" && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{card.aiReview.errorMessage}</p>
      )}
    </div>
  )
}
