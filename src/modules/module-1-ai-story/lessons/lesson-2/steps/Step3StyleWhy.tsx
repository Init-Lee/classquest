/**
 * 文件说明：模块 1 课时 2 第三关说明选择页。
 * 职责：自写区合成一张主任务卡（标题、一行总述、提问、设定与理由），再单独放「需要时再用外部 AI」；主任务必须自己写，只有成功复制提示词后才要求贴回外部 AI 回复。
 * 更新触发：第三关文案、自写/AI 分区、提问条、理由字段、复制选用口径或完成动作变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/utils/cn"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { hasModule1Lesson2Reason } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  MODULE1_LESSON2_PAGES,
  MODULE1_LESSON2_REASON_QUESTIONS,
  MODULE1_LESSON2_SHARED_COPY,
} from "@/modules/module-1-ai-story/constants/lesson2-copy"
import { ClassroomExampleDialog } from "@/modules/module-1-ai-story/features/lesson2-support/ClassroomExampleDialog"
import { CopyPromptControl } from "@/modules/module-1-ai-story/features/lesson2-support/CopyPromptControl"
import { Lesson2ReviewBanner } from "@/modules/module-1-ai-story/lessons/lesson-2/components/Lesson2ReviewBanner"
import { Lesson2WritingSummary } from "@/modules/module-1-ai-story/lessons/lesson-2/components/Lesson2WritingSummary"
import { clearModule1Lesson2Review, finalizeModule1Lesson2State } from "@/modules/module-1-ai-story/domains/portfolio/lesson2-update"
import { buildModule1Lesson1Context, buildModule1Lesson2Prompt } from "@/modules/module-1-ai-story/lessons/lesson-2/utils/build-lesson2-prompts"

export default function Step3StyleWhy() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [exampleOpen, setExampleOpen] = useState(false)
  if (!portfolio) return null

  const page = MODULE1_LESSON2_PAGES.step3
  const state = portfolio.lesson2
  const valid = hasModule1Lesson2Reason(state)
  const aiAssistUsed = state.reasonAiAssistUsed
  const aiReplyRequired = aiAssistUsed && !state.reasonAiReply.trim()
  const contextPreview = [
    `城市问题：${portfolio.lesson1.cityIssue.trim() || MODULE1_LESSON2_SHARED_COPY.notFilled}`,
    `写给谁：${portfolio.lesson1.audience.trim() || MODULE1_LESSON2_SHARED_COPY.notFilled}`,
    `参照：${state.reference.workTitle.trim() || MODULE1_LESSON2_SHARED_COPY.notFilled}`,
  ].join(" · ")

  const updateLesson2 = (updater: (current: typeof state) => typeof state) => {
    updatePortfolio(current => ({
      ...current,
      lesson2: finalizeModule1Lesson2State(current.lesson2, updater(current.lesson2)),
    }))
  }

  const markReasonAiAssistUsed = () => {
    updateLesson2(current => ({
      ...current,
      reasonAiAssistUsed: true,
    }))
  }

  const continueNext = async () => {
    if (!state.reason.trim()) {
      setError(page.validation[0])
      return
    }
    if (state.reasonAiAssistUsed && !state.reasonAiReply.trim()) {
      setError(page.validation[1])
      return
    }
    setError("")
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 2, stepId: 4 },
      lesson2: {
        ...clearModule1Lesson2Review(current.lesson2, ["reason"]),
        step: 4,
        step3Completed: true,
      },
    }))
    await flushPortfolio()
    navigate("/module/1/lesson/2/step/4")
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4">
        <Card>
          <CardHeader className="space-y-2 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="leading-snug">{page.title}</CardTitle>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {MODULE1_LESSON2_SHARED_COPY.observeMainBadge}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{page.intro}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="space-y-1.5">
              {MODULE1_LESSON2_REASON_QUESTIONS.map((question, index) => (
                <li
                  key={question}
                  className="rounded-md border-l-4 border-primary bg-primary/5 px-3 py-1.5 text-sm leading-snug"
                >
                  <span className="mr-2 font-semibold text-primary">{`${index + 1}.`}</span>
                  <span className="font-medium">{question}</span>
                </li>
              ))}
            </ol>
            <details className="rounded-lg border bg-muted/30 text-sm">
              <summary className="cursor-pointer px-3 py-2 font-medium">
                {MODULE1_LESSON2_SHARED_COPY.contextTitle}
                <span className="mt-1 block font-normal text-muted-foreground">{contextPreview}</span>
              </summary>
              <div className="space-y-2 border-t px-3 py-2">
                <pre className="whitespace-pre-wrap font-sans text-sm">{buildModule1Lesson1Context(portfolio.lesson1)}</pre>
                <p>参照：{state.reference.workTitle || MODULE1_LESSON2_SHARED_COPY.notFilled}，{state.reference.author || MODULE1_LESSON2_SHARED_COPY.notFilled}</p>
                <p className="whitespace-pre-wrap">已确认写法：{state.writingPlan || MODULE1_LESSON2_SHARED_COPY.notFilled}</p>
              </div>
            </details>
            <Lesson2ReviewBanner
              visible={state.reviewNeeded.reason}
              confirmEnabled={valid}
              onConfirm={() => updateLesson2(current => clearModule1Lesson2Review(current, ["reason"]))}
            />
            <label className="space-y-1.5 text-sm font-medium">
              <span>{page.fields[1].label}</span>
              <Textarea
                className="min-h-[160px] border-2"
                value={state.reason}
                onChange={event => updateLesson2(current => ({ ...current, reason: event.target.value }))}
                placeholder={page.fields[1].placeholder}
              />
            </label>
          </CardContent>
        </Card>

        <Card className={cn(aiAssistUsed && "border-primary")}>
          <CardHeader>
            <CardTitle className="leading-snug">{page.panels[1].title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{MODULE1_LESSON2_SHARED_COPY.reasonAiAssistOptionalNote}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{page.panels[1].body}</p>
            <CopyPromptControl
              label={page.buttons[0]}
              disabled={!state.writingPlan.trim()}
              disabledReason={state.writingPlan.trim() ? undefined : MODULE1_LESSON2_SHARED_COPY.incompletePrompt}
              buildText={() => buildModule1Lesson2Prompt("P3", portfolio)}
              onCopied={markReasonAiAssistUsed}
            />
            <label className="space-y-1.5 text-sm font-medium">
              <span>{aiAssistUsed ? MODULE1_LESSON2_SHARED_COPY.aiReplyRequiredLabel : page.fields[0].label}</span>
              <Textarea
                aria-required={aiAssistUsed}
                className={cn(
                  aiAssistUsed ? "min-h-[120px] border-primary" : "min-h-[96px] bg-muted/30",
                )}
                value={state.reasonAiReply}
                onChange={event => updateLesson2(current => ({
                  ...current,
                  reasonAiReply: event.target.value,
                }))}
                placeholder={page.fields[0].placeholder}
              />
            </label>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{page.hints[0]}</p>
          <p className="text-sm text-muted-foreground">{MODULE1_LESSON2_SHARED_COPY.newContextNote}</p>
          {(error || aiReplyRequired) && (
            <p role="alert" className="text-sm text-destructive">{error || page.validation[1]}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setExampleOpen(true)}>{page.buttons[1]}</Button>
            <Button disabled={!valid} onClick={() => void continueNext()}>{page.buttons[2]}</Button>
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <Lesson2WritingSummary lesson1={portfolio.lesson1} lesson2={state} />
      </div>
      <ClassroomExampleDialog open={exampleOpen} onOpenChange={setExampleOpen} />
    </div>
  )
}
