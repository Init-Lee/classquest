/**
 * 文件说明：模块 1 课时 3 可编辑外部 AI 提示词复制控件。
 * 职责：预览、编辑本次提示词并复制；失败时弹出可全选纯文本，不暗示站内调用模型。
 * 更新触发：课时 3 复制成功文案、编辑入口或复制成功回调载荷变化时，需要同步更新本文件。
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
import { MODULE1_LESSON3_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson3-copy"
import { copyModule1Lesson2Text } from "@/modules/module-1-ai-story/features/lesson2-support/copy-text"
import { module1Lesson3PromptContainsUnresolvedVars } from "@/modules/module-1-ai-story/lessons/lesson-3/utils/build-lesson3-prompts"

export interface Module1Lesson3CopiedPromptDetail {
  generatedPrompt: string
  copiedPrompt: string
  promptEdited: boolean
}

interface EditableCopyPromptControlProps {
  label: string
  disabled?: boolean
  disabledReason?: string
  customText: string
  onCustomTextChange: (value: string) => void
  buildText: () => { ok: boolean; text: string; error: string }
  onCopied?: (detail: Module1Lesson3CopiedPromptDetail) => void
}

export function EditableCopyPromptControl({
  label,
  disabled = false,
  disabledReason,
  customText,
  onCustomTextChange,
  buildText,
  onCopied,
}: EditableCopyPromptControlProps) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [error, setError] = useState("")
  const [fallbackText, setFallbackText] = useState("")
  const [editing, setEditing] = useState(false)
  const generated = buildText()
  const preview = customText.trim() || (generated.ok ? generated.text : "")

  const copyPrompt = async () => {
    const result = buildText()
    if (!result.ok) {
      setStatus("error")
      setError(result.error)
      return
    }
    const copiedPrompt = (customText.trim() || result.text).trim()
    if (!copiedPrompt || module1Lesson3PromptContainsUnresolvedVars(copiedPrompt)) {
      setStatus("error")
      setError(MODULE1_LESSON3_SHARED_COPY.incompletePrompt)
      return
    }
    setError("")
    setStatus("idle")
    try {
      await copyModule1Lesson2Text(copiedPrompt)
      setStatus("success")
      onCopied?.({
        generatedPrompt: result.text,
        copiedPrompt,
        promptEdited: copiedPrompt !== result.text.trim(),
      })
    } catch {
      setFallbackText(copiedPrompt)
      setStatus("error")
      setError(MODULE1_LESSON3_SHARED_COPY.copyFailed)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={disabled} onClick={() => void copyPrompt()}>
          {status === "success" ? MODULE1_LESSON3_SHARED_COPY.copied : label}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={disabled || !generated.ok}
          onClick={() => {
            if (!editing && !customText.trim() && generated.ok) onCustomTextChange(generated.text)
            setEditing(current => !current)
          }}
        >
          {editing ? MODULE1_LESSON3_SHARED_COPY.cancelEditPrompt : MODULE1_LESSON3_SHARED_COPY.editPrompt}
        </Button>
      </div>
      {disabled && disabledReason && (
        <p className="text-xs text-muted-foreground">{disabledReason}</p>
      )}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <label className="space-y-1.5 text-sm font-medium">
        <span>{MODULE1_LESSON3_SHARED_COPY.promptPreview}</span>
        <Textarea
          className="max-h-56 min-h-[120px] overflow-y-auto font-mono text-xs"
          readOnly={!editing}
          value={preview}
          onChange={event => onCustomTextChange(event.target.value)}
        />
      </label>
      <Dialog open={Boolean(fallbackText)} onOpenChange={open => { if (!open) setFallbackText("") }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>复制文本</DialogTitle>
            <DialogDescription>{MODULE1_LESSON3_SHARED_COPY.copyFailed}</DialogDescription>
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
