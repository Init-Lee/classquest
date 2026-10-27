/**
 * 文件说明：课时 1 各关共用的标题、继续按钮和保存等待。
 * 职责：显示关卡标题；进入下一关前先等本机保存完成，失败时留在当前关并保留输入。某一关可以在这次保存前先写入确认。第 1 关可选择占满课时内容区，其他关标题仍保持较窄宽度。
 * 更新触发：关卡标题样式、第 1 关宽度，或下一关前的确认写入、保存等待、失败提示变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { useModule2State } from "@/modules/module-2-ai-comic/app/providers/Module2Provider"
import { rememberModule2Lesson1Step } from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import type { Module2Lesson1StepId, Module2PortfolioV1 } from "@/modules/module-2-ai-comic/domains/portfolio/types"

export function Lesson1StepHeader({
  step,
  title,
  lead,
  wide = false,
}: {
  step: number
  title: string
  lead: string
  /** 为真时标题随课时内容区拉满；默认仍限制宽度，避免改到其他关。 */
  wide?: boolean
}) {
  return (
    <header className={`mb-6 space-y-2 ${wide ? "w-full max-w-none" : "max-w-3xl"}`}>
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
  prepare,
}: {
  enabled: boolean
  toStep: Module2Lesson1StepId
  label: string
  hint?: string
  /** 跳转前的额外写入。返回非空 error 时留在当前关，不保存这次确认，也不进入下一关。 */
  prepare?: (current: Module2PortfolioV1, now: string) => { portfolio: Module2PortfolioV1; error: string }
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
      const now = new Date().toISOString()
      if (prepare) {
        let failure = ""
        updatePortfolio((current) => {
          const prepared = prepare(current, now)
          if (prepared.error) {
            failure = prepared.error
            return current
          }
          return rememberModule2Lesson1Step(prepared.portfolio, toStep, now)
        })
        if (failure) {
          setError(failure)
          return
        }
      } else {
        updatePortfolio(current => rememberModule2Lesson1Step(current, toStep, now))
      }
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
