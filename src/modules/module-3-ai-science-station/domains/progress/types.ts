/**
 * 文件说明：进度指针领域类型定义
 * 职责：记录学生当前所在课时和步骤，作为恢复进度的锚点
 * 更新触发：课时数量或步骤数量范围发生变化时
 */

/** 进度指针：记录当前所在课时与步骤 */
export interface ProgressPointer {
  /** 当前课时（1-6） */
  lessonId: 1 | 2 | 3 | 4 | 5 | 6
  /** 当前步骤编号（1-6） */
  stepId: number
  /** 最后更新时间（ISO 8601） */
  updatedAt: string
}
