/**
 * 文件说明：快照领域类型定义
 * 职责：定义阶段快照的元数据结构，快照是面向教师评分的过程性证据
 * 更新触发：快照内容字段发生变化时；新增快照类型时
 */

/** 快照元数据 */
export interface SnapshotMeta {
  /** 快照唯一 ID */
  id: string
  /** 快照类型：R1个人快照 / 课时1完整 / 课时2公开资源 / 课时2完整 / 课时3工具箱与证据卡 */
  type: "r1-personal" | "lesson1-full" | "lesson2-public" | "lesson2-full" | "lesson3-toolbox"
  /** 所属课时 */
  lessonId: number
  /** 生成时间 */
  generatedAt: string
  /** 文件名（供下载时使用） */
  filename: string
}

/** 生成快照所需的输入参数 */
export interface SnapshotInput {
  /** 快照类型（与 SnapshotMeta.type 保持同步） */
  type: SnapshotMeta["type"]
  /** 当前学生的完整档案（Portfolio 序列化后的数据） */
  portfolioSnapshot: unknown
}
