/**
 * 文件说明：模块 4 课时 6 路由入口。
 * 职责：处理 `/module/4/lesson/6/*` 子路由、执行课时 5 完成 Guard，并统一渲染课时标题与步骤进度条。
 * 更新触发：课时 6 路径、步骤数量、课内进度条布局、Guard、C4b 复盘页或完成策略变化时，需要同步更新本文件。
 */

import { type ReactNode } from "react"
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { InnerStepProgress } from "@/modules/module-4-ai-info-detective/features/progress-ui/InnerStepProgress"
import { LESSON6_CONFIG, LESSON6_STEPS } from "./config"
import { canEnterLesson6Step, getLesson6CompletedSteps, getLesson6GuardReason } from "./guards"
import { LockedLesson6Step } from "./components/Lesson6StepLayout"
import Step1PublicationStatus from "./steps/Step1PublicationStatus"
import Step2PublicChallengeEmbedded from "./steps/Step2PublicChallengeEmbedded"
import Step3ReflectionAndSnapshot from "./steps/Step3ReflectionAndSnapshot"

function StepContainer({ stepId, children }: { stepId: number; children: ReactNode }) {
  const { portfolio, loading, isTeacherMode } = useModule4Portfolio()
  const navigate = useNavigate()

  if (loading) return <div className="py-16 text-center text-sm text-muted-foreground">正在准备模块四学习档案...</div>
  if (!portfolio && !isTeacherMode) return <Navigate to="/module/4" replace />
  if (!portfolio) return null

  // 本地 npm run dev 调 UI 时仅跳过进页拦截；进度条仍按学生档案展示真实勾选与锁定。
  const bypassRouteGuard = isTeacherMode || import.meta.env.DEV
  const allowed = bypassRouteGuard || canEnterLesson6Step(portfolio.lesson5, stepId, portfolio.lesson6)
  if (!allowed) {
    return (
      <LockedLesson6Step
        reason={getLesson6GuardReason()}
        onReturn={() => navigate("/module/4")}
      />
    )
  }

  const completedSteps = getLesson6CompletedSteps(portfolio.lesson6)
  const accessibleSteps = isTeacherMode
    ? LESSON6_STEPS.map(step => step.id)
    : LESSON6_STEPS.filter(step => canEnterLesson6Step(portfolio.lesson5, step.id, portfolio.lesson6)).map(step => step.id)
  const lockedSteps = LESSON6_STEPS
    .filter(step => !accessibleSteps.includes(step.id) && !completedSteps.includes(step.id))
    .map(step => step.id)

  return (
    <>
      <div
        className="sticky z-30 bg-background/95 pb-3 pt-1 backdrop-blur supports-[backdrop-filter]:bg-background/90"
        style={{ top: "var(--module4-sticky-stack-height, 6.75rem)" }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">课时6</span>
              <h2 className="text-lg font-semibold">{LESSON6_CONFIG.title}</h2>
            </div>
            <InnerStepProgress
              lessonId={6}
              currentStepId={stepId}
              steps={LESSON6_STEPS.map(step => ({ id: step.id, label: step.title }))}
              completedStepIds={completedSteps}
              accessibleStepIds={accessibleSteps}
              lockedStepIds={lockedSteps}
              markPreviousStepsCompleted={false}
            />
          </div>
        </div>
      </div>
      {children}
    </>
  )
}

export default function Lesson6Routes() {
  const params = useParams<{ "*": string }>()
  const stepId = Number(params["*"]?.replace("step/", "") || "1")

  return (
    <StepContainer stepId={stepId}>
      <Routes>
        <Route index element={<Navigate to="step/1" replace />} />
        <Route path="step/1" element={<Step1PublicationStatus />} />
        <Route path="step/2" element={<Step2PublicChallengeEmbedded />} />
        <Route path="step/3" element={<Step3ReflectionAndSnapshot />} />
        <Route path="*" element={<Navigate to="step/1" replace />} />
      </Routes>
    </StepContainer>
  )
}
