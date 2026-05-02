/**
 * 文件说明：最终样例题目卡展示组件。
 * 职责：展示新闻类或图片类题目卡的四部分结构，并区分答题前可见内容与答题后展开内容。
 * 更新触发：样例题卡展示规则、四部分结构或 Step 2 确认交互变化时，需要同步更新本文件。
 */

import type { CardPartKey, FinalSampleCardData, ImageMaterial, NewsMaterial } from "@/modules/module-4-ai-info-detective/domains/question-card/types"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"

interface FinalSampleCardProps {
  sample: FinalSampleCardData
  mode?: "full" | "before" | "after"
  confirmedParts?: CardPartKey[]
  onPartConfirmed?: (partKey: CardPartKey) => void
}

function isNewsMaterial(material: NewsMaterial | ImageMaterial): material is NewsMaterial {
  return "title" in material
}

function PartAction({
  partKey,
  confirmedParts,
  onPartConfirmed,
}: {
  partKey: CardPartKey
  confirmedParts: CardPartKey[]
  onPartConfirmed?: (partKey: CardPartKey) => void
}) {
  if (!onPartConfirmed) return null
  const confirmed = confirmedParts.includes(partKey)
  return (
    <Button type="button" variant={confirmed ? "secondary" : "outline"} size="sm" onClick={() => onPartConfirmed(partKey)}>
      {confirmed ? "已确认" : "确认看到"}
    </Button>
  )
}

export function FinalSampleCard({ sample, mode = "full", confirmedParts = [], onPartConfirmed }: FinalSampleCardProps) {
  const showBefore = mode === "full" || mode === "before"
  const showAfter = mode === "full" || mode === "after"

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{sample.title}</CardTitle>
            <CardDescription>{sample.cardType === "news" ? "新闻类题目卡" : "图片类题目卡"}</CardDescription>
          </div>
          <Badge variant="secondary">{mode === "before" ? "答题前" : mode === "after" ? "答题后" : "完整样例"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showBefore && (
          <>
            <section className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">① 素材展示</h3>
                <PartAction partKey="material" confirmedParts={confirmedParts} onPartConfirmed={onPartConfirmed} />
              </div>
              {isNewsMaterial(sample.material) ? (
                <div className="space-y-2">
                  <h4 className="font-medium">{sample.material.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{sample.material.body}</p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                  {sample.material.imagePlaceholder}
                  <div className="mt-2 text-xs">{sample.material.alt}</div>
                </div>
              )}
            </section>
            <section className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">② 判断任务</h3>
                <PartAction partKey="task" confirmedParts={confirmedParts} onPartConfirmed={onPartConfirmed} />
              </div>
              <p className="text-sm">{sample.task}</p>
              <div className="grid gap-2">
                {sample.options.map(option => (
                  <div key={option.key} className="rounded-md border px-3 py-2 text-sm">
                    {option.key}. {option.label}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {showAfter && (
          <>
            <section className="rounded-lg border p-4 space-y-3 bg-green-50/50">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">③ 解析</h3>
                <PartAction partKey="explanation" confirmedParts={confirmedParts} onPartConfirmed={onPartConfirmed} />
              </div>
              <p className="text-sm leading-relaxed">{sample.explanation}</p>
            </section>
            <section className="rounded-lg border p-4 space-y-3 bg-green-50/50">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">④ 来源与核验入口</h3>
                <PartAction partKey="source" confirmedParts={confirmedParts} onPartConfirmed={onPartConfirmed} />
              </div>
              <p className="text-sm">来源说明：{sample.source.note}</p>
              <p className="text-sm text-muted-foreground">核验入口：{sample.source.verification}</p>
            </section>
          </>
        )}
      </CardContent>
    </Card>
  )
}
