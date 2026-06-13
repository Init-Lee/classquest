/**
 * 文件说明：模块 4 课时 6 静态配置。
 * 职责：定义课时 6 标题、Step1-Step3 信息和路由片段，供路由、进度条和页面组件统一使用。
 * 更新触发：课时 6 名称、步骤数量、步骤标题、路由片段或 C4b 复盘步骤开放口径变化时，需要同步更新本文件。
 */

export const LESSON6_CONFIG = {
  id: 6,
  title: "题库发布与可信反思",
  subtitle: "查看 V3 发布状态，完成公共挑战，并生成可信复盘快照",
  totalSteps: 3,
} as const

export const LESSON6_STEPS = [
  {
    id: 1,
    path: "step/1",
    title: "我的 V3 发布状态",
    subtitle: "确认自己提交的 V3 是否已进入教师发布确认流程",
  },
  {
    id: 2,
    path: "step/2",
    title: "公共题库 6 题挑战",
    subtitle: "以课时内身份完成一轮 lesson6_class 公共挑战",
  },
  {
    id: 3,
    path: "step/3",
    title: "可信复盘与项目结营",
    subtitle: "写下可信发布原则，生成 lesson6-stage-v1 阶段快照",
  },
] as const

export type Lesson6StepId = typeof LESSON6_STEPS[number]["id"]
