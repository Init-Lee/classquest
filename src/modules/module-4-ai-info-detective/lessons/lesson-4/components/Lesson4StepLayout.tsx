/**
 * 文件说明：模块 4 课时 4 标准步骤布局。
 * 职责：为课时 4 第 1 关与锁定占位页提供统一容器、标题、说明和返回动作。
 * 更新触发：课时 4 页面布局、锁定提示、步骤页脚或后续关卡开放策略变化时，需要同步更新本文件。
 */

import type { ReactNode } from "react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

export function Lesson4StepLayout({
  title,
  subtitle,
  titleExtra,
  children,
  footer,
}: {
  title: string
  subtitle: string
  /** 标题行右侧附加内容（如同步连接状态），窄屏可换行。 */
  titleExtra?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {titleExtra}
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
      </div>
      {children}
      {footer && <div className="mt-6 flex justify-end">{footer}</div>}
    </div>
  )
}

export function LockedLesson4Step({
  title = "暂时不能进入这一步",
  reason,
  onReturn,
}: {
  title?: string
  reason: string
  onReturn: () => void
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Card>
        <CardContent className="space-y-4 p-8 text-center">
          <p className="text-lg font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{reason}</p>
          <Button onClick={onReturn}>返回当前可完成步骤</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function Lesson4LockedPlaceholder({
  gatePassed,
  onReturn,
}: {
  gatePassed: boolean
  onReturn: () => void
}) {
  return (
    <LockedLesson4Step
      title={gatePassed ? "该步骤本版暂未开放" : "请先完成同伴互审"}
      reason={gatePassed ? "本阶段只交付第 1 关，Step2-4 将在后续迭代开放。" : "请先完成“我的题卡已被审查”和“我已审查别人”两个条件。"}
      onReturn={onReturn}
    />
  )
}
