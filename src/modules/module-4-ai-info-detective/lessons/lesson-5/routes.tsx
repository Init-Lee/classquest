/**
 * 文件说明：模块 4 课时 5 路由入口。
 * 职责：处理 `/module/4/lesson/5/*` 子路由、执行 ready 包 Guard，并统一渲染课时标题与步骤进度条。
 * 更新触发：课时 5 路径、步骤数量、课内进度条布局、Guard 或后续步骤开放策略变化时，需要同步更新本文件。
 */

import { type ReactNode } from "react"
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { InnerStepProgress } from "@/modules/module-4-ai-info-detective/features/progress-ui/InnerStepProgress"
import { LESSON5_CONFIG, LESSON5_STEPS } from "./config"
import { canEnterLesson5Step, getLesson5CompletedSteps, getLesson5GuardReason } from "./guards"
import { LockedLesson5Step } from "./components/Lesson5StepLayout"
import Step1SubmitV2AndConnect from "./steps/Step1SubmitV2AndConnect"
import Step2TrialAndRating from "./steps/Step2TrialAndRating"
import Step3MyItemReport from "./steps/Step3MyItemReport"
import Step4V3RevisionAndSnapshot from "./steps/Step4V3RevisionAndSnapshot"

function StepContainer({ stepId, children }: { stepId: number; children: ReactNode }) {
  const { portfolio, loading, isTeacherMode } = useModule4Portfolio()
  const navigate = useNavigate()

  if (loading) return <div className="py-16 text-center text-sm text-muted-foreground">正在准备模块四学习档案...</div>
  if (!portfolio && !isTeacherMode) return <Navigate to="/module/4" replace />
  if (!portfolio) return null

  // 本地 npm run dev 调 UI 时跳过 Guard，避免被课时 4 就绪包 / 课堂 phase 挡住
  const bypassGuard = isTeacherMode || import.meta.env.DEV
  const allowed = bypassGuard || canEnterLesson5Step(portfolio.lesson4, stepId, portfolio.lesson5)
  if (!allowed) {
    return (
      <LockedLesson5Step
        reason={getLesson5GuardReason()}
        onReturn={() => navigate("/module/4/lesson/4/step/4")}
      />
    )
  }

  const completedSteps = bypassGuard ? [] : getLesson5CompletedSteps(portfolio.lesson5)
  const accessibleSteps = bypassGuard
    ? LESSON5_STEPS.map(step => step.id)
    : LESSON5_STEPS.filter(step => canEnterLesson5Step(portfolio.lesson4, step.id, portfolio.lesson5)).map(step => step.id)

  return (
    <>
      <div
        className="sticky z-30 bg-background/95 pb-3 pt-1 backdrop-blur supports-[backdrop-filter]:bg-background/90"
        style={{ top: "var(--module4-sticky-stack-height, 6.75rem)" }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">课时5</span>
              <h2 className="text-lg font-semibold">{LESSON5_CONFIG.title}</h2>
            </div>
            <InnerStepProgress
              lessonId={5}
              currentStepId={stepId}
              steps={LESSON5_STEPS.map(step => ({ id: step.id, label: step.title }))}
              completedStepIds={completedSteps}
              accessibleStepIds={accessibleSteps}
              markPreviousStepsCompleted={!bypassGuard}
            />
          </div>
        </div>
      </div>
      {children}
    </>
  )
}

export default function Lesson5Routes() {
  const params = useParams<{ "*": string }>()
  const stepId = Number(params["*"]?.replace("step/", "") || "1")

  return (
    <StepContainer stepId={stepId}>
      <Routes>
        <Route index element={<Navigate to="step/1" replace />} />
        <Route path="step/1" element={<Step1SubmitV2AndConnect />} />
        <Route path="step/2" element={<Step2TrialAndRating />} />
        <Route path="step/3" element={<Step3MyItemReport />} />
        <Route path="step/4" element={<Step4V3RevisionAndSnapshot />} />
        <Route path="*" element={<Navigate to="step/1" replace />} />
      </Routes>
    </StepContainer>
  )
}
