/**
 * 文件说明：模块 1 课时 1 路由入口。
 * 职责：分发四个主题关卡、执行真实 Step Guard，并在无档案或越级时安全恢复。
 * 更新触发：课时 1 路径、关卡组件、门禁或进度展示变化时，需要同步更新本文件。
 */

import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { MODULE1_LESSON1_CONFIG, MODULE1_LESSON1_STEPS } from "@/modules/module-1-ai-story/lessons/lesson-1/config"
import {
  canEnterModule1Lesson1Step,
  getCurrentModule1Lesson1Step,
  getModule1Lesson1GuardReason,
  isModule1Lesson1StepComplete,
} from "@/modules/module-1-ai-story/lessons/lesson-1/guards"
import Step1Mission from "./steps/Step1Mission"
import Step2Sdg from "./steps/Step2Sdg"
import Step3CityIssue from "./steps/Step3CityIssue"
import Step4AudienceOutline from "./steps/Step4AudienceOutline"

function Lesson1Frame({ children }: { children: React.ReactNode }) {
  const { portfolio, loading } = useModule1Portfolio()
  const params = useParams<{ "*": string }>()
  const navigate = useNavigate()
  const stepId = Number(params["*"]?.replace("step/", "") || "1")

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">正在准备学习档案...</div>
  if (!portfolio) return <Navigate to="/module/1" replace />
  if (!canEnterModule1Lesson1Step(portfolio.lesson1, stepId)) {
    const current = getCurrentModule1Lesson1Step(portfolio.lesson1)
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Card>
          <CardHeader><CardTitle>这一关还没有解锁</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{getModule1Lesson1GuardReason(stepId)}</p>
            <Button onClick={() => navigate(`/module/1/lesson/1/step/${current}`)}>回到当前关卡</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6">
      <div>
        <p className="text-xs font-medium text-primary">课时 1 · {MODULE1_LESSON1_CONFIG.title}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {MODULE1_LESSON1_STEPS.map(step => (
            <span key={step.id} className={`rounded-full px-3 py-1 text-xs ${step.id === stepId ? "bg-primary text-primary-foreground" : isModule1Lesson1StepComplete(portfolio.lesson1, step.id) ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
              {step.id}. {step.title}
            </span>
          ))}
        </div>
      </div>
      {children}
    </div>
  )
}

export default function Module1Lesson1Routes() {
  return (
    <Lesson1Frame>
      <Routes>
        <Route index element={<Navigate to="step/1" replace />} />
        <Route path="step/1" element={<Step1Mission />} />
        <Route path="step/2" element={<Step2Sdg />} />
        <Route path="step/3" element={<Step3CityIssue />} />
        <Route path="step/4" element={<Step4AudienceOutline />} />
        <Route path="*" element={<Navigate to="step/1" replace />} />
      </Routes>
    </Lesson1Frame>
  )
}
