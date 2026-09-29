/**
 * 文件说明：模块 1 课时 5 静态配置。
 * 职责：统一声明「写出故事的关键变化」四关标题、路径与教学意图。
 * 更新触发：课时 5 关卡数量、名称、路径或教学顺序变化时，需要同步更新本文件。
 */

export const MODULE1_LESSON5_CONFIG = {
  id: 5,
  title: "转：写出故事的关键变化",
  subtitle: "接着已经发生的事情，写清变化的来由和影响",
  totalSteps: 4,
} as const

export const MODULE1_LESSON5_STEPS = [
  { id: 1, path: "step/1", title: "看懂变化" },
  { id: 2, path: "step/2", title: "确定关键变化" },
  { id: 3, path: "step/3", title: "AI起草" },
  { id: 4, path: "step/4", title: "检查与确认" },
] as const
