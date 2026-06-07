/**
 * 文件说明：模块 4 课时 5 第 3 关本人题卡报告页面。
 * 职责：在 analytics_open 后读取学生 my-report，展示本人 news/image 题卡统计、三色样本状态和诊断提示，并把报告写入本地 lesson5.myReport 供 Step4 V3 学习任务与快照复用。
 * 更新触发：my-report API、Step3 进入条件、学生报告信息结构、本地 myReport 字段或 C6/C7 反馈展示口径变化时，需要同步更新本文件。
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  attachLesson5Participant,
  fetchLesson5ActiveSession,
  fetchLesson5MyReport,
  fetchLesson5SessionState,
  resolveLesson5StudentMode,
} from "@/modules/module-4-ai-info-detective/api/lesson5-student.adapter"
import type { Lesson5MyReportResponse } from "@/modules/module-4-ai-info-detective/api/lesson5-types"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Lesson5StepLayout } from "../components/Lesson5StepLayout"
import { MyItemStatsCard } from "../components/MyItemStatsCard"

export default function Step3MyItemReport() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const mode = resolveLesson5StudentMode()
  const [report, setReport] = useState<Lesson5MyReportResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const portfolioRef = useRef(portfolio)
  const loadingRef = useRef(false)
  const initialLoadRef = useRef(false)

  useEffect(() => {
    portfolioRef.current = portfolio
  }, [portfolio])

  const loadReport = useCallback(async () => {
    const currentPortfolio = portfolioRef.current
    if (!currentPortfolio?.lesson5.submissionSummary || loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError("")
    try {
      const submission = currentPortfolio.lesson5.submissionSummary
      let connectedSession = currentPortfolio.lesson5.connectedSession
      if (!connectedSession) {
        const activeSession = await fetchLesson5ActiveSession(submission.classId)
        if (!activeSession) {
          setError("当前班级暂时没有可连接课堂。请等待老师开放统计后再刷新。")
          return
        }
        const attached = await attachLesson5Participant({
          sessionId: activeSession.sessionId,
          classId: submission.classId,
          studentName: submission.studentName,
          classSeatCode: submission.classSeatCode,
          lesson5ClientId: currentPortfolio.lesson5.clientId,
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
      } else {
        const nextState = await fetchLesson5SessionState(connectedSession.sessionId, connectedSession.participantId)
        if (nextState.phase !== "draft") {
          connectedSession = {
            ...connectedSession,
            phase: nextState.phase,
            questionCount: nextState.settings.questionCount,
            newsCount: nextState.settings.newsCount,
            imageCount: nextState.settings.imageCount,
            serverNow: nextState.serverNow,
          }
        }
      }

      const nextReport = await fetchLesson5MyReport(
        connectedSession.sessionId,
        connectedSession.participantId,
        currentPortfolio.lesson5.clientId,
      )
      setReport(nextReport)
      await savePortfolio({
        ...currentPortfolio,
        lesson5: {
          ...currentPortfolio.lesson5,
          connectedSession,
          myReport: nextReport,
        },
      })
    } catch (err) {
      setReport(null)
      setError(err instanceof Error ? err.message : "读取本人题卡报告失败，请稍后重试。")
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [mode, savePortfolio])

  useEffect(() => {
    if (!portfolio?.lesson5.submissionSummary || initialLoadRef.current) return
    initialLoadRef.current = true
    void loadReport()
  }, [loadReport, portfolio?.lesson5.submissionSummary])

  if (!portfolio) return null

  return (
    <Lesson5StepLayout title="" subtitle="">
      <div className="space-y-6">
        {!portfolio.lesson5.submissionSummary ? (
          <Card>
            <CardContent className="space-y-4 p-6 text-sm">
              <p className="font-medium">还没有完成 Step1 提交</p>
              <p className="text-muted-foreground">请先提交课时4 V2 ready 包，再等待老师开放统计报告。</p>
              <Button onClick={() => navigate("/module/4/lesson/5/step/1")}>返回第 1 关</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-slate-200 bg-slate-950 text-white">
              <CardContent className="space-y-3 p-6">
                <h2 className="text-2xl font-semibold">用统计反馈检查自己的题卡</h2>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={() => void loadReport()} disabled={loading}>
                    {loading ? "刷新中..." : "刷新报告"}
                  </Button>
                  <Button variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10" onClick={() => navigate("/module/4/lesson/5/step/2")}>
                    回看试答进度
                  </Button>
                  {(portfolio.lesson5.connectedSession?.phase === "analytics_open" || portfolio.lesson5.connectedSession?.phase === "revision_open" || portfolio.lesson5.connectedSession?.phase === "closed") && (
                    <Button variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10" onClick={() => navigate("/module/4/lesson/5/step/4")}>
                      进入第 4 关 / V3 学习任务
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading && !report && (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">正在读取本人题卡报告...</CardContent>
              </Card>
            )}

            {report && (
              <div className="space-y-4">
                <div className="rounded-lg bg-white px-4 py-3 text-xs text-muted-foreground shadow-sm">
                  报告生成时间：{new Date(report.generatedAt).toLocaleString()}
                </div>
                {report.items.length > 0 ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {report.items.map(item => (
                      <MyItemStatsCard key={item.itemVersionId} item={item} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="space-y-3 p-6 text-sm">
                      <p className="font-medium">暂未找到本人题卡统计</p>
                      <p className="text-muted-foreground">
                        可能是本轮冻结池没有包含你提交的题卡，或老师刚开放统计仍需刷新。此提示不影响你回看 Step2。
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Lesson5StepLayout>
  )
}
