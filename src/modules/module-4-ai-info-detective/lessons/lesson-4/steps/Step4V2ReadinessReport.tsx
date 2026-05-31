/**
 * 文件说明：模块 4 课时 4 第 4 关 V2 就绪报告页面。
 * 职责：评估两张 V2 题卡是否可进入课时五，生成本地 ready_for_lesson5 包，并只写入前端 portfolio。
 * 更新触发：Step4 就绪规则、准备包结构、最终完成字段或课时五承接边界变化时，需要同步更新本文件。
 */

import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { MODULE4_LESSON_REGISTRY } from "@/modules/module-4-ai-info-detective/app/lesson-registry"
import { Lesson4StepLayout } from "../components/Lesson4StepLayout"
import { ReadyForLesson5ActionBar } from "../components/v2-readiness/ReadyForLesson5ActionBar"
import { V2PackagePreview } from "../components/v2-readiness/V2PackagePreview"
import { V2ReadinessCard } from "../components/v2-readiness/V2ReadinessCard"
import { buildLesson4ReadyPackage } from "../utils/build-lesson4-ready-package"
import { buildLesson4StageSnapshot } from "../utils/build-lesson4-stage-snapshot"
import { evaluateLesson4QuickCheck } from "../utils/evaluate-lesson4-quick-check"
import { evaluateLesson4ReadyForLesson5 } from "../utils/evaluate-lesson4-ready-for-lesson5"
import { getLesson4PostSaveTarget } from "../utils/get-lesson4-post-save-target"

export default function Step4V2ReadinessReport() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const createdAt = useMemo(() => new Date().toISOString(), [])
  const postSaveTarget = useMemo(() => getLesson4PostSaveTarget(), [])

  if (!portfolio) return null

  const decisions = portfolio.lesson4.feedbackInbox.decisions
  const evaluation = evaluateLesson4ReadyForLesson5({
    v2: portfolio.lesson4.v2,
    decisions,
    step2Completed: portfolio.lesson4.step2Completed,
    step3Completed: portfolio.lesson4.step3Completed,
  })
  const previewReadiness = {
    ...portfolio.lesson4.readiness,
    newsReady: evaluation.cards.news.status !== "red",
    imageReady: evaluation.cards.image.status !== "red",
    readyForLesson5: false,
    checkedAt: createdAt,
  }
  const previewPackage = buildLesson4ReadyPackage({
    createdAt,
    student: portfolio.student,
    newsCard: portfolio.lesson4.v2.newsCard,
    imageCard: portfolio.lesson4.v2.imageCard,
    receivedReviewPresent: Boolean(portfolio.lesson4.outbound.receivedReviewJson),
    feedbackDecisions: decisions,
    readiness: previewReadiness,
  })

  const saveReadyPackage = async () => {
    if (evaluation.status === "red" || saving) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const readiness = {
        ...portfolio.lesson4.readiness,
        newsReady: true,
        imageReady: true,
        readyForLesson5: true,
        checkedAt: now,
        exportedPackageJson: undefined,
      }
      const readyPackage = buildLesson4ReadyPackage({
        createdAt: now,
        student: portfolio.student,
        newsCard: portfolio.lesson4.v2.newsCard,
        imageCard: portfolio.lesson4.v2.imageCard,
        receivedReviewPresent: Boolean(portfolio.lesson4.outbound.receivedReviewJson),
        feedbackDecisions: decisions,
        readiness,
      })
      const quickCheck = evaluateLesson4QuickCheck(
        {
          ...portfolio.lesson4,
          readiness,
          step4Completed: true,
          completed: true,
          completedAt: now,
        },
        now,
      )
      const nextLesson4 = {
        ...portfolio.lesson4,
        readiness: {
          ...readiness,
          exportedPackageJson: readyPackage,
        },
        quickCheck,
        step4Completed: true,
        completed: true,
        completedAt: now,
      }
      const lesson5 = MODULE4_LESSON_REGISTRY.find(entry => entry.id === 5)
      const nextProgress = lesson5?.available
        ? { lessonId: 5, stepId: 1 }
        : { lessonId: 4, stepId: 4 }
      await savePortfolio({
        ...portfolio,
        progress: nextProgress,
        lesson4: {
          ...nextLesson4,
          stageSnapshot: buildLesson4StageSnapshot(
            { ...nextLesson4, step4Completed: true },
            now,
            quickCheck,
          ),
        },
      })
      navigate(postSaveTarget.path)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Lesson4StepLayout title="第4关 · V2 就绪报告" subtitle="确认两张题卡已经准备好进入课时五网页试答">
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">今日完成链路：</span>
          V1 → 同伴反馈 → V2 修改/确认 → 就绪
        </p>
        <div className="grid gap-5 lg:grid-cols-3">
          <V2ReadinessCard report={evaluation.cards.news} />
          <V2ReadinessCard report={evaluation.cards.image} />
          <V2PackagePreview readyPackage={previewPackage} />
        </div>
        {evaluation.status === "red" && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            当前仍有阻塞项，请回到第 3 关补齐后再保存。
          </div>
        )}
        <ReadyForLesson5ActionBar
          status={evaluation.status}
          saving={saving}
          postSaveLabel={postSaveTarget.label}
          onSave={saveReadyPackage}
        />
      </div>
    </Lesson4StepLayout>
  )
}

