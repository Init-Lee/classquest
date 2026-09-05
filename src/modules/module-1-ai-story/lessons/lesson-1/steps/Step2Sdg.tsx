/**
 * 文件说明：模块 1 课时 1 第二关 SDG 选择页。
 * 职责：让学生从 17 项 SDG 中选择主题并说明与生活、学校或社区的连接。
 * 更新触发：SDG 内容、支架资料入口位置或淡绿色样式、理由完成条件或第二关交互变化时，需要同步更新本文件。
 * 入口约定：资料按钮放在卡片标题行右侧（桌面同行、窄屏折到标题下方右侧），浅绿底 + emerald 字/边，不是本页主 CTA。
 */

import { ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { MODULE1_SDG_INTRO_HREF, MODULE1_SDGS } from "@/modules/module-1-ai-story/constants/sdgs"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { Lesson1ThemeOutline } from "@/modules/module-1-ai-story/lessons/lesson-1/components/Lesson1ThemeOutline"

export default function Step2Sdg() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  if (!portfolio) return null
  const state = portfolio.lesson1

  const update = (patch: Partial<typeof state>) => {
    updatePortfolio(current => ({
      ...current,
      lesson1: { ...current.lesson1, ...patch },
    }))
  }
  const valid = Boolean(state.sdg.trim() && state.sdgWhy.trim())

  const continueNext = async () => {
    if (!valid) return
    updatePortfolio(current => ({
      ...current,
      progress: { lessonId: 1, stepId: 3 },
      lesson1: { ...current.lesson1, step: 3, step2Completed: true },
    }))
    await flushPortfolio()
    navigate("/module/1/lesson/1/step/3")
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2 space-y-0">
          <CardTitle className="min-w-0 basis-full leading-snug sm:basis-auto sm:flex-1">选择一个 SDG，并说清连接</CardTitle>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="ml-auto h-8 shrink-0 gap-1.5 border-emerald-300 bg-emerald-50 text-xs text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100 hover:text-emerald-900"
          >
            <a
              href={MODULE1_SDG_INTRO_HREF}
              target="_blank"
              rel="noopener noreferrer"
              title="课堂支架资料，会在新窗口打开，不影响本页填写"
              aria-label="查看 SDG 介绍资料（新窗口打开）"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              查看 SDG 介绍资料
            </a>
          </Button>
        </CardHeader>
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
            <Textarea className="min-h-[120px]" value={state.sdgWhy} onChange={event => update({ sdgWhy: event.target.value })} placeholder="用 1—2 句话写出与你的生活、学校或社区的连接。" />
          </label>
          <Button disabled={!valid} onClick={() => void continueNext()}>保存并继续</Button>
        </CardContent>
      </Card>
      <Lesson1ThemeOutline state={state} />
    </div>
  )
}
