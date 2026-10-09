/**
 * 文件说明：模块 1 课时 6 静态配置。
 * 职责：统一声明「让故事有一个恰当的结尾」四关标题、路径与教学意图。
 * 更新触发：课时 6 关卡数量、名称、路径或教学顺序变化时，需要同步更新本文件。
 */

export const MODULE1_LESSON6_CONFIG = {
  id: 6,
  title: "合：让故事有一个恰当的结尾",
  subtitle: "回应前面的事情，连起来读，确认自己的完整作品。",
  totalSteps: 4,
} as const

export const MODULE1_LESSON6_STEPS = [
  { id: 1, path: "step/1", title: "看懂收束" },
  { id: 2, path: "step/2", title: "确定怎样结束" },
  { id: 3, path: "step/3", title: "AI起草合段" },
  { id: 4, path: "step/4", title: "通读全文并确认" },
] as const
