/**
 * 文件说明：模块 2 课时 1 静态配置。
 * 职责：统一声明“小说怎样变成漫画”的四关标题与路径。
 * 更新触发：课时 1 关卡数量、名称、路径或教学顺序变化时，需要同步更新本文件。
 */

export const MODULE2_LESSON1_CONFIG = {
  id: 1,
  title: "小说怎样变成漫画",
  subtitle: "接入我的小说，看懂改编样例，选出四个关键画面并确定视觉方向",
  totalSteps: 4,
} as const

export const MODULE2_LESSON1_STEPS = [
  { id: 1, path: "step/1", title: "导入我的小说" },
  { id: 2, path: "step/2", title: "看懂改编样例" },
  { id: 3, path: "step/3", title: "选出四个关键画面" },
  { id: 4, path: "step/4", title: "确定视觉方向" },
] as const
