/**
 * 文件说明：模块 4 课时 1 路由入口。
 * 职责：处理 `/module/4/lesson/1/*` 子路由、执行 Guard；统一渲染 sticky 课时标题与关卡进度条，并向子页面注入剩余可视高度变量。无本地档案且非教师模式时退回首页建档。
 * 更新触发：课时 1 路径、Step 数量、全屏滚动壳层、课内进度条布局（须与模块三一致）、Guard 或无档案跳转策略变化时，需要同步更新本文件。
 */

import { type ReactNode, useLayoutEffect, useRef } from "react"
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom"
import { InnerStepProgress } from "@/modules/module-4-ai-info-detective/features/progress-ui/InnerStepProgress"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { LESSON1_CONFIG, LESSON1_STEPS } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/config"
import {
  canEnterLesson1Step,
  getCurrentLesson1Step,
  getLesson1CompletedSteps,
  getLesson1GuardReason,
} from "@/modules/module-4-ai-info-detective/lessons/lesson-1/guards"
import { cn } from "@/shared/utils/cn"
import { LockedLesson1Step } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/components/Lesson1StepLayout"
import Step1MissionBrief from "./steps/Step1MissionBrief"
import Step2SampleObservation from "./steps/Step2SampleObservation"
import Step3CardAnatomy from "./steps/Step3CardAnatomy"
import Step4QuizFlowDemo from "./steps/Step4QuizFlowDemo"
import Step5TaskChecklist from "./steps/Step5TaskChecklist"

function StepContainer({ stepId, children }: { stepId: number; children: ReactNode }) {
  const { portfolio, loading, isTeacherMode } = useModule4Portfolio()
  const navigate = useNavigate()
  const lessonChromeRef = useRef<HTMLDivElement>(null)

  // 课时条高度写入变量，供所有全屏式 Step 统一计算「顶栏之外的可视内容区」。
  useLayoutEffect(() => {
    const el = lessonChromeRef.current
    if (!el) return
    const update = () => {
      document.documentElement.style.setProperty("--module4-lesson1-chrome-h", `${el.offsetHeight}px`)
      document.documentElement.style.setProperty(
        "--module4-lesson1-content-h",
        "calc(100dvh - var(--module4-sticky-stack-height, 7rem) - var(--module4-lesson1-chrome-h, 8rem))",
      )
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
      document.documentElement.style.removeProperty("--module4-lesson1-chrome-h")
      document.documentElement.style.removeProperty("--module4-lesson1-content-h")
    }
  })

  if (loading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">正在准备模块四学习档案...</div>
  }

  if (!portfolio && !isTeacherMode) {
    return <Navigate to="/module/4" replace />
  }

  if (!portfolio) return null

  const allowed = canEnterLesson1Step(portfolio.lesson1, stepId)
  if (!allowed && !isTeacherMode) {
    const currentStep = getCurrentLesson1Step(portfolio.lesson1)
    return (
      <LockedLesson1Step
        reason={getLesson1GuardReason(stepId)}
        onReturn={() => navigate(`/module/4/lesson/1/step/${currentStep}`)}
      />
    )
  }

  const completedSteps = isTeacherMode ? [] : getLesson1CompletedSteps(portfolio.lesson1)
  const accessibleSteps = isTeacherMode
    ? LESSON1_STEPS.map(step => step.id)
    : LESSON1_STEPS
      .filter(step => canEnterLesson1Step(portfolio.lesson1, step.id))
      .map(step => step.id)

  const chrome = (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">课时1</span>
        <h2 className="text-lg font-semibold">{LESSON1_CONFIG.title}</h2>
      </div>
      <InnerStepProgress
        lessonId={1}
        currentStepId={stepId}
        steps={LESSON1_STEPS.map(step => ({ id: step.id, label: step.title }))}
        completedStepIds={completedSteps}
        accessibleStepIds={accessibleSteps}
        markPreviousStepsCompleted={!isTeacherMode}
      />
    </div>
  )

  const usesScreenLayout = stepId === 1 || stepId === 2

  return (
    <>
      <div
        ref={lessonChromeRef}
        className={cn(
          "sticky z-30 bg-background/95 pb-3 pt-1 backdrop-blur supports-[backdrop-filter]:bg-background/90",
        )}
        style={{ top: "var(--module4-sticky-stack-height, 6.75rem)" }}
      >
        <div className="mx-auto max-w-7xl px-4">
          {chrome}
        </div>
      </div>
      <div className={usesScreenLayout ? "w-full min-w-0" : "mx-auto w-full max-w-7xl px-4 py-6"}>
        {children}
      </div>
    </>
  )
}

export default function Lesson1Routes() {
  const params = useParams<{ "*": string }>()
  const stepId = Number(params["*"]?.replace("step/", "") || "1")

  return (
    <StepContainer stepId={stepId}>
      <Routes>
        <Route index element={<Navigate to="step/1" replace />} />
        <Route path="step/1" element={<Step1MissionBrief />} />
        <Route path="step/2" element={<Step2SampleObservation />} />
        <Route path="step/3" element={<Step3CardAnatomy />} />
        <Route path="step/4" element={<Step4QuizFlowDemo />} />
        <Route path="step/5" element={<Step5TaskChecklist />} />
        <Route path="*" element={<Navigate to="step/1" replace />} />
      </Routes>
    </StepContainer>
  )
}
