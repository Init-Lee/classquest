/**
 * 文件说明：模块 1 课时 3 第三关完成初稿。
 * 职责：必填题目与初稿，展示 200—300 字引导；首次确认冻结初稿；本关必须复制 P3 并贴回回复，过程入档。
 * 更新触发：第 3 关题目必填、字数展示、初稿冻结、必用外部 AI 或 P3 过程入档规则变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/utils/cn"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { MODULE1_LESSON3_PAGES, MODULE1_LESSON3_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson3-copy"
import {
  countModule1MeaningfulChars,
  hasModule1Lesson3Draft,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  clearModule1Lesson3Review,
  finalizeModule1Lesson3State,
  freezeModule1Lesson3Draft,
  patchModule1Lesson3AiProcess,
  recordModule1Lesson3AiCopy,
} from "@/modules/module-1-ai-story/domains/portfolio/lesson3-update"
import { EditableCopyPromptControl } from "@/modules/module-1-ai-story/features/lesson3-support/EditableCopyPromptControl"
import { Lesson3AiReplyField } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3AiReplyField"
import { Lesson3ReviewBanner } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3ReviewBanner"
import { Lesson3StepSplit } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3StepSplit"
import { Lesson3WritingDrawer } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3WritingDrawer"
import { buildModule1Lesson3Prompt } from "@/modules/module-1-ai-story/lessons/lesson-3/utils/build-lesson3-prompts"

export default function Step3WriteDraft() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  if (!portfolio) return null

  const page = MODULE1_LESSON3_PAGES.step3
  const state = portfolio.lesson3
  const process = state.aiProcess.p3
  const valid = hasModule1Lesson3Draft(state)
  const charCount = countModule1MeaningfulChars(state.draftText)
  const promptReady = Boolean(state.openingPlan.trim() && state.focusTechnique.trim())

  const updateLesson3 = (updater: (current: typeof state) => typeof state) => {
    updatePortfolio(current => ({
      ...current,
      lesson3: finalizeModule1Lesson3State(current.lesson3, updater(current.lesson3)),
    }))
  }

  const continueNext = async () => {
    if (!state.storyTitle.trim()) {
      setError(page.validation[0])
      return
    }
    if (!state.draftText.trim()) {
      setError(page.validation[1])
      return
    }
    if (!process.copySucceeded || !process.aiReply.trim()) {
      setError(page.validation[2])
      return
    }
    setError("")
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 3, stepId: 4 },
      lesson3: {
        ...freezeModule1Lesson3Draft(clearModule1Lesson3Review(current.lesson3, ["draft"])),
        step: 4,
        step3Completed: true,
      },
    }))
    await flushPortfolio()
    navigate("/module/1/lesson/3/step/4")
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
                  {MODULE1_LESSON3_SHARED_COPY.observeMainBadge}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{page.intro}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal space-y-1 pl-5 text-sm">{page.steps.map(item => <li key={item}>{item}</li>)}</ol>
              <p className="text-sm">{page.deliver}</p>
              <Lesson3ReviewBanner
                visible={state.reviewNeeded.draft}
                message={MODULE1_LESSON3_SHARED_COPY.openingChanged}
                confirmEnabled={valid}
                onConfirm={() => updateLesson3(current => clearModule1Lesson3Review(current, ["draft"]))}
              />
              <label className="space-y-1.5 text-sm font-medium">
                <span>{page.fields[0].label}</span>
                <Input
                  value={state.storyTitle}
                  onChange={event => updateLesson3(current => ({ ...current, storyTitle: event.target.value }))}
                  placeholder={page.fields[0].placeholder}
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                <span>{page.fields[1].label}</span>
                <Textarea
                  className="min-h-[220px] border-2"
                  value={state.draftText}
                  onChange={event => updateLesson3(current => ({ ...current, draftText: event.target.value }))}
                  placeholder={page.fields[1].placeholder}
                />
              </label>
              <p className="text-sm text-muted-foreground">
                {MODULE1_LESSON3_SHARED_COPY.wordCountLabel}：{charCount}。{MODULE1_LESSON3_SHARED_COPY.wordCountHint}
                {charCount > 0 && (charCount < 200 || charCount > 300) ? " 未落在区间也可以继续，不判定质量不合格。" : ""}
              </p>
            </CardContent>
          </Card>
        )}
        ai={(
          <Card className={cn("flex h-full min-w-0 flex-col overflow-hidden", process.copySucceeded && "border-primary")}>
            <CardHeader>
              <CardTitle className="leading-snug">{MODULE1_LESSON3_SHARED_COPY.aiAssistRequiredTitleDraft}</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <p className="text-sm leading-relaxed">{MODULE1_LESSON3_SHARED_COPY.aiAssistRequiredNote}</p>
              <EditableCopyPromptControl
                label={page.buttons[0]}
                disabled={!promptReady}
                disabledReason={promptReady ? undefined : MODULE1_LESSON3_SHARED_COPY.missingOpening}
                customText={state.customPrompts.p3}
                onCustomTextChange={value => updateLesson3(current => ({
                  ...current,
                  customPrompts: { ...current.customPrompts, p3: value },
                }))}
                buildText={() => buildModule1Lesson3Prompt("P3", portfolio)}
                onCopied={detail => updateLesson3(current => patchModule1Lesson3AiProcess(
                  current,
                  "p3",
                  recordModule1Lesson3AiCopy(current.aiProcess.p3, detail.generatedPrompt, detail.copiedPrompt),
                ))}
              />
              <Lesson3AiReplyField
                copySucceeded={process.copySucceeded}
                value={process.aiReply}
                optionalLabel={MODULE1_LESSON3_SHARED_COPY.aiReplyRequiredLabel}
                onChange={value => updateLesson3(current => patchModule1Lesson3AiProcess(current, "p3", { aiReply: value }))}
              />
            </CardContent>
          </Card>
        )}
        footer={(
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{page.teacher}</p>
            <p className="text-sm text-muted-foreground">{MODULE1_LESSON3_SHARED_COPY.newContextNote}</p>
            {(error || (process.copySucceeded && !process.aiReply.trim())) && (
              <p role="alert" className="text-sm text-destructive">{error || page.validation[2]}</p>
            )}
            <Button disabled={!valid} onClick={() => void continueNext()}>{page.buttons[1]}</Button>
          </div>
        )}
      />
      <Lesson3WritingDrawer lesson1={portfolio.lesson1} lesson2={portfolio.lesson2} lesson3={state} />
    </div>
  )
}
