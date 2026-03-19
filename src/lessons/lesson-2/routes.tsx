/**
 * 文件说明：课时2路由入口
 * 职责：处理课时2的 URL 分发，渲染对应步骤组件，包含 Guard 检查
 * 更新触发：课时2新增或删除步骤时
 */

import { useEffect } from "react"
import { Routes, Route, useParams, useNavigate } from "react-router-dom"
import { usePortfolio } from "@/app/providers/AppProvider"
import { LESSON2_CONFIG } from "./config"
import { checkLesson2Guard, getLesson2CompletedSteps } from "./guards"
import { InnerStepProgress } from "@/features/progress-ui/InnerStepProgress"
import Step1Resume from "./steps/Step1Resume"
import Step2Sync from "./steps/Step2Sync"
import Step3MyTasks from "./steps/Step3MyTasks"
import Step4Evidence from "./steps/Step4Evidence"
import Step5Quality from "./steps/Step5Quality"
import Step6Review from "./steps/Step6Review"

function StepContainer({ stepId, children }: { stepId: number; children: React.ReactNode }) {
  const { portfolio } = usePortfolio()
  const navigate = useNavigate()
  const guard = checkLesson2Guard(stepId, portfolio)
  const completedSteps = getLesson2CompletedSteps(portfolio)

  useEffect(() => {
    if (!guard.allowed) {
      navigate("/lesson/2/step/1", { replace: true })
    }
  }, [guard.allowed, navigate])

  if (!guard.allowed) return null

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">课时2</span>
          <h2 className="text-lg font-semibold">{LESSON2_CONFIG.title}</h2>
        </div>
        <InnerStepProgress
          lessonId={2}
          currentStepId={stepId}
          steps={LESSON2_CONFIG.steps}
          completedStepIds={completedSteps}
        />
      </div>
      <div>{children}</div>
    </div>
  )
}

export default function Lesson2Routes() {
  const params = useParams<{ "*": string }>()
  const stepId = parseInt(params["*"]?.replace("step/", "") || "1")

  return (
    <StepContainer stepId={stepId}>
      <Routes>
        <Route path="step/1" element={<Step1Resume />} />
        <Route path="step/2" element={<Step2Sync />} />
        <Route path="step/3" element={<Step3MyTasks />} />
        <Route path="step/4" element={<Step4Evidence />} />
        <Route path="step/5" element={<Step5Quality />} />
        <Route path="step/6" element={<Step6Review />} />
        <Route path="*" element={<Step1Resume />} />
      </Routes>
    </StepContainer>
  )
}
