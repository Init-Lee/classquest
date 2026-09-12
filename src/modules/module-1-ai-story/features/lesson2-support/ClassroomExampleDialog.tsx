/**
 * 文件说明：模块 1 课时 2 课堂虚构示例只读弹层。
 * 职责：展示「关灯这件事」完整示例，不写入学生进度，也不能替换已填字段。
 * 更新触发：虚构示例正文、弹层标题或关闭文案变化时，需要同步更新本文件。
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
import { MODULE1_LESSON2_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson2-copy"

interface ClassroomExampleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClassroomExampleDialog({ open, onOpenChange }: ClassroomExampleDialogProps) {
  const example = MODULE1_LESSON2_EXAMPLE
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>课堂虚构示例：关灯这件事</DialogTitle>
          <DialogDescription>{example.note}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-3 overflow-y-auto pr-1 text-sm leading-relaxed">
          <p><strong>年份：</strong>{example.year}</p>
          <p><strong>SDG主题：</strong>{example.sdg}</p>
          <p><strong>城市问题：</strong>{example.cityIssue}</p>
          <p><strong>写给谁：</strong>{example.audience}</p>
          <p><strong>对方关心的事：</strong>{example.audienceConcern}</p>
          <p className="whitespace-pre-wrap"><strong>情境：</strong>{example.context}</p>
          <p className="whitespace-pre-wrap"><strong>片段观察：</strong>{example.observation}</p>
          <p className="whitespace-pre-wrap"><strong>准备采用的写法：</strong>{example.writingPlan}</p>
          <p className="whitespace-pre-wrap"><strong>选择理由：</strong>{example.reason}</p>
          <p className="whitespace-pre-wrap"><strong>我是谁：</strong>{example.who}</p>
          <p className="whitespace-pre-wrap"><strong>我想要：</strong>{example.want}</p>
          <p className="whitespace-pre-wrap"><strong>我卡在：</strong>{example.blocked}</p>
          <p className="whitespace-pre-wrap"><strong>准备先尝试的行动：</strong>{example.firstAction}</p>
          <p className="whitespace-pre-wrap"><strong>可能发生的变化：</strong>{example.possibleChange}</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
