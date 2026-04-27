/**
 * 文件说明：课时4路由入口
 * 职责：处理课时4的 URL 分发，渲染对应步骤组件，包含 Guard 检查
 * 更新触发：课时4新增或删除步骤时；步骤组件路径变更时
 */

import { useEffect } from "react"
import { Routes, Route, useParams, useNavigate } from "react-router-dom"
import { usePortfolio } from "@/modules/module-3-ai-science-station/app/providers/AppProvider"
import { LESSON4_CONFIG } from "./config"
import { checkLesson4Guard, getLesson4CompletedSteps } from "./guards"
import { InnerStepProgress } from "@/modules/module-3-ai-science-station/features/progress-ui/InnerStepProgress"
import Step1GroupMerge from "./steps/Step1GroupMerge"
import Step2PersonalDraft from "./steps/Step2PersonalDraft"
import Step3PlanRecord from "./steps/Step3PlanRecord"
import Step4CollabBuild from "./steps/Step4CollabBuild"
import Step5UpgradeVerify from "./steps/Step5UpgradeVerify"

function StepContainer({ stepId, children }: { stepId: number; children: React.ReactNode }) {
  const { portfolio, isTeacherMode } = usePortfolio()
  const navigate = useNavigate()
  const guard = checkLesson4Guard(stepId, portfolio)
  const completedSteps = getLesson4CompletedSteps(portfolio)

  useEffect(() => {
    if (!guard.allowed && !isTeacherMode) {
      if (!portfolio) return
      navigate("/module/3/lesson/4/step/1", { replace: true })
    }
  }, [guard.allowed, isTeacherMode, navigate, portfolio])

  if (!guard.allowed && !isTeacherMode) return null

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">课时4</span>
          <h2 className="text-lg font-semibold">{LESSON4_CONFIG.title}</h2>
        </div>
        <InnerStepProgress
          lessonId={4}
          currentStepId={stepId}
          steps={LESSON4_CONFIG.steps}
          completedStepIds={completedSteps}
        />
      </div>
      <div>{children}</div>
    </div>
  )
}

export default function Lesson4Routes() {
  const params = useParams<{ "*": string }>()
  const stepId = parseInt(params["*"]?.replace("step/", "") || "1")

  return (
    <StepContainer stepId={stepId}>
      <Routes>
        <Route path="step/1" element={<Step1GroupMerge />} />
        <Route path="step/2" element={<Step2PersonalDraft />} />
        <Route path="step/3" element={<Step3PlanRecord />} />
        <Route path="step/4" element={<Step4CollabBuild />} />
        <Route path="step/5" element={<Step5UpgradeVerify />} />
        <Route path="*" element={<Step1GroupMerge />} />
      </Routes>
    </StepContainer>
  )
}
