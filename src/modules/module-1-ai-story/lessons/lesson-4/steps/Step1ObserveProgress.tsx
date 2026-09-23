/**
 * 文件说明：模块 1 课时 4 第一关观察推进。
 * 职责：页内展示两则课堂短例，学生自写观察；需要时复制 P1 并记录课时 4 自有外部 AI 过程。
 * 更新触发：第 1 关文案、短例卡或 P1 过程入档规则变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/utils/cn"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import {
  MODULE1_LESSON4_CASES,
  MODULE1_LESSON4_CASE_HELP,
  MODULE1_LESSON4_PAGES,
  MODULE1_LESSON4_SHARED_COPY,
} from "@/modules/module-1-ai-story/constants/lesson4-copy"
import { hasModule1Lesson4Observation } from "@/modules/module-1-ai-story/domains/portfolio/types"
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
import { buildModule1Lesson4Prompt } from "@/modules/module-1-ai-story/lessons/lesson-4/utils/build-lesson4-prompts"

export default function Step1ObserveProgress() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  if (!portfolio) return null

  const page = MODULE1_LESSON4_PAGES.step1
  const state = portfolio.lesson4
  const process = state.aiProcess.p1
  const valid = hasModule1Lesson4Observation(state)

  const updateLesson4 = (updater: (current: typeof state) => typeof state) => {
    updatePortfolio(current => ({
      ...current,
      lesson4: finalizeModule1Lesson4State(current.lesson4, updater(current.lesson4)),
    }))
  }

  const continueNext = async () => {
    if (!state.observation.trim()) {
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
      progress: { lessonId: 4, stepId: 2 },
      lesson4: {
        ...clearModule1Lesson4Review(current.lesson4, ["plan"]),
        step: 2,
        step1Completed: true,
      },
    }))
    await flushPortfolio()
    navigate("/module/1/lesson/4/step/2")
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
              <p className="text-xs text-muted-foreground">{MODULE1_LESSON4_SHARED_COPY.caseNote}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {MODULE1_LESSON4_CASES.map(item => (
                  <article key={item.id} className="space-y-2 rounded-lg border p-3 text-sm">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="whitespace-pre-wrap leading-relaxed">{item.text}</p>
                    <p className="text-xs text-muted-foreground">{item.question}</p>
                    <p className="text-xs text-muted-foreground">可引导：{item.teacherPoint}</p>
                  </article>
                ))}
              </div>
              <details className="rounded-lg border bg-muted/30 text-sm">
                <summary className="cursor-pointer px-3 py-2 font-medium">{MODULE1_LESSON4_SHARED_COPY.caseHelpTitle}</summary>
                <p className="border-t px-3 py-2 text-muted-foreground">{MODULE1_LESSON4_CASE_HELP}</p>
              </details>
              <Lesson3ReviewBanner
                visible={state.reviewNeeded.plan && !state.plotPlan.trim()}
                message={MODULE1_LESSON4_SHARED_COPY.upstreamChanged}
                confirmEnabled={valid}
                onConfirm={() => updateLesson4(current => clearModule1Lesson4Review(current, ["plan"]))}
              />
              <label className="space-y-1.5 text-sm font-medium">
                <span>{page.fields[0].label}</span>
                <Textarea
                  className="min-h-[140px] border-2"
                  value={state.observation}
                  onChange={event => updateLesson4(current => ({ ...current, observation: event.target.value }))}
                  placeholder={page.fields[0].placeholder}
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
              <p className="text-sm text-muted-foreground">{MODULE1_LESSON4_SHARED_COPY.aiAssistOptionalNote}</p>
              <EditableCopyPromptControl
                label={page.buttons[0]}
                copiedLabel={MODULE1_LESSON4_SHARED_COPY.copied}
                copyFailedLabel={MODULE1_LESSON4_SHARED_COPY.copyFailed}
                restoreLabel={MODULE1_LESSON4_SHARED_COPY.restorePrompt}
                onRestore={() => updateLesson4(current => ({
                  ...current,
                  customPrompts: { ...current.customPrompts, p1: "" },
                }))}
                customText={state.customPrompts.p1}
                onCustomTextChange={value => updateLesson4(current => ({
                  ...current,
                  customPrompts: { ...current.customPrompts, p1: value },
                }))}
                buildText={() => buildModule1Lesson4Prompt("P1", portfolio)}
                onCopied={detail => updateLesson4(current => patchModule1Lesson4AiProcess(
                  current,
                  "p1",
                  recordModule1Lesson4AiCopy(current.aiProcess.p1, detail.generatedPrompt, detail.copiedPrompt, "p1"),
                ))}
              />
              <Lesson3AiReplyField
                copySucceeded={process.copySucceeded}
                value={process.aiReply}
                optionalLabel={MODULE1_LESSON4_SHARED_COPY.aiReplyOptionalLabel}
                onChange={value => updateLesson4(current => patchModule1Lesson4AiProcess(current, "p1", { aiReply: value }))}
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
