/**
 * 文件说明：模块 4 课时 5 第 2 关等待试答与分配列表页面。
 * 职责：基于 Step1 保存的 submissionSummary / connectedSession 读取课堂状态和 assignment list，并在 trial_open 下串联逐题作答、答案揭示与三维快评；统计反馈开放后统一引导进入 Step3 报告。
 * 更新触发：课时 5 participant 恢复、session state 轮询、assignment 展示、C5 作答入口或 C6 报告入口变化时，需要同步更新本文件。
 */

import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import {
  attachLesson5Participant,
  fetchLesson5ActiveSession,
  fetchLesson5Assignments,
  fetchLesson5SessionState,
  resolveLesson5StudentMode,
  submitLesson5Answer,
  submitLesson5Rating,
} from "@/modules/module-4-ai-info-detective/api/lesson5-student.adapter"
import type { Lesson5AnswerSubmitResponse, Lesson5AssignmentDto, Lesson5SessionPhase, Lesson5SessionStateResponse } from "@/modules/module-4-ai-info-detective/api/lesson5-types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Progress } from "@/shared/ui/progress"
import { AnswerRevealPanel } from "../components/AnswerRevealPanel"
import { AssignmentList } from "../components/AssignmentList"
import { Lesson5StepLayout } from "../components/Lesson5StepLayout"
import { RatingPanel, type Lesson5RatingDraft } from "../components/RatingPanel"
import { TrialQuestionCard } from "../components/TrialQuestionCard"

const defaultRatingDraft: Lesson5RatingDraft = {
  clarity: 2,
  thinkingValue: 2,
  explanationHelpfulness: 2,
  issueFlags: [],
  comment: "",
}

const phaseLabels: Record<Lesson5SessionPhase, string> = {
  draft: "草稿",
  pool_locked: "等待老师开放试答",
  trial_open: "试答开放",
  trial_locked: "试答锁定",
  analytics_open: "统计反馈已开放",
  revision_open: "统计反馈已开放",
  closed: "统计反馈已开放",
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, value))
}

