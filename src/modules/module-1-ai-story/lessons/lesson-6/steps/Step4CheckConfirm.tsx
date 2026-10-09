/**
 * 文件说明：模块 1 课时 6 第四关通读全文并确认。
 * 职责：独立确认稿、四个阅读问题、校对预览、「恢复初稿」用初稿替换确认稿；本关必须复制 P4 并贴回回复，P5 仍可选；确认后进入我的小说。
 * 更新触发：第 4 关完成条件、全文预览、必用外部 AI、恢复初稿确认框或完成弹窗变化时，需要同步更新本文件。
 */

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/utils/cn"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import {
  MODULE1_LESSON6_CHECK_QUESTIONS,
  MODULE1_LESSON6_NOVEL_UI,
  MODULE1_LESSON6_PAGES,
  MODULE1_LESSON6_PREVIEW_UI,
  MODULE1_LESSON6_SHARED_COPY,
} from "@/modules/module-1-ai-story/constants/lesson6-copy"
import { countModule1MeaningfulChars } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  buildModule1Lesson6ConfirmedEdition,
  clearModule1Lesson6Review,
  finalizeModule1Lesson6State,
  hasModule1Lesson6CurrentFinal,
  hasModule1Lesson6CurrentRequiredAi,
  patchModule1Lesson6AiProcess,
  recordModule1Lesson6AiCopy,
} from "@/modules/module-1-ai-story/domains/portfolio/lesson6-update"
import { Module1StoryReading } from "@/modules/module-1-ai-story/features/story/Module1StoryReading"
import { Module1LessonSnapshotDownloadButton } from "@/modules/module-1-ai-story/features/global-actions/Module1LessonSnapshotDownloadButton"
import { EditableCopyPromptControl } from "@/modules/module-1-ai-story/features/lesson3-support/EditableCopyPromptControl"
import { Lesson3AiReplyField } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3AiReplyField"
import { Lesson3ReviewBanner } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3ReviewBanner"
import { Lesson3StepSplit } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3StepSplit"
import { Lesson6WritingDrawer } from "@/modules/module-1-ai-story/lessons/lesson-6/components/Lesson6WritingDrawer"
import {
  buildModule1Lesson6CheckContextKey,
  buildModule1Lesson6PreviewKey,
  buildModule1Lesson6Prompt,
} from "@/modules/module-1-ai-story/lessons/lesson-6/utils/build-lesson6-prompts"

