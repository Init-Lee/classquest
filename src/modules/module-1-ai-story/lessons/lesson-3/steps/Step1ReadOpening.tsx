/**
 * 文件说明：模块 1 课时 3 第一关读懂一个开头。
 * 职责：页内展示三则课堂自编开头，学生自写阅读判断；需要时复制 P1 并记录外部 AI 过程。
 * 更新触发：第 1 关文案、案例卡、配图或 P1 过程入档规则变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/utils/cn"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import {
  MODULE1_LESSON3_CASES,
  MODULE1_LESSON3_CASE_HELP,
  MODULE1_LESSON3_PAGES,
  MODULE1_LESSON3_SHARED_COPY,
} from "@/modules/module-1-ai-story/constants/lesson3-copy"
import { hasModule1Lesson3Observation } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  clearModule1Lesson3Review,
  finalizeModule1Lesson3State,
  patchModule1Lesson3AiProcess,
  recordModule1Lesson3AiCopy,
} from "@/modules/module-1-ai-story/domains/portfolio/lesson3-update"
import { EditableCopyPromptControl } from "@/modules/module-1-ai-story/features/lesson3-support/EditableCopyPromptControl"
import { Lesson3AiReplyField } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3AiReplyField"
import { Lesson3OptionalImage } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3OptionalImage"
import { Lesson3ReviewBanner } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3ReviewBanner"
import { Lesson3WritingSummary } from "@/modules/module-1-ai-story/lessons/lesson-3/components/Lesson3WritingSummary"
import { buildModule1Lesson3Prompt } from "@/modules/module-1-ai-story/lessons/lesson-3/utils/build-lesson3-prompts"

export default function Step1ReadOpening() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  if (!portfolio) return null

  const page = MODULE1_LESSON3_PAGES.step1
  const state = portfolio.lesson3
  const process = state.aiProcess.p1
  const valid = hasModule1Lesson3Observation(state)

  const updateLesson3 = (updater: (current: typeof state) => typeof state) => {
    updatePortfolio(current => ({
      ...current,
      lesson3: finalizeModule1Lesson3State(current.lesson3, updater(current.lesson3)),
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
      progress: { lessonId: 3, stepId: 2 },
      lesson3: {
        ...clearModule1Lesson3Review(current.lesson3, ["opening"]),
        step: 2,
        step1Completed: true,
      },
    }))
    await flushPortfolio()
    navigate("/module/1/lesson/3/step/2")
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4">
        <Card>
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
            <p className="text-xs text-muted-foreground">{MODULE1_LESSON3_SHARED_COPY.caseNote}</p>
            <div className="grid gap-3 md:grid-cols-3">
              {MODULE1_LESSON3_CASES.map(item => (
                <article key={item.id} className="space-y-2 rounded-lg border p-3 text-sm">
                  <h3 className="font-semibold">{item.title}</h3>
                  {item.showImage && <Lesson3OptionalImage src={item.imageSrc} alt={item.imageAlt} />}
                  <p className="whitespace-pre-wrap leading-relaxed">{item.text}</p>
                  <p className="text-xs text-muted-foreground">可引导：{item.guide}</p>
                </article>
              ))}
            </div>
            <details className="rounded-lg border bg-muted/30 text-sm">
              <summary className="cursor-pointer px-3 py-2 font-medium">{MODULE1_LESSON3_SHARED_COPY.caseHelpTitle}</summary>
              <p className="border-t px-3 py-2 text-muted-foreground">{MODULE1_LESSON3_CASE_HELP}</p>
            </details>
            <Lesson3ReviewBanner
              visible={state.reviewNeeded.opening && !state.openingPlan.trim()}
              confirmEnabled={valid}
              onConfirm={() => updateLesson3(current => clearModule1Lesson3Review(current, ["opening"]))}
            />
            <label className="space-y-1.5 text-sm font-medium">
              <span>{page.fields[0].label}</span>
              <Textarea
                className="min-h-[140px] border-2"
                value={state.observation}
                onChange={event => updateLesson3(current => ({ ...current, observation: event.target.value }))}
                placeholder={page.fields[0].placeholder}
              />
            </label>
          </CardContent>
        </Card>

        <Card className={cn(process.copySucceeded && "border-primary")}>
          <CardHeader>
            <CardTitle className="leading-snug">需要时再用外部 AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{MODULE1_LESSON3_SHARED_COPY.aiAssistNote}</p>
            <p className="text-sm text-muted-foreground">{MODULE1_LESSON3_SHARED_COPY.aiAssistOptionalNote}</p>
            <EditableCopyPromptControl
              label={page.buttons[0]}
              customText={state.customPrompts.p1}
              onCustomTextChange={value => updateLesson3(current => ({
                ...current,
                customPrompts: { ...current.customPrompts, p1: value },
              }))}
              buildText={() => buildModule1Lesson3Prompt("P1", portfolio)}
              onCopied={detail => updateLesson3(current => patchModule1Lesson3AiProcess(
                current,
                "p1",
                recordModule1Lesson3AiCopy(current.aiProcess.p1, detail.generatedPrompt, detail.copiedPrompt),
              ))}
            />
            <Lesson3AiReplyField
              copySucceeded={process.copySucceeded}
              value={process.aiReply}
              onChange={value => updateLesson3(current => patchModule1Lesson3AiProcess(current, "p1", { aiReply: value }))}
            />
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{page.teacher}</p>
          {(error || (process.copySucceeded && !process.aiReply.trim())) && (
            <p role="alert" className="text-sm text-destructive">{error || page.validation[1]}</p>
          )}
          <Button disabled={!valid} onClick={() => void continueNext()}>{page.buttons[1]}</Button>
        </div>
      </div>
      <Lesson3WritingSummary lesson1={portfolio.lesson1} lesson2={portfolio.lesson2} lesson3={state} />
    </div>
  )
}
