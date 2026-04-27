/**
 * 文件说明：课时注册表
 * 职责：统一管理所有课时的配置信息（标题、状态、步骤数等）
 *       是课时进度条和路由守卫的配置来源；并提供结合注册表开放状态的进度指针修正
 * 更新触发：新增课时（如课时5+）时在此注册；课时标题或状态变化时；跨课指针规则变化时
 */

import type { ModulePortfolio } from "@/modules/module-3-ai-science-station/domains/portfolio/types"
import type { ProgressPointer } from "@/modules/module-3-ai-science-station/domains/progress/types"
import { resolvePointerFromState } from "@/modules/module-3-ai-science-station/utils/pointer"

export interface LessonConfig {
  /** 课时 ID（1-6） */
  id: number
  /** 显示标题 */
  title: string
  /** 简短副标题 */
  subtitle: string
  /** 是否已开放（false 则显示为锁定状态） */
  enabled: boolean
  /** 总步骤数 */
  totalSteps: number
}

/** 所有课时的注册配置 */
export const LESSON_REGISTRY: LessonConfig[] = [
  {
    id: 1,
    title: "项目启动与定题",
    subtitle: "确定研究方向，制定采证计划",
    enabled: true,
    totalSteps: 5,
  },
  {
    id: 2,
    title: "证据采集与规范记录",
    subtitle: "把计划变成可追溯的真实证据",
    enabled: true,
    totalSteps: 5,
  },
  {
    id: 3,
    title: "素材整理与证据加工",
    subtitle: "整理个人材料，加工证据卡",
    enabled: true,
    totalSteps: 5,
  },
  {
    id: 4,
    title: "结论形成与网页传播",
    subtitle: "小组合并成果，协商完成网页作品",
    enabled: true,
    totalSteps: 5,
  },
  {
    id: 5,
    title: "预演展示与反馈优化",
    subtitle: "先听清问题，再决定改哪里",
    enabled: true,
    totalSteps: 2,
  },
  {
    id: 6,
    title: "终版海报路演与表达设计",
    subtitle: "所有成员按同一路径讲",
    enabled: true,
    totalSteps: 2,
  },
]

/** 根据课时 ID 获取配置 */
export function getLessonConfig(lessonId: number): LessonConfig | undefined {
  return LESSON_REGISTRY.find(l => l.id === lessonId)
}

/**
 * 在 resolvePointerFromState 基础上，按「下一课是否开放」把指针推到下一课第1关，
 * 使首页「继续闯关」与顶栏课时状态与「接下来要做的事」一致（例如课时4已完成且课时5开放 → {5,1}）。
 */
export function resolvePortfolioPointer(portfolio: ModulePortfolio): ProgressPointer {
  const base = resolvePointerFromState(portfolio)
  const now = new Date().toISOString()

  const lesson5Cfg = LESSON_REGISTRY.find(l => l.id === 5)
  if (
    portfolio.lesson4?.completed
    && lesson5Cfg?.enabled
    && !portfolio.lesson5?.completed
  ) {
    if (base.lessonId < 5 || (base.lessonId === 4 && base.stepId === 5)) {
      return { lessonId: 5, stepId: 1, updatedAt: now }
    }
  }

  const lesson6Cfg = LESSON_REGISTRY.find(l => l.id === 6)
  if (
    portfolio.lesson5?.completed
    && lesson6Cfg?.enabled
    && !portfolio.lesson6?.completed
  ) {
    if (base.lessonId < 6 || (base.lessonId === 5 && base.stepId === 2)) {
      return { lessonId: 6, stepId: 1, updatedAt: now }
    }
  }

  return base
}
