/**
 * 文件说明：模块 1 课时 2 第四关人物设定页。
 * 职责：收集身份、愿望、阻碍、首次行动与可能变化五项，确认后完成课时 2。
 * 更新触发：人物四格字段、完成弹层或第四关完成条件变化时，需要同步更新本文件。
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
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import {
  hasMeaningfulModule1Lesson2Fields,
  hasModule1Lesson2CharacterFields,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON2_PAGES, MODULE1_LESSON2_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson2-copy"
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
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="leading-snug">{page.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">{page.intro}</p>
          <Lesson2ReviewBanner
            visible={state.reviewNeeded.character}
            confirmEnabled={characterReady}
            onConfirm={() => updateLesson2(current => clearModule1Lesson2Review(current, ["character"]))}
          />
          <div className="grid gap-4">
            <label className="space-y-1 text-sm font-medium">
              <span>{page.panels[0].title} · {page.fields[0].label}</span>
              <p className="text-xs font-normal text-muted-foreground">{page.panels[0].body}</p>
              <Textarea className="min-h-[96px]" value={state.character.who} onChange={event => updateCharacter("who", event.target.value)} placeholder={page.fields[0].placeholder} />
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>{page.panels[1].title} · {page.fields[1].label}</span>
              <p className="text-xs font-normal text-muted-foreground">{page.panels[1].body}</p>
              <Textarea className="min-h-[96px]" value={state.character.want} onChange={event => updateCharacter("want", event.target.value)} placeholder={page.fields[1].placeholder} />
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>{page.panels[2].title} · {page.fields[2].label}</span>
              <p className="text-xs font-normal text-muted-foreground">{page.panels[2].body}</p>
              <Textarea className="min-h-[96px]" value={state.character.blocked} onChange={event => updateCharacter("blocked", event.target.value)} placeholder={page.fields[2].placeholder} />
            </label>
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-sm font-medium">{page.panels[3].title}</p>
              <p className="text-xs text-muted-foreground">{page.panels[3].body}</p>
              <label className="space-y-1 text-sm font-medium">
                <span>{page.fields[3].label}</span>
                <Textarea className="min-h-[96px]" value={state.character.firstAction} onChange={event => updateCharacter("firstAction", event.target.value)} placeholder={page.fields[3].placeholder} />
              </label>
              <label className="space-y-1 text-sm font-medium">
                <span>{page.fields[4].label}</span>
                <Textarea className="min-h-[96px]" value={state.character.possibleChange} onChange={event => updateCharacter("possibleChange", event.target.value)} placeholder={page.fields[4].placeholder} />
              </label>
            </div>
            <label className="space-y-1 text-sm font-medium">
              <span>{page.fields[5].label}</span>
              <Textarea
                className="min-h-[96px]"
                value={state.characterAiReply}
                onChange={event => updateLesson2(current => ({ ...current, characterAiReply: event.target.value }))}
                placeholder={page.fields[5].placeholder}
              />
            </label>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {page.hints.map(hint => <li key={hint}>{hint}</li>)}
          </ul>
          <CopyPromptControl
            label={page.buttons[0]}
            disabled={!state.writingPlan.trim() || !state.reason.trim()}
            disabledReason={MODULE1_LESSON2_SHARED_COPY.incompletePrompt}
            buildText={() => buildModule1Lesson2Prompt("P4", portfolio)}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setExampleOpen(true)}>{page.buttons[1]}</Button>
            <Button disabled={!valid} onClick={() => void complete()}>{page.buttons[3]}</Button>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
      <Lesson2WritingSummary lesson1={portfolio.lesson1} lesson2={state} enableCopy />
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
