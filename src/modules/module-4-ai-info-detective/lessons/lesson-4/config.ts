/**
 * 文件说明：模块 4 课时 4 静态配置。
 * 职责：定义课时 4 标题、四步流程和路由片段，供路由、进度条和页面组件统一使用。
 * 更新触发：课时 4 名称、步骤数量、步骤标题或路由片段变化时，需要同步更新本文件。
 */

export const LESSON4_CONFIG = {
  id: 4,
  title: "题目卡互审与 V2 入库准备",
  subtitle: "完成同伴互审，拿到 V2 修改前的反馈入口",
  totalSteps: 4,
} as const

export const LESSON4_STEPS = [
  {
    id: 1,
    path: "step/1",
    title: "互审中转站",
    subtitle: "完成送审与审查别人两个通关条件",
  },
  {
    id: 2,
    path: "step/2",
    title: "反馈收件箱",
    subtitle: "查看收到的同伴反馈",
  },
  {
    id: 3,
    path: "step/3",
    title: "V2 修改台",
    subtitle: "根据反馈准备 V2 修改",
  },
  {
    id: 4,
    path: "step/4",
    title: "V2 就绪报告",
    subtitle: "确认进入下一课时前的准备状态",
  },
] as const

export type Lesson4StepId = typeof LESSON4_STEPS[number]["id"]
