/**
 * 文件说明：模块 4 课时 6 公共挑战 Shell。
 * 职责：编排匿名公共挑战 run 创建、当前题读取、答案提交、not-ready/限流空态、进度展示与完成摘要；支持独立 standalone 页面与课时 6 嵌入模式。
 * 更新触发：公共挑战状态机、嵌入课时 6 的完成回调、错误分支、完成面板或 not-ready 空态接入策略变化时，需要同步更新本文件。
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertCircle, RotateCcw } from "lucide-react"
import { publicChallengeAdapter, PublicChallengeHttpError } from "@/modules/module-4-ai-info-detective/api/lesson6-public-challenge.adapter"
import type {
  PublicChallengeAnswerResponse,
  PublicChallengeContext,
  PublicChallengeCurrentQuestion,
  PublicChallengeRun,
  PublicChallengeSummary,
} from "@/modules/module-4-ai-info-detective/api/lesson6-types"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import {
  clearActivePublicChallengeRunId,
  readActivePublicChallengeRunId,
} from "./public-challenge-storage"
import { PublicChallengeProgress } from "./PublicChallengeProgress"
import { PublicChallengeQuestionCard } from "./PublicChallengeQuestionCard"
import { PublicChallengeResultPanel } from "./PublicChallengeResultPanel"
import { PublicChallengeNotReadyState } from "./PublicChallengeNotReadyState"
import { PublicChallengeCompletePanel } from "./PublicChallengeCompletePanel"

type ShellStatus = "loading" | "ready" | "revealed" | "completed" | "not_ready" | "error"

type NotReadyIssue = {
  reason: "public_bank_not_ready" | "rate_limited"
  message: string
  availableCount?: number
}

function errorMessage(error: unknown): string {
  if (error instanceof PublicChallengeHttpError) return error.message
  if (error instanceof Error && error.message.trim()) return error.message
  return "公共挑战暂时无法加载，请稍后再试。"
}

function toNotReadyIssue(error: unknown): NotReadyIssue | null {
  if (!(error instanceof PublicChallengeHttpError)) return null
  if (error.type === "not_ready") {
    return {
      reason: "public_bank_not_ready",
      message: error.message,
      availableCount: error.availableCount,
    }
  }
  if (error.type === "rate_limited") {
    return {
      reason: "rate_limited",
      message: error.message,
    }
  }
  return null
}

export function PublicChallengeShell({
  context,
  embeddedInLesson6 = false,
  onLesson6Completed,
}: {
  context: PublicChallengeContext
  embeddedInLesson6?: boolean
  onLesson6Completed?: (summary: PublicChallengeSummary) => void
}) {
  const [status, setStatus] = useState<ShellStatus>("loading")
  const [run, setRun] = useState<PublicChallengeRun | null>(null)
  const [question, setQuestion] = useState<PublicChallengeCurrentQuestion | null>(null)
  const [selectedOptionKey, setSelectedOptionKey] = useState("")
  const [submittedOptionKey, setSubmittedOptionKey] = useState("")
  const [answer, setAnswer] = useState<PublicChallengeAnswerResponse | null>(null)
  const [summary, setSummary] = useState<PublicChallengeSummary | null>(null)
  const [notReadyIssue, setNotReadyIssue] = useState<NotReadyIssue | null>(null)
  const [error, setError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const questionStartedAtRef = useRef<number>(Date.now())

  const completeRun = useCallback(async (runId: string) => {
    const nextSummary = await publicChallengeAdapter.getSummary(runId)
    setSummary(nextSummary)
    setStatus("completed")
    clearActivePublicChallengeRunId()
    if (nextSummary.completed) onLesson6Completed?.(nextSummary)
  }, [onLesson6Completed])

  const loadCurrent = useCallback(async (currentRun: PublicChallengeRun) => {
    const current = await publicChallengeAdapter.getCurrent(currentRun.runId)
    if (current.completed) {
      await completeRun(currentRun.runId)
      return
    }
    setQuestion(current)
    setSelectedOptionKey("")
    setSubmittedOptionKey("")
    setAnswer(null)
    setSubmitError("")
    setStatus("ready")
    questionStartedAtRef.current = Date.now()
  }, [completeRun])

  const startRun = useCallback(async () => {
    setStatus("loading")
    setError("")
    setNotReadyIssue(null)
    setSummary(null)
    setQuestion(null)
    setAnswer(null)
    setSelectedOptionKey("")
    setSubmittedOptionKey("")
    setSubmitError("")
    try {
      const cachedRunId = readActivePublicChallengeRunId(context)
      if (cachedRunId) {
        try {
          const cachedRun: PublicChallengeRun = {
            runId: cachedRunId,
            context,
            questionCount: 6,
            startedAt: "",
          }
          setRun(cachedRun)
          await loadCurrent(cachedRun)
          return
        } catch (cachedError) {
          if (!(cachedError instanceof PublicChallengeHttpError) || cachedError.status !== 404) throw cachedError
          clearActivePublicChallengeRunId()
        }
      }

      const nextRun = await publicChallengeAdapter.createRun(context)
      setRun(nextRun)
      await loadCurrent(nextRun)
    } catch (caught) {
      const issue = toNotReadyIssue(caught)
      if (issue) {
        setNotReadyIssue(issue)
        setStatus("not_ready")
        return
      }
      setError(errorMessage(caught))
      setStatus("error")
    }
  }, [context, loadCurrent])

  useEffect(() => {
    void startRun()
  }, [startRun])

  const handleSubmit = async () => {
    if (!run || !question?.runItemId || !selectedOptionKey) return
    setSubmitting(true)
    setSubmitError("")
    try {
      const durationMs = Math.max(0, Date.now() - questionStartedAtRef.current)
      const nextAnswer = await publicChallengeAdapter.submitAnswer(run.runId, {
        runItemId: question.runItemId,
        selectedOptionKey,
        durationMs,
      })
      setAnswer(nextAnswer)
      setSubmittedOptionKey(selectedOptionKey)
      setStatus("revealed")
      if (!nextAnswer.next.hasNext) clearActivePublicChallengeRunId()
    } catch (caught) {
      setSubmitError(errorMessage(caught))
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = async () => {
    if (!run || !answer) return
    setStatus("loading")
    try {
      if (!answer.next.hasNext) {
        await completeRun(run.runId)
        return
      }
      await loadCurrent(run)
    } catch (caught) {
      setError(errorMessage(caught))
      setStatus("error")
    }
  }

  const handleRestart = () => {
    clearActivePublicChallengeRunId()
    setRun(null)
    void startRun()
  }

  if (status === "loading") {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          正在准备公共挑战题目...
        </CardContent>
      </Card>
    )
  }

  if (status === "error") {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="h-5 w-5" />
            公共挑战暂时不可用
          </CardTitle>
          <CardDescription className="text-amber-800/80">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="rounded-full border-amber-300 text-amber-900" onClick={startRun}>
            <RotateCcw className="mr-2 h-4 w-4" />
            重试
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (status === "not_ready" && notReadyIssue) {
    return (
      <PublicChallengeNotReadyState
        reason={notReadyIssue.reason}
        message={notReadyIssue.message}
        availableCount={notReadyIssue.availableCount}
        onRetry={handleRestart}
      />
    )
  }

  if (status === "completed") {
    return (
      <PublicChallengeCompletePanel
        summary={summary}
        embeddedInLesson6={embeddedInLesson6}
        onRestart={handleRestart}
      />
    )
  }

  if (!question) return null

  return (
    <div className="space-y-4">
      <PublicChallengeProgress
        answeredCount={answer?.progress.answeredCount ?? question.answeredCount}
        questionCount={question.questionCount}
      />
      <PublicChallengeQuestionCard
        question={question}
        selectedOptionKey={selectedOptionKey}
        disabled={status === "revealed"}
        submitting={submitting}
        error={submitError}
        onSelect={setSelectedOptionKey}
        onSubmit={handleSubmit}
      />
      {status === "revealed" && answer && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <PublicChallengeResultPanel
              question={question}
              answer={answer}
              selectedOptionKey={submittedOptionKey}
            />
            <Button className="w-full rounded-full" onClick={handleNext}>
              {answer.next.hasNext ? "进入下一题" : "查看完成状态"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
