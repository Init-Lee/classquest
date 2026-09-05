/**
 * 文件说明：模块 1 课时 1 第四关受众与主题确认页。
 * 职责：收集受众及其关注点，派生主题大纲，并在五个源字段齐全时完成课时 1。
 * 更新触发：受众字段、主题大纲模板、完成条件或课时收口动作变化时，需要同步更新本文件。
 */

import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import {
  hasMeaningfulModule1Lesson1Fields,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"

export default function Step4AudienceOutline() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  if (!portfolio) return null
  const state = portfolio.lesson1
  const valid = hasMeaningfulModule1Lesson1Fields(state)
  const outline = `围绕“${state.cityIssue || "待填写城市问题"}”，从 2035 年写信给“${state.audience || "待填写受众"}”，回应其对“${state.audienceConcern || "待填写关注点"}”的关切，并体现 ${state.sdg || "待选择 SDG"} 的实践意义。`

  const update = (patch: Partial<typeof state>) => {
    updatePortfolio(current => ({
      ...current,
      lesson1: { ...current.lesson1, ...patch },
    }))
  }

  const complete = async () => {
    if (!valid) return
    const completedAt = new Date().toISOString()
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 2, stepId: 1 },
      lesson1: { ...current.lesson1, step: 4, step4Completed: true, completed: true, completedAt },
    }))
    await flushPortfolio()
    navigate("/module/1")
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>确定故事写给谁</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="space-y-1 text-sm font-medium">
            <span>受众</span>
            <Input value={state.audience} onChange={event => update({ audience: event.target.value })} placeholder="如：妈妈、班主任、社区物业、2025 年的我" />
          </label>
          <label className="space-y-1 text-sm font-medium">
            <span>他们最在意什么？</span>
            <Input value={state.audienceConcern} onChange={event => update({ audienceConcern: event.target.value })} placeholder="如：睡眠质量、成本与安全、使用便利" />
          </label>
          <Button disabled={!valid} onClick={() => void complete()}>确认主题大纲，完成课时 1</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>派生主题大纲</CardTitle></CardHeader>
        <CardContent><p className="whitespace-pre-wrap text-sm leading-relaxed">{outline}</p></CardContent>
      </Card>
    </div>
  )
}
