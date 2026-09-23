/**
 * 文件说明：模块 1 课时 4 静态配置。
 * 职责：统一声明「写出事情的发展」四关标题、路径与教学意图。
 * 更新触发：课时 4 关卡数量、名称、路径或教学顺序变化时，需要同步更新本文件。
 */

export const MODULE1_LESSON4_CONFIG = {
  id: 4,
  title: "承：写出事情的发展",
  subtitle: "主角做了一件事，事情因此有了新的发展",
  totalSteps: 4,
} as const

export const MODULE1_LESSON4_STEPS = [
  { id: 1, path: "step/1", title: "看懂推进" },
  { id: 2, path: "step/2", title: "安排下一步" },
  { id: 3, path: "step/3", title: "AI起草" },
  { id: 4, path: "step/4", title: "检查与确认" },
] as const
