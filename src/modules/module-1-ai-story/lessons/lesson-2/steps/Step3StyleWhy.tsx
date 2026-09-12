/**
 * 文件说明：模块 1 课时 2 第三关说明选择页。
 * 职责：只读展示主题、受众、参照和写法，让学生写下 1—2 句选择理由。
 * 更新触发：理由字段、只读上下文或第三关完成条件变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { hasModule1Lesson2Reason } from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON2_PAGES, MODULE1_LESSON2_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson2-copy"
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

  const updateLesson2 = (updater: (current: typeof state) => typeof state) => {
    updatePortfolio(current => ({
      ...current,
      lesson2: finalizeModule1Lesson2State(current.lesson2, updater(current.lesson2)),
    }))
  }

  const continueNext = async () => {
    if (!valid) {
      setError(page.validation[0])
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
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="leading-snug">{page.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">{page.intro}</p>
          <section className="space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
            <p className="font-medium">{MODULE1_LESSON2_SHARED_COPY.contextTitle}</p>
            <pre className="whitespace-pre-wrap font-sans text-sm">{buildModule1Lesson1Context(portfolio.lesson1)}</pre>
            <p>参照：{state.reference.workTitle || MODULE1_LESSON2_SHARED_COPY.notFilled}，{state.reference.author || MODULE1_LESSON2_SHARED_COPY.notFilled}</p>
            <p className="whitespace-pre-wrap">已确认写法：{state.writingPlan || MODULE1_LESSON2_SHARED_COPY.notFilled}</p>
          </section>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{page.panels[0].body}</p>
          <Lesson2ReviewBanner
            visible={state.reviewNeeded.reason}
            confirmEnabled={valid}
            onConfirm={() => updateLesson2(current => clearModule1Lesson2Review(current, ["reason"]))}
          />
          <label className="space-y-1 text-sm font-medium">
            <span>{page.fields[1].label}</span>
            <Textarea
              className="min-h-[120px]"
              value={state.reason}
              onChange={event => updateLesson2(current => ({ ...current, reason: event.target.value }))}
              placeholder={page.fields[1].placeholder}
            />
          </label>
          <label className="space-y-1 text-sm font-medium">
            <span>{page.fields[0].label}</span>
            <Textarea
              className="min-h-[96px]"
              value={state.reasonAiReply}
              onChange={event => updateLesson2(current => ({ ...current, reasonAiReply: event.target.value }))}
              placeholder={page.fields[0].placeholder}
            />
          </label>
          <p className="text-xs text-muted-foreground">{page.hints[0]}</p>
          <CopyPromptControl
            label={page.buttons[0]}
            disabled={!state.writingPlan.trim()}
            disabledReason={state.writingPlan.trim() ? undefined : MODULE1_LESSON2_SHARED_COPY.incompletePrompt}
            buildText={() => buildModule1Lesson2Prompt("P3", portfolio)}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setExampleOpen(true)}>{page.buttons[1]}</Button>
            <Button onClick={() => void continueNext()}>{page.buttons[2]}</Button>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
      <Lesson2WritingSummary lesson1={portfolio.lesson1} lesson2={state} />
      <ClassroomExampleDialog open={exampleOpen} onOpenChange={setExampleOpen} />
    </div>
  )
}
