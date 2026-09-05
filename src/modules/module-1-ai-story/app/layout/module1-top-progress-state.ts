/**
 * 文件说明：模块 1 顶部课时进度状态计算器。
 * 职责：以注册表、档案和当前路由纯计算六课时的状态、目标路径与可点击性，供顶部进度和测试复用。
 * 更新触发：模块 1 课时开放、访问规则、顶部状态文案或无档案入口策略变化时，需要同步更新本文件。
 */

import {
  canAccessModule1Lesson,
  MODULE1_LESSON_REGISTRY,
} from "@/modules/module-1-ai-story/app/lesson-registry"
import type { Module1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"

export type Module1TopLessonStatus = "completed" | "current" | "available" | "locked"

export interface Module1TopProgressItem {
  id: number
  title: string
  subtitle: string
  status: Module1TopLessonStatus
  target: string | null
  clickable: boolean
}

export function buildModule1TopProgressItems(
  portfolio: Module1Portfolio | null,
  currentLessonId: number,
): Module1TopProgressItem[] {
  return MODULE1_LESSON_REGISTRY.map((lesson) => {
    if (!portfolio) {
      const isEntry = lesson.id === 1
      return {
        id: lesson.id,
        title: lesson.title,
        subtitle: lesson.subtitle,
        status: isEntry ? "available" : "locked",
        target: isEntry ? "/module/1" : null,
        clickable: isEntry,
      }
    }

    const accessible = canAccessModule1Lesson(portfolio, lesson.id)
    const completed = accessible && lesson.isComplete(portfolio)
    const current = accessible && lesson.id === currentLessonId
    const status: Module1TopLessonStatus = completed
      ? "completed"
      : current
        ? "current"
        : accessible
          ? "available"
          : "locked"

    return {
      id: lesson.id,
      title: lesson.title,
      subtitle: lesson.available ? lesson.subtitle : `${lesson.subtitle} · 未开放`,
      status,
      target: accessible ? lesson.path : null,
      clickable: accessible,
    }
  })
}
