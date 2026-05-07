/**
 * 文件说明：模块 4 课时注册表。
 * 职责：集中声明模块 4 课时入口、标题与完成状态，并根据档案内容修正可能落后的进度指针。
 * 更新触发：模块 4 新增课时、课时入口路径、完成判定或指针修正规则变化时，需要同步更新本文件。
 */

import type { Module4Portfolio, Module4ProgressPointer } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { getCurrentLesson1Step } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/guards"

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
    title: "素材收集与合规筛查",
    subtitle: "准备新闻素材、图片素材和来源记录",
    path: "/module/4",
    available: false,
    isComplete: () => false,
  },
  {
    id: 3,
    title: "题卡创作与解释撰写",
    subtitle: "完成新闻题卡与图片题卡草稿",
    path: "/module/4",
    available: false,
    isComplete: () => false,
  },
  {
    id: 4,
    title: "同伴评审与终稿优化",
    subtitle: "根据反馈优化题卡内容",
    path: "/module/4",
    available: false,
    isComplete: () => false,
  },
  {
    id: 5,
    title: "网页试答与反馈优化",
    subtitle: "体验班级题库试答与快评",
    path: "/module/4",
    available: false,
    isComplete: () => false,
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

export function resolveModule4PortfolioPointer(portfolio: Module4Portfolio): Module4ProgressPointer {
  if (portfolio.lesson1.completed) {
    return { lessonId: 2, stepId: 1 }
  }
  return { lessonId: 1, stepId: getCurrentLesson1Step(portfolio.lesson1) }
}
