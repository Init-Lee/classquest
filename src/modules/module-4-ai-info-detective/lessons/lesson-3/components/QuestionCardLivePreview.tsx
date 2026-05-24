/**
 * 文件说明：模块 4 课时 3 题卡实时预览组件。
 * 职责：展示单张 V1 题卡的完整实时预览，包含素材、判断任务、参考答案、解析与来源核验。
 * 更新触发：题卡四部分结构、选项 rationale、预览布局或展示字段变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson3QuestionCardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { LESSON3_SOURCE_TYPE_LABELS } from "../data/default-options"

function PreviewAnalysisSection({ card }: { card: Module4Lesson3QuestionCardDraft }) {
  const correctOption = card.task.options.find(option => option.key === card.task.correctOptionKey)
  const optionsWithRationale = card.task.options.filter(option => option.rationale?.trim())
  const otherRationales = optionsWithRationale.filter(option => option.key !== card.task.correctOptionKey)

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
}: {
  card: Module4Lesson3QuestionCardDraft
}) {
  const cardAltLabel = card.kind === "news" ? "新闻题卡 V1" : "图片题卡 V1"

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 py-2">
        <p className="text-lg font-semibold leading-none tracking-tight">实时预览</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
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

        <PreviewAnalysisSection card={card} />
      </CardContent>
    </Card>
  )
}
