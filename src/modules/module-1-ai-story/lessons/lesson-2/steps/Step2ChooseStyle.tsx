/**
 * 文件说明：模块 1 课时 2 第二关风格选择页。
 * 职责：打开预设/自定义风格选择器，把确认结果写入档案，并展示当前风格摘要。
 * 更新触发：风格选择交互、摘要展示或第二关完成条件变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { hasSelectedModule1Lesson2Style } from "@/modules/module-1-ai-story/domains/portfolio/types"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { StyleSelectorDialog } from "@/modules/module-1-ai-story/features/style-selector/StyleSelectorDialog"
import { StyleSummary } from "@/modules/module-1-ai-story/features/style-selector/StyleSummary"
import { Lesson2CharacterOutline } from "@/modules/module-1-ai-story/lessons/lesson-2/components/Lesson2CharacterOutline"

export default function Step2ChooseStyle() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  if (!portfolio) return null
  const state = portfolio.lesson2
  const valid = hasSelectedModule1Lesson2Style(state)

  const continueNext = async () => {
    if (!valid) return
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 2, stepId: 3 },
      lesson2: { ...current.lesson2, step: 3, step2Completed: true },
    }))
    await flushPortfolio()
    navigate("/module/1/lesson/2/step/3")
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>选择一个写作风格</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            可以从 8 张预设卡里选一张，也可以自己定义风格。自定义时，风格抽取器只帮你生成提示词，需要复制到常用的 AI 工具后再把结果填回来。
          </p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">当前选择的风格</p>
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>选择风格</Button>
          </div>
          <StyleSummary state={state} />
          <Button disabled={!valid} onClick={() => void continueNext()}>保存并继续</Button>
        </CardContent>
      </Card>
      <Lesson2CharacterOutline state={state} />
      <StyleSelectorDialog
        open={open}
        onOpenChange={setOpen}
        state={state}
        onConfirm={patch => {
          updatePortfolio(current => ({
            ...current,
            lesson2: { ...current.lesson2, ...patch },
          }))
        }}
      />
    </div>
  )
}
