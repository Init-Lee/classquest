/**
 * 文件说明：模块 1 课时 2 第三关风格理由页。
 * 职责：只读引用课时 1 的受众与城市问题，让学生说明所选风格为何适合。
 * 更新触发：理由字段、课时 1 引用展示或第三关完成条件变化时，需要同步更新本文件。
 */

import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { StyleSummary } from "@/modules/module-1-ai-story/features/style-selector/StyleSummary"
import { Lesson2CharacterOutline } from "@/modules/module-1-ai-story/lessons/lesson-2/components/Lesson2CharacterOutline"

export default function Step3StyleWhy() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  if (!portfolio) return null
  const state = portfolio.lesson2
  const valid = state.styleWhy.trim().length > 0

  const continueNext = async () => {
    if (!valid) return
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 2, stepId: 4 },
      lesson2: { ...current.lesson2, step: 4, step3Completed: true },
    }))
    await flushPortfolio()
    navigate("/module/1/lesson/2/step/4")
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>为什么选这个风格？</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <StyleSummary state={state} />
          <div className="grid gap-3 rounded-lg bg-muted/40 p-3 text-sm sm:grid-cols-2">
            <p><span className="text-muted-foreground">城市问题：</span>{portfolio.lesson1.cityIssue || "（课时 1 未填写）"}</p>
            <p><span className="text-muted-foreground">受众：</span>{portfolio.lesson1.audience || "（课时 1 未填写）"}</p>
          </div>
          <label className="space-y-1 text-sm font-medium">
            <span>结合受众与城市问题，写 1–2 句</span>
            <Textarea
              className="min-h-[120px]"
              value={state.styleWhy}
              onChange={event => updatePortfolio(current => ({
                ...current,
                lesson2: { ...current.lesson2, styleWhy: event.target.value },
              }))}
              placeholder="例：写给值班家长，用纪实风格更能用现场计数说服；问题与放学通行直接相关。"
            />
          </label>
          <Button disabled={!valid} onClick={() => void continueNext()}>保存并继续</Button>
        </CardContent>
      </Card>
      <Lesson2CharacterOutline state={state} />
    </div>
  )
}
