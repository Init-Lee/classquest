/**
 * 文件说明：模块 4 占位首页。
 * 职责：在架构重构阶段提供稳定的模块 4 入口，不实现任何实质课程内容。
 * 更新触发：模块 4 课时分支开始开发真实首页、课程入口或 mock 流程时，需要替换本文件。
 */

import { Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"

const LESSON_OUTLINE = [
  "框架发布与终版样例分析",
  "素材收集与合规筛查",
  "题卡创作与解释撰写",
  "同伴评审与终稿优化",
  "网页试答与反馈优化",
  "题库发布与可信反思",
]

export default function Module4HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center space-y-3 py-6">
        <Badge variant="secondary" className="gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          架构占位
        </Badge>
        <h1 className="text-3xl font-bold">AI 信息侦探</h1>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          模块 4 的课程内容将在后续逐课时分支中独立开发。当前页面仅用于确认平台路由和模块边界。
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>计划中的 6 个课时</CardTitle>
          <CardDescription>本轮架构重构不实现这些课时，只保留开发边界。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {LESSON_OUTLINE.map((title, index) => (
              <div key={title} className="rounded-lg border border-dashed p-3 text-sm">
                <span className="text-muted-foreground">课时 {index + 1}</span>
                <div className="font-medium mt-1">{title}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
