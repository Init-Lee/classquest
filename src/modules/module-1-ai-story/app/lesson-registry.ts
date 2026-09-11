/**
 * 文件说明：模块 1 六课时注册表。
 * 职责：声明课时入口、锁定状态、访问规则，并从真实完成态修复继续学习指针。
 * 更新触发：课时标题、开放范围、完成判定、路由、续学规则或教师讲解放行变化时，需要同步更新本文件。
 */

import type {
  Module1LessonId,
  Module1Portfolio,
  Module1ProgressPointer,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { getCurrentModule1Lesson1Step } from "@/modules/module-1-ai-story/lessons/lesson-1/guards"
import { getCurrentModule1Lesson2Step } from "@/modules/module-1-ai-story/lessons/lesson-2/guards"

export interface Module1LessonEntry {
  id: Module1LessonId
  title: string
  subtitle: string
  path: string
  available: boolean
  isComplete: (portfolio: Module1Portfolio | null) => boolean
}

export const MODULE1_LESSON_REGISTRY: Module1LessonEntry[] = [
  { id: 1, title: "故事主题", subtitle: "确定 SDG、城市问题与受众", path: "/module/1/lesson/1/step/1", available: true, isComplete: p => Boolean(p?.lesson1.completed) },
  { id: 2, title: "风格与人物", subtitle: "选择写作风格并完成人物四格", path: "/module/1/lesson/2/step/1", available: true, isComplete: p => Boolean(p?.lesson2.completed) },
  { id: 3, title: "起：开头暴击", subtitle: "后续阶段开放", path: "/module/1/lesson/3/step/1", available: false, isComplete: p => Boolean(p?.lesson3.completed) },
  { id: 4, title: "承：主要推进", subtitle: "后续阶段开放", path: "/module/1/lesson/4/step/1", available: false, isComplete: p => Boolean(p?.lesson4.completed) },
  { id: 5, title: "转：冲突与反转", subtitle: "后续阶段开放", path: "/module/1/lesson/5/step/1", available: false, isComplete: p => Boolean(p?.lesson5.completed) },
  { id: 6, title: "合：落点回响", subtitle: "后续阶段开放", path: "/module/1/lesson/6/step/1", available: false, isComplete: p => Boolean(p?.lesson6.completed) },
]

export function canAccessModule1Lesson(
  portfolio: Module1Portfolio | null,
  lessonId: number,
  isTeacherMode = false,
): boolean {
  const entry = MODULE1_LESSON_REGISTRY.find(lesson => lesson.id === lessonId)
  if (!entry?.available) return false
  if (isTeacherMode) return true
  if (!portfolio) return false
  if (lessonId === 1) return true
  const previous = portfolio[`lesson${lessonId - 1}` as "lesson1" | "lesson2" | "lesson3" | "lesson4" | "lesson5"]
  return previous.completed
}

export function resolveModule1PortfolioPointer(portfolio: Module1Portfolio): Module1ProgressPointer {
  if (!portfolio.lesson1.completed) {
    return { lessonId: 1, stepId: getCurrentModule1Lesson1Step(portfolio.lesson1) }
  }
  if (!portfolio.lesson2.completed) {
    return { lessonId: 2, stepId: getCurrentModule1Lesson2Step(portfolio.lesson2) }
  }
  for (let lessonId = 3 as Module1LessonId; lessonId <= 6; lessonId += 1) {
    const state = portfolio[`lesson${lessonId}` as "lesson3" | "lesson4" | "lesson5" | "lesson6"]
    if (!state.completed) return { lessonId, stepId: Math.max(1, state.step) }
  }
  return { lessonId: 6, stepId: Math.max(1, portfolio.lesson6.step) }
}

export function getModule1LessonResumePath(
  portfolio: Module1Portfolio,
  lessonId: Module1LessonId,
): string {
  const entry = MODULE1_LESSON_REGISTRY.find(lesson => lesson.id === lessonId)
  if (!entry) return "/module/1"
  if (lessonId === 1) {
    return `/module/1/lesson/1/step/${portfolio.lesson1.completed ? 4 : getCurrentModule1Lesson1Step(portfolio.lesson1)}`
  }
  if (lessonId === 2) {
    return `/module/1/lesson/2/step/${portfolio.lesson2.completed ? 4 : getCurrentModule1Lesson2Step(portfolio.lesson2)}`
  }
  return entry.path
}
