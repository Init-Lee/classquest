/**
 * 文件说明：模块 4 课时 1 静态配置。
 * 职责：定义课时标题、五个 Step 的展示元数据和总步数，供路由、进度条和页面布局统一使用。
 * 更新触发：课时名称、Step 数量、Step 标题或路由片段变化时，需要同步更新本文件。
 */

export const LESSON1_CONFIG = {
  id: 1,
  title: "框架发布与样例拆解",
  subtitle: "看懂一张“AI 信息辨识题”是怎么工作的",
  totalSteps: 5,
} as const

export const LESSON1_STEPS = [
  {
    id: 1,
    path: "step/1",
    title: "任务发布",
    subtitle: "进入 AI 信息辨识员训练营",
  },
  {
    id: 2,
    path: "step/2",
    title: "样例观察",
    subtitle: "看懂新闻题卡与图片题卡",
  },
  {
    id: 3,
    path: "step/3",
    title: "四部分结构拆解",
    subtitle: "完成田字型结构配对",
  },
  {
    id: 4,
    path: "step/4",
    title: "完整题卡长什么样？",
    subtitle: "从作者视角查看完整模板",
  },
  {
    id: 5,
    path: "step/5",
    title: "领取素材准备任务",
    subtitle: "领取个人素材准备任务",
  },
] as const

export type Lesson1StepId = typeof LESSON1_STEPS[number]["id"]
