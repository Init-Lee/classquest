/**
 * 文件说明：课时 1 各关共用的标题、继续按钮和保存等待。
 * 职责：显示关卡标题；进入下一关前先等本机保存完成，失败时留在当前关并保留输入。
 * 更新触发：关卡标题样式、下一关前的保存等待或失败提示变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { useModule2State } from "@/modules/module-2-ai-comic/app/providers/Module2Provider"
import { rememberModule2Lesson1Step } from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import type { Module2Lesson1StepId } from "@/modules/module-2-ai-comic/domains/portfolio/types"

export function Lesson1StepHeader({ step, title, lead }: { step: number; title: string; lead: string }) {
  return (
    <header className="mb-6 max-w-3xl space-y-2">
      <h1 className="text-2xl font-bold">第 {step} 关 · {title}</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">{lead}</p>
    </header>
  )
}

export function Lesson1ContinueButton({
  enabled,
  toStep,
  label,
  hint,
}: {
  enabled: boolean
  toStep: Module2Lesson1StepId
  label: string
  hint?: string
}) {
  const navigate = useNavigate()
  const { updatePortfolio, flushPortfolio } = useModule2State()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const go = async () => {
    if (!enabled || busy) return
    setBusy(true)
    setError("")
    try {
      updatePortfolio(current => rememberModule2Lesson1Step(current, toStep, new Date().toISOString()))
      await flushPortfolio()
      navigate(`/module/2/lesson/1/step/${toStep}`)
    } catch {
      setError("还没有保存成功。你写下的内容还在，请重试后再进入下一关。")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-8 space-y-2">
      {hint && !enabled && <p className="text-sm text-muted-foreground">{hint}</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <Button type="button" onClick={() => void go()} disabled={!enabled || busy}>
        {busy ? "正在保存…" : label}
      </Button>
    </div>
  )
}
