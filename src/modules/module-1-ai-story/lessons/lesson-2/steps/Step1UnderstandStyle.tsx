/**
 * 文件说明：模块 1 课时 2 第一关理解风格页。
 * 职责：让学生阅读三则课堂文学片段，提交一处有依据的观察，并可复制外部 AI 辅助提示词。
 * 更新触发：第一关文案、案例展示、观察字段或完成动作变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { hasModule1Lesson2StudyFields } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  MODULE1_LESSON2_METHOD_DEFINITION,
  MODULE1_LESSON2_OPENING,
  MODULE1_LESSON2_PAGES,
  MODULE1_LESSON2_SHARED_COPY,
  MODULE1_LESSON2_STUDENT_PRINCIPLES,
} from "@/modules/module-1-ai-story/constants/lesson2-copy"
import { MODULE1_LITERARY_CASES } from "@/modules/module-1-ai-story/constants/literary-cases"
import { CopyPromptControl } from "@/modules/module-1-ai-story/features/lesson2-support/CopyPromptControl"
import { LiteraryCasePanel } from "@/modules/module-1-ai-story/lessons/lesson-2/components/LiteraryCasePanel"
import { Lesson2LegacyNotice } from "@/modules/module-1-ai-story/lessons/lesson-2/components/Lesson2LegacyNotice"
import { Lesson2ReviewBanner } from "@/modules/module-1-ai-story/lessons/lesson-2/components/Lesson2ReviewBanner"
import { clearModule1Lesson2Review, finalizeModule1Lesson2State } from "@/modules/module-1-ai-story/domains/portfolio/lesson2-update"
import { buildModule1Lesson2Prompt } from "@/modules/module-1-ai-story/lessons/lesson-2/utils/build-lesson2-prompts"

export default function Step1UnderstandStyle() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  if (!portfolio) return null

  const page = MODULE1_LESSON2_PAGES.step1
  const state = portfolio.lesson2
  const selectedCaseId = state.study.caseId
  const valid = hasModule1Lesson2StudyFields(state)

  const updateLesson2 = (updater: (current: typeof state) => typeof state) => {
    updatePortfolio(current => ({
      ...current,
      lesson2: finalizeModule1Lesson2State(current.lesson2, updater(current.lesson2)),
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

      <section className="space-y-3">
        {MODULE1_LITERARY_CASES.map(literaryCase => (
          <LiteraryCasePanel
            key={literaryCase.id}
            literaryCase={literaryCase}
            selected={selectedCaseId === literaryCase.id}
            onSelect={() => updateLesson2(current => ({
              ...current,
              study: { ...current.study, caseId: literaryCase.id },
            }))}
          />
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{page.panels[1].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{page.panels[0].body}</p>
          <p className="text-sm text-muted-foreground">{page.panels[1].body}</p>
          <Lesson2ReviewBanner
            visible={state.reviewNeeded.study}
            message={MODULE1_LESSON2_SHARED_COPY.studyCaseChanged}
            confirmEnabled={valid}
            onConfirm={() => updateLesson2(current => clearModule1Lesson2Review(current, ["study"]))}
          />
          <label className="space-y-1 text-sm font-medium">
            <span>{page.fields[1].label}</span>
            <Textarea
              className="min-h-[120px]"
              value={state.study.response}
              onChange={event => updateLesson2(current => ({
                ...current,
                study: { ...current.study, response: event.target.value },
              }))}
              placeholder={page.fields[1].placeholder}
            />
          </label>
          <label className="space-y-1 text-sm font-medium">
            <span>{page.fields[2].label}</span>
            <Textarea
              className="min-h-[96px]"
              value={state.study.aiReply}
              onChange={event => updateLesson2(current => ({
                ...current,
                study: { ...current.study, aiReply: event.target.value },
              }))}
              placeholder={page.fields[2].placeholder}
            />
          </label>
          <p className="text-xs text-muted-foreground">{page.hints[0]}</p>
          <p className="text-xs text-muted-foreground">{MODULE1_LESSON2_SHARED_COPY.newContextNote}</p>
          <CopyPromptControl
            label={page.buttons[0]}
            disabled={!selectedCaseId}
            disabledReason={selectedCaseId ? undefined : page.validation[0]}
            buildText={() => buildModule1Lesson2Prompt("P1", portfolio, { selectedCaseId })}
          />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button onClick={() => void confirm()}>{page.buttons[3]}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
