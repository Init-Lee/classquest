/**
 * 文件说明：模块 1 课时 2 第一关理解风格页。
 * 职责：用三张预览卡选择并阅读课堂文学片段；下半部分拆成「先自己观察」与「需要时再用外部 AI」两块填写区，主任务必须自己写，只有成功复制提示词后才要求贴回外部 AI 回复。
 * 更新触发：第一关文案、预览/详情交互、观察字段、复制选用口径或完成动作变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/utils/cn"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { hasModule1Lesson2StudyFields } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  MODULE1_LESSON2_COMMON_QUESTIONS,
  MODULE1_LESSON2_METHOD_DEFINITION,
  MODULE1_LESSON2_OPENING,
  MODULE1_LESSON2_PAGES,
  MODULE1_LESSON2_SHARED_COPY,
  MODULE1_LESSON2_STUDENT_PRINCIPLES,
} from "@/modules/module-1-ai-story/constants/lesson2-copy"
import { getModule1LiteraryCaseById, MODULE1_LITERARY_CASES } from "@/modules/module-1-ai-story/constants/literary-cases"
import { CopyPromptControl } from "@/modules/module-1-ai-story/features/lesson2-support/CopyPromptControl"
import { LiteraryCaseDetailDialog } from "@/modules/module-1-ai-story/lessons/lesson-2/components/LiteraryCaseDetailDialog"
import { LiteraryCasePreviewCard } from "@/modules/module-1-ai-story/lessons/lesson-2/components/LiteraryCasePreviewCard"
import { Lesson2LegacyNotice } from "@/modules/module-1-ai-story/lessons/lesson-2/components/Lesson2LegacyNotice"
import { Lesson2ReviewBanner } from "@/modules/module-1-ai-story/lessons/lesson-2/components/Lesson2ReviewBanner"
import { clearModule1Lesson2Review, finalizeModule1Lesson2State } from "@/modules/module-1-ai-story/domains/portfolio/lesson2-update"
import { buildModule1Lesson2Prompt } from "@/modules/module-1-ai-story/lessons/lesson-2/utils/build-lesson2-prompts"

export default function Step1UnderstandStyle() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [previewCaseId, setPreviewCaseId] = useState("")
  if (!portfolio) return null

  const page = MODULE1_LESSON2_PAGES.step1
  const state = portfolio.lesson2
  const selectedCaseId = state.study.caseId
  const selectedCase = getModule1LiteraryCaseById(selectedCaseId)
  const previewCase = getModule1LiteraryCaseById(previewCaseId)
  const valid = hasModule1Lesson2StudyFields(state)
  const aiAssistUsed = state.study.aiAssistUsed
  const aiReplyRequired = aiAssistUsed && !state.study.aiReply.trim()

  const updateLesson2 = (updater: (current: typeof state) => typeof state) => {
    updatePortfolio(current => ({
      ...current,
      lesson2: finalizeModule1Lesson2State(current.lesson2, updater(current.lesson2)),
    }))
  }

  const selectCase = (caseId: string) => {
    updateLesson2(current => ({
      ...current,
      study: { ...current.study, caseId },
    }))
  }

  const markAiAssistUsed = () => {
    updateLesson2(current => ({
      ...current,
      study: { ...current.study, aiAssistUsed: true },
    }))
  }

  const confirm = async () => {
    if (!state.study.caseId.trim()) {
      setError(page.validation[0])
      return
    }
    if (!state.study.response.trim()) {
      setError(page.validation[1])
      return
    }
    if (state.study.aiAssistUsed && !state.study.aiReply.trim()) {
      setError(page.validation[2])
      return
    }
    setError("")
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 2, stepId: 2 },
      lesson2: {
        ...clearModule1Lesson2Review(current.lesson2, ["study"]),
        step: 2,
        step1Completed: true,
      },
    }))
    await flushPortfolio()
    navigate("/module/1/lesson/2/step/2")
  }

  return (
    <div className="space-y-4">
      <Lesson2LegacyNotice legacy={state.legacyLesson2} />
      <Card>
        <CardHeader>
          <CardTitle className="leading-snug">{page.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>{MODULE1_LESSON2_OPENING}</p>
          <p>{MODULE1_LESSON2_METHOD_DEFINITION}</p>
          <p>{page.intro}</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {MODULE1_LESSON2_STUDENT_PRINCIPLES.map(item => <li key={item}>{item}</li>)}
          </ul>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {MODULE1_LITERARY_CASES.map(literaryCase => (
          <LiteraryCasePreviewCard
            key={literaryCase.id}
            literaryCase={literaryCase}
            selected={selectedCaseId === literaryCase.id}
            onOpen={() => setPreviewCaseId(literaryCase.id)}
            onSelect={() => selectCase(literaryCase.id)}
          />
        ))}
      </section>
      <LiteraryCaseDetailDialog
        literaryCase={previewCase}
        selected={Boolean(previewCase && selectedCaseId === previewCase.id)}
        open={Boolean(previewCase)}
        onOpenChange={open => { if (!open) setPreviewCaseId("") }}
        onSelect={() => {
          if (previewCase) selectCase(previewCase.id)
        }}
      />

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="leading-snug">{page.panels[0].title}</CardTitle>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {MODULE1_LESSON2_SHARED_COPY.observeMainBadge}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-2">
            {MODULE1_LESSON2_COMMON_QUESTIONS.map((question, index) => (
              <li
                key={question}
                className="rounded-md border-l-4 border-primary bg-primary/5 px-3 py-2.5 text-sm leading-relaxed"
              >
                <span className="mr-2 font-semibold text-primary">{`${index + 1}.`}</span>
                <span className="font-medium">{question}</span>
              </li>
            ))}
          </ol>
          <p className="inline-flex max-w-full items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {`${MODULE1_LESSON2_SHARED_COPY.currentStudyCasePrefix}：${selectedCase ? selectedCase.cardTitle : MODULE1_LESSON2_SHARED_COPY.notFilled}`}
          </p>
          <p className="text-sm leading-relaxed">{page.panels[0].body}</p>
          <Lesson2ReviewBanner
            visible={state.reviewNeeded.study}
            message={MODULE1_LESSON2_SHARED_COPY.studyCaseChanged}
            confirmEnabled={valid}
            onConfirm={() => updateLesson2(current => clearModule1Lesson2Review(current, ["study"]))}
          />
          <label className="space-y-1.5 text-sm font-medium">
            <span>{page.fields[1].label}</span>
            <Textarea
              className="min-h-[160px] border-2"
              value={state.study.response}
              onChange={event => updateLesson2(current => ({
                ...current,
                study: { ...current.study, response: event.target.value },
              }))}
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
          <p className="text-sm leading-relaxed">{MODULE1_LESSON2_SHARED_COPY.aiAssistOptionalNote}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{page.panels[1].body}</p>
          <CopyPromptControl
            label={page.buttons[0]}
            disabled={!selectedCaseId}
            disabledReason={selectedCaseId ? undefined : page.validation[0]}
            buildText={() => buildModule1Lesson2Prompt("P1", portfolio, { selectedCaseId })}
            onCopied={markAiAssistUsed}
          />
          <label className="space-y-1.5 text-sm font-medium">
            <span>{aiAssistUsed ? MODULE1_LESSON2_SHARED_COPY.aiReplyRequiredLabel : page.fields[2].label}</span>
            <Textarea
              aria-required={aiAssistUsed}
              className={cn(
                aiAssistUsed ? "min-h-[120px] border-primary" : "min-h-[96px] bg-muted/30",
              )}
              value={state.study.aiReply}
              onChange={event => updateLesson2(current => ({
                ...current,
                study: { ...current.study, aiReply: event.target.value },
              }))}
              placeholder={page.fields[2].placeholder}
            />
          </label>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{page.hints[0]}</p>
        <p className="text-sm text-muted-foreground">{MODULE1_LESSON2_SHARED_COPY.newContextNote}</p>
        {(error || aiReplyRequired) && (
          <p role="alert" className="text-sm text-destructive">{error || page.validation[2]}</p>
        )}
        <Button disabled={!valid} onClick={() => void confirm()}>{page.buttons[3]}</Button>
      </div>
    </div>
  )
}
