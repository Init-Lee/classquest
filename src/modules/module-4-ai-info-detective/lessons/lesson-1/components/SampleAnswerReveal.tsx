/**
 * 文件说明：模块 4 课时 1 第 2 关作答反馈组件。
 * 职责：在样例卡提交判断后展示学生选择、参考判断、即时反馈和解析，来源核验入口由题卡壳的独立区域承接。
 * 更新触发：Step 2 答案反馈文案结构、解析展示层级或来源核验提示样式变化时，需要同步更新本文件。
 */

import type { Step2OptionKey, Step2SampleCard } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/types"
import { cn } from "@/shared/utils/cn"

interface SampleAnswerRevealProps {
  card: Step2SampleCard
  selectedOptionKey: Step2OptionKey
}

export function SampleAnswerReveal({ card, selectedOptionKey }: SampleAnswerRevealProps) {
  const selected = card.options.find(option => option.key === selectedOptionKey)
  const correct = card.options.find(option => option.key === card.correctOptionKey)
  const isCorrect = selectedOptionKey === card.correctOptionKey

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded-2xl border p-4 text-sm",
          isCorrect ? "border-green-200 bg-green-50 text-green-900" : "border-amber-200 bg-amber-50 text-amber-950",
        )}
      >
        <p><strong>你的选择：</strong>{selected ? `${selected.key}. ${selected.label}` : selectedOptionKey}</p>
        <p className="mt-1"><strong>参考判断：</strong>{correct ? `${correct.key}. ${correct.label}` : card.correctOptionKey}</p>
        <p className="mt-3 leading-relaxed">{isCorrect ? card.correctFeedback : card.incorrectFeedback}</p>
      </div>
      <div className="rounded-2xl border bg-background/90 p-4">
        <h3 className="font-semibold">解析</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.explanation}</p>
      </div>
    </div>
  )
}
