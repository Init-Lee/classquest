/**
 * 文件说明：模块 4 课时 3 题卡编辑工作台（单屏驾驶舱）。
 * 职责：为新闻/图片 V1 题卡提供左右各 50% 的单屏驾驶舱：左侧四 Tab 分段编辑，右侧两行预览（图+题 / 解析+完成度与 AI 自检）。
 * 更新触发：题卡编辑分区、Tab 导航、预览布局、移动端折叠策略或保存/完成流程变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { ChevronDown, ChevronUp, Expand } from "lucide-react"
import type {
  Module4Lesson3AiReviewState,
  Module4Lesson3QuestionCardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON3_SOURCE_TYPE_LABELS } from "../data/default-options"
import { TaskOptionsEditor } from "./TaskOptionsEditor"
import { evaluateLesson3SelfCheck } from "../utils/evaluate-lesson3-self-check"
import { Button } from "@/shared/ui/button"
import { Textarea } from "@/shared/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import { cn } from "@/shared/utils/cn"
import { QuestionCardLivePreview } from "./QuestionCardLivePreview"
import type { Lesson3PreviewMode } from "./PreviewModeTabs"
import { useImeSafeDraftValue } from "./useImeSafeDraftValue"

type EditorTab = 1 | 2 | 3 | 4

const TAB_ITEMS: Array<{ id: EditorTab; label: string; shortLabel: string }> = [
  { id: 1, label: "素材展示", shortLabel: "素材" },
  { id: 2, label: "判断任务", shortLabel: "任务" },
  { id: 3, label: "核心解析", shortLabel: "解析" },
  { id: 4, label: "来源核验", shortLabel: "来源" },
]

function withSelfCheck(card: Module4Lesson3QuestionCardDraft): Module4Lesson3QuestionCardDraft {
  return { ...card, selfCheck: evaluateLesson3SelfCheck(card), updatedAt: new Date().toISOString() }
}

function tabComplete(card: Module4Lesson3QuestionCardDraft, tab: EditorTab): boolean {
  const check = card.selfCheck
  if (tab === 1) return check.materialReady
  if (tab === 2) return check.taskReady && check.answerSelected
  if (tab === 3) return check.explanationReady
  return check.sourceReady && check.verificationReady
}

function cardTitle(cardType: "news" | "image"): string {
  return cardType === "news" ? "新闻题卡 V1" : "图片题卡 V1"
}

function explanationHint(cardType: "news" | "image"): string {
  return cardType === "news"
    ? "写 40–120 字左右，说明标题、数据出处、截图来源等具体依据；避免只写「我觉得像 AI」。"
    : "可写人体结构、文字细节、光影透视、来源不可追溯等依据；证据不足时选择 C 是合理答案。"
}

function verificationGuidePlaceholder(cardType: "news" | "image"): string {
  return cardType === "news"
    ? "打开来源链接后，请核对发布时间、发布机构、正文是否与截图一致，并查找是否有其他权威报道交叉印证。"
    : "打开生成工具记录或原图来源后，请核对 Prompt 摘要、生成参数，或尝试反向搜图比对画面细节。"
}

export function QuestionCardEditorWorkbench({
  cardType,
  card,
  previewMode,
  onPreviewModeChange,
  onCardChange,
  onComplete,
  completeLabel,
}: {
  cardType: "news" | "image"
  card: Module4Lesson3QuestionCardDraft
  previewMode: Lesson3PreviewMode
  onPreviewModeChange: (mode: Lesson3PreviewMode) => void
  onCardChange: (card: Module4Lesson3QuestionCardDraft) => void
  onComplete: () => void
  completeLabel: string
}) {
  const [activeEditorTab, setActiveEditorTab] = useState<EditorTab>(1)
  const [savedHint, setSavedHint] = useState(false)
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)

  const snapshot = card.sourceMaterialSnapshot
  const title = cardTitle(cardType)

  const updateCard = (next: Module4Lesson3QuestionCardDraft) => onCardChange(withSelfCheck(next))

  const refreshSelfCheck = () => updateCard(card)

  const switchTab = (tab: EditorTab) => {
    setActiveEditorTab(tab)
    refreshSelfCheck()
  }

  const updateAiReview = (aiReview: Module4Lesson3AiReviewState) => {
    updateCard({
      ...card,
      aiReview,
      metrics: {
        ...card.metrics,
        aiReviewRequestCount: aiReview.status === "pending"
          ? card.metrics.aiReviewRequestCount + 1
          : card.metrics.aiReviewRequestCount,
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

  const displayNoteField = useImeSafeDraftValue({
    value: card.material.displayNote,
    onCommit: displayNote => updateCard({
      ...card,
      material: { ...card.material, displayNote },
      metrics: { ...card.metrics, materialEditCount: card.metrics.materialEditCount + 1 },
    }),
  })
  const taskPromptField = useImeSafeDraftValue({
    value: card.task.prompt,
    onCommit: prompt => updateCard({
      ...card,
      task: { ...card.task, prompt },
      metrics: { ...card.metrics, taskEditCount: card.metrics.taskEditCount + 1 },
    }),
  })
  const explanationField = useImeSafeDraftValue({
    value: card.explanation.text,
    onCommit: text => updateCard({
      ...card,
      explanation: {
        text,
        editCount: card.explanation.editCount + 1,
        updatedAt: new Date().toISOString(),
      },
      metrics: { ...card.metrics, explanationEditCount: card.metrics.explanationEditCount + 1 },
    }),
  })
  const verificationNoteField = useImeSafeDraftValue({
    value: card.source.verificationNote,
    onCommit: verificationNote => updateCard({
      ...card,
      source: { ...card.source, verificationNote },
      metrics: { ...card.metrics, sourceEditCount: card.metrics.sourceEditCount + 1 },
    }),
  })

  const handleSaveSection = () => {
    updateCard(card)
    setSavedHint(true)
    window.setTimeout(() => setSavedHint(false), 2000)
  }

  const goPrevTab = () => {
    if (activeEditorTab > 1) switchTab((activeEditorTab - 1) as EditorTab)
  }

  const goNextTab = () => {
    if (activeEditorTab < 4) switchTab((activeEditorTab + 1) as EditorTab)
  }

  const previewPanel = (
    <QuestionCardLivePreview
      card={card}
      mode={previewMode}
      onModeChange={updatePreviewMode}
      onReviewStateChange={updateAiReview}
    />
  )

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden px-4 sm:px-8 lg:px-10">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:grid lg:grid-cols-2 lg:grid-rows-1 lg:gap-6">
        {/* 移动端预览折叠区 */}
        <div className="shrink-0 lg:hidden">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-2xl border bg-white px-4 py-3 text-left"
            onClick={() => setMobilePreviewOpen(open => !open)}
          >
            <span className="text-sm font-medium">{title} · 实时预览与完成度</span>
            {mobilePreviewOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {mobilePreviewOpen && (
            <div className="mt-3 max-h-[42vh] overflow-y-auto rounded-2xl border bg-slate-50/50 p-3">
              {previewPanel}
            </div>
          )}
        </div>

        {/* 左侧编辑区 */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-white lg:flex-none">
          <div className="shrink-0 border-b px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h3 className="shrink-0 text-base font-semibold sm:text-lg">{title} · 编辑工作台</h3>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {TAB_ITEMS.map(item => {
                  const complete = tabComplete(card, item.id)
                  const active = activeEditorTab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition sm:px-3 sm:text-sm",
                        active
                          ? "border-primary/30 bg-primary/5 text-primary shadow-sm"
                          : "border-transparent bg-slate-50 hover:bg-slate-100",
                      )}
                      onClick={() => switchTab(item.id)}
                    >
                      <span className="font-medium">{item.shortLabel}</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:text-xs",
                          complete ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {complete ? "已完成" : "待补充"}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              素材与来源来自课时 2 快照；本页只编辑题卡内容，不会改动课时 2 原记录。
            </p>
          </div>

          <div
            className={cn(
              "min-h-0 flex-1 px-4 py-4 sm:px-5",
              activeEditorTab === 1 ? "overflow-y-auto lg:overflow-hidden" : "overflow-y-auto",
            )}
          >
            {activeEditorTab === 1 && (
              <div className="flex h-full min-h-0 flex-col gap-4 lg:overflow-hidden">
                <div className="flex min-h-[12rem] flex-[1] flex-col lg:min-h-0 lg:max-h-[50%]">
                  {card.material.asset ? (
                    <div className="relative flex h-full min-h-[12rem] items-center justify-center overflow-hidden rounded-2xl border bg-slate-50">
                      <img
                        src={card.material.asset.dataUrl}
                        alt={snapshot.lesson2TitleOrName || title}
                        className="max-h-full max-w-full object-contain"
                      />
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button type="button" variant="secondary" size="sm" className="absolute bottom-3 right-3 gap-1">
                            <Expand className="h-3.5 w-3.5" />
                            放大查看
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] max-w-4xl overflow-auto">
                          <DialogHeader>
                            <DialogTitle>{snapshot.lesson2TitleOrName || "素材预览"}</DialogTitle>
                          </DialogHeader>
                          <img
                            src={card.material.asset.dataUrl}
                            alt={snapshot.lesson2TitleOrName || title}
                            className="max-h-[70vh] w-full rounded-xl object-contain"
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[12rem] items-center justify-center rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                      暂无素材图片（请先在课时 2 完成素材准备）
                    </div>
                  )}
                </div>
                <div className="flex min-h-0 min-w-0 flex-[1] flex-col gap-3 overflow-y-auto lg:max-h-[50%] lg:pr-1">
                  <dl className="grid gap-3 rounded-2xl border bg-slate-50/80 p-4 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">素材短名（快照）</dt>
                      <dd className="mt-1 font-medium">{snapshot.lesson2TitleOrName || "未填写"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">课时 2 疑点提示（快照）</dt>
                      <dd className="mt-1 leading-6">{snapshot.lesson2ClueNote || "无"}</dd>
                    </div>
                  </dl>
                  <label className="block space-y-2 text-sm">
                    <span className="font-medium">展示说明</span>
                    <Textarea
                      {...displayNoteField}
                      placeholder="只描述素材可见信息或课时 2 留下的疑点，不写最终判断。"
                      rows={4}
                    />
                  </label>
                </div>
              </div>
            )}

            {activeEditorTab === 2 && (
              <div className="space-y-4">
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-muted-foreground">
                  题干需清楚说明判断对象；默认提供 A/B/C 三项，可按需修改文案或增减至最多六项，并单选一项作为参考答案。
                </p>
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">题干</span>
                  <Textarea
                    {...taskPromptField}
                    rows={3}
                  />
                </label>
                <TaskOptionsEditor
                  cardId={card.id}
                  options={card.task.options}
                  correctOptionKey={card.task.correctOptionKey}
                  onChange={({ options, correctOptionKey }) => updateCard({
                    ...card,
                    task: { ...card.task, options, correctOptionKey },
                    metrics: { ...card.metrics, taskEditCount: card.metrics.taskEditCount + 1 },
                  })}
                />
              </div>
            )}

            {activeEditorTab === 3 && (
              <div className="space-y-4">
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                  {explanationHint(cardType)}
                </p>
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">核心解析</span>
                  <Textarea
                    {...explanationField}
                    placeholder={cardType === "news"
                      ? "例如：这则新闻目前只有截图，缺少原网页链接；标题中的数据出处不清，需要根据来源记录继续核验。"
                      : "例如：画面中背景文字和边缘融合存在异常，但来源记录仍需核验，因此不能只凭画面下最终结论。"}
                    rows={6}
                  />
                </label>
              </div>
            )}

            {activeEditorTab === 4 && (
              <div className="space-y-4">
                <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-900">
                  来源类型与来源记录由课时 2 快照带入，此处只读；请补充点开来源后应观察什么、如何核验与复现。
                </p>
                <dl className="space-y-3 rounded-2xl border bg-slate-50/80 p-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">来源类型（快照）</dt>
                    <dd className="mt-1 font-medium">
                      {card.source.sourceType
                        ? LESSON3_SOURCE_TYPE_LABELS[card.source.sourceType]
                        : "未选择"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">来源记录（快照）</dt>
                    <dd className="mt-1 whitespace-pre-wrap leading-6">
                      {card.source.sourceRecord || "未填写"}
                    </dd>
                  </div>
                </dl>
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">核验观察指引</span>
                  <Textarea
                    {...verificationNoteField}
                    placeholder={verificationGuidePlaceholder(cardType)}
                    rows={4}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50/80 px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" disabled={activeEditorTab === 1} onClick={goPrevTab}>
                上一步
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={handleSaveSection}>
                {savedHint ? "已保存" : "保存当前项"}
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={activeEditorTab === 4} onClick={goNextTab}>
                下一项
              </Button>
            </div>
            <div className="flex items-center gap-3">
              {!card.selfCheck.allRequiredPassed && (
                <p className="text-[11px] text-muted-foreground">四项必填完成后可点击</p>
              )}
              <Button
                type="button"
                size="sm"
                disabled={!card.selfCheck.allRequiredPassed}
                title={card.selfCheck.allRequiredPassed ? undefined : "请先完成素材、任务、核心解析与来源核验四项必填内容"}
                onClick={onComplete}
              >
                {completeLabel}
              </Button>
            </div>
          </div>
        </section>

        {/* 右侧实时反馈预览（桌面） */}
        <aside className="hidden min-h-0 min-w-0 flex-col overflow-hidden lg:flex">
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {previewPanel}
          </div>
        </aside>
      </div>
    </div>
  )
}
