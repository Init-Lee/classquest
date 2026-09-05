/**
 * 文件说明：模块 1 课时 1 路由入口。
 * 职责：分发四个主题关卡、执行真实 Step Guard，并在无档案或越级时安全恢复。
 * 更新触发：课时 1 路径、关卡组件、门禁、教师讲解放行或进度展示变化时，需要同步更新本文件。
 */

import { useLayoutEffect, useRef } from "react"
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { MODULE1_LESSON1_CONFIG, MODULE1_LESSON1_STEPS } from "@/modules/module-1-ai-story/lessons/lesson-1/config"
import {
  canEnterModule1Lesson1Step,
  getModule1Lesson1GuardReason,
  getModule1Lesson1RouteRedirect,
  isModule1Lesson1StepComplete,
} from "@/modules/module-1-ai-story/lessons/lesson-1/guards"
import { InnerStepProgress } from "@/modules/module-1-ai-story/features/progress-ui/InnerStepProgress"
import Step1Mission from "./steps/Step1Mission"
import Step2Sdg from "./steps/Step2Sdg"
import Step3CityIssue from "./steps/Step3CityIssue"
import Step4AudienceOutline from "./steps/Step4AudienceOutline"

function Lesson1Frame({ children }: { children: React.ReactNode }) {
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
  const routeRedirect = getModule1Lesson1RouteRedirect(portfolio, stepId, isTeacherMode)
  if (!portfolio) return <Navigate to={routeRedirect ?? "/module/1"} replace />
  if (!isTeacherMode && !canEnterModule1Lesson1Step(portfolio.lesson1, stepId)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Card>
          <CardHeader><CardTitle>这一关还没有解锁</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{getModule1Lesson1GuardReason(stepId)}</p>
            <Button onClick={() => navigate(routeRedirect ?? "/module/1")}>回到当前关卡</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedStepIds = MODULE1_LESSON1_STEPS
    .filter(step => isModule1Lesson1StepComplete(portfolio.lesson1, step.id))
    .map(step => step.id)
  const accessibleStepIds = isTeacherMode
    ? MODULE1_LESSON1_STEPS.map(step => step.id)
    : MODULE1_LESSON1_STEPS
      .filter(step => canEnterModule1Lesson1Step(portfolio.lesson1, step.id))
      .map(step => step.id)
  const lockedStepIds = MODULE1_LESSON1_STEPS
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
          <p className="text-xs font-medium text-primary">课时 1 · {MODULE1_LESSON1_CONFIG.title}</p>
          <InnerStepProgress
            steps={MODULE1_LESSON1_STEPS.map(step => ({ id: step.id, label: step.title }))}
            currentStepId={stepId}
            completedStepIds={completedStepIds}
            accessibleStepIds={accessibleStepIds}
            lockedStepIds={lockedStepIds}
            onStepClick={targetStep => navigate(`/module/1/lesson/1/step/${targetStep}`)}
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

export default function Module1Lesson1Routes() {
  return (
    <Lesson1Frame>
      <Routes>
        <Route index element={<Navigate to="step/1" replace />} />
        <Route path="step/1" element={<Step1Mission />} />
        <Route path="step/2" element={<Step2Sdg />} />
        <Route path="step/3" element={<Step3CityIssue />} />
        <Route path="step/4" element={<Step4AudienceOutline />} />
        <Route path="*" element={<Navigate to="step/1" replace />} />
      </Routes>
    </Lesson1Frame>
  )
}
