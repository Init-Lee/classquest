/**
 * 文件说明：模块 1 课时 2 右侧写作设定汇总。
 * 职责：只展示已确认字段，未填显示「尚未填写」，确认关可复制第 7 节汇总文本；课组标题与交替底色走共用分组壳。
 * 更新触发：汇总视觉、复制入口、待复核提示或字段结构变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { Check, ClipboardCopy } from "lucide-react"
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
import type { Module1Lesson1State, Module1Lesson2State } from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON2_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson2-copy"
import { copyModule1Lesson2Text } from "@/modules/module-1-ai-story/features/lesson2-support/copy-text"
import {
  Module1WritingSummaryBlock,
  Module1WritingSummaryGroup,
} from "@/modules/module-1-ai-story/features/writing-drawer/Module1WritingSummaryGroup"
import {
  buildModule1Lesson2WritingSummary,
  resolveModule1Lesson2CopyPayload,
} from "@/modules/module-1-ai-story/lessons/lesson-2/utils/build-lesson2-writing-summary"

interface Lesson2WritingSummaryProps {
  lesson1: Module1Lesson1State
  lesson2: Module1Lesson2State
  enableCopy?: boolean
}

export function Lesson2WritingSummary({
  lesson1,
  lesson2,
  enableCopy = false,
}: Lesson2WritingSummaryProps) {
  const summary = buildModule1Lesson2WritingSummary(lesson1, lesson2)
  const copyPayload = resolveModule1Lesson2CopyPayload(summary)
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle")
  const [fallbackText, setFallbackText] = useState("")

  const copySummary = async () => {
    setCopyStatus("idle")
    try {
      await copyModule1Lesson2Text(copyPayload.text)
      setCopyStatus("success")
    } catch {
      setFallbackText(copyPayload.text)
      setCopyStatus("error")
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg">{summary.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-relaxed">
        <p className="text-muted-foreground">{summary.intro}</p>
        <Module1WritingSummaryGroup lesson="lesson1">
          <Module1WritingSummaryBlock title="SDG 主题">
            <p>故事年份：{summary.year}</p>
            <p>SDG主题：{summary.sdg}</p>
            <p>选择理由：{summary.sdgWhy}</p>
          </Module1WritingSummaryBlock>
          <Module1WritingSummaryBlock title="城市问题">
            <p>城市问题：{summary.cityIssue}</p>
          </Module1WritingSummaryBlock>
          <Module1WritingSummaryBlock title="写给谁">
            <p>我写给谁：{summary.audience}</p>
            <p>对方关心的事：{summary.audienceConcern}</p>
          </Module1WritingSummaryBlock>
        </Module1WritingSummaryGroup>
        <Module1WritingSummaryGroup lesson="lesson2">
          <Module1WritingSummaryBlock title="文学参照">
            <p>作品：{summary.workTitle}</p>
            <p>作者：{summary.author}</p>
            <p>片段位置：{summary.location}</p>
            <p>版本说明：{summary.versionNote}</p>
            <p className="whitespace-pre-wrap">阅读出处：{summary.sourceNote}</p>
          </Module1WritingSummaryBlock>
          <Module1WritingSummaryBlock title="我准备采用的写法">
            <p className="whitespace-pre-wrap">{summary.writingPlan}</p>
          </Module1WritingSummaryBlock>
          <Module1WritingSummaryBlock title="我的选择理由">
            <p className="whitespace-pre-wrap">{summary.reason}</p>
          </Module1WritingSummaryBlock>
          <Module1WritingSummaryBlock
            title="人物四格"
            extra={enableCopy ? (
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => void copySummary()}
                className="h-7 shrink-0 gap-1 px-2 text-xs text-muted-foreground"
              >
                {copyStatus === "success" ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                {copyStatus === "success" ? MODULE1_LESSON2_SHARED_COPY.copied : "复制已确认的写作设定"}
              </Button>
            ) : undefined}
          >
            <p>我是谁：{summary.who}</p>
            <p>我想要：{summary.want}</p>
            <p>我卡在：{summary.blocked}</p>
            <p>准备先尝试的行动：{summary.firstAction}</p>
            <p>可能发生的变化：{summary.possibleChange}</p>
            <p className="text-xs text-muted-foreground">人物变化是目前的设想，后续写作时可以调整。</p>
          </Module1WritingSummaryBlock>
        </Module1WritingSummaryGroup>
        {summary.reviewNeeded && (
          <p className="text-xs text-amber-800">{MODULE1_LESSON2_SHARED_COPY.upstreamChanged}</p>
        )}
        <Dialog open={Boolean(fallbackText)} onOpenChange={open => { if (!open) setFallbackText("") }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>复制文本</DialogTitle>
              <DialogDescription>{MODULE1_LESSON2_SHARED_COPY.copyFailed}</DialogDescription>
            </DialogHeader>
            <Textarea className="min-h-[240px] font-mono text-xs" readOnly value={fallbackText} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFallbackText("")}>关闭</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
