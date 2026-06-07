/**
 * 文件说明：模块 4 课时 5 静态配置。
 * 职责：定义课时 5 标题、Step1-Step4 信息和路由片段，供路由、进度条和页面组件统一使用。
 * 更新触发：课时 5 名称、步骤数量、步骤标题或路由片段变化时，需要同步更新本文件。
 */

export const LESSON5_CONFIG = {
  id: 5,
  title: "网页试答与反馈优化",
  subtitle: "把 V2 题卡提交到班级题池，连接课堂并查看分配",
  totalSteps: 4,
} as const

export const LESSON5_STEPS = [
  {
    id: 1,
    path: "step/1",
    title: "提交 V2 到班级题池",
    subtitle: "连接课时4 ready 包与课时5题池",
  },
  {
    id: 2,
    path: "step/2",
    title: "课堂试答与快评",
    subtitle: "完成本轮分配题卡的作答、揭示和快评",
  },
  {
    id: 3,
    path: "step/3",
    title: "查看本人题卡报告",
    subtitle: "读取 C6 统计反馈并提炼修订方向",
  },
  {
    id: 4,
    path: "step/4",
    title: "V3 修订与本地快照",
    subtitle: "提交修订计划、V3 题卡并导出课时5证据",
  },
] as const

export type Lesson5StepId = typeof LESSON5_STEPS[number]["id"]
