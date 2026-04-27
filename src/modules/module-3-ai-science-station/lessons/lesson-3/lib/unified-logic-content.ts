/**
 * 文件说明：课时3「材料加工统一逻辑」文案与课堂讲稿数据
 * 职责：四步标题/栅格短文案、课堂翻页每页讲稿（金句、解析、关键动作、避坑、提问、底部目标）
 * 更新触发：教学话术调整、步骤增删、与 assets 配图顺序约定变化时
 */

/** 单页课堂讲稿（与配图、栅格序号一一对应） */
export type UnifiedLogicNarration = {
  /** 核心金句（大字强调） */
  goldenSentence: string
  /** 内容解析正文 */
  analysis: string
  /** 关键动作正文 */
  keyAction: string
  /** 避坑指南正文（可含 ❌ ⚠️ 等符号） */
  pitfall: string
  /** 课堂提问正文（不含前缀「💡」） */
  classroomQuestion: string
  /** 底部目标条文案 */
  footerGoal: string
}

export type UnifiedLogicStep = {
  step: "1" | "2" | "3" | "4"
  /** 四格漫画底部两行文案，\n 分隔 */
  text: string
  /** 翻页/大标题用短标题（与「第 n 页」组合展示） */
  headline: string
  narration: UnifiedLogicNarration
}

/** 四步统一数据源：栅格 + 课堂翻页共用 */
export const UNIFIED_LOGIC_STEPS: readonly UnifiedLogicStep[] = [
  {
    step: "1",
    text: "原始材料\n是什么",
    headline: "原始材料是什么",
    narration: {
      goldenSentence: "先分清你手上有什么，后面才知道该怎么整理。",
      analysis:
        "原始材料形式多样：图片、文字、表格数据、视频，或是课时1记录的辅助线索。",
      keyAction: "这一步不是下结论，而是识别材料的类型与来源。",
      pitfall: "❌ 不要一开始就想「海报怎么写」，先认清材料本身。",
      classroomQuestion: "我手上的这条材料，属于哪一类？",
      footerGoal: "这一步的目标：看清材料",
    },
  },
  {
    step: "2",
    text: "我看到了\n什么",
    headline: "我看到了什么",
    narration: {
      goldenSentence: "不是把材料原样搬上去，而是先从里面看出值得表达的现象。",
      analysis: "筛选价值：同一份材料里，真正有用的往往只有那一小部分。",
      keyAction: "说清楚材料让你注意到了什么现象、问题，或它为何值得上墙。",
      pitfall: "❌ 不要把「看到的现象」直接武断地等同于「已经证明的原因」。",
      classroomQuestion: "这条材料最值得别人看到的是什么？",
      footerGoal: "这一步的目标：抓住现象",
    },
  },
  {
    step: "3",
    text: "我做了什么\n最小加工",
    headline: "我做了什么最小加工",
    narration: {
      goldenSentence: "加工不是重做，而是让别人一眼看懂重点。",
      analysis: "加工手段：裁剪、圈点、摘录、压缩，或转化为一句简短的趋势判断。",
      keyAction: "加工的目标是「服务表达」，而非单纯的视觉美化。",
      pitfall: "❌ 只做帮助理解的必要加工，不要为了好看添加无意义的装饰。",
      classroomQuestion: "我最少要做什么处理，才能让重点更清楚？",
      footerGoal: "这一步的目标：做最小加工",
    },
  },
  {
    step: "4",
    text: "海报上可以\n怎么说",
    headline: "海报上可以怎么说",
    narration: {
      goldenSentence: "海报上的话，要基于材料说，而不是让 AI 自由发挥。",
      analysis: "逻辑闭环：当前面三步（材料-现象-加工）完成后，海报表达自然水到渠成。",
      keyAction: "将复杂的材料信息，转化为别人一秒就能看懂的直观表述。",
      pitfall: "⚠️ 能说「我们观察到……」时，先不要急着说「这一定是因为……」。",
      classroomQuestion: "海报上我能不能用一句话把它说清楚？",
      footerGoal: "这一步的目标：形成海报表达",
    },
  },
]

export const UNIFIED_LOGIC_SLIDE_COUNT = UNIFIED_LOGIC_STEPS.length

export function stepCaptionLine(step: Pick<UnifiedLogicStep, "text">): string {
  return step.text.replace(/\n/g, "")
}
