/**
 * 文件说明：模块 1 课时 2 第四关人物四格与弧光确认页。
 * 职责：收集我是谁/想要/卡在/改变四格，派生人物弧光大纲，并在字段齐全时完成课时 2。
 * 更新触发：人物四格字段、大纲复制、完成条件或课时收口动作变化时，需要同步更新本文件。
 */

import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { hasMeaningfulModule1Lesson2Fields } from "@/modules/module-1-ai-story/domains/portfolio/types"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { Lesson2CharacterOutline } from "@/modules/module-1-ai-story/lessons/lesson-2/components/Lesson2CharacterOutline"

export default function Step4CharacterArc() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  if (!portfolio) return null
  const state = portfolio.lesson2
  const valid = hasMeaningfulModule1Lesson2Fields(state)

  const update = (patch: Partial<typeof state>) => {
    updatePortfolio(current => ({
      ...current,
      lesson2: { ...current.lesson2, ...patch },
    }))
  }

  const complete = async () => {
    if (!valid) return
    const completedAt = new Date().toISOString()
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 3, stepId: 1 },
      lesson2: { ...current.lesson2, step: 4, step4Completed: true, completed: true, completedAt },
    }))
    await flushPortfolio()
    navigate("/module/1")
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>完成人物四格</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">
              <span>我是谁</span>
              <Textarea className="min-h-[108px]" value={state.protagonistIdentity} onChange={event => update({ protagonistIdentity: event.target.value })} placeholder="身份＋与问题的关系；例：七年级生，光学社成员，给妈妈写信" />
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>我卡在（主要障碍）</span>
              <Textarea className="min-h-[108px]" value={state.obstacle} onChange={event => update({ obstacle: event.target.value })} placeholder="例：物业称没有人投诉；设备不接收市民反馈；同学嫌麻烦" />
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>我想要（可观察目标）</span>
              <Textarea className="min-h-[108px]" value={state.goal} onChange={event => update({ goal: event.target.value })} placeholder="例：把 22:00 后卧室照度控制在 ≤ 5lx" />
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>我改变（行动）＋证据锚点</span>
              <Textarea className="min-h-[108px]" value={state.changeAction} onChange={event => update({ changeAction: event.target.value })} placeholder="例：三晚测光并画图；对接市民反馈入口；问卷统计贴公示" />
            </label>
          </div>
          <Button disabled={!valid} onClick={() => void complete()}>确认人物弧光，完成课时 2</Button>
        </CardContent>
      </Card>
      <Lesson2CharacterOutline state={state} enableCopy />
    </div>
  )
}
