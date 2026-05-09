/**
 * 文件说明：模块 4 课时 2 路由入口。
 * 职责：处理 `/module/4/lesson/2/*` 子路由、执行 Guard，并统一渲染课时标题与关卡进度条。
 * 更新触发：课时 2 路径、关卡数量、课内进度条布局、Guard 或教师模式策略变化时，需要同步更新本文件。
 */

import { type ReactNode, useLayoutEffect, useRef } from "react"
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom"
import { InnerStepProgress } from "@/modules/module-4-ai-info-detective/features/progress-ui/InnerStepProgress"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { LESSON2_CONFIG, LESSON2_STEPS } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/config"
import { getCurrentLesson1Step } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/guards"
import {
  canEnterLesson2Step,
  getCurrentLesson2Step,
  getLesson2CompletedSteps,
  getLesson2GuardReason,
} from "@/modules/module-4-ai-info-detective/lessons/lesson-2/guards"
import { LockedLesson2Step } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/components/Lesson2StepLayout"
import { cn } from "@/shared/utils/cn"
import Step1MaterialBaseline from "./steps/Step1MaterialBaseline"
import Step2ScreeningCriteria from "./steps/Step2ScreeningCriteria"
import Step3NewsWorkbench from "./steps/Step3NewsWorkbench"
import Step4ImageWorkbench from "./steps/Step4ImageWorkbench"
import Step5ScreeningReport from "./steps/Step5ScreeningReport"

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
      document.documentElement.style.setProperty("--module4-lesson2-chrome-h", `${el.offsetHeight}px`)
      document.documentElement.style.setProperty(
        "--module4-lesson2-content-h",
        "calc(100dvh - var(--module4-sticky-stack-height, 7rem) - var(--module4-lesson2-chrome-h, 8rem))",
      )
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
      document.documentElement.style.removeProperty("--module4-lesson2-chrome-h")
      document.documentElement.style.removeProperty("--module4-lesson2-content-h")
    }
  })

  if (loading) return <div className="py-16 text-center text-sm text-muted-foreground">正在准备模块四学习档案...</div>
  if (!portfolio && !isTeacherMode) return <Navigate to="/module/4" replace />
  if (!portfolio) return null

  const allowed = canEnterLesson2Step(portfolio.lesson1, portfolio.lesson2, stepId)
  if (!allowed && !isTeacherMode) {
    if (!portfolio.lesson1.completed) {
      const currentLesson1Step = getCurrentLesson1Step(portfolio.lesson1)
      return (
        <LockedLesson2Step
          reason="请先完成课时 1，再进入课时 2。"
          onReturn={() => navigate(`/module/4/lesson/1/step/${currentLesson1Step}`)}
        />
      )
    }
    const currentStep = getCurrentLesson2Step(portfolio.lesson2)
    return (
      <LockedLesson2Step
        reason={getLesson2GuardReason(stepId)}
        onReturn={() => navigate(`/module/4/lesson/2/step/${currentStep}`)}
      />
    )
  }

  const completedSteps = isTeacherMode ? [] : getLesson2CompletedSteps(portfolio.lesson2)
  const accessibleSteps = isTeacherMode
    ? LESSON2_STEPS.map(step => step.id)
    : LESSON2_STEPS
      .filter(step => canEnterLesson2Step(portfolio.lesson1, portfolio.lesson2, step.id))
      .map(step => step.id)
  const usesScreenLayout = stepId === 1 || stepId === 2

  return (
    <>
      <div
        ref={lessonChromeRef}
        className={cn("sticky z-30 bg-background/95 pb-3 pt-1 backdrop-blur supports-[backdrop-filter]:bg-background/90")}
        style={{ top: "var(--module4-sticky-stack-height, 6.75rem)" }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">课时2</span>
              <h2 className="text-lg font-semibold">{LESSON2_CONFIG.title}</h2>
            </div>
            <InnerStepProgress
              lessonId={2}
              currentStepId={stepId}
              steps={LESSON2_STEPS.map(step => ({ id: step.id, label: step.title }))}
              completedStepIds={completedSteps}
              accessibleStepIds={accessibleSteps}
              markPreviousStepsCompleted={!isTeacherMode}
            />
          </div>
        </div>
      </div>
      <div className={usesScreenLayout ? "w-full min-w-0" : "mx-auto w-full max-w-7xl px-4 py-6"}>{children}</div>
    </>
  )
}

export default function Lesson2Routes() {
  const params = useParams<{ "*": string }>()
  const stepId = Number(params["*"]?.replace("step/", "") || "1")

  return (
    <StepContainer stepId={stepId}>
      <Routes>
        <Route index element={<Navigate to="step/1" replace />} />
        <Route path="step/1" element={<Step1MaterialBaseline />} />
        <Route path="step/2" element={<Step2ScreeningCriteria />} />
        <Route path="step/3" element={<Step3NewsWorkbench />} />
        <Route path="step/4" element={<Step4ImageWorkbench />} />
        <Route path="step/5" element={<Step5ScreeningReport />} />
        <Route path="*" element={<Navigate to="step/1" replace />} />
      </Routes>
    </StepContainer>
  )
}
