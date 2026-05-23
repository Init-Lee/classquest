/**
 * 文件说明：模块 4 课时 3 静态配置。
 * 职责：定义课时 3 标题、四步流程和路由片段，供路由、进度条和页面组件统一使用。
 * 更新触发：课时 3 名称、步骤数量、步骤标题或路由片段变化时，需要同步更新本文件。
 */

export const LESSON3_CONFIG = {
  id: 3,
  title: "题目卡 V1 制作与解析填写",
  subtitle: "把两份素材制作成新闻题卡 V1 与图片题卡 V1",
  totalSteps: 4,
} as const

export const LESSON3_STEPS = [
  {
    id: 1,
    path: "step/1",
    title: "启动 V1 制作",
    subtitle: "明确今天要完成的两张题卡初稿",
  },
  {
    id: 2,
    path: "step/2",
    title: "新闻题卡编辑器",
    subtitle: "制作新闻题卡 V1",
  },
  {
    id: 3,
    path: "step/3",
    title: "图片题卡编辑器",
    subtitle: "制作图片题卡 V1",
  },
  {
    id: 4,
    path: "step/4",
    title: "双卡自测与保存",
    subtitle: "试答两张题卡并保存 V1",
  },
] as const

export type Lesson3StepId = typeof LESSON3_STEPS[number]["id"]
