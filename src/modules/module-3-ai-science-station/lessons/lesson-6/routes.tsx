/**
 * 文件说明：课时6路由入口
 * 职责：处理课时6的 URL 分发，渲染对应步骤组件，包含 Guard 检查
 * 更新触发：课时6新增或删除步骤时；步骤组件路径变更时
 */

import { useEffect } from "react"
import { Routes, Route, useParams, useNavigate } from "react-router-dom"
import { usePortfolio } from "@/modules/module-3-ai-science-station/app/providers/AppProvider"
import { LESSON6_CONFIG } from "./config"
import { checkLesson6Guard, getLesson6CompletedSteps } from "./guards"
import { InnerStepProgress } from "@/modules/module-3-ai-science-station/features/progress-ui/InnerStepProgress"
import Step1ExampleAnalysis from "./steps/Step1ExampleAnalysis"
import Step2RoadshowPath from "./steps/Step2RoadshowPath"

function StepContainer({ stepId, children }: { stepId: number; children: React.ReactNode }) {
  const { portfolio, isTeacherMode } = usePortfolio()
  const navigate = useNavigate()
  const guard = checkLesson6Guard(stepId, portfolio)
  const completedSteps = getLesson6CompletedSteps(portfolio)

  useEffect(() => {
    if (!guard.allowed && !isTeacherMode) {
      if (!portfolio) return
      navigate("/module/3/lesson/6/step/1", { replace: true })
    }
  }, [guard.allowed, isTeacherMode, navigate, portfolio])

  if (!guard.allowed && !isTeacherMode) return null

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full font-medium">课时6</span>
          <h2 className="text-lg font-semibold">{LESSON6_CONFIG.title}</h2>
        </div>
        <InnerStepProgress
          lessonId={6}
          currentStepId={stepId}
          steps={LESSON6_CONFIG.steps}
          completedStepIds={completedSteps}
        />
      </div>
      <div>{children}</div>
    </div>
  )
}

export default function Lesson6Routes() {
  const params = useParams<{ "*": string }>()
  const stepId = parseInt(params["*"]?.replace("step/", "") || "1")

  return (
    <StepContainer stepId={stepId}>
      <Routes>
        <Route path="step/1" element={<Step1ExampleAnalysis />} />
        <Route path="step/2" element={<Step2RoadshowPath />} />
        <Route path="*" element={<Step1ExampleAnalysis />} />
      </Routes>
    </StepContainer>
  )
}
