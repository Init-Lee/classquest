/**
 * 文件说明：模块 4 课时 1 通用 Step 布局。
 * 职责：统一各关的步骤标题、说明、内容卡与底部操作；课时标题与课内流程条由 `lesson-1/routes` 统一承接（与模块三一致）。
 * 更新触发：步骤正文卡片结构、底部按钮区、主标题可选样式（titleClassName）或与模块三对齐策略变化时，需要同步更新本文件。
 */

import type { ReactNode } from "react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/shared/utils/cn"

interface Lesson1StepLayoutProps {
  title: string
  subtitle: string
  /** 主标题额外 className（例如第 3 关使用与关卡条一致的 primary 强调样式） */
  titleClassName?: string
  children: ReactNode
  footer?: ReactNode
}

export function Lesson1StepLayout({
  title,
  subtitle,
  titleClassName,
  children,
  footer,
}: Lesson1StepLayoutProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className={cn("text-2xl font-bold", titleClassName)}>{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {children}
        </CardContent>
      </Card>

      {footer && <div className="flex flex-wrap justify-end gap-2">{footer}</div>}
    </div>
  )
}

export function LockedLesson1Step({
  reason,
  onReturn,
}: {
  reason: string
  onReturn: () => void
}) {
  return (
    <Card>
      <CardContent className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">请先完成前一关</h1>
        <p className="text-sm text-muted-foreground">{reason}</p>
        <Button onClick={onReturn}>返回当前可学习关卡</Button>
      </CardContent>
    </Card>
  )
}
