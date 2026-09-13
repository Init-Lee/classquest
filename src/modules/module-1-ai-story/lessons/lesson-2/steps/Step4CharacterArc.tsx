/**
 * 文件说明：模块 1 课时 2 第四关人物设定页。
 * 职责：自写区合成一张主任务卡（标题、提问、人物五项），再单独放「需要时再用外部 AI」；主任务必须自己写，只有成功复制提示词后才要求贴回外部 AI 回复，确认后完成课时 2。
 * 更新触发：第四关文案、自写/AI 分区、提问条、人物五项、复制选用口径或完成动作变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { cn } from "@/shared/utils/cn"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import {
  hasMeaningfulModule1Lesson2Fields,
  hasModule1Lesson2CharacterFields,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  MODULE1_LESSON2_CHARACTER_QUESTIONS,
  MODULE1_LESSON2_PAGES,
  MODULE1_LESSON2_SHARED_COPY,
} from "@/modules/module-1-ai-story/constants/lesson2-copy"
import { ClassroomExampleDialog } from "@/modules/module-1-ai-story/features/lesson2-support/ClassroomExampleDialog"
import { CopyPromptControl } from "@/modules/module-1-ai-story/features/lesson2-support/CopyPromptControl"
import { Lesson2ReviewBanner } from "@/modules/module-1-ai-story/lessons/lesson-2/components/Lesson2ReviewBanner"
import { Lesson2WritingSummary } from "@/modules/module-1-ai-story/lessons/lesson-2/components/Lesson2WritingSummary"
import { clearModule1Lesson2Review, finalizeModule1Lesson2State } from "@/modules/module-1-ai-story/domains/portfolio/lesson2-update"
import { buildModule1Lesson2Prompt } from "@/modules/module-1-ai-story/lessons/lesson-2/utils/build-lesson2-prompts"

export default function Step4CharacterArc() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [exampleOpen, setExampleOpen] = useState(false)
  const [finished, setFinished] = useState(false)
  if (!portfolio) return null

  const page = MODULE1_LESSON2_PAGES.step4
  const state = portfolio.lesson2
  const characterReady = hasModule1Lesson2CharacterFields(state)
  const valid = hasMeaningfulModule1Lesson2Fields(state)
  const aiAssistUsed = state.characterAiAssistUsed
  const aiReplyRequired = aiAssistUsed && !state.characterAiReply.trim()

  const updateLesson2 = (updater: (current: typeof state) => typeof state) => {
    updatePortfolio(current => ({
      ...current,
      lesson2: finalizeModule1Lesson2State(current.lesson2, updater(current.lesson2)),
    }))
  }

  const updateCharacter = (key: keyof typeof state.character, value: string) => {
    updateLesson2(current => ({
      ...current,
      character: { ...current.character, [key]: value },
    }))
  }

  const markCharacterAiAssistUsed = () => {
    updateLesson2(current => ({
      ...current,
      characterAiAssistUsed: true,
    }))
  }

  const complete = async () => {
    if (!state.character.who.trim()) {
      setError(page.validation[0])
      return
    }
    if (!state.character.want.trim()) {
      setError(page.validation[1])
      return
    }
    if (!state.character.blocked.trim()) {
      setError(page.validation[2])
      return
    }
    if (!state.character.firstAction.trim()) {
      setError(page.validation[3])
      return
    }
    if (!state.character.possibleChange.trim()) {
      setError(page.validation[4])
      return
    }
    if (state.characterAiAssistUsed && !state.characterAiReply.trim()) {
      setError(page.validation[5])
      return
    }
    if (!valid) {
      setError(MODULE1_LESSON2_SHARED_COPY.upstreamChanged)
      return
    }
    setError("")
    const completedAt = new Date().toISOString()
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 3, stepId: 1 },
      lesson2: {
        ...clearModule1Lesson2Review(current.lesson2, ["character"]),
        step: 4,
        step4Completed: true,
        completed: true,
        completedAt,
      },
    }))
    await flushPortfolio()
    setFinished(true)
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
              {MODULE1_LESSON2_CHARACTER_QUESTIONS.map((question, index) => (
                <li
                  key={question}
                  className="rounded-md border-l-4 border-primary bg-primary/5 px-3 py-1.5 text-sm leading-snug"
                >
                  <span className="mr-2 font-semibold text-primary">{`${index + 1}.`}</span>
                  <span className="font-medium">{question}</span>
                </li>
              ))}
            </ol>
            <Lesson2ReviewBanner
              visible={state.reviewNeeded.character}
              confirmEnabled={characterReady}
              onConfirm={() => updateLesson2(current => clearModule1Lesson2Review(current, ["character"]))}
            />
            <div className="grid gap-3">
              <label className="space-y-1 text-sm font-medium">
                <span>{page.fields[0].label}</span>
                <Textarea
                  className="min-h-[72px]"
                  value={state.character.who}
                  onChange={event => updateCharacter("who", event.target.value)}
                  placeholder={page.fields[0].placeholder}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium">
                  <span>{page.fields[1].label}</span>
                  <Textarea
                    className="min-h-[72px]"
                    value={state.character.want}
                    onChange={event => updateCharacter("want", event.target.value)}
                    placeholder={page.fields[1].placeholder}
                  />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  <span>{page.fields[2].label}</span>
                  <Textarea
                    className="min-h-[72px]"
                    value={state.character.blocked}
                    onChange={event => updateCharacter("blocked", event.target.value)}
                    placeholder={page.fields[2].placeholder}
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium">
                  <span>{page.fields[3].label}</span>
                  <Textarea
                    className="min-h-[72px]"
                    value={state.character.firstAction}
                    onChange={event => updateCharacter("firstAction", event.target.value)}
                    placeholder={page.fields[3].placeholder}
                  />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  <span>{page.fields[4].label}</span>
                  <Textarea
                    className="min-h-[72px]"
                    value={state.character.possibleChange}
                    onChange={event => updateCharacter("possibleChange", event.target.value)}
                    placeholder={page.fields[4].placeholder}
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(aiAssistUsed && "border-primary")}>
          <CardHeader>
            <CardTitle className="leading-snug">{page.panels[1].title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{MODULE1_LESSON2_SHARED_COPY.characterAiAssistOptionalNote}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{page.panels[1].body}</p>
            <CopyPromptControl
              label={page.buttons[0]}
              disabled={!state.writingPlan.trim() || !state.reason.trim()}
              disabledReason={MODULE1_LESSON2_SHARED_COPY.incompletePrompt}
              buildText={() => buildModule1Lesson2Prompt("P4", portfolio)}
              onCopied={markCharacterAiAssistUsed}
            />
            <label className="space-y-1.5 text-sm font-medium">
              <span>{aiAssistUsed ? MODULE1_LESSON2_SHARED_COPY.aiReplyRequiredLabel : page.fields[5].label}</span>
              <Textarea
                aria-required={aiAssistUsed}
                className={cn(
                  aiAssistUsed ? "min-h-[120px] border-primary" : "min-h-[96px] bg-muted/30",
                )}
                value={state.characterAiReply}
                onChange={event => updateLesson2(current => ({
                  ...current,
                  characterAiReply: event.target.value,
                }))}
                placeholder={page.fields[5].placeholder}
              />
            </label>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{page.hints[0]}</p>
          <p className="text-sm text-muted-foreground">{MODULE1_LESSON2_SHARED_COPY.newContextNote}</p>
          {(error || aiReplyRequired) && (
            <p role="alert" className="text-sm text-destructive">{error || page.validation[5]}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setExampleOpen(true)}>{page.buttons[1]}</Button>
            <Button disabled={!valid} onClick={() => void complete()}>{page.buttons[3]}</Button>
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <Lesson2WritingSummary lesson1={portfolio.lesson1} lesson2={state} enableCopy />
      </div>
      <ClassroomExampleDialog open={exampleOpen} onOpenChange={setExampleOpen} />
      <Dialog open={finished} onOpenChange={open => { if (!open) navigate("/module/1") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{MODULE1_LESSON2_SHARED_COPY.finishTitle}</DialogTitle>
            <DialogDescription>{MODULE1_LESSON2_SHARED_COPY.finishBody}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{MODULE1_LESSON2_SHARED_COPY.exportReminder}</p>
          <DialogFooter>
            <Button type="button" onClick={() => navigate("/module/1")}>回到模块首页</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
