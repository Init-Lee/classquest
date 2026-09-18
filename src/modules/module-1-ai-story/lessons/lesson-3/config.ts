/**
 * 文件说明：模块 1 课时 3 静态配置。
 * 职责：统一声明「写一个吸引人的开头」四关标题、路径与教学意图。
 * 更新触发：课时 3 关卡数量、名称、路径或教学顺序变化时，需要同步更新本文件。
 */

export const MODULE1_LESSON3_CONFIG = {
  id: 3,
  title: "起：写一个吸引人的开头",
  subtitle: "选定开场，写出初稿并确认开头",
  totalSteps: 4,
} as const

export const MODULE1_LESSON3_STEPS = [
  { id: 1, path: "step/1", title: "读懂一个开头" },
  { id: 2, path: "step/2", title: "选定开场" },
  { id: 3, path: "step/3", title: "完成初稿" },
  { id: 4, path: "step/4", title: "检查与修改" },
] as const
