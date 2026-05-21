/**
 * 文件说明：模块 4 课时 3 标准步骤布局。
 * 职责：为课时 3 普通步骤与锁定提示提供统一容器、标题、说明和页脚位置。
 * 更新触发：课时 3 页面布局、锁定提示或步骤页脚策略变化时，需要同步更新本文件。
 */

import type { ReactNode } from "react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

export function Lesson3StepLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">课时3 · 题目卡 V1 制作</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
      </div>
      {children}
      {footer && <div className="mt-6 flex justify-end">{footer}</div>}
    </div>
  )
}

export function LockedLesson3Step({
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
          <p className="text-lg font-semibold">暂时不能进入这一步</p>
          <p className="text-sm text-muted-foreground">{reason}</p>
          <Button onClick={onReturn}>返回当前可完成步骤</Button>
        </CardContent>
      </Card>
    </div>
  )
}
