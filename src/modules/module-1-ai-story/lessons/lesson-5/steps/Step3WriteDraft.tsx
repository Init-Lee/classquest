/**
 * 文件说明：模块 1 课时 5 第三关用 AI 起草转段。
 * 职责：只读课时 3 题目与前序确认稿，学生保存转段初稿；本关必须复制 P3 并贴回回复；完成后初稿硬锁只读，顶栏仍可回看。
 * 更新触发：第 3 关必用外部 AI、初稿硬锁、锁定灰态、题目只读或字数引导规则变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/utils/cn"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { MODULE1_LESSON5_PAGES, MODULE1_LESSON5_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson5-copy"
import { countModule1MeaningfulChars } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  clearModule1Lesson5Review,
  finalizeModule1Lesson5State,
  freezeModule1Lesson5Draft,
  hasModule1Lesson5CurrentDraft,
  hasModule1Lesson5CurrentRequiredAi,
  patchModule1Lesson5AiProcess,
  recordModule1Lesson5AiCopy,
} from "@/modules/module-1-ai-story/domains/portfolio/lesson5-update"
import { EditableCopyPromptControl } from "@/modules/module-1-ai-story/features/lesson3-support/EditableCopyPromptControl"
import { Lesson3AiReplyField } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3AiReplyField"
import { Lesson3ReviewBanner } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3ReviewBanner"
import { Lesson3StepSplit } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3StepSplit"
import { Lesson5WritingDrawer } from "@/modules/module-1-ai-story/lessons/lesson-5/components/Lesson5WritingDrawer"
import {
  buildModule1Lesson5DraftContextKey,
  buildModule1Lesson5Prompt,
} from "@/modules/module-1-ai-story/lessons/lesson-5/utils/build-lesson5-prompts"

export default function Step3WriteDraft() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  if (!portfolio) return null

  const page = MODULE1_LESSON5_PAGES.step3
  const state = portfolio.lesson5
  const process = state.aiProcess.p3
  const draftLocked = state.step3Completed
  const draftContextKey = buildModule1Lesson5DraftContextKey(portfolio)
  const valid = draftLocked || hasModule1Lesson5CurrentDraft(state, draftContextKey)
  const charCount = countModule1MeaningfulChars(state.draftText)
  const planReady = Boolean(state.plotPlan.trim() && state.planReason.trim())
  const contextStale = process.copySucceeded
    && Boolean(process.contextKey.trim())
    && process.contextKey !== draftContextKey

  const updateLesson5 = (updater: (current: typeof state) => typeof state) => {
    updatePortfolio(current => ({
      ...current,
      lesson5: finalizeModule1Lesson5State(current.lesson5, updater(current.lesson5)),
    }))
  }

  const continueNext = async () => {
    // 已完成后只回看：直接进第 4 关，不重写初稿、不因只读态清空。
    if (draftLocked) {
      setError("")
      updatePortfolio(current => ({
        ...current,
        progress: { lessonId: 5, stepId: 4 },
        lesson5: {
          ...current.lesson5,
          step: 4,
          step3Completed: true,
        },
      }))
      await flushPortfolio()
      navigate("/module/1/lesson/5/step/4")
      return
    }
    if (!state.draftText.trim()) {
      setError(page.validation[0])
      return
    }
    if (!hasModule1Lesson5CurrentRequiredAi(process, draftContextKey)) {
      setError(contextStale ? MODULE1_LESSON5_SHARED_COPY.promptChanged : page.validation[1])
      return
    }
    setError("")
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 5, stepId: 4 },
      lesson5: {
        ...freezeModule1Lesson5Draft(clearModule1Lesson5Review(current.lesson5, ["draft"])),
        step: 4,
        step3Completed: true,
      },
    }))
    await flushPortfolio()
    navigate("/module/1/lesson/5/step/4")
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
                  {MODULE1_LESSON5_SHARED_COPY.observeMainBadge}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{page.intro}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal space-y-1 pl-5 text-sm">{page.steps.map(item => <li key={item}>{item}</li>)}</ol>
              <p className="text-sm">{page.deliver}</p>
              <p className="text-xs text-muted-foreground">
                {MODULE1_LESSON5_SHARED_COPY.storyTitleReadonly}：{portfolio.lesson3.storyTitle.trim() || MODULE1_LESSON5_SHARED_COPY.notFilled}。{MODULE1_LESSON5_SHARED_COPY.changeTitleHint}
              </p>
              <details className="rounded-lg border bg-muted/30 text-sm">
                <summary className="cursor-pointer px-3 py-2 font-medium">{MODULE1_LESSON5_SHARED_COPY.openingTitle}</summary>
                <pre className="whitespace-pre-wrap border-t px-3 py-2 font-sans text-sm">
                  {portfolio.lesson3.finalText.trim() || MODULE1_LESSON5_SHARED_COPY.notFilled}
                </pre>
              </details>
              <details className="rounded-lg border bg-muted/30 text-sm">
                <summary className="cursor-pointer px-3 py-2 font-medium">{MODULE1_LESSON5_SHARED_COPY.developmentTitle}</summary>
                <pre className="whitespace-pre-wrap border-t px-3 py-2 font-sans text-sm">
                  {portfolio.lesson4.finalText.trim() || MODULE1_LESSON5_SHARED_COPY.notFilled}
                </pre>
              </details>
              <Lesson3ReviewBanner
                visible={state.reviewNeeded.draft}
                message={state.reviewNeeded.plan ? MODULE1_LESSON5_SHARED_COPY.planChanged : MODULE1_LESSON5_SHARED_COPY.openingChanged}
                confirmEnabled={valid}
                onConfirm={() => updateLesson5(current => clearModule1Lesson5Review(current, ["draft"]))}
              />
              {draftLocked && (
                <p className="text-sm text-muted-foreground">{MODULE1_LESSON5_SHARED_COPY.draftLockedHint}</p>
              )}
              <label className="space-y-1.5 text-sm font-medium">
                <span>{page.fields[0].label}</span>
                <Textarea
                  className={cn(
                    "min-h-[220px] border-2",
                    draftLocked && "cursor-default border-muted bg-muted text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0",
                  )}
                  value={state.draftText}
                  readOnly={draftLocked}
                  onChange={event => {
                    if (draftLocked) return
                    updateLesson5(current => ({ ...current, draftText: event.target.value }))
                  }}
                  placeholder={page.fields[0].placeholder}
                />
              </label>
              <p className="text-sm text-muted-foreground">
                {MODULE1_LESSON5_SHARED_COPY.wordCountLabel}：{charCount}。{MODULE1_LESSON5_SHARED_COPY.wordCountHint}
                {charCount > 0 && (charCount < 200 || charCount > 300) ? " 未落在区间也可以继续，不判定质量不合格。" : ""}
              </p>
            </CardContent>
          </Card>
        )}
        ai={(
          <Card className={cn("flex h-full min-w-0 flex-col overflow-hidden", process.copySucceeded && !draftLocked && "border-primary")}>
            <CardHeader>
              <CardTitle className="leading-snug">{MODULE1_LESSON5_SHARED_COPY.aiAssistRequiredTitleDraft}</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <p className="text-sm leading-relaxed">{MODULE1_LESSON5_SHARED_COPY.aiAssistRequiredNote}</p>
              <EditableCopyPromptControl
                label={page.buttons[0]}
                copiedLabel={MODULE1_LESSON5_SHARED_COPY.copied}
                copyFailedLabel={MODULE1_LESSON5_SHARED_COPY.copyFailed}
                restoreLabel={MODULE1_LESSON5_SHARED_COPY.restorePrompt}
                onRestore={() => updateLesson5(current => ({
                  ...current,
                  customPrompts: { ...current.customPrompts, p3: "" },
                }))}
                disabled={draftLocked || !planReady}
                disabledReason={draftLocked
                  ? MODULE1_LESSON5_SHARED_COPY.draftLockedHint
                  : (planReady ? undefined : MODULE1_LESSON5_SHARED_COPY.missingPlan)}
                customText={state.customPrompts.p3}
                onCustomTextChange={value => {
                  if (draftLocked) return
                  updateLesson5(current => ({
                    ...current,
                    customPrompts: { ...current.customPrompts, p3: value },
                  }))
                }}
                buildText={() => buildModule1Lesson5Prompt("P3", portfolio)}
                onCopied={detail => updateLesson5(current => patchModule1Lesson5AiProcess(
                  current,
                  "p3",
                  recordModule1Lesson5AiCopy(
                    current.aiProcess.p3,
                    detail.generatedPrompt,
                    detail.copiedPrompt,
                    buildModule1Lesson5DraftContextKey(portfolio),
                  ),
                ))}
              />
              {contextStale && !draftLocked && (
                <p className="text-sm text-amber-800">{MODULE1_LESSON5_SHARED_COPY.promptChanged}</p>
              )}
              <Lesson3AiReplyField
                copySucceeded={process.copySucceeded}
                readOnly={draftLocked}
                value={process.aiReply}
                optionalLabel={MODULE1_LESSON5_SHARED_COPY.aiReplyRequiredLabel}
                onChange={value => {
                  if (draftLocked) return
                  updateLesson5(current => patchModule1Lesson5AiProcess(current, "p3", { aiReply: value }))
                }}
              />
            </CardContent>
          </Card>
        )}
        footer={(
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{page.teacher}</p>
            <p className="text-sm text-muted-foreground">{MODULE1_LESSON5_SHARED_COPY.newContextNote}</p>
            {(error || (!draftLocked && process.copySucceeded && !process.aiReply.trim())) && (
              <p role="alert" className="text-sm text-destructive">{error || page.validation[1]}</p>
            )}
            <Button disabled={!valid} onClick={() => void continueNext()}>{page.buttons[1]}</Button>
          </div>
        )}
      />
      <Lesson5WritingDrawer lesson1={portfolio.lesson1} lesson2={portfolio.lesson2} lesson3={portfolio.lesson3} lesson4={portfolio.lesson4} lesson5={state} />
    </div>
  )
}
