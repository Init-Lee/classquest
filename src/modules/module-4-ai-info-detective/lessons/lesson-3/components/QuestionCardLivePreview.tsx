/**
 * 文件说明：模块 4 课时 3 题卡实时预览组件。
 * 职责：展示单张 V1 题卡的答题前/答题后视图；桌面端两行布局（图+题 / 解析+反馈），编辑工作台可嵌入完成度与 AI 自检。
 * 更新触发：题卡四部分结构、选项 rationale、预览模式、两行布局或展示字段变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson3AiReviewState,
  Module4Lesson3QuestionCardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { LESSON3_SOURCE_TYPE_LABELS } from "../data/default-options"
import { AiReviewPanel } from "./AiReviewPanel"
import { InlineSelfCheckPanel } from "./InlineSelfCheckPanel"
import { type Lesson3PreviewMode, PreviewModeTabs } from "./PreviewModeTabs"

function PreviewAnalysisSection({
  card,
  mode,
}: {
  card: Module4Lesson3QuestionCardDraft
  mode: Lesson3PreviewMode
}) {
  const correctOption = card.task.options.find(option => option.key === card.task.correctOptionKey)
  const optionsWithRationale = card.task.options.filter(option => option.rationale?.trim())
  const otherRationales = optionsWithRationale.filter(option => option.key !== card.task.correctOptionKey)

  if (mode === "before") {
    return (
      <div className="flex h-full min-h-[8rem] items-center justify-center rounded-2xl border border-dashed bg-slate-50/60 p-4 text-center text-sm text-muted-foreground">
        切换到「答题后」可预览解析与来源核验内容
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-2xl border bg-green-50/80 p-3">
      <p className="text-sm font-medium text-green-900">答题后解析</p>

      <div className="rounded-xl bg-white p-2.5 text-sm">
        <p className="font-medium text-slate-800">参考答案</p>
        <p className="mt-1 leading-6 text-slate-700">
          {correctOption ? `${correctOption.key}. ${correctOption.label}` : "未选择"}
        </p>
      </div>

      {correctOption?.rationale?.trim() && (
        <div className="rounded-xl bg-white p-2.5 text-sm">
          <p className="font-medium text-slate-800">正确答案解析</p>
          <p className="mt-1 leading-6 text-slate-700">{correctOption.rationale.trim()}</p>
        </div>
      )}

      <div className="rounded-xl bg-white p-2.5 text-sm">
        <p className="font-medium text-slate-800">核心解析</p>
        <p className="mt-1 leading-6 text-slate-700">{card.explanation.text || "未填写核心解析"}</p>
      </div>

      {otherRationales.length > 0 && (
        <div className="space-y-1.5 rounded-xl bg-white p-2.5 text-sm">
          <p className="font-medium text-slate-800">其他选项解析</p>
          {otherRationales.map(option => (
            <p key={option.key} className="leading-6 text-slate-700">
              <span className="font-medium">{option.key}.</span> {option.rationale?.trim()}
            </p>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-white p-2.5 text-sm leading-6">
        <p><strong>来源类型：</strong>{card.source.sourceType ? LESSON3_SOURCE_TYPE_LABELS[card.source.sourceType] : "未选择"}</p>
        <p><strong>来源记录：</strong>{card.source.sourceRecord || "未填写"}</p>
        <p><strong>核验观察指引：</strong>{card.source.verificationNote || "未填写"}</p>
      </div>
    </div>
  )
}

export function QuestionCardLivePreview({
  card,
  mode,
  onModeChange,
  onReviewStateChange,
}: {
  card: Module4Lesson3QuestionCardDraft
  mode: Lesson3PreviewMode
  onModeChange: (mode: Lesson3PreviewMode) => void
  /** 编辑工作台传入时，第二行右侧展示结构完成度与题卡自检助手 */
  onReviewStateChange?: (next: Module4Lesson3AiReviewState) => void
}) {
  const cardAltLabel = card.kind === "news" ? "新闻题卡 V1" : "图片题卡 V1"
  const showEditorFeedback = Boolean(onReviewStateChange)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <p className="text-lg font-semibold leading-none tracking-tight">实时预览</p>
        <PreviewModeTabs mode={mode} onModeChange={onModeChange} />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 第一行：素材图片 | 判断任务 */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex min-h-0 flex-col rounded-2xl border bg-white p-3">
            {card.material.asset ? (
              <div className="flex min-h-[10rem] flex-1 items-center justify-center overflow-hidden rounded-xl border bg-slate-50">
                <img
                  src={card.material.asset.dataUrl}
                  alt={card.material.titleOrName || cardAltLabel}
                  className="max-h-48 max-w-full object-contain lg:max-h-56"
                />
              </div>
            ) : (
              <div className="flex min-h-[10rem] items-center justify-center rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                暂无素材图片
              </div>
            )}
            <h3 className="mt-2 text-sm font-semibold">{card.material.titleOrName || "未填写素材短名"}</h3>
            {card.material.displayNote && (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.material.displayNote}</p>
            )}
          </div>

          <div className="rounded-2xl border bg-slate-50 p-3">
            <p className="text-sm font-medium">判断任务</p>
            <p className="mt-2 text-sm leading-6">{card.task.prompt || "未填写题干"}</p>
            <div className="mt-3 space-y-1.5">
              {card.task.options.map(option => (
                <div key={option.key} className="rounded-xl border bg-white px-3 py-2 text-sm">
                  {option.key}. {option.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 第二行：解析 | 完成度 + 自检助手（编辑工作台） */}
        <div className={showEditorFeedback ? "grid gap-4 lg:grid-cols-2" : ""}>
          <div className={showEditorFeedback ? "min-h-0 min-w-0" : ""}>
            <PreviewAnalysisSection card={card} mode={mode} />
          </div>

          {showEditorFeedback && onReviewStateChange && (
            <div className="flex min-h-0 min-w-0 flex-col gap-3">
              <InlineSelfCheckPanel selfCheck={card.selfCheck} />
              <AiReviewPanel card={card} onReviewStateChange={onReviewStateChange} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
