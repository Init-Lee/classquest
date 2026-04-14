/**
 * 文件说明：课时注册表
 * 职责：统一管理所有课时的配置信息（标题、状态、步骤数等）
 *       是课时进度条和路由守卫的配置来源
 * 更新触发：新增课时（如课时5+）时在此注册；课时标题或状态变化时
 */

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
    totalSteps: 6,
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
    enabled: false,
    totalSteps: 2,
  },
]

/** 根据课时 ID 获取配置 */
export function getLessonConfig(lessonId: number): LessonConfig | undefined {
  return LESSON_REGISTRY.find(l => l.id === lessonId)
}
