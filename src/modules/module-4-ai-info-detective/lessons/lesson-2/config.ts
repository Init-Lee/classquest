/**
 * 文件说明：模块 4 课时 2 静态配置。
 * 职责：定义课时标题、五个关卡的路由与展示文案，供路由、进度条和页面组件统一使用。
 * 更新触发：课时 2 名称、关卡数量、关卡标题或路由片段变化时，需要同步更新本文件。
 */

export const LESSON2_CONFIG = {
  id: 2,
  title: "素材搜集与合规初筛",
  subtitle: "给新闻和图片素材做第一次合规体检",
  totalSteps: 5,
} as const

export const LESSON2_STEPS = [
  {
    id: 1,
    path: "step/1",
    title: "素材不等于题目",
    subtitle: "先看懂什么叫“能入题”的素材",
  },
  {
    id: 2,
    path: "step/2",
    title: "四关体检标准",
    subtitle: "用四项标准重新判断你的材料",
  },
  {
    id: 3,
    path: "step/3",
    title: "新闻素材工作台",
    subtitle: "收集、补全并筛选你的新闻截图",
  },
  {
    id: 4,
    path: "step/4",
    title: "图片素材工作台",
    subtitle: "收集、补全并筛选你的图片素材",
  },
  {
    id: 5,
    path: "step/5",
    title: "我的素材体检报告",
    subtitle: "汇总两份素材，确认进入下一课",
  },
] as const

export type Lesson2StepId = typeof LESSON2_STEPS[number]["id"]
