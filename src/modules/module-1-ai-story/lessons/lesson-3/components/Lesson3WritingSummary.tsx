/**
 * 文件说明：模块 1 课时 3 右侧只读写作设定。
 * 职责：按内容包顺序展示已确认设定、开场和本段写法，并提供前两课完整设定回看。
 * 更新触发：右栏字段、完整设定展开范围或占位文案变化时，需要同步更新本文件。
 */

import { useState } from "react"
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
import type {
  Module1Lesson1State,
  Module1Lesson2State,
  Module1Lesson3State,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON3_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson3-copy"
import { buildModule1Lesson2WritingSummary } from "@/modules/module-1-ai-story/lessons/lesson-2/utils/build-lesson2-writing-summary"
import { buildModule1Lesson3WritingSummary } from "@/modules/module-1-ai-story/lessons/lesson-3/utils/build-lesson3-writing-summary"

interface Lesson3WritingSummaryProps {
  lesson1: Module1Lesson1State
  lesson2: Module1Lesson2State
  lesson3: Module1Lesson3State
}

export function Lesson3WritingSummary({
  lesson1,
  lesson2,
  lesson3,
}: Lesson3WritingSummaryProps) {
  const summary = buildModule1Lesson3WritingSummary(lesson1, lesson2, lesson3)
  const full = buildModule1Lesson2WritingSummary(lesson1, lesson2)
  const [open, setOpen] = useState(false)

  return (
    <Card className="h-fit lg:sticky lg:top-[calc(var(--module1-sticky-stack-height,4rem)+var(--module1-lesson-chrome-height,5rem)+0.75rem)]">
      <CardHeader>
        <CardTitle className="text-lg">{summary.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed">
        <p className="text-muted-foreground">{summary.intro}</p>
        <p>城市问题：{summary.cityIssue}</p>
        <p>写给谁及关切：{summary.audience} / {summary.audienceConcern}</p>
        <p className="whitespace-pre-wrap">课时 2 确认的写法：{summary.writingPlan}</p>
        <p className="whitespace-pre-wrap">选择理由：{summary.reason}</p>
        <section className="space-y-1 rounded-lg bg-primary/5 p-3">
          <p className="font-semibold">人物五项</p>
          <p>我是谁：{summary.who}</p>
          <p>我想要：{summary.want}</p>
          <p>我卡在：{summary.blocked}</p>
          <p>准备先尝试的行动：{summary.firstAction}</p>
          <p>可能发生的变化：{summary.possibleChange}</p>
        </section>
        <p>当前开场：{summary.openingPlan}</p>
        <p className="whitespace-pre-wrap">本段写法：{summary.focusTechnique}</p>
        <p className="text-xs text-muted-foreground">故事年份：{summary.year}（{MODULE1_LESSON3_SHARED_COPY.yearNote}）</p>
        {summary.reviewNeeded && (
          <p className="text-xs text-amber-800">{MODULE1_LESSON3_SHARED_COPY.upstreamChanged}</p>
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          {MODULE1_LESSON3_SHARED_COPY.fullSetting}
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{MODULE1_LESSON3_SHARED_COPY.fullSetting}</DialogTitle>
              <DialogDescription>文学作品全文、示例开头和 AI 长回复不会送进后续写作提示词。</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto text-sm">
              <p>故事年份：{full.year}</p>
              <p>SDG主题：{full.sdg}</p>
              <p>选择理由：{full.sdgWhy}</p>
              <p>城市问题：{full.cityIssue}</p>
              <p>写给谁：{full.audience}</p>
              <p>对方关心的事：{full.audienceConcern}</p>
              <p>作品：{full.workTitle} / {full.author}</p>
              <p>片段位置：{full.location}</p>
              <p className="whitespace-pre-wrap">阅读出处：{full.sourceNote}</p>
              <p className="whitespace-pre-wrap">已确认写法：{full.writingPlan}</p>
              <p className="whitespace-pre-wrap">选择理由：{full.reason}</p>
              <p>我是谁：{full.who}</p>
              <p>我想要：{full.want}</p>
              <p>我卡在：{full.blocked}</p>
              <p>准备先尝试的行动：{full.firstAction}</p>
              <p>可能发生的变化：{full.possibleChange}</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>关闭</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
