/**
 * 文件说明：模块 1 课时 2 实时结构化人物设定大纲组件。
 * 职责：在课时 2 展示风格、理由、四格与派生弧光分析；确认关在弧光分析框内提供轻量复制。
 * 更新触发：课时 2 大纲视觉、复制入口、复制文本策略或字段结构变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { Check, ClipboardCopy } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import type { Module1Lesson2State } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  buildModule1Lesson2CharacterOutline,
  resolveModule1Lesson2CopyPayload,
} from "@/modules/module-1-ai-story/lessons/lesson-2/utils/build-lesson2-character-outline"

async function copyTextWithFallback(text: string): Promise<void> {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("当前浏览器未开放剪贴板接口")
    await navigator.clipboard.writeText(text)
    return
  } catch (clipboardError) {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.setAttribute("readonly", "")
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    try {
      if (!document.execCommand("copy")) throw clipboardError
    } finally {
      textarea.remove()
    }
  }
}

interface Lesson2CharacterOutlineProps {
  state: Module1Lesson2State
  enableCopy?: boolean
}

export function Lesson2CharacterOutline({ state, enableCopy = false }: Lesson2CharacterOutlineProps) {
  const outline = buildModule1Lesson2CharacterOutline(state)
  const copyPayload = resolveModule1Lesson2CopyPayload(outline)
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle")

  const copyOutline = async () => {
    setCopyStatus("idle")
    try {
      await copyTextWithFallback(copyPayload.text)
      setCopyStatus("success")
    } catch (error) {
      console.error("[module1 lesson2 outline] copy failed", error)
      setCopyStatus("error")
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg">📋 故事人物设定大纲</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-relaxed">
        <section>
          <p className="font-semibold">【{outline.title}】</p>
        </section>
        <section>
          <p><span aria-hidden="true">🎭 </span><strong>写作风格：</strong>{outline.styleName}</p>
          <p className="pl-6"><strong>选择理由：</strong>{outline.styleWhy}</p>
          <p className="pl-6"><strong>{outline.styleDetailsLabel}：</strong>{outline.styleHint}</p>
          {outline.styleExamples.length > 0 && (
            <div className="pl-6">
              <p><strong>示例开头：</strong></p>
              {outline.styleExamples.map(example => (
                <p key={example}>• {example}</p>
              ))}
            </div>
          )}
        </section>
        <section>
          <p><span aria-hidden="true">📝 </span><strong>人物弧光：</strong></p>
          <p className="pl-6"><strong>我是谁：</strong>{outline.protagonistIdentity}</p>
          <p className="pl-6"><strong>我想要：</strong>{outline.goal}</p>
          <p className="pl-6"><strong>我卡在：</strong>{outline.obstacle}</p>
          <p className="pl-6"><strong>我改变：</strong>{outline.changeAction}</p>
        </section>
        <section className="space-y-2 rounded-lg bg-primary/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">
              <span aria-hidden="true">💡 </span>
              弧光分析
            </p>
            {enableCopy && (
              <Button
                size="sm"
                type="button"
                variant="outline"
                disabled={!copyPayload.enabled}
                onClick={() => void copyOutline()}
                className="h-7 shrink-0 gap-1 px-2 text-xs text-muted-foreground"
              >
                {copyStatus === "success" ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                {copyStatus === "success" ? "已复制" : "复制大纲"}
              </Button>
            )}
          </div>
          <p>{outline.arcAnalysis}</p>
          {enableCopy && !copyPayload.enabled && (
            <p className="text-xs text-muted-foreground">风格、理由和人物四格填写完整后即可复制大纲，方便交给外部 AI。</p>
          )}
          {copyStatus === "error" && (
            <p role="alert" className="text-xs text-destructive">复制失败，请检查浏览器剪贴板权限后重试。</p>
          )}
        </section>
      </CardContent>
    </Card>
  )
}
