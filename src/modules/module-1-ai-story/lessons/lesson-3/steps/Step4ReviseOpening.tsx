/**
 * 文件说明：模块 1 课时 3 第四关检查与修改。
 * 职责：独立确认稿、四个阅读问题、保留初稿防丢、P4/P5 过程入档，完成后指向课时 4。
 * 更新触发：第 4 关完成条件、保留初稿确认框或完成弹窗快照入口变化时，需要同步更新本文件。
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
  MODULE1_LESSON3_CHECK_QUESTIONS,
  MODULE1_LESSON3_PAGES,
  MODULE1_LESSON3_SHARED_COPY,
} from "@/modules/module-1-ai-story/constants/lesson3-copy"
import {
  countModule1MeaningfulChars,
  hasMeaningfulModule1Lesson3Fields,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  clearModule1Lesson3Review,
  finalizeModule1Lesson3State,
  patchModule1Lesson3AiProcess,
  recordModule1Lesson3AiCopy,
} from "@/modules/module-1-ai-story/domains/portfolio/lesson3-update"
import { Module1LessonSnapshotDownloadButton } from "@/modules/module-1-ai-story/features/global-actions/Module1LessonSnapshotDownloadButton"
import { EditableCopyPromptControl } from "@/modules/module-1-ai-story/features/lesson3-support/EditableCopyPromptControl"
import { Lesson3AiReplyField } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3AiReplyField"
import { Lesson3OptionalImage } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3OptionalImage"
import { Lesson3ReviewBanner } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3ReviewBanner"
import { Lesson3StepSplit } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3StepSplit"
import { Lesson3WritingDrawer } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3WritingDrawer"
import { buildModule1Lesson3Prompt } from "@/modules/module-1-ai-story/lessons/lesson-3/utils/build-lesson3-prompts"

export default function Step4ReviseOpening() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [finished, setFinished] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)

  useEffect(() => {
    if (!portfolio) return
    if (!portfolio.lesson3.finalText.trim() && portfolio.lesson3.draftText.trim()) {
      updatePortfolio(current => ({
        ...current,
        lesson3: finalizeModule1Lesson3State(
          current.lesson3,
          current.lesson3.finalText.trim()
            ? current.lesson3
            : { ...current.lesson3, finalText: current.lesson3.draftText },
        ),
      }))
    }
    // 仅在首次进入且确认稿为空时带入初稿，不记为已确认。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!portfolio) return null

  const page = MODULE1_LESSON3_PAGES.step4
  const state = portfolio.lesson3
  const p4 = state.aiProcess.p4
  const p5 = state.aiProcess.p5
  const valid = hasMeaningfulModule1Lesson3Fields(state)
  const inspectReady = Boolean((state.finalText.trim() || state.draftText.trim()))

  const updateLesson3 = (updater: (current: typeof state) => typeof state) => {
    updatePortfolio(current => ({
      ...current,
      lesson3: finalizeModule1Lesson3State(current.lesson3, updater(current.lesson3)),
    }))
  }

  const applyKeepDraft = () => {
    updateLesson3(current => ({
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
    if (!state.finalText.trim() || !state.decisionNote.trim()) {
      setError(page.validation[0])
      return
    }
    if (p4.copySucceeded && !p4.aiReply.trim()) {
      setError(page.validation[1])
      return
    }
    if (p5.copySucceeded && !p5.aiReply.trim()) {
      setError(page.validation[2])
      return
    }
    setError("")
    const completedAt = new Date().toISOString()
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 4, stepId: 1 },
      lesson3: {
        ...clearModule1Lesson3Review(current.lesson3, ["opening", "draft", "final"]),
        step: 4,
        step4Completed: true,
        completed: true,
        completedAt,
      },
    }))
    await flushPortfolio()
    setFinished(true)
  }

  return (
    <div className="space-y-4">
      <Lesson3StepSplit
        main={(
          <Card className="flex h-full flex-col">
            <CardHeader className="space-y-2 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="leading-snug">{page.question}</CardTitle>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {MODULE1_LESSON3_SHARED_COPY.observeMainBadge}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{page.intro}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Lesson3OptionalImage src="/module-1/lesson-3/revision_desk.png" alt="检查与修改配图：书桌" />
              <ol className="list-decimal space-y-1 pl-5 text-sm">{page.steps.map(item => <li key={item}>{item}</li>)}</ol>
              <p className="text-sm">{page.deliver}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {MODULE1_LESSON3_CHECK_QUESTIONS.map(item => (
                  <p key={item.question} className="rounded-md border-l-4 border-primary bg-primary/5 px-3 py-2 text-sm">
                    <span className="font-medium">{item.question}</span>
                    <span className="mt-1 block text-muted-foreground">{item.meaning}</span>
                  </p>
                ))}
              </div>
              <Lesson3ReviewBanner
                visible={state.reviewNeeded.final}
                message={state.reviewNeeded.draft ? MODULE1_LESSON3_SHARED_COPY.draftChanged : MODULE1_LESSON3_SHARED_COPY.openingChanged}
                confirmEnabled={Boolean(state.finalText.trim() && state.decisionNote.trim())}
                onConfirm={() => updateLesson3(current => clearModule1Lesson3Review(current, ["final", "draft"]))}
              />
              <label className="space-y-1.5 text-sm font-medium">
                <span>{page.fields[1].label}</span>
                <Textarea
                  className="min-h-[220px] border-2"
                  value={state.finalText}
                  onChange={event => updateLesson3(current => ({ ...current, finalText: event.target.value }))}
                  placeholder={page.fields[1].placeholder}
                />
              </label>
              <p className="text-sm text-muted-foreground">
                {MODULE1_LESSON3_SHARED_COPY.wordCountLabel}：{countModule1MeaningfulChars(state.finalText)}。{MODULE1_LESSON3_SHARED_COPY.wordCountHint}
              </p>
              <label className="space-y-1.5 text-sm font-medium">
                <span>{page.fields[2].label}</span>
                <Textarea
                  className="min-h-[96px] border-2"
                  value={state.decisionNote}
                  onChange={event => updateLesson3(current => ({ ...current, decisionNote: event.target.value }))}
                  placeholder={page.fields[2].placeholder}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={keepDraft}>{page.buttons[2]}</Button>
                {state.previousFinalText.trim() && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => updateLesson3(current => ({
                      ...current,
                      finalText: current.previousFinalText,
                      previousFinalText: "",
                    }))}
                  >
                    {MODULE1_LESSON3_SHARED_COPY.restoreFinal}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        ai={(
          <Card className={cn("flex h-full min-w-0 flex-col overflow-hidden", (p4.copySucceeded || p5.copySucceeded) && "border-primary")}>
            <CardHeader>
              <CardTitle className="leading-snug">需要时再用外部 AI</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <p className="text-sm leading-relaxed">{MODULE1_LESSON3_SHARED_COPY.aiAssistNote}</p>
              <EditableCopyPromptControl
                label={page.buttons[0]}
                disabled={!inspectReady}
                disabledReason={inspectReady ? undefined : "请先写下或粘贴一版开头，再生成检查提示词。"}
                customText={state.customPrompts.p4}
                onCustomTextChange={value => updateLesson3(current => ({
                  ...current,
                  customPrompts: { ...current.customPrompts, p4: value },
                }))}
                buildText={() => buildModule1Lesson3Prompt("P4", portfolio)}
                onCopied={detail => updateLesson3(current => patchModule1Lesson3AiProcess(
                  current,
                  "p4",
                  recordModule1Lesson3AiCopy(current.aiProcess.p4, detail.generatedPrompt, detail.copiedPrompt),
                ))}
              />
              <Lesson3AiReplyField
                copySucceeded={p4.copySucceeded}
                value={p4.aiReply}
                optionalLabel={page.fields[0].label}
                onChange={value => updateLesson3(current => ({
                  ...patchModule1Lesson3AiProcess(current, "p4", { aiReply: value }),
                  feedbackRaw: value,
                }))}
              />
              <details className="space-y-3 rounded-lg border p-3">
                <summary className="cursor-pointer text-sm font-medium">按我选定的意见局部修改（可选）</summary>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>{page.fields[3].label}</span>
                  <Textarea
                    className="min-h-[80px]"
                    value={state.revisionInstruction}
                    onChange={event => updateLesson3(current => ({ ...current, revisionInstruction: event.target.value }))}
                    placeholder={page.fields[3].placeholder}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>{page.fields[4].label}</span>
                  <Textarea
                    className="min-h-[72px]"
                    value={state.preserveText}
                    onChange={event => updateLesson3(current => ({ ...current, preserveText: event.target.value }))}
                    placeholder={page.fields[4].placeholder}
                  />
                </label>
                <EditableCopyPromptControl
                  label={page.buttons[1]}
                  disabled={!state.revisionInstruction.trim() || !inspectReady}
                  disabledReason={!state.revisionInstruction.trim() ? MODULE1_LESSON3_SHARED_COPY.missingRevision : undefined}
                  customText={state.customPrompts.p5}
                  onCustomTextChange={value => updateLesson3(current => ({
                    ...current,
                    customPrompts: { ...current.customPrompts, p5: value },
                  }))}
                  buildText={() => buildModule1Lesson3Prompt("P5", portfolio)}
                  onCopied={detail => updateLesson3(current => patchModule1Lesson3AiProcess(
                    current,
                    "p5",
                    recordModule1Lesson3AiCopy(current.aiProcess.p5, detail.generatedPrompt, detail.copiedPrompt),
                  ))}
                />
                <Lesson3AiReplyField
                  copySucceeded={p5.copySucceeded}
                  value={p5.aiReply}
                  onChange={value => updateLesson3(current => patchModule1Lesson3AiProcess(current, "p5", { aiReply: value }))}
                />
                <p className="text-xs text-muted-foreground">请把 AI 返回的开头正文贴进确认稿，改动说明不要混进小说。</p>
              </details>
            </CardContent>
          </Card>
        )}
        footer={(
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{page.hint}</p>
            {(error || (p4.copySucceeded && !p4.aiReply.trim()) || (p5.copySucceeded && !p5.aiReply.trim())) && (
              <p role="alert" className="text-sm text-destructive">
                {error || (p4.copySucceeded && !p4.aiReply.trim() ? page.validation[1] : page.validation[2])}
              </p>
            )}
            <Button disabled={!valid} onClick={() => void complete()}>{page.buttons[3]}</Button>
          </div>
        )}
      />
      <Lesson3WritingDrawer lesson1={portfolio.lesson1} lesson2={portfolio.lesson2} lesson3={state} />

      <Dialog open={replaceOpen} onOpenChange={setReplaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{MODULE1_LESSON3_SHARED_COPY.keepDraftConfirmTitle}</DialogTitle>
            <DialogDescription>{MODULE1_LESSON3_SHARED_COPY.keepDraftConfirmBody}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReplaceOpen(false)}>{MODULE1_LESSON3_SHARED_COPY.cancel}</Button>
            <Button type="button" onClick={applyKeepDraft}>{MODULE1_LESSON3_SHARED_COPY.keepDraftConfirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={finished} onOpenChange={open => { if (!open) navigate("/module/1") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{MODULE1_LESSON3_SHARED_COPY.finishTitle}</DialogTitle>
            <DialogDescription>{MODULE1_LESSON3_SHARED_COPY.finishBody}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{MODULE1_LESSON3_SHARED_COPY.exportReminder}</p>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Module1LessonSnapshotDownloadButton portfolio={portfolio} lessonId={3} enabled />
            <Button type="button" onClick={() => navigate("/module/1")}>回到模块首页</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
