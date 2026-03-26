/**
 * 文件说明：课时2路由入口
 * 职责：处理课时2的 URL 分发，渲染对应步骤组件，包含 Guard 检查
 * 更新触发：课时2新增或删除步骤时
 * 注：原 Step1Resume + Step2Sync 已合并为 Step1Combined；共5关
 */

import { useEffect } from "react"
import { Routes, Route, useParams, useNavigate } from "react-router-dom"
import { usePortfolio } from "@/app/providers/AppProvider"
import { LESSON2_CONFIG } from "./config"
import { checkLesson2Guard, getLesson2CompletedSteps } from "./guards"
import { InnerStepProgress } from "@/features/progress-ui/InnerStepProgress"
import Step1Combined from "./steps/Step1Combined"
import Step2MyTasks from "./steps/Step2MyTasks"
import Step3Evidence from "./steps/Step3Evidence"
import Step4Quality from "./steps/Step4Quality"
import Step5Review from "./steps/Step5Review"

function StepContainer({ stepId, children }: { stepId: number; children: React.ReactNode }) {
  const { portfolio, isTeacherMode } = usePortfolio()
  const navigate = useNavigate()
  const guard = checkLesson2Guard(stepId, portfolio)
  const completedSteps = getLesson2CompletedSteps(portfolio)

  useEffect(() => {
    if (!guard.allowed && !isTeacherMode) {
      if (!portfolio) return
      navigate("/lesson/2/step/1", { replace: true })
    }
  }, [guard.allowed, isTeacherMode, navigate, portfolio])

  if (!guard.allowed && !isTeacherMode) return null

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
        <Route path="step/1" element={<Step1Combined />} />
        <Route path="step/2" element={<Step2MyTasks />} />
        <Route path="step/3" element={<Step3Evidence />} />
        <Route path="step/4" element={<Step4Quality />} />
        <Route path="step/5" element={<Step5Review />} />
        <Route path="*" element={<Step1Combined />} />
      </Routes>
    </StepContainer>
  )
}
