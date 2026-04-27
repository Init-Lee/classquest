/**
 * 文件说明：课时6配置
 * 职责：定义课时6两关步骤标签；固定四步路演流程的只读展示（本步任务、建议句式、常见错误）
 * 更新触发：步骤名称变更；第1关/第2关教学文案与 skill pack 对齐调整时
 */

/** 四步路演：第1关卡片与第2关表格行标题（顺序锁定） */
export const LESSON6_ROADSHOW_META = [
  {
    step: 1,
    name: "点题",
    task: "先说研究的问题是什么，为什么值得关注。",
    suggestedPhrases:
      "我们研究的问题是……\n这个问题和校园 / 同学 / 社区有什么关系……",
    mistake: "一上来就从整张海报开始念，没有先讲清研究主题。",
  },
  {
    step: 2,
    name: "指证据",
    task: "说清海报上哪一块是证据，这块证据说明了什么。",
    suggestedPhrases: "请看海报这里……\n这张照片 / 这组数据 / 这段记录说明……",
    mistake: "只说结论，不指出海报上的具体位置。",
  },
  {
    step: 3,
    name: "说判断与建议",
    task: "从证据走到判断，再说明建议怎么做。",
    suggestedPhrases: "因此我们认为……\n所以我们建议……",
    mistake: "从证据直接跳到口号，没有讲清中间的判断过程。",
  },
  {
    step: 4,
    name: "应追问并收束",
    task: "准备回答「你们怎么证明」，再用一句话收住。",
    suggestedPhrases: "如果你问「你们怎么证明」，我们会回到……\n总之，我们想说明的是……",
    mistake: "被问住以后离开证据，只剩下重复观点。",
  },
] as const

export const LESSON6_CONFIG = {
  id: 6,
  title: "终版海报路演与表达设计",
  steps: [
    { id: 1, label: "示例拆解与路径定标" },
    { id: 2, label: "讲解路径定稿与轮流试讲" },
  ],
}

/** 第1关：海报讲解路径示意图（图标 + 旁注，与四步对应） */
export const LESSON6_PATH_DIAGRAM_STEPS = [
  {
    step: 1,
    short: "点题",
    caption: "先告诉观众你研究什么",
  },
  {
    step: 2,
    short: "指证据",
    caption: "带观众看海报上的证据",
  },
  {
    step: 3,
    short: "说判断与建议",
    caption: "从证据走到判断",
  },
  {
    step: 4,
    short: "应追问并收束",
    caption: "被问时回到证据，再收住",
  },
] as const
