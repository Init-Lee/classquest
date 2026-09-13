/**
 * 文件说明：模块 1 课时 2 第二关寻找参照与确定写法页。
 * 职责：关内分两页——第一页找候选，第二页选定片段并拆解写法；右侧写作设定改为可收起抽屉。
 * 更新触发：第 2 关分页、跳过第一轮、复制必填口径、课堂填入或写法完成条件变化时，需要同步更新本文件。
 */

import { useLayoutEffect, useState } from "react"
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
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
  canCompleteModule1Lesson2Step2Round1,
  canCompleteModule1Lesson2Step2Round2Fields,
  hasModule1Lesson1PromptContext,
  hasModule1Lesson2ReferenceFields,
  hasModule1Lesson2WritingPlan,
  joinModule1WritingPlanItems,
  parseModule1WritingPlanItems,
  type Module1Lesson2Reference,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  MODULE1_LESSON2_PAGES,
  MODULE1_LESSON2_SHARED_COPY,
} from "@/modules/module-1-ai-story/constants/lesson2-copy"
import { MODULE1_LITERARY_CASES } from "@/modules/module-1-ai-story/constants/literary-cases"
import {
  buildModule1ClassroomReference,
  hasExistingModule1Reference,
  isSameModule1ReferenceIdentity,
} from "@/modules/module-1-ai-story/constants/story-options"
import { ClassroomExampleDialog } from "@/modules/module-1-ai-story/features/lesson2-support/ClassroomExampleDialog"
import { CopyPromptControl } from "@/modules/module-1-ai-story/features/lesson2-support/CopyPromptControl"
import { Lesson2ReviewBanner } from "@/modules/module-1-ai-story/lessons/lesson-2/components/Lesson2ReviewBanner"
import { Lesson2WritingDrawer } from "@/modules/module-1-ai-story/lessons/lesson-2/components/Lesson2WritingDrawer"
import { getModule1Lesson2Step2RoundRedirect } from "@/modules/module-1-ai-story/lessons/lesson-2/guards"
import { clearModule1Lesson2Review, finalizeModule1Lesson2State } from "@/modules/module-1-ai-story/domains/portfolio/lesson2-update"
import { buildModule1Lesson2Prompt } from "@/modules/module-1-ai-story/lessons/lesson-2/utils/build-lesson2-prompts"
import {
  buildModule1Lesson2Step2Path,
  parseModule1Lesson2Step2Round,
} from "@/modules/module-1-ai-story/lessons/lesson-2/utils/step2-round"

