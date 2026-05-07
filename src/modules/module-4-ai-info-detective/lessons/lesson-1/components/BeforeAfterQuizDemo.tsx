/**
 * 文件说明：答题前 / 答题后流程模拟组件。
 * 职责：让学生先独立作答，再看到解析与来源核验入口，理解网页题库的展示逻辑。
 * 更新触发：默认判断选项、答题后展示规则或 Step 4 完成条件变化时，需要同步更新本文件。
 */

import { useState } from "react"
import type { FinalSampleCardData } from "@/modules/module-4-ai-info-detective/domains/question-card/types"
import { Button } from "@/shared/ui/button"
import { Textarea } from "@/shared/ui/textarea"
import { FinalSampleCard } from "./FinalSampleCard"

interface BeforeAfterQuizDemoProps {
  sample: FinalSampleCardData
  initialReflection?: string
  onCompleted: (answerKey: string, reflection: string) => void
}

export function BeforeAfterQuizDemo({ sample, initialReflection = "", onCompleted }: BeforeAfterQuizDemoProps) {
  const [answerKey, setAnswerKey] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [reflection, setReflection] = useState(initialReflection)

  const canComplete = submitted && reflection.trim().length > 0

  return (
    <div className="space-y-4">
      <FinalSampleCard sample={sample} mode={submitted ? "full" : "before"} />
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold">请先完成一次模拟作答</h3>
        <div className="grid gap-2">
          {sample.options.map(option => (
            <label key={option.key} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <input
                type="radio"
                name="module4-quiz-demo"
                value={option.key}
                checked={answerKey === option.key}
                onChange={() => setAnswerKey(option.key)}
                disabled={submitted}
              />
              <span>{option.key}. {option.label}</span>
            </label>
          ))}
        </div>
        <Button type="button" onClick={() => setSubmitted(true)} disabled={!answerKey || submitted}>
          提交模拟答案
        </Button>
      </div>
      {submitted && (
        <div className="rounded-lg border p-4 space-y-3">
          <label className="text-sm font-medium" htmlFor="before-after-reason">
            为什么解析和来源核验要在答题后再显示？
          </label>
          <Textarea
            id="before-after-reason"
            value={reflection}
            onChange={event => setReflection(event.target.value)}
            placeholder="写一句你的理解，例如：先独立判断，再对照证据复盘。"
          />
          <Button type="button" onClick={() => onCompleted(answerKey, reflection)} disabled={!canComplete}>
            完成网页试答体验
          </Button>
        </div>
      )}
    </div>
  )
}
