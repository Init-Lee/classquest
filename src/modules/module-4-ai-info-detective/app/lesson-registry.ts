/**
 * 文件说明：模块 4 课时注册表。
 * 职责：集中声明模块 4 课时入口、标题与完成状态，并根据档案内容修正可能落后的进度指针。
 * 更新触发：模块 4 新增课时、课时入口路径、完成判定或指针修正规则变化时，需要同步更新本文件。
 */

import type { Module4Portfolio, Module4ProgressPointer } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { getCurrentLesson1Step } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/guards"
import { getCurrentLesson2Step } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/guards"
import { getCurrentLesson3Step } from "@/modules/module-4-ai-info-detective/lessons/lesson-3/guards"
import { getCurrentLesson4Step } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/guards"
import { getLesson5CurrentStep } from "@/modules/module-4-ai-info-detective/lessons/lesson-5/utils/get-lesson5-current-step"

export interface Module4LessonEntry {
  id: number
  title: string
  subtitle: string
  path: string
  available: boolean
  isComplete: (portfolio: Module4Portfolio | null) => boolean
}

export const MODULE4_LESSON_REGISTRY: Module4LessonEntry[] = [
  {
    id: 1,
    title: "框架发布与样例拆解",
    subtitle: "看懂一张“AI 信息辨识题”是怎么工作的",
    path: "/module/4/lesson/1/step/1",
    available: true,
    isComplete: portfolio => Boolean(portfolio?.lesson1.completed),
  },
  {
    id: 2,
    title: "素材搜集与合规初筛",
    subtitle: "准备新闻素材、图片素材和来源记录",
    path: "/module/4/lesson/2/step/1",
    available: true,
    isComplete: portfolio => Boolean(portfolio?.lesson2.completed),
  },
  {
    id: 3,
    title: "题目卡 V1 制作与解析填写",
    subtitle: "完成新闻题卡与图片题卡 V1 初稿",
    path: "/module/4/lesson/3/step/1",
    available: true,
    isComplete: portfolio => Boolean(portfolio?.lesson3.completed),
  },
  {
    id: 4,
    title: "题目卡互审与 V2 入库准备",
    subtitle: "通过同伴互审拿到 V2 修改入口",
    path: "/module/4/lesson/4/step/1",
    available: true,
    isComplete: portfolio => Boolean(portfolio?.lesson4.completed),
  },
  {
    id: 5,
    title: "网页试答与反馈优化",
    subtitle: "提交 V2 到班级题池，准备后续网页试答",
    path: "/module/4/lesson/5/step/1",
    available: true,
    isComplete: portfolio => Boolean(portfolio?.lesson5.completed),
  },
  {
    id: 6,
    title: "题库发布与可信反思",
    subtitle: "完成发布复盘与可信表达反思",
    path: "/module/4",
    available: false,
    isComplete: () => false,
  },
]

export function canAccessModule4Lesson(
  portfolio: Module4Portfolio | null,
  lessonId: number,
  isTeacherMode = false,
): boolean {
  const entry = MODULE4_LESSON_REGISTRY.find(lesson => lesson.id === lessonId)
  if (!entry?.available) return false
  if (isTeacherMode) return true
  if (lessonId === 1) return true
  if (!portfolio) return false
  if (lessonId === 2) return portfolio.lesson1.completed
  if (lessonId === 3) return portfolio.lesson2.completed
  if (lessonId === 4) return portfolio.lesson3.completed
  if (lessonId === 5) return portfolio.lesson4.completed && portfolio.lesson4.readiness.readyForLesson5
  return false
}

export function resolveModule4PortfolioPointer(portfolio: Module4Portfolio): Module4ProgressPointer {
  if (!portfolio.lesson1.completed) {
    return { lessonId: 1, stepId: getCurrentLesson1Step(portfolio.lesson1) }
  }
  if (!portfolio.lesson2.completed) {
    return { lessonId: 2, stepId: getCurrentLesson2Step(portfolio.lesson2) }
  }
  if (!portfolio.lesson3.completed) {
    return { lessonId: 3, stepId: getCurrentLesson3Step(portfolio.lesson3) }
  }
  if (!portfolio.lesson4.completed) {
    return { lessonId: 4, stepId: getCurrentLesson4Step(portfolio.lesson4) }
  }
  return { lessonId: 5, stepId: getLesson5CurrentStep(portfolio.lesson5) }
}
