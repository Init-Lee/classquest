/**
 * 文件说明：模块 4 课时 3 题卡编辑工作台（单屏驾驶舱）。
 * 职责：为新闻/图片 V1 题卡提供单屏驾驶舱：左侧四 Tab 分段编辑，右侧拆分为实时预览与 AI 自检助手。
 * 更新触发：题卡编辑分区、Tab 导航、预览布局、移动端折叠策略或保存/完成流程变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { ChevronDown, ChevronUp, Expand, X } from "lucide-react"
import type {
  Module4Lesson3AiReviewState,
  Module4Lesson3QuestionCardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { createEmptyModule4Lesson3AiReviewState } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { TaskOptionsEditor } from "./TaskOptionsEditor"
import { evaluateLesson3SelfCheck } from "../utils/evaluate-lesson3-self-check"
import { deriveLesson3AiReviewTier } from "../utils/derive-lesson3-ai-review-tier"
import { Button } from "@/shared/ui/button"
import { Textarea } from "@/shared/ui/textarea"
import { Input } from "@/shared/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import { cn } from "@/shared/utils/cn"
import { QuestionCardLivePreview } from "./QuestionCardLivePreview"
import { useImeSafeDraftValue } from "./useImeSafeDraftValue"
import { SourceTypeSelect } from "./SourceTypeSelect"
import { AiReviewPanel } from "./AiReviewPanel"

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

function withAiReviewStale(card: Module4Lesson3QuestionCardDraft): Module4Lesson3QuestionCardDraft {
  if (!card.aiReview.result) return { ...card, aiReview: createEmptyModule4Lesson3AiReviewState() }
  return {
    ...card,
    aiReview: {
      ...card.aiReview,
      status: "completed",
      isStale: true,
      errorMessage: "题卡内容已修改，请重新运行题卡自检助手。",
    },
  }
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
  onCardChange,
  onComplete,
  completeLabel,
  lesson2SnapshotOutdated = false,
  onSyncLesson2Snapshot,
}: {
  cardType: "news" | "image"
  card: Module4Lesson3QuestionCardDraft
  onCardChange: (card: Module4Lesson3QuestionCardDraft) => void
  onComplete: () => void
  completeLabel: string
  lesson2SnapshotOutdated?: boolean
  onSyncLesson2Snapshot?: () => void
}) {
  const [activeEditorTab, setActiveEditorTab] = useState<EditorTab>(1)
  const [savedHint, setSavedHint] = useState(false)
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)
  const [lesson2SyncDismissed, setLesson2SyncDismissed] = useState(false)

  const snapshot = card.sourceMaterialSnapshot
  const title = cardTitle(cardType)
  const aiReviewTier = card.aiReview.isStale ? "not_checked" : deriveLesson3AiReviewTier(card.aiReview.result)
  const aiReviewPassed = aiReviewTier === "excellent" || aiReviewTier === "good"
  const canComplete = card.selfCheck.allRequiredPassed && aiReviewPassed
  const showLesson2SyncNotice = lesson2SnapshotOutdated && !lesson2SyncDismissed && onSyncLesson2Snapshot

  const updateCard = (next: Module4Lesson3QuestionCardDraft) => onCardChange(withSelfCheck(next))
  const updateContentCard = (next: Module4Lesson3QuestionCardDraft) => {
    updateCard(withAiReviewStale(next))
  }

  const refreshSelfCheck = () => updateCard(card)

  const switchTab = (tab: EditorTab) => {
    setActiveEditorTab(tab)
    refreshSelfCheck()
  }

  const updateAiReview = (aiReview: Module4Lesson3AiReviewState) => {
    const isFreshSuccess = aiReview.status === "completed"
      && !!aiReview.lastRequestId
      && aiReview.lastRequestId !== card.aiReview.lastRequestId
    updateCard({
      ...card,
      aiReview,
      metrics: {
        ...card.metrics,
        aiReviewRequestCount: isFreshSuccess
          ? card.metrics.aiReviewRequestCount + 1
          : card.metrics.aiReviewRequestCount,
      },
    })
  }

  const displayNoteField = useImeSafeDraftValue({
    value: card.material.displayNote,
    onCommit: displayNote => updateContentCard({
      ...card,
      material: { ...card.material, displayNote },
      metrics: { ...card.metrics, materialEditCount: card.metrics.materialEditCount + 1 },
    }),
  })
  const titleOrNameField = useImeSafeDraftValue({
    value: card.material.titleOrName,
    onCommit: titleOrName => updateContentCard({
      ...card,
      material: { ...card.material, titleOrName },
      metrics: { ...card.metrics, materialEditCount: card.metrics.materialEditCount + 1 },
    }),
  })
  const taskPromptField = useImeSafeDraftValue({
    value: card.task.prompt,
    onCommit: prompt => updateContentCard({
      ...card,
      task: { ...card.task, prompt },
      metrics: { ...card.metrics, taskEditCount: card.metrics.taskEditCount + 1 },
    }),
  })
  const explanationField = useImeSafeDraftValue({
    value: card.explanation.text,
    onCommit: text => updateContentCard({
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
    onCommit: verificationNote => updateContentCard({
      ...card,
      source: { ...card.source, verificationNote },
      metrics: { ...card.metrics, sourceEditCount: card.metrics.sourceEditCount + 1 },
    }),
  })
  const sourceRecordField = useImeSafeDraftValue({
    value: card.source.sourceRecord,
    onCommit: sourceRecord => updateContentCard({
      ...card,
      source: { ...card.source, sourceRecord },
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
    <QuestionCardLivePreview card={card} />
  )

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden px-4 sm:px-8 lg:px-10">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-1 lg:gap-6">
        {/* 移动端预览折叠区 */}
        <div className="shrink-0 lg:hidden">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-2xl border bg-white px-4 py-3 text-left"
            onClick={() => setMobilePreviewOpen(open => !open)}
          >
            <span className="text-sm font-medium">{title} · 实时预览与自检助手</span>
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
              素材与来源来自课时 2 快照；如自检指出来源或说明不清，可在本页直接修改题卡副本，不会改动课时 2 原记录。
            </p>
            {showLesson2SyncNotice && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p>
                      检测到课时 2 素材记录已更新。课时 3 默认保留进入时的快照；如果你想使用最新素材，可以手动重新带入。
                    </p>
                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      替换材料会更新素材与来源记录，并让 AI 自检、自测试答和最终保存重新确认；题干、答案和核心解析不会被覆盖。
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                        onClick={onSyncLesson2Snapshot}
                      >
                        重新带入课时 2 最新素材
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-amber-900 hover:bg-amber-100"
                        onClick={() => setLesson2SyncDismissed(true)}
                      >
                        不采纳
                      </Button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-1 text-amber-900 transition hover:bg-amber-100"
                    aria-label="不采纳课时 2 最新素材提醒"
                    onClick={() => setLesson2SyncDismissed(true)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            className={cn(
              "min-h-0 flex-1 px-4 py-4 sm:px-5",
              activeEditorTab === 1 ? "overflow-y-auto lg:overflow-hidden" : "overflow-y-auto",
            )}
          >
            {activeEditorTab === 1 && (
              <div className="flex h-full min-h-0 flex-col gap-3 lg:overflow-hidden">
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
                <div className="flex min-h-0 min-w-0 flex-[1] flex-col gap-2 overflow-visible lg:max-h-[50%]">
                  <dl className="grid shrink-0 gap-2 rounded-xl border bg-slate-50/80 p-3 text-sm">
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">课时 2 疑点提示（快照）</dt>
                      <dd className="mt-0.5 line-clamp-2 text-sm leading-5 text-muted-foreground">
                        {snapshot.lesson2ClueNote || "无"}
                      </dd>
                    </div>
                  </dl>
                  <label className="block shrink-0 space-y-1.5 text-sm">
                    <span className="font-medium">素材短名</span>
                    <Input
                      {...titleOrNameField}
                      placeholder="给素材起一个便于识别的短名"
                    />
                  </label>
                  <label className="block shrink-0 space-y-1.5 text-sm">
                    <span className="font-medium">展示说明</span>
                    <div className="p-1 -m-1">
                      <Textarea
                        {...displayNoteField}
                        placeholder="只描述素材可见信息或课时 2 留下的疑点，不写最终判断。"
                        rows={2}
                        className="min-h-[72px] max-h-[96px] resize-none py-2"
                      />
                    </div>
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
                  onChange={({ options, correctOptionKey }) => updateContentCard({
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
                  来源信息由课时 2 快照带入；如自检指出来源不清，可在本页修改题卡中的来源副本，并补充核验观察指引。
                </p>
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">来源类型</span>
                  <SourceTypeSelect
                    value={card.source.sourceType}
                    onChange={sourceType => updateContentCard({
                      ...card,
                      source: { ...card.source, sourceType },
                      metrics: { ...card.metrics, sourceEditCount: card.metrics.sourceEditCount + 1 },
                    })}
                  />
                </label>
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">来源记录</span>
                  <Textarea
                    {...sourceRecordField}
                    placeholder="填写链接、平台、生成记录、拍摄说明或其它可追溯信息"
                    rows={4}
                  />
                </label>
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
              {!canComplete && (
                <p className="max-w-[18rem] text-[11px] text-muted-foreground">
                  {!card.selfCheck.allRequiredPassed
                    ? "四项必填完成后可点击"
                    : aiReviewTier === "not_checked"
                      ? "请先运行题卡自检助手"
                      : aiReviewTier === "good"
                        ? "自检为“基本合格”，可以保存 V1，建议课时4继续优化"
                        : "自检未通过，请修改后重新自检"}
                </p>
              )}
              <Button
                type="button"
                size="sm"
                disabled={!canComplete}
                title={canComplete ? undefined : "请先完成结构必填项，并确认题卡自检不是“不通过”"}
                onClick={onComplete}
              >
                {completeLabel}
              </Button>
            </div>
          </div>
        </section>

        {/* 右侧：实时预览与自检助手拆分 */}
        <aside className="hidden min-h-0 min-w-0 overflow-hidden lg:grid lg:grid-cols-2 lg:gap-4">
          <div className="min-h-0 min-w-0 overflow-y-auto pr-1">{previewPanel}</div>
          <div className="min-h-0 min-w-0 overflow-y-auto pr-1">
            <AiReviewPanel card={card} onReviewStateChange={updateAiReview} />
          </div>
        </aside>
      </div>
    </div>
  )
}
