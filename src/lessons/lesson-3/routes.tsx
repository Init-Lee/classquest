/**
 * 文件说明：课时3路由入口
 * 职责：处理课时3的 URL 分发，渲染对应步骤组件，包含 Guard 检查
 * 更新触发：课时3新增或删除步骤时；步骤组件路径变更时
 */

import { useEffect } from "react"
import { Routes, Route, useParams, useNavigate } from "react-router-dom"
import { usePortfolio } from "@/app/providers/AppProvider"
import { LESSON3_CONFIG } from "./config"
import { checkLesson3Guard, getLesson3CompletedSteps } from "./guards"
import { InnerStepProgress } from "@/features/progress-ui/InnerStepProgress"
import Step1InheritAnchor from "./steps/Step1InheritAnchor"
import Step2Toolbox from "./steps/Step2Toolbox"
import Step3SelectMaterials from "./steps/Step3SelectMaterials"
import Step4EvidenceWorkshop from "./steps/Step4EvidenceWorkshop"
import Step5PreviewExport from "./steps/Step5PreviewExport"

function StepContainer({ stepId, children }: { stepId: number; children: React.ReactNode }) {
  const { portfolio, isTeacherMode } = usePortfolio()
  const navigate = useNavigate()
  const guard = checkLesson3Guard(stepId, portfolio)
  const completedSteps = getLesson3CompletedSteps(portfolio)

  useEffect(() => {
    if (!guard.allowed && !isTeacherMode) {
      if (!portfolio) return
      navigate("/lesson/3/step/1", { replace: true })
    }
  }, [guard.allowed, isTeacherMode, navigate, portfolio])

  if (!guard.allowed && !isTeacherMode) return null

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">课时3</span>
          <h2 className="text-lg font-semibold">{LESSON3_CONFIG.title}</h2>
        </div>
        <InnerStepProgress
          lessonId={3}
          currentStepId={stepId}
          steps={LESSON3_CONFIG.steps}
          completedStepIds={completedSteps}
        />
      </div>
      <div>{children}</div>
    </div>
  )
}

export default function Lesson3Routes() {
  const params = useParams<{ "*": string }>()
  const stepId = parseInt(params["*"]?.replace("step/", "") || "1")

  return (
    <StepContainer stepId={stepId}>
      <Routes>
        <Route path="step/1" element={<Step1InheritAnchor />} />
        <Route path="step/2" element={<Step2Toolbox />} />
        <Route path="step/3" element={<Step3SelectMaterials />} />
        <Route path="step/4" element={<Step4EvidenceWorkshop />} />
        <Route path="step/5" element={<Step5PreviewExport />} />
        <Route path="*" element={<Step1InheritAnchor />} />
      </Routes>
    </StepContainer>
  )
}
