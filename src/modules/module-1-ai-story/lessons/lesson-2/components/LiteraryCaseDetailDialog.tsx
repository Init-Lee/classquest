/**
 * 文件说明：模块 1 课时 2 第 1 关文学案例详情弹层。
 * 职责：对齐课时 2 已有 Dialog，展示一则案例的完整 LiteraryCasePanel，并允许在弹层内选用该片段。
 * 更新触发：详情弹层布局、关闭方式或弹层内选用交互变化时，需要同步更新本文件。
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
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden">
        {literaryCase && (
          <>
            <DialogHeader>
              <DialogTitle className="leading-snug">{literaryCase.cardTitle}</DialogTitle>
              <DialogDescription>
                {literaryCase.author} · {literaryCase.teachingRole}
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 overflow-y-auto pr-1">
              <LiteraryCasePanel literaryCase={literaryCase} />
            </div>
            <DialogFooter>
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
