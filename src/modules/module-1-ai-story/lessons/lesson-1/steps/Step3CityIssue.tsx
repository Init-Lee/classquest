/**
 * 文件说明：模块 1 课时 1 第三关城市问题页。
 * 职责：引导学生把 SDG 收窄为一个具体、可观察的城市生活问题。
 * 更新触发：城市问题支架、完成条件或第三关导航变化时，需要同步更新本文件。
 */

import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { Lesson1ThemeOutline } from "@/modules/module-1-ai-story/lessons/lesson-1/components/Lesson1ThemeOutline"

export default function Step3CityIssue() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  if (!portfolio) return null
  const state = portfolio.lesson1
  const valid = state.cityIssue.trim().length > 0

  const continueNext = async () => {
    if (!valid) return
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 1, stepId: 4 },
      lesson1: { ...current.lesson1, step: 4, step3Completed: true },
    }))
    await flushPortfolio()
    navigate("/module/1/lesson/1/step/4")
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>聚焦一个具体城市问题</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">越具体越好，最好能观察或测量。例如：校园食堂浪费、夜间小区照度过高、老楼缺少无障碍扶手。</p>
          <Textarea
            className="min-h-[120px]"
            value={state.cityIssue}
            onChange={event => updatePortfolio(current => ({
              ...current,
              lesson1: { ...current.lesson1, cityIssue: event.target.value },
            }))}
            placeholder="用一句完整的话写下具体问题"
          />
          <Button disabled={!valid} onClick={() => void continueNext()}>保存并继续</Button>
        </CardContent>
      </Card>
      <Lesson1ThemeOutline state={state} />
    </div>
  )
}
