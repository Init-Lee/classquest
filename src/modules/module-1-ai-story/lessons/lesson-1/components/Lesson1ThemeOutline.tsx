/**
 * 文件说明：模块 1 课时 1 实时结构化故事主题大纲组件。
 * 职责：在 Step 2—4 统一展示完整字段结构，并在 Step 4 于主题核心框内复制可交给外部 AI 的主题核心句子。
 * 更新触发：课时 1 大纲视觉、复制入口位置、复制文本策略、字段结构或响应式布局变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { Check, ClipboardCopy } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import type { Module1Lesson1State } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  buildModule1Lesson1ThemeOutline,
  resolveModule1Lesson1CopyPayload,
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
  const copyPayload = resolveModule1Lesson1CopyPayload(outline)
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle")

  const copyThemeCore = async () => {
    setCopyStatus("idle")
    try {
      await copyTextWithFallback(copyPayload.text)
      setCopyStatus("success")
    } catch (error) {
      console.error("[module1 lesson1 outline] copy failed", error)
      setCopyStatus("error")
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg">📋 当前页面大纲</CardTitle>
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
        <section className="space-y-2 rounded-lg bg-primary/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">
              <span aria-hidden="true">💡 </span>
              主题核心
            </p>
            {enableCopy && (
              <Button
                size="sm"
                type="button"
                variant="outline"
                disabled={!copyPayload.enabled}
                onClick={() => void copyThemeCore()}
                className="h-7 shrink-0 gap-1 px-2 text-xs text-muted-foreground"
              >
                {copyStatus === "success" ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                {copyStatus === "success" ? "已复制" : "复制主题核心"}
              </Button>
            )}
          </div>
          <p>{outline.themeCore}</p>
          {enableCopy && !copyPayload.enabled && (
            <p className="text-xs text-muted-foreground">五项内容填写完整后即可复制主题核心，方便交给外部 AI。</p>
          )}
          {copyStatus === "error" && (
            <p role="alert" className="text-xs text-destructive">复制失败，请检查浏览器剪贴板权限后重试。</p>
          )}
        </section>
      </CardContent>
    </Card>
  )
}
