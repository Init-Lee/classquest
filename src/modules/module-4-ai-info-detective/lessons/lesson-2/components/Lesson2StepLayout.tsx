/**
 * 文件说明：模块 4 课时 2 关卡布局组件。
 * 职责：提供课时 2 五个关卡统一的标题、说明、内容区和底部操作区，并提供被 Guard 拦截时的提示页。
 * 更新触发：课时 2 页面视觉规范、关卡页脚交互或锁定页提示结构变化时，需要同步更新本文件。
 */

import type { ReactNode } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"

interface Lesson2StepLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Lesson2StepLayout({ title, subtitle, children, footer, className }: Lesson2StepLayoutProps) {
  return (
    <section className={cn("space-y-6", className)}>
      <div className="rounded-3xl border bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-[0.06em] text-primary text-balance">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-5">{children}</div>
      {footer && (
        <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/90">
          <div className="mx-auto flex max-w-7xl justify-end gap-3">{footer}</div>
        </div>
      )}
    </section>
  )
}

export function LockedLesson2Step({ reason, onReturn }: { reason: string; onReturn: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-3xl border bg-card p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
        <h2 className="text-xl font-semibold">这一关还没有解锁</h2>
        <p className="mt-2 text-sm text-muted-foreground">{reason}</p>
        <Button className="mt-6" onClick={onReturn}>返回当前关卡</Button>
      </div>
    </div>
  )
}
