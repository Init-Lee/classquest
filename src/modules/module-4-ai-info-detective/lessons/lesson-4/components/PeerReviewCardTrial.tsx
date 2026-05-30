/**
 * 文件说明：模块 4 课时 4 同伴题卡试答组件。
 * 职责：以审查者视角展示单张 V1 题卡的素材、任务选项、解析和来源，并记录试答选项。
 * 更新触发：课时 3 题卡展示字段、试答交互或互审前置体验规则变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson3OptionKey,
  Module4Lesson3QuestionCardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

function toLesson3OptionKey(value: string): Module4Lesson3OptionKey | null {
  return value === "A" || value === "B" || value === "C" || value === "D" || value === "E" || value === "F" ? value : null
}

export function PeerReviewCardTrial({
  card,
  selectedOptionKey,
  onSelect,
}: {
  card: Module4Lesson3QuestionCardDraft
  selectedOptionKey?: Module4Lesson3OptionKey
  onSelect: (key: Module4Lesson3OptionKey) => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{card.kind === "news" ? "新闻题卡试答" : "图片题卡试答"}</CardTitle>
          <Badge variant={selectedOptionKey ? "success" : "secondary"}>{selectedOptionKey ? "已试答" : "待试答"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">{card.material.titleOrName || "未命名素材"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{card.material.displayNote || "暂无素材说明。"}</p>
        </div>
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-sm font-medium">{card.task.prompt}</p>
          <div className="mt-3 grid gap-2">
            {card.task.options.map(option => (
              <Button
                key={option.key}
                variant={selectedOptionKey === option.key ? "default" : "outline"}
                className="justify-start whitespace-normal text-left"
                onClick={() => {
                  const optionKey = toLesson3OptionKey(option.key)
                  if (optionKey) onSelect(optionKey)
                }}
              >
                {option.key}. {option.label}
              </Button>
            ))}
          </div>
        </div>
        {selectedOptionKey && (
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="font-medium">作者解析</p>
              <p className="mt-1 text-muted-foreground">{card.explanation.text || "作者还没有填写解析。"}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-medium">来源与核验</p>
              <p className="mt-1 text-muted-foreground">{card.source.sourceRecord || "暂无来源记录。"}</p>
              <p className="mt-2 text-xs text-muted-foreground">{card.source.verificationNote || "暂无核验说明。"}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
