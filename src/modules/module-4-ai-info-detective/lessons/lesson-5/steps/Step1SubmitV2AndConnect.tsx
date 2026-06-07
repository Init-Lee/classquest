/**
 * 文件说明：模块 4 课时 5 第 1 关 V2 提交页面。
 * 职责：读取课时4 ready 包，提交 news/image 两张 V2 题卡到班级题池，并在提交成功后尝试连接 active session 与绑定 participant。
 * 更新触发：课时 5 Step1 提交流程、ready 包校验、提交结果保存字段或后续 Step2 解锁条件变化时，需要同步更新本文件。
 */

import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import {
  attachLesson5Participant,
  fetchLesson5ActiveSession,
  resolveLesson5StudentMode,
  submitLesson5V2Package,
} from "@/modules/module-4-ai-info-detective/api/lesson5-student.adapter"
import type { Lesson5V2SubmissionResponse } from "@/modules/module-4-ai-info-detective/api/lesson5-types"
import type { Module4Lesson5ConnectedSessionState } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Card, CardContent } from "@/shared/ui/card"
import { Lesson5StepLayout } from "../components/Lesson5StepLayout"
import { V2SubmissionPanel } from "../components/V2SubmissionPanel"
import type { Lesson5ReadyPackage, Lesson5SubmitUiState } from "../types"
import { buildLesson5V2SubmissionPayload } from "../utils/build-lesson5-v2-submission-payload"
import { ensureLesson5ClientId } from "../utils/lesson5-client-id"

function isLesson5ReadyPackage(value: unknown): value is Lesson5ReadyPackage {
  if (!value || typeof value !== "object") return false
  const pkg = value as Partial<Lesson5ReadyPackage>
  return pkg.packageVersion === "lesson4-ready-for-lesson5-v1"
    && Boolean(pkg.cards?.news)
    && Boolean(pkg.cards?.image)
}

function buildSuccessMessage(response: Lesson5V2SubmissionResponse): string {
  const dedupedKinds = (["news", "image"] as const).filter(kind => response.items[kind].deduped)
  if (dedupedKinds.length === 2) return "提交成功：两张题卡均命中同内容版本，已幂等复用。"
  if (dedupedKinds.length === 1) return "提交成功：其中一张题卡命中同内容版本，另一张生成新版本。"
  return "提交成功：两张题卡已进入班级题池，并生成当前 V2 版本。"
}

export default function Step1SubmitV2AndConnect() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const mode = resolveLesson5StudentMode()
  const [uiState, setUiState] = useState<Lesson5SubmitUiState>(() => {
    if (!portfolio?.lesson5.submissionSummary) return { status: "idle", message: "" }
    return {
      status: "success",
      message: "本地记录显示你已经完成课时5 Step1 提交，可再次提交验证幂等。",
      response: {
        ok: true,
        classId: portfolio.lesson5.submissionSummary.classId,
        studentName: portfolio.lesson5.submissionSummary.studentName,
        classSeatCode: portfolio.lesson5.submissionSummary.classSeatCode,
        items: portfolio.lesson5.submissionSummary.items,
        submittedAt: portfolio.lesson5.submissionSummary.submittedAt,
      },
    }
  })

  const readyPackage = useMemo(() => {
    const raw = portfolio?.lesson4.readiness.exportedPackageJson
    return isLesson5ReadyPackage(raw) ? raw : null
  }, [portfolio?.lesson4.readiness.exportedPackageJson])

  if (!portfolio) return null

  const missingReadyPackage = !readyPackage
  const submitDisabled = missingReadyPackage || !portfolio.student.studentName || !portfolio.student.classSeatCode

  const handleSubmit = async () => {
    if (!readyPackage || submitDisabled) return
    const clientId = ensureLesson5ClientId(portfolio.lesson5.clientId)
    setUiState({ status: "submitting", message: "正在提交到班级题池..." })
    try {
      const payload = buildLesson5V2SubmissionPayload(portfolio, readyPackage, clientId)
      const response = await submitLesson5V2Package(payload)
      const now = new Date().toISOString()
      let connectedSession: Module4Lesson5ConnectedSessionState | undefined
      let connectionMessage = "当前暂无可连接课堂。你已完成 V2 提交，可进入第 2 关等待老师锁池或开放试答。"

      try {
        const activeSession = await fetchLesson5ActiveSession(response.classId)
        if (activeSession) {
          const attached = await attachLesson5Participant({
            sessionId: activeSession.sessionId,
            classId: response.classId,
            studentName: response.studentName,
            classSeatCode: response.classSeatCode,
            lesson5ClientId: clientId,
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
            attachedAt: now,
            serverNow: attached.serverNow,
            mode,
          }
          connectionMessage = `已连接课堂「${activeSession.title}」，第 2 关可查看本轮分配列表。`
        }
      } catch (connectError) {
        connectionMessage = connectError instanceof Error
          ? `V2 已提交成功，但课堂连接暂未完成：${connectError.message}`
          : "V2 已提交成功，但课堂连接暂未完成，请稍后在第 2 关刷新。"
      }

      await savePortfolio({
        ...portfolio,
        progress: { lessonId: 5, stepId: 2 },
        lesson5: {
          ...portfolio.lesson5,
          clientId,
          submissionSummary: {
            submittedAt: response.submittedAt,
            classId: response.classId,
            studentName: response.studentName,
            classSeatCode: response.classSeatCode,
            mode,
            items: response.items,
          },
          connectedSession,
          completed: true,
          completedAt: now,
        },
      })
      setUiState({
        status: "success",
        message: `${buildSuccessMessage(response)} ${connectionMessage}`,
        response,
      })
    } catch (error) {
      setUiState({
        status: "error",
        message: error instanceof Error ? error.message : "提交失败，请稍后重试。",
      })
    }
  }

  return (
    <Lesson5StepLayout title="第1关 · 提交 V2 到班级题池" subtitle="把课时4生成的 ready 包连接到课时5题池，准备后续网页试答。">
      <div className="space-y-6">
        {missingReadyPackage ? (
          <Card>
            <CardContent className="space-y-3 p-6 text-sm">
              <p className="font-medium">还没有找到课时4 ready 包</p>
              <p className="text-muted-foreground">请先回到课时4第4关，保存 V2 就绪报告后再进入课时5。</p>
            </CardContent>
          </Card>
        ) : (
          <V2SubmissionPanel
            readyPackage={readyPackage}
            mode={mode}
            state={uiState}
            disabled={submitDisabled}
            onSubmit={() => void handleSubmit()}
            onContinue={() => navigate("/module/4/lesson/5/step/2")}
          />
        )}
      </div>
    </Lesson5StepLayout>
  )
}
