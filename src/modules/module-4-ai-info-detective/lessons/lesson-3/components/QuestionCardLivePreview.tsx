/**
 * 文件说明：模块 4 课时 3 题卡实时预览组件。
 * 职责：展示单张 V1 题卡的答题前/答题后视图，帮助学生边编辑边确认呈现效果。
 * 更新触发：题卡四部分结构、预览模式或展示字段变化时，需要同步更新本文件。
 */

import type { Module4Lesson3QuestionCardDraft } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { LESSON3_SOURCE_TYPE_LABELS } from "../data/default-options"
import { type Lesson3PreviewMode, PreviewModeTabs } from "./PreviewModeTabs"

export function QuestionCardLivePreview({
  card,
  mode,
  onModeChange,
}: {
  card: Module4Lesson3QuestionCardDraft
  mode: Lesson3PreviewMode
  onModeChange: (mode: Lesson3PreviewMode) => void
}) {
  const title = card.kind === "news" ? "新闻题卡 V1" : "图片题卡 V1"
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">{title}</CardTitle>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">实时预览</span>
        </div>
        <PreviewModeTabs mode={mode} onModeChange={onModeChange} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border bg-white p-4">
          {card.material.asset ? (
            <img
              src={card.material.asset.dataUrl}
              alt={card.material.titleOrName || title}
              className="mb-3 max-h-64 w-full rounded-xl border object-contain"
            />
          ) : (
            <div className="mb-3 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">暂无素材图片</div>
          )}
          <h3 className="text-base font-semibold">{card.material.titleOrName || "未填写素材短名"}</h3>
          {card.material.displayNote && <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.material.displayNote}</p>}
        </div>

        <div className="rounded-2xl border bg-slate-50 p-4">
          <p className="text-sm font-medium">判断任务</p>
          <p className="mt-2 text-sm leading-6">{card.task.prompt || "未填写题干"}</p>
          <div className="mt-3 space-y-2">
            {card.task.options.map(option => (
              <div key={option.key} className="rounded-xl border bg-white px-3 py-2 text-sm">
                {option.key}. {option.label}
              </div>
            ))}
          </div>
        </div>

        {mode === "after" && (
          <div className="space-y-4 rounded-2xl border bg-green-50 p-4">
            <p className="text-sm font-medium text-green-900">答题后解析</p>
            <p className="text-sm">参考答案：{card.task.correctOptionKey ?? "未选择"}</p>
            <p className="text-sm leading-6">{card.explanation.text || "未填写核心解析"}</p>
            <div className="rounded-xl bg-white p-3 text-sm leading-6">
              <p><strong>来源类型：</strong>{card.source.sourceType ? LESSON3_SOURCE_TYPE_LABELS[card.source.sourceType] : "未选择"}</p>
              <p><strong>来源记录：</strong>{card.source.sourceRecord || "未填写"}</p>
              <p><strong>核验入口：</strong>{card.source.verificationNote || "未填写"}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
