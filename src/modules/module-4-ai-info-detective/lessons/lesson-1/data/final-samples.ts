/**
 * 文件说明：课时 1 最终题目卡样例数据。
 * 职责：提供新闻类、图片类样例题卡和默认判断选项，支撑 Step 2 样例观察与 Step 4 网页试答模拟。
 * 更新触发：样例题卡内容、默认判断选项或题卡字段结构变化时，需要同步更新本文件。
 */

import type { FinalSampleCardData, JudgmentOption } from "@/modules/module-4-ai-info-detective/domains/question-card/types"

export const DEFAULT_JUDGMENT_OPTIONS: JudgmentOption[] = [
  { key: "A", label: "明显存在 AI 痕迹" },
  { key: "B", label: "暂无明显 AI 痕迹" },
  { key: "C", label: "证据不足，仍需核验" },
]

export const NEWS_SAMPLE_CARD: FinalSampleCardData = {
  id: "sample-news-001",
  cardType: "news",
  title: "新闻类样例：城市夜间灯光变化",
  material: {
    title: "某城市宣布试点“夜间灯光智能调节系统”",
    body: "报道声称，该系统能根据街区人流、天气和节假日自动调整灯光亮度，以减少能源浪费并提升夜间安全。",
  },
  task: "请判断该内容是否存在 AI 痕迹。",
  options: DEFAULT_JUDGMENT_OPTIONS,
  correctOptionKey: "C",
  explanation: "材料只描述了“智能调节”功能，但没有提供系统是否使用机器学习模型、数据来源或决策机制的证据，因此不能仅凭“智能”二字判断存在 AI 痕迹。",
  source: {
    type: "web",
    note: "示例材料，模拟网络新闻片段。",
    verification: "应核验原始报道来源、发布机构、技术说明或项目公告。",
  },
}

export const IMAGE_SAMPLE_CARD: FinalSampleCardData = {
  id: "sample-image-001",
  cardType: "image",
  title: "图片类样例：校园宣传海报",
  material: {
    imagePlaceholder: "一张校园宣传海报样例图，可先用占位图实现。",
    alt: "校园宣传海报示意图",
  },
  task: "请判断该图片是否存在 AI 痕迹。",
  options: DEFAULT_JUDGMENT_OPTIONS,
  correctOptionKey: "C",
  explanation: "单凭画面风格无法可靠判断图片是否由 AI 生成。需要结合生成记录、素材来源、编辑过程或发布说明进行核验。",
  source: {
    type: "mixed",
    note: "示例材料，模拟经过编辑处理的图片。",
    verification: "应核验图片原始来源、编辑记录或生成说明。",
  },
}
