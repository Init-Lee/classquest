/**
 * 文件说明：模块 1 课时 1 第四关受众与主题确认页。
 * 职责：收集受众及其关注点，派生主题大纲，并在五个源字段齐全时完成课时 1，完成弹窗提供本课阶段快照下载。
 * 更新触发：受众字段、主题大纲模板、完成条件、完成弹窗或课时收口动作变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Textarea } from "@/shared/ui/textarea"
import {
  hasMeaningfulModule1Lesson1Fields,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { Module1LessonSnapshotDownloadButton } from "@/modules/module-1-ai-story/features/global-actions/Module1LessonSnapshotDownloadButton"
import { Lesson1ThemeOutline } from "@/modules/module-1-ai-story/lessons/lesson-1/components/Lesson1ThemeOutline"

export default function Step4AudienceOutline() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const [finished, setFinished] = useState(false)
  if (!portfolio) return null
  const state = portfolio.lesson1
  const valid = hasMeaningfulModule1Lesson1Fields(state)

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
    setFinished(true)
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>确定故事写给谁</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="space-y-1 text-sm font-medium">
            <span>受众</span>
            <Textarea className="min-h-[108px]" value={state.audience} onChange={event => update({ audience: event.target.value })} placeholder="如：妈妈、班主任、社区物业、2025 年的我" />
          </label>
          <label className="space-y-1 text-sm font-medium">
            <span>他们最在意什么？</span>
            <Textarea className="min-h-[108px]" value={state.audienceConcern} onChange={event => update({ audienceConcern: event.target.value })} placeholder="如：睡眠质量、成本与安全、使用便利" />
          </label>
          <Button disabled={!valid} onClick={() => void complete()}>确认主题大纲，完成课时 1</Button>
        </CardContent>
      </Card>
      <Lesson1ThemeOutline state={state} enableCopy />
      <Dialog open={finished} onOpenChange={open => { if (!open) navigate("/module/1") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>课时 1 已完成</DialogTitle>
            <DialogDescription>
              主题设定已经确认。请下载本课阶段快照交作业；换设备继续学习请用右上角「保存进度」。
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">阶段快照是只读 HTML，不能导入恢复进度。</p>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Module1LessonSnapshotDownloadButton
              portfolio={portfolio}
              lessonId={1}
              enabled
            />
            <Button type="button" onClick={() => navigate("/module/1")}>回到模块首页</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
