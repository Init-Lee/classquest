/**
 * 文件说明：模块 1 课时 1 静态配置。
 * 职责：统一声明主题课的四关标题、路径与教学意图。
 * 更新触发：课时 1 关卡数量、名称、路径或教学顺序变化时，需要同步更新本文件。
 */

export const MODULE1_LESSON1_CONFIG = {
  id: 1,
  title: "未来城市的故事主题",
  subtitle: "从 SDG、城市问题和受众关切确定故事方向",
  totalSteps: 4,
} as const

export const MODULE1_LESSON1_STEPS = [
  { id: 1, path: "step/1", title: "接受任务" },
  { id: 2, path: "step/2", title: "连接 SDG" },
  { id: 3, path: "step/3", title: "聚焦城市问题" },
  { id: 4, path: "step/4", title: "确认主题大纲" },
] as const
