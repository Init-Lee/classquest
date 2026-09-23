/**
 * 文件说明：模块 1 课时 4 第二关安排下一步。
 * 职责：回看课时 3 确认稿，学生自写情节安排与理由；可选复制 P2 并记录课时 4 自有外部 AI 过程。
 * 更新触发：第 2 关字段、开头展开或 P2 过程入档规则变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/utils/cn"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import {
  MODULE1_LESSON4_PAGES,
  MODULE1_LESSON4_PLAN_HELP,
  MODULE1_LESSON4_SHARED_COPY,
} from "@/modules/module-1-ai-story/constants/lesson4-copy"
import { hasModule1Lesson4Plan } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  clearModule1Lesson4Review,
  finalizeModule1Lesson4State,
  patchModule1Lesson4AiProcess,
  recordModule1Lesson4AiCopy,
} from "@/modules/module-1-ai-story/domains/portfolio/lesson4-update"
import { EditableCopyPromptControl } from "@/modules/module-1-ai-story/features/lesson3-support/EditableCopyPromptControl"
import { Lesson3AiReplyField } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3AiReplyField"
import { Lesson3ReviewBanner } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3ReviewBanner"
import { Lesson3StepSplit } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3StepSplit"
import { Lesson4WritingDrawer } from "@/modules/module-1-ai-story/lessons/lesson-4/components/Lesson4WritingDrawer"
import {
  buildModule1Lesson4Prompt,
  hasModule1Lesson4PromptContext,
} from "@/modules/module-1-ai-story/lessons/lesson-4/utils/build-lesson4-prompts"

export default function Step2PlanNext() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  if (!portfolio) return null

  const page = MODULE1_LESSON4_PAGES.step2
  const state = portfolio.lesson4
  const process = state.aiProcess.p2
  const valid = hasModule1Lesson4Plan(state)
  const canBuildP2 = hasModule1Lesson4PromptContext(portfolio.lesson1, portfolio.lesson2)
    && Boolean(portfolio.lesson3.finalText.trim())

  const updateLesson4 = (updater: (current: typeof state) => typeof state) => {
    updatePortfolio(current => ({
      ...current,
      lesson4: finalizeModule1Lesson4State(current.lesson4, updater(current.lesson4)),
    }))
  }

  const continueNext = async () => {
    if (!state.plotPlan.trim() || !state.planReason.trim()) {
      setError(page.validation[0])
      return
    }
    if (process.copySucceeded && !process.aiReply.trim()) {
      setError(page.validation[1])
      return
    }
    setError("")
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 4, stepId: 3 },
      lesson4: {
        ...clearModule1Lesson4Review(current.lesson4, ["plan"]),
        step: 3,
        step2Completed: true,
      },
    }))
    await flushPortfolio()
    navigate("/module/1/lesson/4/step/3")
  }

  return (
    <div className="space-y-4">
      <Lesson3StepSplit
        aiPlacement="end"
        main={(
          <Card className="flex h-full flex-col">
            <CardHeader className="space-y-2 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="leading-snug">{page.question}</CardTitle>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {MODULE1_LESSON4_SHARED_COPY.observeMainBadge}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{page.intro}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal space-y-1 pl-5 text-sm">{page.steps.map(item => <li key={item}>{item}</li>)}</ol>
              <p className="text-sm">{page.deliver}</p>
              <p className="text-xs text-muted-foreground">
                {MODULE1_LESSON4_SHARED_COPY.storyTitleReadonly}：{portfolio.lesson3.storyTitle.trim() || MODULE1_LESSON4_SHARED_COPY.notFilled}。{MODULE1_LESSON4_SHARED_COPY.changeTitleHint}
              </p>
              <details className="rounded-lg border bg-muted/30 text-sm" open>
                <summary className="cursor-pointer px-3 py-2 font-medium">{MODULE1_LESSON4_SHARED_COPY.openingTitle}</summary>
                <pre className="whitespace-pre-wrap border-t px-3 py-2 font-sans text-sm">
                  {portfolio.lesson3.finalText.trim() || MODULE1_LESSON4_SHARED_COPY.notFilled}
                </pre>
              </details>
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">构思帮助（不必逐条填写）</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {MODULE1_LESSON4_PLAN_HELP.map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <Lesson3ReviewBanner
                visible={state.reviewNeeded.plan}
                message={MODULE1_LESSON4_SHARED_COPY.upstreamChanged}
                confirmEnabled={valid}
                onConfirm={() => updateLesson4(current => clearModule1Lesson4Review(current, ["plan"]))}
              />
              <label className="space-y-1.5 text-sm font-medium">
                <span>{page.fields[0].label}</span>
                <Textarea
                  className="min-h-[120px] border-2"
                  value={state.plotPlan}
                  onChange={event => updateLesson4(current => ({ ...current, plotPlan: event.target.value }))}
                  placeholder={page.fields[0].placeholder}
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                <span>{page.fields[1].label}</span>
                <Textarea
                  className="min-h-[96px] border-2"
                  value={state.planReason}
                  onChange={event => updateLesson4(current => ({ ...current, planReason: event.target.value }))}
                  placeholder={page.fields[1].placeholder}
                />
              </label>
            </CardContent>
          </Card>
        )}
        ai={(
          <Card className={cn("flex h-full min-w-0 flex-col overflow-hidden", process.copySucceeded && "border-primary")}>
            <CardHeader>
              <CardTitle className="leading-snug">{MODULE1_LESSON4_SHARED_COPY.aiAssistOptionalTitle}</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <p className="text-sm leading-relaxed">{MODULE1_LESSON4_SHARED_COPY.aiAssistNote}</p>
              <EditableCopyPromptControl
                label={page.buttons[0]}
                copiedLabel={MODULE1_LESSON4_SHARED_COPY.copied}
                copyFailedLabel={MODULE1_LESSON4_SHARED_COPY.copyFailed}
                restoreLabel={MODULE1_LESSON4_SHARED_COPY.restorePrompt}
                onRestore={() => updateLesson4(current => ({
                  ...current,
                  customPrompts: { ...current.customPrompts, p2: "" },
                }))}
                disabled={!canBuildP2}
                disabledReason={canBuildP2 ? undefined : MODULE1_LESSON4_SHARED_COPY.incompletePrompt}
                customText={state.customPrompts.p2}
                onCustomTextChange={value => updateLesson4(current => ({
                  ...current,
                  customPrompts: { ...current.customPrompts, p2: value },
                }))}
                buildText={() => buildModule1Lesson4Prompt("P2", portfolio)}
                onCopied={detail => updateLesson4(current => patchModule1Lesson4AiProcess(
                  current,
                  "p2",
                  recordModule1Lesson4AiCopy(current.aiProcess.p2, detail.generatedPrompt, detail.copiedPrompt, "p2"),
                ))}
              />
              <Lesson3AiReplyField
                copySucceeded={process.copySucceeded}
                value={process.aiReply}
                optionalLabel={MODULE1_LESSON4_SHARED_COPY.aiReplyOptionalLabel}
                onChange={value => updateLesson4(current => patchModule1Lesson4AiProcess(current, "p2", { aiReply: value }))}
              />
              <p className="text-xs text-muted-foreground">{MODULE1_LESSON4_SHARED_COPY.usageNote}</p>
            </CardContent>
          </Card>
        )}
        footer={(
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{page.teacher}</p>
            {(error || (process.copySucceeded && !process.aiReply.trim())) && (
              <p role="alert" className="text-sm text-destructive">{error || page.validation[1]}</p>
            )}
            <Button disabled={!valid} onClick={() => void continueNext()}>{page.buttons[1]}</Button>
          </div>
        )}
      />
      <Lesson4WritingDrawer lesson1={portfolio.lesson1} lesson2={portfolio.lesson2} lesson3={portfolio.lesson3} lesson4={state} />
    </div>
  )
}
