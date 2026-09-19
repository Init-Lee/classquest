/**
 * 文件说明：模块 1 课时 3 第二关选定开场。
 * 职责：学生自写开场时刻与本段写法，可选复制 P2 并记录外部 AI 过程；不回写课时 2。
 * 更新触发：第 2 关字段、写法摘写说明或 P2 过程入档规则变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/utils/cn"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { MODULE1_LESSON3_PAGES, MODULE1_LESSON3_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson3-copy"
import { hasModule1Lesson3Opening } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  clearModule1Lesson3Review,
  finalizeModule1Lesson3State,
  patchModule1Lesson3AiProcess,
  recordModule1Lesson3AiCopy,
} from "@/modules/module-1-ai-story/domains/portfolio/lesson3-update"
import { EditableCopyPromptControl } from "@/modules/module-1-ai-story/features/lesson3-support/EditableCopyPromptControl"
import { Lesson3AiReplyField } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3AiReplyField"
import { Lesson3ReviewBanner } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3ReviewBanner"
import { Lesson3StepSplit } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3StepSplit"
import { Lesson3WritingDrawer } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3WritingDrawer"
import {
  buildModule1Lesson3Prompt,
  hasModule1Lesson3PromptContext,
} from "@/modules/module-1-ai-story/lessons/lesson-3/utils/build-lesson3-prompts"

export default function Step2ChooseOpening() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  if (!portfolio) return null

  const page = MODULE1_LESSON3_PAGES.step2
  const state = portfolio.lesson3
  const process = state.aiProcess.p2
  const valid = hasModule1Lesson3Opening(state)
  const canBuildP2 = hasModule1Lesson3PromptContext(portfolio.lesson1, portfolio.lesson2)

  const updateLesson3 = (updater: (current: typeof state) => typeof state) => {
    updatePortfolio(current => ({
      ...current,
      lesson3: finalizeModule1Lesson3State(current.lesson3, updater(current.lesson3)),
    }))
  }

  const continueNext = async () => {
    if (!state.openingPlan.trim() || !state.focusTechnique.trim()) {
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
      progress: { lessonId: 3, stepId: 3 },
      lesson3: {
        ...clearModule1Lesson3Review(current.lesson3, ["opening"]),
        step: 3,
        step2Completed: true,
      },
    }))
    await flushPortfolio()
    navigate("/module/1/lesson/3/step/3")
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
                  {MODULE1_LESSON3_SHARED_COPY.observeMainBadge}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{page.intro}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal space-y-1 pl-5 text-sm">{page.steps.map(item => <li key={item}>{item}</li>)}</ol>
              <p className="text-sm">{page.deliver}</p>
              <Lesson3ReviewBanner
                visible={state.reviewNeeded.opening}
                confirmEnabled={valid}
                onConfirm={() => updateLesson3(current => clearModule1Lesson3Review(current, ["opening"]))}
              />
              <label className="space-y-1.5 text-sm font-medium">
                <span>{page.fields[0].label}</span>
                <Textarea
                  className="min-h-[96px] border-2"
                  value={state.openingPlan}
                  onChange={event => updateLesson3(current => ({ ...current, openingPlan: event.target.value }))}
                  placeholder={page.fields[0].placeholder}
                />
              </label>
              <p className="text-xs text-muted-foreground">帮助区示例：{page.help.opening}</p>
              <label className="space-y-1.5 text-sm font-medium">
                <span>{page.fields[1].label}</span>
                <Textarea
                  className="min-h-[120px] border-2"
                  value={state.focusTechnique}
                  onChange={event => updateLesson3(current => ({ ...current, focusTechnique: event.target.value }))}
                  placeholder={page.fields[1].placeholder}
                />
              </label>
              <p className="text-xs text-muted-foreground">课时 2 已确认写法全文，供摘写，不会回写课时 2：</p>
              <pre className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 font-sans text-sm">
                {portfolio.lesson2.writingPlan.trim() || MODULE1_LESSON3_SHARED_COPY.notFilled}
              </pre>
              <p className="text-xs text-muted-foreground">帮助区示例：{page.help.technique}</p>
            </CardContent>
          </Card>
        )}
        ai={(
          <Card className={cn("flex h-full min-w-0 flex-col overflow-hidden", process.copySucceeded && "border-primary")}>
            <CardHeader>
              <CardTitle className="leading-snug">需要时再用外部 AI</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <p className="text-sm leading-relaxed">{MODULE1_LESSON3_SHARED_COPY.aiAssistNote}</p>
              <EditableCopyPromptControl
                label={page.buttons[0]}
                disabled={!canBuildP2}
                disabledReason={canBuildP2 ? undefined : MODULE1_LESSON3_SHARED_COPY.incompletePrompt}
                customText={state.customPrompts.p2}
                onCustomTextChange={value => updateLesson3(current => ({
                  ...current,
                  customPrompts: { ...current.customPrompts, p2: value },
                }))}
                buildText={() => buildModule1Lesson3Prompt("P2", portfolio)}
                onCopied={detail => updateLesson3(current => patchModule1Lesson3AiProcess(
                  current,
                  "p2",
                  recordModule1Lesson3AiCopy(current.aiProcess.p2, detail.generatedPrompt, detail.copiedPrompt),
                ))}
              />
              <Lesson3AiReplyField
                copySucceeded={process.copySucceeded}
                value={process.aiReply}
                onChange={value => updateLesson3(current => ({
                  ...patchModule1Lesson3AiProcess(current, "p2", { aiReply: value }),
                  openingCandidatesRaw: value,
                }))}
              />
              <details className="rounded-lg border bg-muted/30 text-sm">
                <summary className="cursor-pointer px-3 py-2 font-medium">{page.fields[2].label}</summary>
                <p className="border-t px-3 py-2 text-muted-foreground">上面的回复会一并作为可选备选保存，方便以后回看。</p>
              </details>
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
      <Lesson3WritingDrawer lesson1={portfolio.lesson1} lesson2={portfolio.lesson2} lesson3={state} />
    </div>
  )
}
