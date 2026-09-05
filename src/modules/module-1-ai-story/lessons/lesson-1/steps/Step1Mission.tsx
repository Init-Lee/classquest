/**
 * 文件说明：模块 1 课时 1 第一关任务页。
 * 职责：介绍 2035 未来城市写作任务，并在学生确认后保存解锁状态。
 * 更新触发：课时 1 任务语境、第一关完成动作或下一关路径变化时，需要同步更新本文件。
 */

import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"

export default function Step1Mission() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  if (!portfolio) return null

  const confirm = async () => {
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 1, stepId: 2 },
      lesson1: { ...current.lesson1, step: 2, step1Completed: true },
    }))
    await flushPortfolio()
    navigate("/module/1/lesson/1/step/2")
  }

  return (
    <Card>
      <CardHeader><CardTitle>从 2035 年寄回一封未来来信</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm leading-relaxed">
        <p>你将从熟悉的城市生活出发，选择一个可持续发展目标，聚焦一个具体问题，再决定故事要写给谁。</p>
        <p>本课先完成故事主题。后续课时会逐步设计人物，并写出“起—承—转—合”的未来城市微小说。</p>
        <Button onClick={() => void confirm()}>我已了解任务，继续</Button>
      </CardContent>
    </Card>
  )
}
