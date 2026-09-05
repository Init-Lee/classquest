/**
 * 文件说明：模块 1 课时 1 实时结构化故事主题大纲组件。
 * 职责：在 Step 2—4 统一展示完整字段结构，并在最终结构完整时复制可直接交给外部 AI 的大纲文本。
 * 更新触发：课时 1 大纲视觉、复制反馈、字段结构或响应式布局变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { Check, ClipboardCopy } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import type { Module1Lesson1State } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  buildModule1Lesson1ThemeOutline,
  formatModule1Lesson1ThemeOutline,
} from "@/modules/module-1-ai-story/lessons/lesson-1/utils/build-lesson1-theme-outline"

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

interface Lesson1ThemeOutlineProps {
  state: Module1Lesson1State
  enableCopy?: boolean
}

export function Lesson1ThemeOutline({ state, enableCopy = false }: Lesson1ThemeOutlineProps) {
  const outline = buildModule1Lesson1ThemeOutline(state)
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle")

  const copyOutline = async () => {
    setCopyStatus("idle")
    try {
      await copyTextWithFallback(formatModule1Lesson1ThemeOutline(outline))
      setCopyStatus("success")
    } catch (error) {
      console.error("[module1 lesson1 outline] copy failed", error)
      setCopyStatus("error")
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg">📋 当前页面大纲</CardTitle>
        {enableCopy && (
          <Button
            size="sm"
            type="button"
            disabled={!outline.complete}
            onClick={() => void copyOutline()}
            className="self-start gap-1.5"
          >
            {copyStatus === "success" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
            {copyStatus === "success" ? "已复制完整大纲" : "复制完整大纲"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-relaxed">
        <section>
          <p className="font-semibold">【{outline.title}】</p>
        </section>
        <section>
          <p><span aria-hidden="true">📋 </span><strong>SDG 主题：</strong>{outline.sdgTheme}</p>
          <p className="pl-6"><strong>选择理由：</strong>{outline.selectionReason}</p>
        </section>
        <section>
          <p><span aria-hidden="true">🏙️ </span><strong>城市问题：</strong>{outline.cityIssue}</p>
        </section>
        <section>
          <p><span aria-hidden="true">👥 </span><strong>受众分析：</strong></p>
          <p className="pl-6"><strong>写给：</strong>{outline.audience}</p>
          <p className="pl-6"><strong>关注点：</strong>{outline.audienceConcern}</p>
        </section>
        <section className="rounded-lg bg-primary/5 p-3">
          <p><span aria-hidden="true">💡 </span><strong>主题核心：</strong>{outline.themeCore}</p>
        </section>
        {enableCopy && !outline.complete && (
          <p className="text-xs text-muted-foreground">五项内容填写完整后即可复制完整大纲。</p>
        )}
        {copyStatus === "error" && (
          <p role="alert" className="text-sm text-destructive">复制失败，请检查浏览器剪贴板权限后重试。</p>
        )}
      </CardContent>
    </Card>
  )
}
