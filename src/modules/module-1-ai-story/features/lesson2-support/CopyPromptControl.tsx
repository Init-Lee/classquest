/**
 * 文件说明：模块 1 课时 2 外部 AI 提示词复制控件。
 * 职责：生成提示词并复制；失败时弹出可全选纯文本，不暗示站内调用模型。
 * 更新触发：复制按钮文案、失败弹层或外部 AI 工作流说明变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Textarea } from "@/shared/ui/textarea"
import { MODULE1_LESSON2_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson2-copy"
import { copyModule1Lesson2Text } from "@/modules/module-1-ai-story/features/lesson2-support/copy-text"

interface CopyPromptControlProps {
  label: string
  disabled?: boolean
  disabledReason?: string
  buildText: () => { ok: boolean; text: string; error: string }
}

export function CopyPromptControl({
  label,
  disabled = false,
  disabledReason,
  buildText,
}: CopyPromptControlProps) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [error, setError] = useState("")
  const [fallbackText, setFallbackText] = useState("")

  const copyPrompt = async () => {
    const result = buildText()
    if (!result.ok) {
      setStatus("error")
      setError(result.error)
      return
    }
    setError("")
    setStatus("idle")
    try {
      await copyModule1Lesson2Text(result.text)
      setStatus("success")
    } catch {
      setFallbackText(result.text)
      setStatus("error")
      setError(MODULE1_LESSON2_SHARED_COPY.copyFailed)
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" disabled={disabled} onClick={() => void copyPrompt()}>
        {status === "success" ? MODULE1_LESSON2_SHARED_COPY.copied : label}
      </Button>
      {disabled && disabledReason && (
        <p className="text-xs text-muted-foreground">{disabledReason}</p>
      )}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
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
    </div>
  )
}
