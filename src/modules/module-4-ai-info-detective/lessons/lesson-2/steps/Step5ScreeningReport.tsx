/**
 * 文件说明：模块 4 课时 2 第 5 关页面。
 * 职责：汇总新闻与图片素材体检结果，生成 QuickCheck 自动记录，并完成课时 2。
 * 更新触发：报告字段、最终确认文案、QuickCheck 生成时机或课时完成跳转规则变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { Lesson2StepLayout } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/components/Lesson2StepLayout"
import { MaterialReportCard } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/components/MaterialReportCard"
import { evaluateLesson2QuickCheck, isLesson2ReadyForReport } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/utils/evaluate-lesson2-quickcheck"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

const FINAL_CONFIRMATION = "我已完成新闻和图片素材的合规初筛，并知道本课只做素材初筛，下一课再继续加工成题目卡。"

export default function Step5ScreeningReport() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({})
  if (!portfolio) return null

  const lesson2 = portfolio.lesson2
  const ready = isLesson2ReadyForReport(lesson2)
  const allConfirmed = confirmed[FINAL_CONFIRMATION] === true

  const complete = () => {
    if (!ready || !allConfirmed) return
    const now = new Date().toISOString()
    const nextLesson2 = {
      ...lesson2,
      quickCheck: evaluateLesson2QuickCheck(lesson2),
      step5Completed: true,
      completed: true,
      completedAt: now,
    }
    void savePortfolio({
      ...portfolio,
      progress: { lessonId: 3, stepId: 1 },
      lesson2: nextLesson2,
    })
    navigate("/module/4?lesson2=completed")
  }

  return (
    <Lesson2StepLayout
      title="第5关 · 我的素材体检报告"
      subtitle="汇总两份素材，确认进入下一课"
      footer={<Button onClick={complete} disabled={!ready || !allConfirmed}>完成课时2</Button>}
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <MaterialReportCard title="新闻素材体检卡" record={lesson2.news} />
        <MaterialReportCard title="图片素材体检卡" record={lesson2.image} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">最终确认</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
            绿色表示这份素材已完成进入下一课所需的基础准备，不代表它已经是最终优秀题目。
          </p>
          <label className="flex items-start gap-3 rounded-2xl border p-4 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={confirmed[FINAL_CONFIRMATION] === true}
              onChange={event => setConfirmed(current => ({ ...current, [FINAL_CONFIRMATION]: event.target.checked }))}
            />
            <span>{FINAL_CONFIRMATION}</span>
          </label>
        </CardContent>
      </Card>
    </Lesson2StepLayout>
  )
}
