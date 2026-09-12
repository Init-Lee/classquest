/**
 * 文件说明：模块 1 课时 2 第 1 关文学案例详情弹层。
 * 职责：对齐课时 2 已有 Dialog，以横向窗口展示 LiteraryCasePanel，页脚固定关闭/选用，不改选用字段。
 * 更新触发：详情弹层尺寸、横向布局、关闭方式或弹层内选用交互变化时，需要同步更新本文件。
 */

import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { MODULE1_LESSON2_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson2-copy"
import type { Module1LiteraryCase } from "@/modules/module-1-ai-story/constants/literary-cases"
import { LiteraryCasePanel } from "@/modules/module-1-ai-story/lessons/lesson-2/components/LiteraryCasePanel"

interface LiteraryCaseDetailDialogProps {
  literaryCase: Module1LiteraryCase | undefined
  selected: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: () => void
}

export function LiteraryCaseDetailDialog({
  literaryCase,
  selected,
  open,
  onOpenChange,
  onSelect,
}: LiteraryCaseDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[min(96vw,1100px)] max-w-[min(96vw,1100px)] flex-col overflow-hidden">
        {literaryCase && (
          <>
            <DialogHeader className="shrink-0">
              <DialogTitle className="leading-snug">{literaryCase.cardTitle}</DialogTitle>
              <DialogDescription>
                {literaryCase.author} · {literaryCase.teachingRole}
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto md:overflow-hidden">
              <LiteraryCasePanel key={literaryCase.id} literaryCase={literaryCase} />
            </div>
            <DialogFooter className="shrink-0 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {MODULE1_LESSON2_SHARED_COPY.closeStudyCase}
              </Button>
              <Button
                type="button"
                variant={selected ? "default" : "outline"}
                onClick={onSelect}
              >
                {selected ? MODULE1_LESSON2_SHARED_COPY.selectedStudyCase : MODULE1_LESSON2_SHARED_COPY.selectStudyCase}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
