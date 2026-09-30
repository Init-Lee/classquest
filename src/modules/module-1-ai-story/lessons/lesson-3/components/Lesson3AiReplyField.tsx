/**
 * 文件说明：模块 1 课时 3 外部 AI 回复粘贴区。
 * 职责：在成功复制提示词后把回复标为必填，并写入课时 3 自有过程字段；可选只读灰态供课时 4/5 锁定回看。
 * 更新触发：回复必填口径、占位文案、只读灰态或过程字段结构变化时，需要同步更新本文件。
 */

import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/utils/cn"
import { MODULE1_LESSON3_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson3-copy"

interface Lesson3AiReplyFieldProps {
  copySucceeded: boolean
  value: string
  onChange: (value: string) => void
  optionalLabel?: string
  /** 锁定回看时套灰只读，不传则保持可编辑样式（课时 3 等）。 */
  readOnly?: boolean
}

export function Lesson3AiReplyField({
  copySucceeded,
  value,
  onChange,
  optionalLabel = MODULE1_LESSON3_SHARED_COPY.aiReplyOptionalLabel,
  readOnly = false,
}: Lesson3AiReplyFieldProps) {
  return (
    <label className="space-y-1.5 text-sm font-medium">
      <span>{copySucceeded ? MODULE1_LESSON3_SHARED_COPY.aiReplyRequiredLabel : optionalLabel}</span>
      <Textarea
        aria-required={copySucceeded}
        readOnly={readOnly}
        className={cn(
          readOnly
            ? "min-h-[120px] cursor-default border-muted bg-muted text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            : (copySucceeded ? "min-h-[120px] border-primary" : "min-h-[96px] bg-muted/30"),
        )}
        value={value}
        onChange={event => {
          if (readOnly) return
          onChange(event.target.value)
        }}
        placeholder={MODULE1_LESSON3_SHARED_COPY.aiReplyPlaceholder}
      />
    </label>
  )
}
