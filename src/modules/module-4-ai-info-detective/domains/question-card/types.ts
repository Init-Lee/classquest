/**
 * 文件说明：模块 4 题目卡领域类型。
 * 职责：定义新闻类与图片类题目卡的纯数据结构，供课时页面、样例数据和后续 mock API 复用。
 * 更新触发：题目卡四部分结构、来源类型、默认判断选项或模块 4 题卡字段发生变化时，需要同步更新本文件。
 */

export type CardPartKey = "material" | "task" | "explanation" | "source"

export type CardType = "news" | "image"

export type SourceType = "web" | "ai_generated" | "field_capture" | "mixed"

export interface JudgmentOption {
  key: string
  label: string
}

export interface NewsMaterial {
  title: string
  body: string
}

export interface ImageMaterial {
  imagePlaceholder: string
  alt: string
}

export interface FinalSampleCardData {
  id: string
  cardType: CardType
  title: string
  material: NewsMaterial | ImageMaterial
  task: string
  options: JudgmentOption[]
  correctOptionKey: string
  explanation: string
  source: {
    type: SourceType
    note: string
    verification: string
  }
}