export default function Step2ChooseStyle() {
  const { portfolio, updatePortfolio, flushPortfolio, isTeacherMode } = useModule1Portfolio()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState("")
  const [exampleOpen, setExampleOpen] = useState(false)
  const [pendingCaseId, setPendingCaseId] = useState("")
  const round = parseModule1Lesson2Step2Round(searchParams.get("round"))

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [round])

  if (!portfolio) return null

  const page = MODULE1_LESSON2_PAGES.step2
  const state = portfolio.lesson2
  const roundRedirect = getModule1Lesson2Step2RoundRedirect(state, round, isTeacherMode)
  const [plan1, plan2, plan3] = parseModule1WritingPlanItems(state.writingPlan)
  const lesson1Ready = hasModule1Lesson1PromptContext(portfolio.lesson1)
  const round1Copied = state.round1PromptCopied
  const round2Copied = state.round2PromptCopied
  const round1ReplyRequired = round1Copied && !state.recommendationReply.trim()
  const round2ReplyRequired = round2Copied && !state.analysisReply.trim()

  const updateLesson2 = (updater: (current: typeof state) => typeof state) => {
    updatePortfolio(current => ({
      ...current,
      lesson2: finalizeModule1Lesson2State(current.lesson2, updater(current.lesson2)),
    }))
  }

  const applyReference = (reference: Module1Lesson2Reference) => {
    updateLesson2(current => ({ ...current, reference }))
  }

  const requestClassroomCase = (caseId: string) => {
    const next = buildModule1ClassroomReference(caseId)
    if (!next) return
    if (hasExistingModule1Reference(state.reference) && !isSameModule1ReferenceIdentity(state.reference, next)) {
      setPendingCaseId(caseId)
      return
    }
    applyReference(next)
  }

  const updateWritingPlan = (index: 0 | 1 | 2, value: string) => {
    const items: [string, string, string] = [plan1, plan2, plan3]
    items[index] = value
    updateLesson2(current => ({
      ...current,
      writingPlan: joinModule1WritingPlanItems(items),
    }))
  }

  const goToRound2 = async (passedUpdater: (current: typeof state) => typeof state) => {
    setError("")
    updatePortfolio(current => ({
      ...current,
      lesson2: finalizeModule1Lesson2State(current.lesson2, passedUpdater(current.lesson2)),
    }))
    await flushPortfolio()
    navigate(buildModule1Lesson2Step2Path(2))
  }

  const continueRound1 = async () => {
    if (!canCompleteModule1Lesson2Step2Round1(state)) {
      setError(MODULE1_LESSON2_SHARED_COPY.round1ReplyRequired)
      return
    }
    await goToRound2(current => ({ ...current, step2Round1Passed: true }))
  }

  const skipToClassroom = async () => {
    await goToRound2(current => ({
      ...current,
      step2Round1Passed: true,
      reference: current.reference.origin
        ? current.reference
        : { ...current.reference, origin: "classroom" },
    }))
  }

  const continueNext = async () => {
    if (!state.reference.workTitle.trim() || !state.reference.author.trim()) {
      setError(page.validation[0])
      return
    }
    if (!state.reference.location.trim()) {
      setError(page.validation[1])
      return
    }
    if (!state.reference.excerpt.trim()) {
      setError(page.validation[2])
      return
    }
    if (!state.reference.sourceNote.trim()) {
      setError(page.validation[3])
      return
    }
    if (!state.reference.sourceConfirmed) {
      setError(page.validation[4])
      return
    }
    if (state.round2PromptCopied && !state.analysisReply.trim()) {
      setError(MODULE1_LESSON2_SHARED_COPY.round2ReplyRequired)
      return
    }
    if (!hasModule1Lesson2WritingPlan(state)) {
      setError(page.validation[5])
      return
    }
    if (!canCompleteModule1Lesson2Step2Round2Fields(state)) {
      setError(MODULE1_LESSON2_SHARED_COPY.round2ReplyRequired)
      return
    }
    setError("")
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 2, stepId: 3 },
      lesson2: {
        ...clearModule1Lesson2Review(current.lesson2, ["reference", "writingPlan"]),
        step: 3,
        step2Completed: true,
        step2Round1Passed: true,
      },
    }))
    await flushPortfolio()
    navigate("/module/1/lesson/2/step/3")
  }

  if (roundRedirect) {
    return <Navigate to={roundRedirect} replace />
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-muted-foreground">
        {round === 1 ? MODULE1_LESSON2_SHARED_COPY.step2Round1Label : MODULE1_LESSON2_SHARED_COPY.step2Round2Label}
      </p>

      {round === 1 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="leading-snug">{page.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p>{page.intro}</p>
              {!lesson1Ready && (
                <p className="rounded-lg bg-amber-50 p-3 text-amber-900">
                  城市问题或写给谁缺失，请
                  <Link className="underline underline-offset-2" to="/module/1/lesson/1/step/4">返回补全第1课</Link>
                  。
                </p>
              )}
              <p className="text-muted-foreground">{MODULE1_LESSON2_SHARED_COPY.newContextNote}</p>
            </CardContent>
          </Card>

          <Card className={cn(round1Copied && "border-primary")}>
            <CardHeader>
              <CardTitle>{page.panels[0].title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{page.panels[0].body}</p>
              <CopyPromptControl
                label={page.buttons[0]}
                disabled={!lesson1Ready}
                disabledReason={lesson1Ready ? undefined : MODULE1_LESSON2_SHARED_COPY.incompletePrompt}
                buildText={() => buildModule1Lesson2Prompt("P2A", portfolio)}
                onCopied={() => updateLesson2(current => ({ ...current, round1PromptCopied: true }))}
              />
              <label className="space-y-1 text-sm font-medium">
                <span>{round1Copied ? MODULE1_LESSON2_SHARED_COPY.aiReplyRequiredLabel : page.fields[0].label}</span>
                <Textarea
                  aria-required={round1Copied}
                  className={cn(round1Copied ? "min-h-[96px] border-primary" : "min-h-[96px] bg-muted/30")}
                  value={state.recommendationReply}
                  onChange={event => updateLesson2(current => ({
                    ...current,
                    recommendationReply: event.target.value,
                  }))}
                  placeholder={page.fields[0].placeholder}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void skipToClassroom()}>
                  {MODULE1_LESSON2_SHARED_COPY.skipToClassroom}
                </Button>
                <Button onClick={() => void continueRound1()}>{MODULE1_LESSON2_SHARED_COPY.saveAndContinue}</Button>
              </div>
              {(error || round1ReplyRequired) && (
                <p role="alert" className="text-sm text-destructive">{error || MODULE1_LESSON2_SHARED_COPY.round1ReplyRequired}</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{page.panels[1].title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{page.panels[1].body}</p>
              <Lesson2ReviewBanner
                visible={state.reviewNeeded.reference}
                confirmEnabled={hasModule1Lesson2ReferenceFields(state)}
                onConfirm={() => updateLesson2(current => clearModule1Lesson2Review(current, ["reference"]))}
              />
              <fieldset className="space-y-2 text-sm">
                <legend className="font-medium">{page.fields[1].label}</legend>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="reference-origin"
                    checked={state.reference.origin === "classroom"}
                    onChange={() => updateLesson2(current => ({
                      ...current,
                      reference: { ...current.reference, origin: "classroom" },
                    }))}
                  />
                  使用课堂案例
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="reference-origin"
                    checked={state.reference.origin === "external"}
                    onChange={() => updateLesson2(current => ({
                      ...current,
                      reference: { ...current.reference, origin: "external", caseId: "" },
                    }))}
                  />
                  使用我找到的作品片段
                </label>
              </fieldset>
              {state.reference.origin === "classroom" && (
                <div className="space-y-2">
                  {MODULE1_LITERARY_CASES.map(literaryCase => (
                    <div key={literaryCase.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                      <p>{literaryCase.cardTitle}</p>
                      <Button type="button" size="sm" variant="outline" onClick={() => requestClassroomCase(literaryCase.id)}>
                        {page.buttons[1]}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <label className="space-y-1 text-sm font-medium">
                <span>{page.fields[2].label}</span>
                <Input
                  value={state.reference.workTitle}
                  onChange={event => updateLesson2(current => ({
                    ...current,
                    reference: { ...current.reference, workTitle: event.target.value },
                  }))}
                  placeholder={page.fields[2].placeholder}
                />
              </label>
              <label className="space-y-1 text-sm font-medium">
                <span>{page.fields[3].label}</span>
                <Input
                  value={state.reference.author}
                  onChange={event => updateLesson2(current => ({
                    ...current,
                    reference: { ...current.reference, author: event.target.value },
                  }))}
                  placeholder={page.fields[3].placeholder}
                />
              </label>
              <label className="space-y-1 text-sm font-medium">
                <span>{page.fields[4].label}</span>
                <Input
                  value={state.reference.location}
                  onChange={event => updateLesson2(current => ({
                    ...current,
                    reference: { ...current.reference, location: event.target.value },
                  }))}
                  placeholder={page.fields[4].placeholder}
                />
              </label>
              <label className="space-y-1 text-sm font-medium">
                <span>{page.fields[5].label}</span>
                <Textarea
                  className="min-h-[72px]"
                  value={state.reference.versionNote}
                  onChange={event => updateLesson2(current => ({
                    ...current,
                    reference: { ...current.reference, versionNote: event.target.value },
                  }))}
                  placeholder={page.fields[5].placeholder}
                />
              </label>
              <label className="space-y-1 text-sm font-medium">
                <span>{page.fields[6].label}</span>
                <Textarea
                  className="min-h-[140px]"
                  value={state.reference.excerpt}
                  onChange={event => updateLesson2(current => ({
                    ...current,
                    reference: { ...current.reference, excerpt: event.target.value },
                  }))}
                  placeholder={page.fields[6].placeholder}
                />
              </label>
              <label className="space-y-1 text-sm font-medium">
                <span>{page.fields[7].label}</span>
                <Textarea
                  className="min-h-[72px]"
                  value={state.reference.sourceNote}
                  onChange={event => updateLesson2(current => ({
                    ...current,
                    reference: { ...current.reference, sourceNote: event.target.value },
                  }))}
                  placeholder={page.fields[7].placeholder}
                />
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={state.reference.sourceConfirmed}
                  onChange={event => updatePortfolio(current => ({
                    ...current,
                    lesson2: {
                      ...current.lesson2,
                      reference: {
                        ...current.lesson2.reference,
                        sourceConfirmed: event.target.checked,
                      },
                    },
                  }))}
                />
                <span>{page.fields[8].label}</span>
              </label>
              <p className="text-xs text-muted-foreground">{MODULE1_LESSON2_SHARED_COPY.sourceMismatch}</p>
            </CardContent>
          </Card>

          <Card className={cn(round2Copied && "border-primary")}>
            <CardHeader>
              <CardTitle>{page.panels[2].title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{page.panels[2].body}</p>
              <Lesson2ReviewBanner
                visible={state.reviewNeeded.writingPlan}
                confirmEnabled={hasModule1Lesson2WritingPlan(state)}
                onConfirm={() => updateLesson2(current => clearModule1Lesson2Review(current, ["writingPlan"]))}
              />
              <CopyPromptControl
                label={page.buttons[2]}
                disabled={!state.reference.excerpt.trim() || !hasModule1Lesson2ReferenceFields(state)}
                disabledReason={
                  !state.reference.excerpt.trim()
                    ? MODULE1_LESSON2_SHARED_COPY.excerptMissing
                    : MODULE1_LESSON2_SHARED_COPY.incompletePrompt
                }
                buildText={() => buildModule1Lesson2Prompt("P2B", portfolio)}
                onCopied={() => updateLesson2(current => ({ ...current, round2PromptCopied: true }))}
              />
              <label className="space-y-1 text-sm font-medium">
                <span>{round2Copied ? MODULE1_LESSON2_SHARED_COPY.aiReplyRequiredLabel : page.fields[9].label}</span>
                <Textarea
                  aria-required={round2Copied}
                  className={cn(round2Copied ? "min-h-[96px] border-primary" : "min-h-[96px] bg-muted/30")}
                  value={state.analysisReply}
                  onChange={event => updateLesson2(current => ({
                    ...current,
                    analysisReply: event.target.value,
                  }))}
                  placeholder={page.fields[9].placeholder}
                />
              </label>
              <div className="space-y-2">
                <p className="text-sm font-medium">{page.fields[10].label}</p>
                <Textarea className="min-h-[72px]" value={plan1} onChange={event => updateWritingPlan(0, event.target.value)} placeholder="1. 我准备采用……写法，在我的故事中用来……。" />
                <Textarea className="min-h-[72px]" value={plan2} onChange={event => updateWritingPlan(1, event.target.value)} placeholder="2. 我还准备采用……写法，在我的故事中用来……。" />
                <Textarea className="min-h-[72px]" value={plan3} onChange={event => updateWritingPlan(2, event.target.value)} placeholder="3.（选填）我准备……。" />
              </div>
              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {page.hints.map(hint => <li key={hint}>{hint}</li>)}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(buildModule1Lesson2Step2Path(1))}>
                  {MODULE1_LESSON2_SHARED_COPY.backToRound1}
                </Button>
                <Button type="button" variant="outline" onClick={() => setExampleOpen(true)}>{page.buttons[3]}</Button>
                <Button onClick={() => void continueNext()}>{page.buttons[4]}</Button>
              </div>
              {(error || round2ReplyRequired) && (
                <p role="alert" className="text-sm text-destructive">{error || MODULE1_LESSON2_SHARED_COPY.round2ReplyRequired}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Lesson2WritingDrawer lesson1={portfolio.lesson1} lesson2={state} />
      <ClassroomExampleDialog open={exampleOpen} onOpenChange={setExampleOpen} />
      <Dialog open={Boolean(pendingCaseId)} onOpenChange={open => { if (!open) setPendingCaseId("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{MODULE1_LESSON2_SHARED_COPY.caseReplaceTitle}</DialogTitle>
            <DialogDescription>{MODULE1_LESSON2_SHARED_COPY.caseReplaceBody}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingCaseId("")}>
              {MODULE1_LESSON2_SHARED_COPY.cancel}
            </Button>
            <Button
              type="button"
              onClick={() => {
                const next = buildModule1ClassroomReference(pendingCaseId)
                if (next) applyReference(next)
                setPendingCaseId("")
              }}
            >
              {MODULE1_LESSON2_SHARED_COPY.caseReplaceConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