export default function Step4CheckConfirm() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [finished, setFinished] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [openedPreviewKey, setOpenedPreviewKey] = useState("")
  const [showSources, setShowSources] = useState(false)
  const [wasComplete, setWasComplete] = useState(false)

  useEffect(() => {
    if (!previewOpen || !portfolio) return
    const key = buildModule1Lesson6PreviewKey(portfolio)
    if (portfolio.lesson6.previewSeenKey === key) return
    updatePortfolio(current => ({
      ...current,
      lesson6: finalizeModule1Lesson6State(current.lesson6, {
        ...current.lesson6,
        previewSeenKey: buildModule1Lesson6PreviewKey(current),
      }),
    }))
  }, [previewOpen, portfolio, updatePortfolio])

  useEffect(() => {
    if (!portfolio) return
    if (!portfolio.lesson6.finalText.trim() && portfolio.lesson6.draftText.trim()) {
      updatePortfolio(current => ({
        ...current,
        lesson6: finalizeModule1Lesson6State(
          current.lesson6,
          current.lesson6.finalText.trim()
            ? current.lesson6
            : { ...current.lesson6, finalText: current.lesson6.draftText },
        ),
      }))
    }
    // 仅在首次进入且确认稿为空时带入初稿，不记为已确认。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!portfolio) return null

  const page = MODULE1_LESSON6_PAGES.step4
  const state = portfolio.lesson6
  const p4 = state.aiProcess.p4
  const p5 = state.aiProcess.p5
  const checkContextKey = buildModule1Lesson6CheckContextKey(portfolio)
  const previewKey = buildModule1Lesson6PreviewKey(portfolio)
  const previewReady = state.previewSeenKey === previewKey
  const previewChanged = previewOpen && Boolean(openedPreviewKey) && openedPreviewKey !== previewKey
  const valid = hasModule1Lesson6CurrentFinal(state, checkContextKey, previewKey)
  const inspectReady = Boolean((state.finalText.trim() || state.draftText.trim()))
  const contextStale = p4.copySucceeded
    && Boolean(p4.contextKey.trim())
    && p4.contextKey !== checkContextKey

  const updateLesson6 = (updater: (current: typeof state) => typeof state) => {
    updatePortfolio(current => ({
      ...current,
      lesson6: finalizeModule1Lesson6State(current.lesson6, updater(current.lesson6)),
    }))
  }

  const applyKeepDraft = () => {
    updateLesson6(current => ({
      ...current,
      previousFinalText: current.finalText,
      finalText: current.draftText,
    }))
    setReplaceOpen(false)
  }

  const keepDraft = () => {
    if (state.finalText.trim() && state.finalText.trim() !== state.draftText.trim()) {
      setReplaceOpen(true)
      return
    }
    applyKeepDraft()
  }

  const complete = async () => {
    if (!previewReady) {
      setError(MODULE1_LESSON6_SHARED_COPY.missingPreview)
      return
    }
    if (!state.finalText.trim() || !state.decisionNote.trim() || !state.selfCheck) {
      setError(page.validation[0])
      return
    }
    if (!portfolio.lesson3.finalText.trim() || !portfolio.lesson4.finalText.trim() || !portfolio.lesson5.finalText.trim()) {
      setError(MODULE1_LESSON6_PREVIEW_UI.missingPart)
      return
    }
    if (!hasModule1Lesson6CurrentRequiredAi(p4, checkContextKey)) {
      setError(contextStale ? MODULE1_LESSON6_SHARED_COPY.promptChanged : page.validation[1])
      return
    }
    if (p5.copySucceeded && !p5.aiReply.trim()) {
      setError(page.validation[2])
      return
    }
    setError("")
    const completedAt = new Date().toISOString()
    setWasComplete(state.completed)
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 6, stepId: 4 },
      lesson6: {
        ...clearModule1Lesson6Review(current.lesson6, ["plan", "draft", "final"]),
        step: 4,
        step4Completed: true,
        completed: true,
        completedAt: current.lesson6.completedAt || completedAt,
        confirmedEdition: buildModule1Lesson6ConfirmedEdition(current, completedAt),
      },
    }))
    await flushPortfolio()
    setFinished(true)
  }

  return (
    <div className="space-y-4">
      <Lesson3StepSplit
        aiPlacement="start"
        main={(
          <Card className="flex h-full flex-col">
            <CardHeader className="space-y-2 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="leading-snug">{page.question}</CardTitle>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {MODULE1_LESSON6_SHARED_COPY.observeMainBadge}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{page.intro}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal space-y-1 pl-5 text-sm">{page.steps.map(item => <li key={item}>{item}</li>)}</ol>
              <p className="text-sm">{page.deliver}</p>
              <p className="text-xs text-muted-foreground">
                {MODULE1_LESSON6_SHARED_COPY.storyTitleReadonly}：{portfolio.lesson3.storyTitle.trim() || MODULE1_LESSON6_SHARED_COPY.notFilled}。{MODULE1_LESSON6_SHARED_COPY.changeTitleHint}
              </p>
              <details className="rounded-lg border bg-muted/30 text-sm">
                <summary className="cursor-pointer px-3 py-2 font-medium">{MODULE1_LESSON6_SHARED_COPY.openingTitle}</summary>
                <pre className="whitespace-pre-wrap border-t px-3 py-2 font-sans text-sm">
                  {portfolio.lesson3.finalText.trim() || MODULE1_LESSON6_SHARED_COPY.notFilled}
                </pre>
              </details>
              <details className="rounded-lg border bg-muted/30 text-sm">
                <summary className="cursor-pointer px-3 py-2 font-medium">{MODULE1_LESSON6_SHARED_COPY.developmentTitle}</summary>
                <pre className="whitespace-pre-wrap border-t px-3 py-2 font-sans text-sm">
                  {portfolio.lesson4.finalText.trim() || MODULE1_LESSON6_SHARED_COPY.notFilled}
                </pre>
              </details>
              <details className="rounded-lg border bg-muted/30 text-sm">
                <summary className="cursor-pointer px-3 py-2 font-medium">{MODULE1_LESSON6_SHARED_COPY.turnTitle}</summary>
                <pre className="whitespace-pre-wrap border-t px-3 py-2 font-sans text-sm">
                  {portfolio.lesson5.finalText.trim() || MODULE1_LESSON6_SHARED_COPY.notFilled}
                </pre>
              </details>
              <div className="grid gap-2 sm:grid-cols-2">
                {MODULE1_LESSON6_CHECK_QUESTIONS.map(item => (
                  <p key={item.question} className="rounded-md border-l-4 border-primary bg-primary/5 px-3 py-2 text-sm">
                    <span className="font-medium">{item.question}</span>
                    <span className="mt-1 block text-muted-foreground">{item.meaning}</span>
                  </p>
                ))}
              </div>
              <Lesson3ReviewBanner
                visible={state.reviewNeeded.final}
                message={state.reviewNeeded.draft ? MODULE1_LESSON6_SHARED_COPY.draftChanged : MODULE1_LESSON6_SHARED_COPY.planChanged}
                confirmEnabled={Boolean(state.finalText.trim() && state.decisionNote.trim() && state.selfCheck)}
                onConfirm={() => updateLesson6(current => clearModule1Lesson6Review(current, ["final", "draft"]))}
              />
              <label className="space-y-1.5 text-sm font-medium">
                <span>{page.fields[0].label}</span>
                <Textarea
                  className="min-h-[220px] border-2"
                  value={state.finalText}
                  onChange={event => updateLesson6(current => ({ ...current, finalText: event.target.value }))}
                  placeholder={page.fields[0].placeholder}
                />
              </label>
              <p className="text-sm text-muted-foreground">
                {MODULE1_LESSON6_SHARED_COPY.wordCountLabel}：{countModule1MeaningfulChars(state.finalText)}。{MODULE1_LESSON6_SHARED_COPY.wordCountHint}
              </p>
              <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <Button type="button" onClick={() => { setOpenedPreviewKey(previewKey); setPreviewOpen(true) }}>
                  {MODULE1_LESSON6_PREVIEW_UI.open}
                </Button>
                <p className="text-xs text-muted-foreground">{MODULE1_LESSON6_PREVIEW_UI.onlyPreviewNotice}</p>
                {!previewReady && <p className="text-xs text-amber-800">{MODULE1_LESSON6_SHARED_COPY.missingPreview}</p>}
              </div>
              <label className="space-y-1.5 text-sm font-medium">
                <span>{page.fields[1].label}</span>
                <Textarea
                  className="min-h-[96px] border-2"
                  value={state.decisionNote}
                  onChange={event => updateLesson6(current => ({ ...current, decisionNote: event.target.value }))}
                  placeholder={page.fields[1].placeholder}
                />
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={previewReady && state.selfCheck}
                  disabled={!previewReady}
                  onChange={event => {
                    if (!previewReady) return
                    updateLesson6(current => ({ ...current, selfCheck: event.target.checked }))
                  }}
                />
                <span>{MODULE1_LESSON6_SHARED_COPY.selfCheckLabel}</span>
              </label>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    title={MODULE1_LESSON6_SHARED_COPY.keepDraftHint}
                    aria-label={`${page.buttons[2]}${MODULE1_LESSON6_SHARED_COPY.keepDraftHint}`}
                    onClick={keepDraft}
                  >
                    {page.buttons[2]}
                  </Button>
                  {state.previousFinalText.trim() && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => updateLesson6(current => ({
                        ...current,
                        finalText: current.previousFinalText,
                        previousFinalText: "",
                      }))}
                    >
                      {MODULE1_LESSON6_SHARED_COPY.restoreFinal}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{MODULE1_LESSON6_SHARED_COPY.keepDraftHint}</p>
              </div>
            </CardContent>
          </Card>
        )}
        ai={(
          <Card className={cn("flex h-full min-w-0 flex-col overflow-hidden", (p4.copySucceeded || p5.copySucceeded) && "border-primary")}>
            <CardHeader>
              <CardTitle className="leading-snug">{MODULE1_LESSON6_SHARED_COPY.aiAssistRequiredTitleRevise}</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <p className="text-sm leading-relaxed">{MODULE1_LESSON6_SHARED_COPY.aiAssistRequiredNote}</p>
              <EditableCopyPromptControl
                label={page.buttons[0]}
                copiedLabel={MODULE1_LESSON6_SHARED_COPY.copied}
                copyFailedLabel={MODULE1_LESSON6_SHARED_COPY.copyFailed}
                restoreLabel={MODULE1_LESSON6_SHARED_COPY.restorePrompt}
                onRestore={() => updateLesson6(current => ({
                  ...current,
                  customPrompts: { ...current.customPrompts, p4: "" },
                }))}
                disabled={!inspectReady}
                disabledReason={inspectReady ? undefined : MODULE1_LESSON6_SHARED_COPY.missingInspect}
                customText={state.customPrompts.p4}
                onCustomTextChange={value => updateLesson6(current => ({
                  ...current,
                  customPrompts: { ...current.customPrompts, p4: value },
                }))}
                buildText={() => buildModule1Lesson6Prompt("P4", portfolio)}
                onCopied={detail => updateLesson6(current => patchModule1Lesson6AiProcess(
                  current,
                  "p4",
                  recordModule1Lesson6AiCopy(
                    current.aiProcess.p4,
                    detail.generatedPrompt,
                    detail.copiedPrompt,
                    buildModule1Lesson6CheckContextKey(portfolio),
                  ),
                ))}
              />
              {contextStale && (
                <p className="text-sm text-amber-800">{MODULE1_LESSON6_SHARED_COPY.promptChanged}</p>
              )}
              <Lesson3AiReplyField
                copySucceeded={p4.copySucceeded}
                value={p4.aiReply}
                optionalLabel={MODULE1_LESSON6_SHARED_COPY.aiReplyRequiredLabel}
                onChange={value => updateLesson6(current => patchModule1Lesson6AiProcess(current, "p4", { aiReply: value }))}
              />
              <p className="text-xs text-muted-foreground">{MODULE1_LESSON6_SHARED_COPY.recheckNote}</p>
              <details className="space-y-3 rounded-lg border p-3">
                <summary className="cursor-pointer text-sm font-medium">{MODULE1_LESSON6_SHARED_COPY.optionalReviseTitle}</summary>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>{page.fields[2].label}</span>
                  <Textarea
                    className="min-h-[80px]"
                    value={state.revisionInstruction}
                    onChange={event => updateLesson6(current => ({ ...current, revisionInstruction: event.target.value }))}
                    placeholder={page.fields[2].placeholder}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>{page.fields[3].label}</span>
                  <Textarea
                    className="min-h-[72px]"
                    value={state.preserveText}
                    onChange={event => updateLesson6(current => ({ ...current, preserveText: event.target.value }))}
                    placeholder={page.fields[3].placeholder}
                  />
                </label>
                <EditableCopyPromptControl
                  label={page.buttons[1]}
                  copiedLabel={MODULE1_LESSON6_SHARED_COPY.copied}
                  copyFailedLabel={MODULE1_LESSON6_SHARED_COPY.copyFailed}
                  restoreLabel={MODULE1_LESSON6_SHARED_COPY.restorePrompt}
                  onRestore={() => updateLesson6(current => ({
                    ...current,
                    customPrompts: { ...current.customPrompts, p5: "" },
                  }))}
                  disabled={!state.revisionInstruction.trim() || !inspectReady}
                  disabledReason={!state.revisionInstruction.trim() ? MODULE1_LESSON6_SHARED_COPY.missingRevision : undefined}
                  customText={state.customPrompts.p5}
                  onCustomTextChange={value => updateLesson6(current => ({
                    ...current,
                    customPrompts: { ...current.customPrompts, p5: value },
                  }))}
                  buildText={() => buildModule1Lesson6Prompt("P5", portfolio)}
                  onCopied={detail => updateLesson6(current => patchModule1Lesson6AiProcess(
                    current,
                    "p5",
                    recordModule1Lesson6AiCopy(current.aiProcess.p5, detail.generatedPrompt, detail.copiedPrompt, "p5"),
                  ))}
                />
                <Lesson3AiReplyField
                  copySucceeded={p5.copySucceeded}
                  value={p5.aiReply}
                  onChange={value => updateLesson6(current => patchModule1Lesson6AiProcess(current, "p5", { aiReply: value }))}
                />
                <p className="text-xs text-muted-foreground">请把 AI 返回的合段正文贴进确认稿，改动说明不要混进小说。</p>
              </details>
            </CardContent>
          </Card>
        )}
        footer={(
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{page.teacher}</p>
            {(error || (p4.copySucceeded && !p4.aiReply.trim()) || (p5.copySucceeded && !p5.aiReply.trim())) && (
              <p role="alert" className="text-sm text-destructive">
                {error || (p4.copySucceeded && !p4.aiReply.trim() ? page.validation[1] : page.validation[2])}
              </p>
            )}
            <Button disabled={!valid} onClick={() => void complete()}>{page.buttons[3]}</Button>
          </div>
        )}
      />
      <Lesson6WritingDrawer lesson1={portfolio.lesson1} lesson2={portfolio.lesson2} lesson3={portfolio.lesson3} lesson4={portfolio.lesson4} lesson5={portfolio.lesson5} lesson6={state} />

      <Dialog open={replaceOpen} onOpenChange={setReplaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{MODULE1_LESSON6_SHARED_COPY.keepDraftConfirmTitle}</DialogTitle>
            <DialogDescription>{MODULE1_LESSON6_SHARED_COPY.keepDraftConfirmBody}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReplaceOpen(false)}>{MODULE1_LESSON6_SHARED_COPY.cancel}</Button>
            <Button type="button" onClick={applyKeepDraft}>{MODULE1_LESSON6_SHARED_COPY.keepDraftConfirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={finished} onOpenChange={open => { if (!open) navigate("/module/1/story") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{MODULE1_LESSON6_SHARED_COPY.finishTitle}</DialogTitle>
            <DialogDescription>
              {wasComplete ? MODULE1_LESSON6_SHARED_COPY.finishUpdatedBody : MODULE1_LESSON6_SHARED_COPY.finishBody}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{MODULE1_LESSON6_SHARED_COPY.exportReminder}</p>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Module1LessonSnapshotDownloadButton portfolio={portfolio} lessonId={6} enabled />
            <Button type="button" onClick={() => navigate("/module/1/story")}>{MODULE1_LESSON6_NOVEL_UI.button}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{MODULE1_LESSON6_PREVIEW_UI.title}</DialogTitle>
            <DialogDescription>{MODULE1_LESSON6_PREVIEW_UI.editingNotice}</DialogDescription>
          </DialogHeader>
          <p className="text-sm font-medium text-amber-900">{MODULE1_LESSON6_PREVIEW_UI.editingBadge}</p>
          {previewChanged && <p className="text-sm text-amber-800">{MODULE1_LESSON6_PREVIEW_UI.changedDuringPreview}</p>}
          {!state.finalText.trim() && !state.draftText.trim() && (
            <p className="text-sm text-muted-foreground">{MODULE1_LESSON6_PREVIEW_UI.emptyEnding}</p>
          )}
          {(!portfolio.lesson3.finalText.trim() || !portfolio.lesson4.finalText.trim() || !portfolio.lesson5.finalText.trim()) && (
            <p className="text-sm text-muted-foreground">{MODULE1_LESSON6_PREVIEW_UI.missingPart}</p>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showSources} onChange={event => setShowSources(event.target.checked)} />
            {MODULE1_LESSON6_PREVIEW_UI.sourceToggle}
          </label>
          <Module1StoryReading
            title={portfolio.lesson3.storyTitle}
            untitledLabel={MODULE1_LESSON6_NOVEL_UI.noTitle}
            showSources={showSources}
            parts={[
              { id: "opening", label: MODULE1_LESSON6_NOVEL_UI.partOpening, text: portfolio.lesson3.finalText },
              { id: "development", label: MODULE1_LESSON6_NOVEL_UI.partDevelopment, text: portfolio.lesson4.finalText },
              { id: "turn", label: MODULE1_LESSON6_NOVEL_UI.partTurn, text: portfolio.lesson5.finalText },
              { id: "ending", label: MODULE1_LESSON6_NOVEL_UI.partEnding, text: state.finalText.trim() || state.draftText },
            ]}
          />
          <p className="text-xs text-muted-foreground">{MODULE1_LESSON6_PREVIEW_UI.onlyPreviewNotice}</p>
          <DialogFooter>
            <Button type="button" onClick={() => setPreviewOpen(false)}>{MODULE1_LESSON6_PREVIEW_UI.return}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
