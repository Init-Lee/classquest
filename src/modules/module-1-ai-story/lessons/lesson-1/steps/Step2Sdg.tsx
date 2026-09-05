/**
 * 文件说明：模块 1 课时 1 第二关 SDG 选择页。
 * 职责：让学生从 17 项 SDG 中选择主题并说明与生活、学校或社区的连接。
 * 更新触发：SDG 内容、理由完成条件或第二关交互变化时，需要同步更新本文件。
 */

import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { MODULE1_SDGS } from "@/modules/module-1-ai-story/constants/sdgs"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"

export default function Step2Sdg() {
  const { portfolio, savePortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  if (!portfolio) return null
  const state = portfolio.lesson1

  const update = (patch: Partial<typeof state>) => {
    void savePortfolio({ ...portfolio, lesson1: { ...state, ...patch } })
  }
  const valid = Boolean(state.sdg.trim() && state.sdgWhy.trim())

  const continueNext = async () => {
    if (!valid) return
    await savePortfolio({
      ...portfolio,
      progress: { lessonId: 1, stepId: 3 },
      lesson1: { ...state, step: 3, step2Completed: true },
    })
    navigate("/module/1/lesson/1/step/3")
  }

  return (
    <Card>
      <CardHeader><CardTitle>选择一个 SDG，并说清连接</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <label className="space-y-1 text-sm font-medium">
          <span>SDG（17 选 1）</span>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={state.sdg} onChange={event => update({ sdg: event.target.value })}>
            <option value="">请选择</option>
            {MODULE1_SDGS.map(sdg => <option key={sdg} value={sdg}>{sdg}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          <span>为什么选择它？</span>
          <Textarea value={state.sdgWhy} onChange={event => update({ sdgWhy: event.target.value })} placeholder="用 1—2 句话写出与你的生活、学校或社区的连接。" />
        </label>
        <Button disabled={!valid} onClick={() => void continueNext()}>保存并继续</Button>
      </CardContent>
    </Card>
  )
}