export default function Step2TrialAndRating() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const mode = resolveLesson5StudentMode()
  const [sessionState, setSessionState] = useState<Lesson5SessionStateResponse | undefined>()
  const [assignments, setAssignments] = useState<Lesson5AssignmentDto[]>([])
  const [loading, setLoading] = useState(false)
  const [stateError, setStateError] = useState("")
  const [assignmentError, setAssignmentError] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptionKey, setSelectedOptionKey] = useState("")
  const [activeAnswer, setActiveAnswer] = useState<Lesson5AnswerSubmitResponse | undefined>()
  const [ratingDraft, setRatingDraft] = useState<Lesson5RatingDraft>(defaultRatingDraft)
  const [answerError, setAnswerError] = useState("")
  const [ratingError, setRatingError] = useState("")
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  const [submittingRating, setSubmittingRating] = useState(false)

  const refreshRuntime = useCallback(async (options?: { preserveQuestion?: boolean }) => {
    if (!portfolio?.lesson5.submissionSummary) return
    setLoading(true)
    setStateError("")
    setAssignmentError("")
    try {
      const submission = portfolio.lesson5.submissionSummary
      let connectedSession = portfolio.lesson5.connectedSession

      if (!connectedSession) {
        const activeSession = await fetchLesson5ActiveSession(submission.classId)
        if (!activeSession) {
          setStateError("当前班级暂时没有可连接课堂。请等待老师锁池或开放试答后再刷新。")
          return
        }
        const attached = await attachLesson5Participant({
          sessionId: activeSession.sessionId,
          classId: submission.classId,
          studentName: submission.studentName,
          classSeatCode: submission.classSeatCode,
          lesson5ClientId: portfolio.lesson5.clientId,
        })
        connectedSession = {
          sessionId: activeSession.sessionId,
          participantId: attached.participantId,
          classId: activeSession.classId,
          className: activeSession.className,
          title: activeSession.title,
          phase: attached.phase === "draft" ? "pool_locked" : attached.phase,
          questionCount: activeSession.settings.questionCount,
          newsCount: activeSession.settings.newsCount,
          imageCount: activeSession.settings.imageCount,
          attachedAt: new Date().toISOString(),
          serverNow: attached.serverNow,
          mode,
        }
        await savePortfolio({
          ...portfolio,
          lesson5: {
            ...portfolio.lesson5,
            connectedSession,
          },
        })
      }

      const [nextState, assignmentList] = await Promise.all([
        fetchLesson5SessionState(connectedSession.sessionId, connectedSession.participantId),
        fetchLesson5Assignments(connectedSession.sessionId, connectedSession.participantId),
      ])
      setSessionState(nextState)
      setAssignments(assignmentList.assignments)
      if (connectedSession.phase !== nextState.phase && nextState.phase !== "draft") {
        await savePortfolio({
          ...portfolio,
          lesson5: {
            ...portfolio.lesson5,
            connectedSession: {
              ...connectedSession,
              phase: nextState.phase,
              serverNow: nextState.serverNow,
            },
          },
        })
      }
      if (!options?.preserveQuestion) {
        const recoveredIndex = Math.min(nextState.participant.ratedCount, assignmentList.assignments.length)
        setCurrentIndex(recoveredIndex)
        setSelectedOptionKey("")
        setActiveAnswer(undefined)
        setRatingDraft(defaultRatingDraft)
        setAnswerError("")
        setRatingError("")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "读取课堂状态失败，请稍后重试。"
      setStateError(message)
      setAssignmentError(message)
    } finally {
      setLoading(false)
    }
  }, [mode, portfolio, savePortfolio])

  useEffect(() => {
    void refreshRuntime()
  }, [refreshRuntime])

  if (!portfolio) return null

  const connectedSession = portfolio.lesson5.connectedSession
  const phase = sessionState?.phase ?? connectedSession?.phase
  const trialOpen = phase === "trial_open"
  const trialLocked = phase === "trial_locked"
  const reportAvailable = phase === "analytics_open" || phase === "revision_open" || phase === "closed"
  const activeAssignment = assignments[currentIndex]
  const participant = sessionState?.participant
  const answeredWithoutLocalReveal = Boolean(
    participant && participant.answeredCount > participant.ratedCount && !activeAnswer,
  )
  const completedAll = Boolean(participant?.completed || (assignments.length > 0 && currentIndex >= assignments.length))
  const totalQuestions = assignments.length || sessionState?.settings.questionCount || connectedSession?.questionCount || 0
  const answeredCount = participant?.answeredCount ?? 0
  const ratedCount = participant?.ratedCount ?? 0
  const progressValue = totalQuestions > 0 ? clampProgress((ratedCount / totalQuestions) * 100) : 0
  const currentQuestionNumber = activeAssignment?.orderIndex ?? Math.min(ratedCount + 1, totalQuestions || 1)
  const phaseBadgeVariant = trialOpen || reportAvailable ? "success" : "warning"
  const assignmentListError = assignmentError && assignmentError !== stateError ? assignmentError : ""

  const handleSubmitAnswer = async () => {
    if (!connectedSession || !activeAssignment || !selectedOptionKey) return
    setSubmittingAnswer(true)
    setAnswerError("")
    try {
      const answer = await submitLesson5Answer(activeAssignment.assignmentId, {
        participantId: connectedSession.participantId,
        lesson5ClientId: portfolio.lesson5.clientId,
        selectedOptionKey,
        idempotencyKey: `${connectedSession.participantId}:${activeAssignment.assignmentId}`,
      })
      setActiveAnswer(answer)
      setSelectedOptionKey(answer.selectedOptionKey)
      await refreshRuntime({ preserveQuestion: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : "提交答案失败，请稍后重试。"
      setAnswerError(message)
    } finally {
      setSubmittingAnswer(false)
    }
  }

  const handleSubmitRating = async () => {
    if (!connectedSession || !activeAnswer) return
    setSubmittingRating(true)
    setRatingError("")
    try {
      await submitLesson5Rating(activeAnswer.answerId, {
        participantId: connectedSession.participantId,
        lesson5ClientId: portfolio.lesson5.clientId,
        clarity: ratingDraft.clarity,
        thinkingValue: ratingDraft.thinkingValue,
        explanationHelpfulness: ratingDraft.explanationHelpfulness,
        issueFlags: ratingDraft.issueFlags,
        comment: ratingDraft.comment,
      })
      setActiveAnswer(undefined)
      setSelectedOptionKey("")
      setRatingDraft(defaultRatingDraft)
      setCurrentIndex(index => index + 1)
      await refreshRuntime()
    } catch (error) {
      const message = error instanceof Error ? error.message : "提交快评失败，请稍后重试。"
      setRatingError(message)
    } finally {
      setSubmittingRating(false)
    }
  }

  return (
    <Lesson5StepLayout title={connectedSession ? "" : "第2关 · 课堂试答与快评"} subtitle="">
      <div className="space-y-6">
        {!portfolio.lesson5.submissionSummary ? (
          <Card>
            <CardContent className="space-y-4 p-6 text-sm">
              <p className="font-medium">还没有完成 Step1 提交</p>
              <p className="text-muted-foreground">请先提交课时4 V2 ready 包，再回到这里连接课堂。</p>
              <Button onClick={() => navigate("/module/4/lesson/5/step/1")}>返回第 1 关</Button>
            </CardContent>
          </Card>
        ) : connectedSession ? (
          <>
            <Card className="overflow-hidden border-slate-200">
              <div className="bg-slate-950 px-5 py-4 text-white">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <h2 className="text-2xl font-semibold leading-snug">{connectedSession.title || "课时5课堂"}</h2>
                  <div className="flex flex-wrap items-stretch gap-3 lg:justify-end">
                    <div className="min-w-[260px] flex-1 space-y-2 rounded-2xl bg-white/10 p-3 lg:w-80 lg:flex-none">
                      <div className="flex items-center justify-between gap-3 text-xs text-slate-200">
                        <span className="font-medium text-white">答题进度</span>
                        <span>
                          已答 {answeredCount} / {totalQuestions || "-"} · 已评 {ratedCount} / {totalQuestions || "-"}
                        </span>
                      </div>
                      <Progress value={progressValue} className="h-2 bg-white/20" />
                      <p className="text-right text-xs text-slate-300">当前第 {currentQuestionNumber} 题</p>
                    </div>
                    <div className="flex min-w-[132px] flex-col justify-between gap-2">
                      <Badge variant={phaseBadgeVariant} className="justify-center">
                        {phase ? phaseLabels[phase] ?? phase : "读取中"}
                      </Badge>
                      <Button variant="secondary" size="sm" onClick={() => void refreshRuntime()} disabled={loading}>
                        {loading ? "刷新中..." : "刷新课堂状态"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-4 p-5">
                {stateError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{stateError}</p>}
                {answeredWithoutLocalReveal && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    检测到上一题已答未评：请在试答开放时重新提交本题，恢复揭示后继续评分。
                  </p>
                )}
                <AssignmentList
                  assignments={assignments}
                  loading={loading && assignments.length === 0}
                  error={assignmentListError}
                  currentIndex={currentIndex}
                  answeredCount={answeredCount}
                  ratedCount={ratedCount}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-5">
                {!trialOpen && assignments.length > 0 && (
                  <div className="rounded-2xl border border-dashed bg-slate-50 px-5 py-8 text-center text-sm">
                    <p className="text-base font-semibold">
                      {reportAvailable ? "统计反馈已开放" : trialLocked ? "试答已锁定" : "等待老师开放试答"}
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      {reportAvailable
                        ? "当前阶段不再提交新的作答或快评，请前往第 3 关查看本人题卡统计报告。"
                        : trialLocked
                          ? "当前阶段只保留题序和进度摘要，不再提交新的作答或快评。"
                          : "老师开放试答后，本区会切换为单题答题模式。"}
                    </p>
                    {reportAvailable && (
                      <Button className="mt-4" onClick={() => navigate("/module/4/lesson/5/step/3")}>
                        查看第 3 关报告
                      </Button>
                    )}
                  </div>
                )}

                {trialOpen && activeAssignment && !completedAll && (
                  <>
                    <TrialQuestionCard
                      assignment={activeAssignment}
                      selectedOptionKey={selectedOptionKey}
                      disabled={Boolean(activeAnswer)}
                      submitting={submittingAnswer}
                      error={answerError}
                      onSelect={setSelectedOptionKey}
                      onSubmit={() => void handleSubmitAnswer()}
                    />
                    {activeAnswer && (
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
                        <div className="rounded-2xl border bg-white p-4">
                          <p className="text-sm font-semibold tracking-wide text-primary">答题反馈</p>
                          <div className="mt-3">
                            <AnswerRevealPanel answer={activeAnswer} />
                          </div>
                        </div>
                        <RatingPanel
                          draft={ratingDraft}
                          submitting={submittingRating}
                          error={ratingError}
                          onChange={setRatingDraft}
                          onSubmit={() => void handleSubmitRating()}
                        />
                      </div>
                    )}
                  </>
                )}

                {trialOpen && completedAll && assignments.length > 0 && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-8 text-center text-sm">
                    <p className="text-base font-semibold text-emerald-700">本轮试答与快评已完成</p>
                    <p className="mt-2 text-emerald-800">老师端会在下一次刷新时看到你的完成状态；统计开放后可进入第 3 关。</p>
                  </div>
                )}

                {trialOpen && !activeAssignment && !completedAll && (
                  <div className="rounded-2xl border border-dashed bg-slate-50 px-5 py-8 text-center text-sm text-muted-foreground">
                    暂未读取到当前题，请刷新课堂状态。
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="space-y-4 p-6 text-sm">
              <p className="font-medium">正在等待可连接课堂</p>
              <p className="text-muted-foreground">
                V2 提交已经成功，但当前本地档案还没有 participant 绑定。点击刷新后会重新查询 active session 并尝试 attach。
              </p>
              {stateError && <p className="text-red-600">{stateError}</p>}
              <Button variant="outline" onClick={() => void refreshRuntime()} disabled={loading}>
                {loading ? "刷新中..." : "刷新并尝试连接"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Lesson5StepLayout>
  )
}
