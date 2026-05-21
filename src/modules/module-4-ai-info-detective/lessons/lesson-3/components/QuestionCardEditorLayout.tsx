/**
 * 文件说明：模块 4 课时 3 题卡编辑器布局。
 * 职责：提供新闻/图片 V1 题卡共用编辑表单、右侧 sticky 实时预览和题卡自检助手入口。
 * 更新触发：题卡字段、编辑分区、预览布局或 AI review 接入策略变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson3AiReviewState,
  Module4Lesson3QuestionCardDraft,
  Module4MaterialSourceType,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON3_DEFAULT_OPTIONS } from "../data/default-options"
import { evaluateLesson3SelfCheck } from "../utils/evaluate-lesson3-self-check"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { CardEditorSection } from "./CardEditorSection"
import { SourceTypeSelect } from "./SourceTypeSelect"
import { AiReviewPanel } from "./AiReviewPanel"
import { QuestionCardLivePreview } from "./QuestionCardLivePreview"
import type { Lesson3PreviewMode } from "./PreviewModeTabs"

function withSelfCheck(card: Module4Lesson3QuestionCardDraft): Module4Lesson3QuestionCardDraft {
  return { ...card, selfCheck: evaluateLesson3SelfCheck(card), updatedAt: new Date().toISOString() }
}

export function QuestionCardEditorLayout({
  card,
  previewMode,
  onPreviewModeChange,
  onCardChange,
  onComplete,
  completeButtonLabel,
  helperText,
}: {
  card: Module4Lesson3QuestionCardDraft
  previewMode: Lesson3PreviewMode
  onPreviewModeChange: (mode: Lesson3PreviewMode) => void
  onCardChange: (card: Module4Lesson3QuestionCardDraft) => void
  onComplete: () => void
  completeButtonLabel: string
  helperText: string
}) {
  const updateCard = (next: Module4Lesson3QuestionCardDraft) => onCardChange(withSelfCheck(next))
  const updateAiReview = (aiReview: Module4Lesson3AiReviewState) => {
    updateCard({
      ...card,
      aiReview,
      metrics: {
        ...card.metrics,
        aiReviewRequestCount: aiReview.status === "pending" ? card.metrics.aiReviewRequestCount + 1 : card.metrics.aiReviewRequestCount,
      },
    })
  }
  const updatePreviewMode = (mode: Lesson3PreviewMode) => {
    if (mode !== previewMode) {
      updateCard({
        ...card,
        metrics: { ...card.metrics, previewModeSwitchCount: card.metrics.previewModeSwitchCount + 1 },
      })
    }
    onPreviewModeChange(mode)
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <main className="space-y-5">
        <div className="rounded-2xl border bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">{helperText}</div>

        <CardEditorSection
          id={`${card.kind}-material`}
          title="素材展示"
          description="展示题目要看的素材，只写展示说明，不在这里下判断。"
          complete={card.selfCheck.materialReady}
        >
          {card.material.asset && (
            <img src={card.material.asset.dataUrl} alt={card.material.titleOrName || "题卡素材"} className="max-h-72 w-full rounded-2xl border object-contain" />
          )}
          <label className="space-y-2 text-sm">
            <span className="font-medium">素材短名</span>
            <Input
              value={card.material.titleOrName}
              onChange={event => updateCard({
                ...card,
                material: { ...card.material, titleOrName: event.target.value },
                metrics: { ...card.metrics, materialEditCount: card.metrics.materialEditCount + 1 },
              })}
              placeholder={card.kind === "news" ? "例如：校园 AI 新闻截图" : "例如：AI 风格图片素材"}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">展示说明</span>
            <Textarea
              value={card.material.displayNote}
              onChange={event => updateCard({
                ...card,
                material: { ...card.material, displayNote: event.target.value },
                metrics: { ...card.metrics, materialEditCount: card.metrics.materialEditCount + 1 },
              })}
              placeholder="只描述素材可见信息或课时2留下的疑点，不写最终判断。"
            />
          </label>
        </CardEditorSection>

        <CardEditorSection
          id={`${card.kind}-task`}
          title="判断任务"
          description="题干必须清楚，选项固定为 A/B/C 三项，并选择一个参考答案。"
          complete={card.selfCheck.taskReady && card.selfCheck.answerSelected}
        >
          <label className="space-y-2 text-sm">
            <span className="font-medium">题干</span>
            <Textarea
              value={card.task.prompt}
              onChange={event => updateCard({
                ...card,
                task: { ...card.task, prompt: event.target.value, options: LESSON3_DEFAULT_OPTIONS },
                metrics: { ...card.metrics, taskEditCount: card.metrics.taskEditCount + 1 },
              })}
            />
          </label>
          <div className="grid gap-3 md:grid-cols-3">
            {LESSON3_DEFAULT_OPTIONS.map(option => (
              <label key={option.key} className="flex items-start gap-3 rounded-2xl border p-3 text-sm">
                <input
                  type="radio"
                  name={`${card.id}-answer`}
                  className="mt-1 h-4 w-4"
                  checked={card.task.correctOptionKey === option.key}
                  onChange={() => updateCard({
                    ...card,
                    task: { ...card.task, options: LESSON3_DEFAULT_OPTIONS, correctOptionKey: option.key as "A" | "B" | "C" },
                    metrics: { ...card.metrics, taskEditCount: card.metrics.taskEditCount + 1 },
                  })}
                />
                <span>{option.key}. {option.label}</span>
              </label>
            ))}
          </div>
        </CardEditorSection>

        <CardEditorSection
          id={`${card.kind}-explanation`}
          title="核心解析"
          description="写 40-120 字左右，说明具体依据或核验理由，避免只写个人感觉。"
          complete={card.selfCheck.explanationReady}
        >
          <Textarea
            value={card.explanation.text}
            onChange={event => updateCard({
              ...card,
              explanation: {
                text: event.target.value,
                editCount: card.explanation.editCount + 1,
                updatedAt: new Date().toISOString(),
              },
              metrics: { ...card.metrics, explanationEditCount: card.metrics.explanationEditCount + 1 },
            })}
            placeholder={card.kind === "news"
              ? "例如：这则新闻目前只有截图，缺少原网页链接；标题中的数据出处不清，需要根据来源记录继续核验。"
              : "例如：画面中背景文字和边缘融合存在异常，但来源记录仍需核验，因此不能只凭画面下最终结论。"}
          />
        </CardEditorSection>

        <CardEditorSection
          id={`${card.kind}-source`}
          title="来源与核验入口"
          description="填写可追溯信息，告诉答题者后续可以从哪里继续核验。"
          complete={card.selfCheck.sourceReady && card.selfCheck.verificationReady}
        >
          <SourceTypeSelect
            value={card.source.sourceType}
            onChange={(sourceType?: Module4MaterialSourceType) => updateCard({
              ...card,
              source: { ...card.source, sourceType },
              metrics: { ...card.metrics, sourceEditCount: card.metrics.sourceEditCount + 1 },
            })}
          />
          <label className="space-y-2 text-sm">
            <span className="font-medium">来源记录</span>
            <Textarea
              value={card.source.sourceRecord}
              onChange={event => updateCard({
                ...card,
                source: { ...card.source, sourceRecord: event.target.value },
                metrics: { ...card.metrics, sourceEditCount: card.metrics.sourceEditCount + 1 },
              })}
              placeholder="填写链接、平台、生成记录、拍摄说明或加工过程。"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">核验入口提示</span>
            <Textarea
              value={card.source.verificationNote}
              onChange={event => updateCard({
                ...card,
                source: { ...card.source, verificationNote: event.target.value },
                metrics: { ...card.metrics, sourceEditCount: card.metrics.sourceEditCount + 1 },
              })}
              placeholder="例如：可以从原网页发布时间、图片生成记录或反向搜图继续核验。"
            />
          </label>
        </CardEditorSection>

        <AiReviewPanel card={card} onReviewStateChange={updateAiReview} />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
          <p className="text-sm text-muted-foreground">自检助手失败也不阻止保存 V1，但必填字段需要补齐。</p>
          <Button type="button" onClick={onComplete} disabled={!card.selfCheck.allRequiredPassed}>{completeButtonLabel}</Button>
        </div>
      </main>

      <aside className="space-y-4 lg:sticky lg:top-[calc(var(--module4-sticky-stack-height,7rem)+var(--module4-lesson3-chrome-h,8rem)+1rem)] lg:self-start">
        <QuestionCardLivePreview card={card} mode={previewMode} onModeChange={updatePreviewMode} />
      </aside>
    </div>
  )
}
