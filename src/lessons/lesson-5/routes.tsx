/**
 * 文件说明：课时5路由入口
 * 职责：处理课时5的 URL 分发，渲染对应步骤组件，包含 Guard 检查
 * 更新触发：课时5新增或删除步骤时；步骤组件路径变更时
 */

import { useEffect } from "react"
import { Routes, Route, useParams, useNavigate } from "react-router-dom"
import { usePortfolio } from "@/app/providers/AppProvider"
import { LESSON5_CONFIG } from "./config"
import { checkLesson5Guard, getLesson5CompletedSteps } from "./guards"
import { InnerStepProgress } from "@/features/progress-ui/InnerStepProgress"
import Step1PeerFeedback from "./steps/Step1PeerFeedback"
import Step2VersionChange from "./steps/Step2VersionChange"

function StepContainer({ stepId, children }: { stepId: number; children: React.ReactNode }) {
  const { portfolio, isTeacherMode } = usePortfolio()
  const navigate = useNavigate()
  const guard = checkLesson5Guard(stepId, portfolio)
  const completedSteps = getLesson5CompletedSteps(portfolio)

  useEffect(() => {
    if (!guard.allowed && !isTeacherMode) {
      if (!portfolio) return
      navigate("/lesson/5/step/1", { replace: true })
    }
  }, [guard.allowed, isTeacherMode, navigate, portfolio])

  if (!guard.allowed && !isTeacherMode) return null

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">课时5</span>
          <h2 className="text-lg font-semibold">{LESSON5_CONFIG.title}</h2>
        </div>
        <InnerStepProgress
          lessonId={5}
          currentStepId={stepId}
          steps={LESSON5_CONFIG.steps}
          completedStepIds={completedSteps}
        />
      </div>
      <div>{children}</div>
    </div>
  )
}

export default function Lesson5Routes() {
  const params = useParams<{ "*": string }>()
  const stepId = parseInt(params["*"]?.replace("step/", "") || "1")

  return (
    <StepContainer stepId={stepId}>
      <Routes>
        <Route path="step/1" element={<Step1PeerFeedback />} />
        <Route path="step/2" element={<Step2VersionChange />} />
        <Route path="*" element={<Step1PeerFeedback />} />
      </Routes>
    </StepContainer>
  )
}
