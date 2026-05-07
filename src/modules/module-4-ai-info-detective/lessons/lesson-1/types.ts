/**
 * 文件说明：模块 4 课时 1 专用交互类型。
 * 职责：定义 Step 2 样例题卡、选项反馈、核验链接、题卡模式、结构标注状态等局部类型，避免把未稳定的课时实验结构提前提升到模块级领域层。
 * 更新触发：Step 2 题卡字段、选项反馈、四部分结构、来源核验字段、样例作答流程或后续将类型提升到模块级时，需要同步更新本文件。
 */

import type { CardPartKey } from "@/modules/module-4-ai-info-detective/domains/question-card/types"

export type Step2SampleKind = "news" | "image"

export type Step2OptionKey = "A" | "B" | "C"

export type QuestionCardMode = "quiz-before-answer" | "quiz-after-answer" | "structure-labeling"

export type Step2StructureMatched = Record<CardPartKey, boolean>

export interface Step2SampleMaterial {
  kind: "image"
  imageSrc: string
  alt: string
  caption: string
}

export interface Step2SampleOption {
  key: Step2OptionKey
  label: string
}

export interface Step2SampleCard {
  id: string
  type: Step2SampleKind
  title: string
  material: Step2SampleMaterial
  taskPrompt: string
  options: Step2SampleOption[]
  correctOptionKey: Step2OptionKey
  correctFeedback: string
  incorrectFeedback: string
  feedbackByOption?: Partial<Record<Step2OptionKey, string>>
  explanation: string
  source: {
    sourceType: "network" | "ai_generated"
    sourceTypeLabel: string
    sourceUrl?: string
    sourceLocator?: string
    verificationUrl?: string
    verificationLabel?: string
    verificationTips: string[]
  }
}

export interface Step2StructureLabel {
  key: CardPartKey
  label: string
  hint: string
}
