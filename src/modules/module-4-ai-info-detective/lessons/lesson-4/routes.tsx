/**
 * 文件说明：模块 4 课时 4 路由入口。
 * 职责：处理 `/module/4/lesson/4/*` 子路由、执行 Guard，并统一渲染课时标题与四步进度条；本阶段 Step2-4 只显示锁定占位。
 * 更新触发：课时 4 路径、步骤数量、课内进度条布局、Guard 或后续步骤开放策略变化时，需要同步更新本文件。
 */

import { type ReactNode, useLayoutEffect, useRef } from "react"
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom"
import { InnerStepProgress } from "@/modules/module-4-ai-info-detective/features/progress-ui/InnerStepProgress"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { getCurrentLesson3Step } from "@/modules/module-4-ai-info-detective/lessons/lesson-3/guards"
import { LESSON4_CONFIG, LESSON4_STEPS } from "./config"
import {
  canEnterLesson4Step,
  getCurrentLesson4Step,
  getLesson4CompletedSteps,
  getLesson4GuardReason,
} from "./guards"
import { Lesson4LockedPlaceholder, LockedLesson4Step } from "./components/Lesson4StepLayout"
import Step1PeerReviewRelay from "./steps/Step1PeerReviewRelay"

function StepContainer({ stepId, children }: { stepId: number; children: ReactNode }) {
  const { portfolio, loading, isTeacherMode } = useModule4Portfolio()
  const navigate = useNavigate()
  const lessonChromeRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [stepId])

  useLayoutEffect(() => {
    const el = lessonChromeRef.current
    if (!el) return
    const update = () => {
      document.documentElement.style.setProperty("--module4-lesson4-chrome-h", `${el.offsetHeight}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
      document.documentElement.style.removeProperty("--module4-lesson4-chrome-h")
    }
  })

  if (loading) return <div className="py-16 text-center text-sm text-muted-foreground">正在准备模块四学习档案...</div>
  if (!portfolio && !isTeacherMode) return <Navigate to="/module/4" replace />
  if (!portfolio) return null

  const allowed = canEnterLesson4Step(portfolio.lesson3, stepId)
  if (!allowed && !isTeacherMode) {
    if (!portfolio.lesson3.completed) {
      const currentLesson3Step = getCurrentLesson3Step(portfolio.lesson3)
      return (
        <LockedLesson4Step
          reason="请先完成课时 3，再进入课时 4。"
          onReturn={() => navigate(`/module/4/lesson/3/step/${currentLesson3Step}`)}
        />
      )
    }
    return (
      <LockedLesson4Step
        reason={getLesson4GuardReason(stepId)}
        onReturn={() => navigate(`/module/4/lesson/4/step/${getCurrentLesson4Step(portfolio.lesson4)}`)}
      />
    )
  }

  const completedSteps = isTeacherMode ? [] : getLesson4CompletedSteps(portfolio.lesson4)
  const accessibleSteps = isTeacherMode
    ? LESSON4_STEPS.map(step => step.id)
    : LESSON4_STEPS
      .filter(step => canEnterLesson4Step(portfolio.lesson3, step.id))
      .map(step => step.id)

  return (
    <>
      <div
        ref={lessonChromeRef}
        className="sticky z-30 bg-background/95 pb-3 pt-1 backdrop-blur supports-[backdrop-filter]:bg-background/90"
        style={{ top: "var(--module4-sticky-stack-height, 6.75rem)" }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">课时4</span>
              <h2 className="text-lg font-semibold">{LESSON4_CONFIG.title}</h2>
            </div>
            <InnerStepProgress
              lessonId={4}
              currentStepId={stepId}
              steps={LESSON4_STEPS.map(step => ({ id: step.id, label: step.title }))}
              completedStepIds={completedSteps}
              accessibleStepIds={accessibleSteps}
              markPreviousStepsCompleted={!isTeacherMode}
            />
          </div>
        </div>
      </div>
      {children}
    </>
  )
}

function LockedPlaceholderRoute() {
  const { portfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  return (
    <Lesson4LockedPlaceholder
      gatePassed={Boolean(portfolio?.lesson4.gatePassed)}
      onReturn={() => navigate("/module/4/lesson/4/step/1")}
    />
  )
}

export default function Lesson4Routes() {
  const params = useParams<{ "*": string }>()
  const stepId = Number(params["*"]?.replace("step/", "") || "1")

  return (
    <StepContainer stepId={stepId}>
      <Routes>
        <Route index element={<Navigate to="step/1" replace />} />
        <Route path="step/1" element={<Step1PeerReviewRelay />} />
        <Route path="step/2" element={<LockedPlaceholderRoute />} />
        <Route path="step/3" element={<LockedPlaceholderRoute />} />
        <Route path="step/4" element={<LockedPlaceholderRoute />} />
        <Route path="*" element={<Navigate to="step/1" replace />} />
      </Routes>
    </StepContainer>
  )
}
