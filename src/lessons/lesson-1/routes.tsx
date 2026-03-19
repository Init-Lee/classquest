/**
 * 文件说明：课时1路由入口
 * 职责：处理课时1的 URL 分发，渲染对应的步骤组件
 *       包含步骤进度条和 Guard 检查的统一封装
 * 更新触发：课时1新增或删除步骤时
 */

import { useEffect } from "react"
import { Routes, Route, useParams, useNavigate } from "react-router-dom"
import { usePortfolio } from "@/app/providers/AppProvider"
import { LESSON1_CONFIG } from "./config"
import { checkLesson1Guard, getLesson1CompletedSteps } from "./guards"
import { InnerStepProgress } from "@/features/progress-ui/InnerStepProgress"
import Step1Intro from "./steps/Step1Intro"
import Step2Profile from "./steps/Step2Profile"
import Step3R1 from "./steps/Step3R1"
import Step4Discussion from "./steps/Step4Discussion"
import Step5Checklist from "./steps/Step5Checklist"
import Step6Review from "./steps/Step6Review"

/** 步骤容器：统一处理 Guard、进度条、步骤渲染 */
function StepContainer({ stepId, children }: { stepId: number; children: React.ReactNode }) {
  const { portfolio } = usePortfolio()
  const navigate = useNavigate()
  const guard = checkLesson1Guard(stepId, portfolio)
  const completedSteps = getLesson1CompletedSteps(portfolio)

  useEffect(() => {
    if (!guard.allowed) {
      // Guard 不通过，重定向到第1步
      navigate("/lesson/1/step/1", { replace: true })
    }
  }, [guard.allowed, navigate])

  if (!guard.allowed) return null

  return (
    <div className="space-y-4">
      {/* 课时标题 + 步骤进度条 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">课时1</span>
          <h2 className="text-lg font-semibold">{LESSON1_CONFIG.title}</h2>
        </div>
        <InnerStepProgress
          lessonId={1}
          currentStepId={stepId}
          steps={LESSON1_CONFIG.steps}
          completedStepIds={completedSteps}
        />
      </div>
      <div>{children}</div>
    </div>
  )
}

export default function Lesson1Routes() {
  const params = useParams<{ "*": string }>()
  const stepId = parseInt(params["*"]?.replace("step/", "") || "1")

  return (
    <StepContainer stepId={stepId}>
      <Routes>
        <Route path="step/1" element={<Step1Intro />} />
        <Route path="step/2" element={<Step2Profile />} />
        <Route path="step/3" element={<Step3R1 />} />
        <Route path="step/4" element={<Step4Discussion />} />
        <Route path="step/5" element={<Step5Checklist />} />
        <Route path="step/6" element={<Step6Review />} />
        <Route path="*" element={<Step1Intro />} />
      </Routes>
    </StepContainer>
  )
}
