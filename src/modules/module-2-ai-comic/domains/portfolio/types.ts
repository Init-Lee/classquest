/**
 * 文件说明：模块 2 阶段 A 的最小档案类型骨架。
 * 职责：只提供课时注册表、顶部进度和教师演示态所需的最小字段（课时一当前关与完成标记），不代表正式数据契约。
 * 更新触发：阶段 B 落地数据契约 v1（Module2PortfolioV1 及校验器）时，整体替换本文件；在此之前新增字段需先确认确有调用点。
 */

export type Module2LessonId = 1 | 2 | 3 | 4 | 5 | 6

export type Module2Lesson1StepId = 1 | 2 | 3 | 4

/**
 * 阶段 A 占位档案：阶段 B 将替换为数据契约 v1（Module2PortfolioV1）。
 * 不在这里预建课时二至六或来源、选景、视觉方向等字段，避免用空对象冒充已实现。
 */
export interface Module2PortfolioSkeleton {
  lesson1: {
    step: Module2Lesson1StepId
    completed: boolean
  }
}
