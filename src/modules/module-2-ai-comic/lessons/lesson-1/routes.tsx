/**
 * 文件说明：模块 2 课时 1 路由入口。
 * 职责：首次进入时按需建立本机空草稿档案，分发四个关卡、渲染 sticky 四关进度、执行真实关卡门禁，并在越级、无效地址或本机档案读取失败时安全处理。
 * 更新触发：课时 1 路径、关卡组件、门禁、教师讲解放行或进度展示变化时，需要同步更新本文件。
 */

import { useEffect, useLayoutEffect, useRef } from "react"
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { useModule2State } from "@/modules/module-2-ai-comic/app/providers/Module2Provider"
import { MODULE2_LESSON1_CONFIG, MODULE2_LESSON1_STEPS } from "@/modules/module-2-ai-comic/lessons/lesson-1/config"
import {
  canEnterModule2Lesson1Step,
  getModule2Lesson1GuardReason,
  getModule2Lesson1RouteRedirect,
  isModule2Lesson1StepComplete,
  isValidModule2Lesson1Step,
  MODULE2_LESSON1_ENTRY_PATH,
} from "@/modules/module-2-ai-comic/lessons/lesson-1/guards"
import { Module2InnerStepProgress } from "@/modules/module-2-ai-comic/features/progress-ui/InnerStepProgress"
import Step1ImportNovel from "./steps/Step1ImportNovel"
import Step2ReadSample from "./steps/Step2ReadSample"
import Step3PickScenes from "./steps/Step3PickScenes"
import Step4VisualDirection from "./steps/Step4VisualDirection"

function Lesson1Frame({ children }: { children: React.ReactNode }) {
  const { portfolio, loading, loadError, isTeacherMode, ensureStudentPortfolio } = useModule2State()
  const params = useParams<{ "*": string }>()
  const navigate = useNavigate()
  const lessonChromeRef = useRef<HTMLDivElement>(null)
  const stepId = Number(params["*"]?.replace("step/", "") || "1")
  const frameReady = !loading && portfolio !== null

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [stepId])

  useLayoutEffect(() => {
    const element = lessonChromeRef.current
    if (!frameReady || !element) return
    const update = () => {
      document.documentElement.style.setProperty("--module2-lesson-chrome-height", `${element.offsetHeight}px`)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty("--module2-lesson-chrome-height")
    }
  }, [frameReady, stepId])

  // 首次进入课时 1 时在本机建立空草稿（身份允许全空），身份在第 1 关核对
  useEffect(() => {
    if (!isTeacherMode && !loading && !loadError && !portfolio) void ensureStudentPortfolio()
  }, [ensureStudentPortfolio, isTeacherMode, loadError, loading, portfolio])

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Card>
          <CardHeader><CardTitle>暂时无法继续</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" onClick={() => navigate("/module/2")}>返回模块首页</Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  if (loading || !portfolio) return <div className="py-20 text-center text-sm text-muted-foreground">正在准备学习档案...</div>
  if (!isValidModule2Lesson1Step(stepId)) return <Navigate to={MODULE2_LESSON1_ENTRY_PATH} replace />
  if (!canEnterModule2Lesson1Step(portfolio, stepId, isTeacherMode)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Card>
          <CardHeader><CardTitle>这一关还没有解锁</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{getModule2Lesson1GuardReason(stepId)}</p>
            <Button onClick={() => navigate(getModule2Lesson1RouteRedirect(portfolio, stepId, isTeacherMode) ?? MODULE2_LESSON1_ENTRY_PATH)}>
              回到当前关卡
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedStepIds = MODULE2_LESSON1_STEPS
    .filter(step => isModule2Lesson1StepComplete(portfolio, step.id))
    .map(step => step.id)
  const accessibleStepIds = MODULE2_LESSON1_STEPS
    .filter(step => canEnterModule2Lesson1Step(portfolio, step.id, isTeacherMode))
    .map(step => step.id)

  return (
    <>
      <div
        ref={lessonChromeRef}
        className="sticky z-30 border-b bg-background/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/90"
        style={{ top: "var(--module2-sticky-stack-height, 4rem)" }}
      >
        <div className="mx-auto max-w-7xl space-y-1 px-4">
          <p className="text-xs font-medium text-primary">课时 1 · {MODULE2_LESSON1_CONFIG.title}</p>
          <Module2InnerStepProgress
            steps={MODULE2_LESSON1_STEPS.map(step => ({ id: step.id, label: step.title }))}
            currentStepId={stepId}
            completedStepIds={completedStepIds}
            accessibleStepIds={accessibleStepIds}
            onStepClick={targetStep => navigate(`/module/2/lesson/1/step/${targetStep}`)}
          />
        </div>
      </div>
      <div
        className="mx-auto w-full max-w-7xl px-4 py-6"
        style={{ minHeight: "calc(100dvh - var(--module2-sticky-stack-height, 4rem) - var(--module2-lesson-chrome-height, 5rem))" }}
      >
        {children}
      </div>
    </>
  )
}

export default function Module2Lesson1Routes() {
  return (
    <Lesson1Frame>
      <Routes>
        <Route index element={<Navigate to="step/1" replace />} />
        <Route path="step/1" element={<Step1ImportNovel />} />
        <Route path="step/2" element={<Step2ReadSample />} />
        <Route path="step/3" element={<Step3PickScenes />} />
        <Route path="step/4" element={<Step4VisualDirection />} />
        <Route path="*" element={<Navigate to="step/1" replace />} />
      </Routes>
    </Lesson1Frame>
  )
}
