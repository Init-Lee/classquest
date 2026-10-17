/**
 * 文件说明：模块 2 顶部课时进度状态计算器。
 * 职责：以注册表、档案、教师模式和当前路由纯计算六课时的状态、状态文字、目标路径与可点击性，供顶部进度和测试复用。
 * 更新触发：模块 2 课时开放范围、访问规则、状态文字或顶部入口策略变化时，需要同步更新本文件。
 */

import {
  canAccessModule2Lesson,
  MODULE2_LESSON_REGISTRY,
} from "@/modules/module-2-ai-comic/app/lesson-registry"
import type { Module2PortfolioSkeleton } from "@/modules/module-2-ai-comic/domains/portfolio/types"

/** upcoming = 本站尚未开放（后续开放）；locked = 已开放但前一课未完成。 */
export type Module2TopLessonStatus = "completed" | "current" | "available" | "locked" | "upcoming"

export interface Module2TopProgressItem {
  id: number
  title: string
  subtitle: string
  status: Module2TopLessonStatus
  /** 颜色之外的文字区分，供 title 与读屏使用。 */
  statusLabel: string
  target: string | null
  clickable: boolean
}

const STATUS_LABELS: Record<Module2TopLessonStatus, string> = {
  completed: "已完成",
  current: "当前课时",
  available: "可进入",
  locked: "未解锁",
  upcoming: "后续开放",
}

export function buildModule2TopProgressItems(
  portfolio: Module2PortfolioSkeleton | null,
  currentLessonId: number,
  isTeacherMode = false,
): Module2TopProgressItem[] {
  return MODULE2_LESSON_REGISTRY.map((lesson) => {
    const accessible = canAccessModule2Lesson(portfolio, lesson.id, isTeacherMode)
    const completed = accessible && lesson.isComplete(portfolio)
    const current = accessible && lesson.id === currentLessonId
    const status: Module2TopLessonStatus = !lesson.available
      ? "upcoming"
      : completed
        ? "completed"
        : current
          ? "current"
          : accessible
            ? "available"
            : "locked"

    return {
      id: lesson.id,
      title: lesson.title,
      subtitle: lesson.subtitle,
      status,
      statusLabel: STATUS_LABELS[status],
      target: accessible ? lesson.path : null,
      clickable: accessible,
    }
  })
}
