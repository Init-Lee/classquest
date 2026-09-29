/**
 * 文件说明：模块 1 课时 5 路由入口。
 * 职责：分发四个转段关卡、执行真实 Step Guard，并在无档案、未完成课时 4 或越级时安全恢复。
 * 更新触发：课时 5 路径、关卡组件、门禁、教师讲解放行或进度展示变化时，需要同步更新本文件。
 */

import { useLayoutEffect, useRef } from "react"
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { MODULE1_LESSON5_STEPS } from "@/modules/module-1-ai-story/lessons/lesson-5/config"
import {
  canEnterModule1Lesson5Step,
  getModule1Lesson5GuardReason,
  getModule1Lesson5RouteRedirect,
  isModule1Lesson5StepComplete,
} from "@/modules/module-1-ai-story/lessons/lesson-5/guards"
import { InnerStepProgress } from "@/modules/module-1-ai-story/features/progress-ui/InnerStepProgress"
import { MODULE1_LESSON5_PAGE_INTRO, MODULE1_LESSON5_PAGE_TITLE } from "@/modules/module-1-ai-story/constants/lesson5-copy"
import Step1ObserveProgress from "./steps/Step1ObserveProgress"
import Step2PlanNext from "./steps/Step2PlanNext"
import Step3WriteDraft from "./steps/Step3WriteDraft"
import Step4CheckConfirm from "./steps/Step4CheckConfirm"

function Lesson5Frame({ children }: { children: React.ReactNode }) {
  const { portfolio, loading, isTeacherMode } = useModule1Portfolio()
  const params = useParams<{ "*": string }>()
  const navigate = useNavigate()
  const lessonChromeRef = useRef<HTMLDivElement>(null)
  const stepId = Number(params["*"]?.replace("step/", "") || "1")

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [stepId])

  useLayoutEffect(() => {
    const element = lessonChromeRef.current
    if (!element) return
    const update = () => {
      document.documentElement.style.setProperty("--module1-lesson-chrome-height", `${element.offsetHeight}px`)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty("--module1-lesson-chrome-height")
    }
  }, [])

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">正在准备学习档案...</div>
  const routeRedirect = getModule1Lesson5RouteRedirect(portfolio, stepId, isTeacherMode)
  if (!portfolio) return <Navigate to={routeRedirect ?? "/module/1"} replace />
  if (!isTeacherMode && !portfolio.lesson4.completed) {
    return <Navigate to={routeRedirect ?? "/module/1"} replace />
  }
  if (!isTeacherMode && !canEnterModule1Lesson5Step(portfolio.lesson5, stepId)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Card>
          <CardHeader><CardTitle>这一关还没有解锁</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{getModule1Lesson5GuardReason(stepId)}</p>
            <Button onClick={() => navigate(routeRedirect ?? "/module/1")}>回到当前关卡</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedStepIds = MODULE1_LESSON5_STEPS
    .filter(step => isModule1Lesson5StepComplete(portfolio.lesson5, step.id))
    .map(step => step.id)
  const accessibleStepIds = isTeacherMode
    ? MODULE1_LESSON5_STEPS.map(step => step.id)
    : MODULE1_LESSON5_STEPS
      .filter(step => canEnterModule1Lesson5Step(portfolio.lesson5, step.id))
      .map(step => step.id)
  const lockedStepIds = MODULE1_LESSON5_STEPS
    .filter(step => !accessibleStepIds.includes(step.id))
    .map(step => step.id)

  return (
    <>
      <div
        ref={lessonChromeRef}
        className="sticky z-30 border-b bg-background/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/90"
        style={{ top: "var(--module1-sticky-stack-height, 4rem)" }}
      >
        <div className="mx-auto max-w-7xl space-y-1 px-4">
          <p className="text-xs font-medium text-primary">{MODULE1_LESSON5_PAGE_TITLE}</p>
          <p className="text-xs text-muted-foreground">{MODULE1_LESSON5_PAGE_INTRO}</p>
          <InnerStepProgress
            steps={MODULE1_LESSON5_STEPS.map(step => ({ id: step.id, label: step.title }))}
            currentStepId={stepId}
            completedStepIds={completedStepIds}
            accessibleStepIds={accessibleStepIds}
            lockedStepIds={lockedStepIds}
            onStepClick={targetStep => navigate(`/module/1/lesson/5/step/${targetStep}`)}
          />
        </div>
      </div>
      <div
        className="mx-auto w-full max-w-7xl px-4 py-6"
        style={{ minHeight: "calc(100dvh - var(--module1-sticky-stack-height, 4rem) - var(--module1-lesson-chrome-height, 5rem))" }}
      >
        {children}
      </div>
    </>
  )
}

export default function Module1Lesson5Routes() {
  return (
    <Lesson5Frame>
      <Routes>
        <Route index element={<Navigate to="step/1" replace />} />
        <Route path="step/1" element={<Step1ObserveProgress />} />
        <Route path="step/2" element={<Step2PlanNext />} />
        <Route path="step/3" element={<Step3WriteDraft />} />
        <Route path="step/4" element={<Step4CheckConfirm />} />
        <Route path="*" element={<Navigate to="step/1" replace />} />
      </Routes>
    </Lesson5Frame>
  )
}
