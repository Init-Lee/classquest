/**
 * 文件说明：模块 1 课时 2 第一关风格理解页。
 * 职责：说明风格选择的教学意图，展示 8 张预设卡供查阅，并可新窗口打开同主题不同风格支架资料。
 * 更新触发：第一关文案、预设卡预览、支架资料入口或完成动作变化时，需要同步更新本文件。
 */

import { ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import {
  MODULE1_STYLE_CARDS,
  MODULE1_STYLE_WRITING_TEMPLATES_HREF,
} from "@/modules/module-1-ai-story/constants/story-options"

export default function Step1UnderstandStyle() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  if (!portfolio) return null

  const confirm = async () => {
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 2, stepId: 2 },
      lesson2: { ...current.lesson2, step: 2, step1Completed: true },
    }))
    await flushPortfolio()
    navigate("/module/1/lesson/2/step/2")
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2 space-y-0">
          <CardTitle className="min-w-0 basis-full leading-snug sm:basis-auto sm:flex-1">先看懂风格，再决定怎么写</CardTitle>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="ml-auto h-8 shrink-0 gap-1.5 border-emerald-300 bg-emerald-50 text-xs text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100 hover:text-emerald-900"
          >
            <a
              href={MODULE1_STYLE_WRITING_TEMPLATES_HREF}
              target="_blank"
              rel="noopener noreferrer"
              title="课堂支架资料，会在新窗口打开，不影响本页填写"
              aria-label="查看同主题不同风格写作模板（新窗口打开）"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              查看风格写作模板
            </a>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <p>风格 = 语气与节奏：开头直给｜第一人称｜人物极致化｜每屏有冲突｜少写环境多写人。</p>
          <p className="text-muted-foreground">
            同一城市问题，用纪实、科幻或倡议写出来，读者感受到的力度会不一样。下面 8 张预设卡来自课程支架，下一关再正式选择或自定义。
          </p>
          <Button onClick={() => void confirm()}>我已查看预设风格，继续选择</Button>
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {MODULE1_STYLE_CARDS.map(card => (
          <Card key={card.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs leading-relaxed">
              <p className="text-muted-foreground">适配 SDG：{card.sdg.join("、")}</p>
              <p>{card.hint}</p>
              <p className="text-muted-foreground">① {card.examples[0]}</p>
              <p className="text-muted-foreground">② {card.examples[1]}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
