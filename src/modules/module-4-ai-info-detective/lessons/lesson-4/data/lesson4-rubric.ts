/**
 * 文件说明：模块 4 课时 4 同伴互审量规数据。
 * 职责：提供单卡三档审查结论文案、综合考量维度说明，供互审工作台评价与帮助浮窗渲染。
 * 更新触发：互审档位文案、评价维度列表或 reviewJson.cards[].rubric 结构变化时，需要同步更新本文件。
 */

import type { Lesson4ReviewRubricDimensionKey, Lesson4ReviewVerdict } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export interface Lesson4RubricAreaConfig {
  area: Lesson4ReviewRubricDimensionKey
  title: string
  description: string
}

export interface Lesson4VerdictLevelConfig {
  level: Lesson4ReviewVerdict
  label: string
  description: string
}

/** 综合考量维度（不含安全/违规，后者在底部「整体内容违规」单独判定）。 */
export const LESSON4_REVIEW_CRITERIA: Lesson4RubricAreaConfig[] = [
  { area: "material", title: "素材", description: "素材是否看得清、与题目判断有关，并保留必要背景。" },
  { area: "task", title: "任务", description: "判断问题和选项是否清楚，参考答案是否可被解释支持。" },
  { area: "explanation", title: "解析", description: "解析是否说明判断依据，而不是只给结论。" },
  { area: "source", title: "来源", description: "来源记录和核验入口是否足够让同学继续查证。" },
]

export const LESSON4_VERDICT_LEVELS: Lesson4VerdictLevelConfig[] = [
  { level: "pass", label: "通过", description: "综合素材、任务、解析与来源，本题卡已清楚可用，可以保留。" },
  { level: "minor_fix", label: "小修", description: "基本可用，但建议补充一句或调整表述后再进入 V2。" },
  { level: "major_fix", label: "重改", description: "会影响同学作答或核验，需要回到编辑器重做。" },
]
