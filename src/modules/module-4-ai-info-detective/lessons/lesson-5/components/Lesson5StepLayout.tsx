/**
 * 文件说明：模块 4 课时 5 标准步骤布局。
 * 职责：为课时 5 Step1 和锁定提示提供统一容器、标题、说明与返回动作。
 * 更新触发：课时 5 页面布局、锁定提示、步骤页脚或后续关卡开放策略变化时，需要同步更新本文件。
 */

import type { ReactNode } from "react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

export function Lesson5StepLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>}
          {subtitle && <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

export function LockedLesson5Step({
  reason,
  onReturn,
}: {
  reason: string
  onReturn: () => void
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Card>
        <CardContent className="space-y-4 p-8 text-center">
          <p className="text-lg font-semibold">暂时不能进入课时 5</p>
          <p className="text-sm text-muted-foreground">{reason}</p>
          <Button onClick={onReturn}>返回课时 4 就绪报告</Button>
        </CardContent>
      </Card>
    </div>
  )
}
