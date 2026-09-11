/**
 * 文件说明：模块 1 课时 2 静态配置。
 * 职责：统一声明风格与人物课的四关标题、路径与教学意图。
 * 更新触发：课时 2 关卡数量、名称、路径或教学顺序变化时，需要同步更新本文件。
 */

export const MODULE1_LESSON2_CONFIG = {
  id: 2,
  title: "风格与人物",
  subtitle: "选择写作风格并完成人物四格",
  totalSteps: 4,
} as const

export const MODULE1_LESSON2_STEPS = [
  { id: 1, path: "step/1", title: "理解风格" },
  { id: 2, path: "step/2", title: "选择风格" },
  { id: 3, path: "step/3", title: "说明理由" },
  { id: 4, path: "step/4", title: "确认人物弧光" },
] as const
