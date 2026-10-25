/**
 * 文件说明：模块 2 六课时注册表。
 * 职责：声明六课时标题、主要产出、入口路径与开放状态，并用纯函数区分“课时已开放”和“前一课已完成”两种访问条件；课时一完成按真实字段重算，不读档案中的 completed 标记。
 * 更新触发：课时标题、开放范围、完成判定、入口路径、教师讲解放行或“我的漫画”开放规则变化时，需要同步更新本文件。
 * 课时一完成判定接 lesson1-update 的真实 gate，不读取档案中的 completed 标记。
 *
 * 预留规则：“我的漫画”（/module/2/comic）不是第七课。将来仅当课时六真实完成且存在有效整体确认版时才开放；
 * 当前阶段不注册该路由，也不渲染入口。
 */

import type { Module2LessonId, Module2PortfolioV1 } from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { computeModule2Lesson1Gates } from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"

export interface Module2LessonEntry {
  id: Module2LessonId
  title: string
  subtitle: string
  path: string
  available: boolean
  isComplete: (portfolio: Module2PortfolioV1 | null) => boolean
}

/** 课时二至六尚未建立任何数据字段，完成判定恒为 false，开放时再按真实字段实现。 */
const notYetTracked = () => false

export const MODULE2_LESSON_REGISTRY: Module2LessonEntry[] = [
  { id: 1, title: "小说怎样变成漫画", subtitle: "接入我的小说，写出四句画面，选定 2—3 个视觉词与理由", path: "/module/2/lesson/1/step/1", available: true, isComplete: p => computeModule2Lesson1Gates(p).completed },
  { id: 2, title: "让角色与风格稳定下来", subtitle: "确定 3—5 个外观特征，制作角色参考图与四格共同设定", path: "/module/2/lesson/2/step/1", available: false, isComplete: notYetTracked },
  { id: 3, title: "画出“起”和“承”", subtitle: "完成前两格的画面描述、提示词与可用图片", path: "/module/2/lesson/3/step/1", available: false, isComplete: notYetTracked },
  { id: 4, title: "画出“转”和“合”", subtitle: "完成四格初版并连读检查", path: "/module/2/lesson/4/step/1", available: false, isComplete: notYetTracked },
  { id: 5, title: "让漫画更清楚", subtitle: "围绕具体问题有依据地修改，比较修改前后", path: "/module/2/lesson/5/step/1", available: false, isComplete: notYetTracked },
  { id: 6, title: "完成我的漫画", subtitle: "排版文字、写作品说明、读者检视后确认定稿", path: "/module/2/lesson/6/step/1", available: false, isComplete: notYetTracked },
]

export function getModule2LessonEntry(lessonId: number): Module2LessonEntry | undefined {
  return MODULE2_LESSON_REGISTRY.find(lesson => lesson.id === lessonId)
}

/** 条件一：课时是否已在本站开放（与学生进度无关）。 */
export function isModule2LessonAvailable(lessonId: number): boolean {
  return Boolean(getModule2LessonEntry(lessonId)?.available)
}

/** 条件二：前一课是否已完成。课时一没有前置课，视为满足；不要求先登记身份。 */
export function isModule2PreviousLessonComplete(
  portfolio: Module2PortfolioV1 | null,
  lessonId: number,
): boolean {
  if (lessonId === 1) return true
  const previous = getModule2LessonEntry(lessonId - 1)
  return Boolean(previous?.isComplete(portfolio))
}

/** 访问规则：必须已开放；教师讲解模式可越过“前一课已完成”，但不能进入未开放课时。 */
export function canAccessModule2Lesson(
  portfolio: Module2PortfolioV1 | null,
  lessonId: number,
  isTeacherMode = false,
): boolean {
  if (!isModule2LessonAvailable(lessonId)) return false
  if (isTeacherMode) return true
  return isModule2PreviousLessonComplete(portfolio, lessonId)
}
