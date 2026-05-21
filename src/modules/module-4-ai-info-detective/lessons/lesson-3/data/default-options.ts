/**
 * 文件说明：模块 4 课时 3 默认选项与来源类型数据。
 * 职责：集中提供题目卡 V1 的固定三选项和四类来源文案，供编辑器、预览和自检复用。
 * 更新触发：课时 3 题目选项、来源类型枚举或展示文案变化时，需要同步更新本文件。
 */

import type { Module4MaterialSourceType } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import type { JudgmentOption } from "@/modules/module-4-ai-info-detective/domains/question-card/types"

export const LESSON3_DEFAULT_OPTIONS: JudgmentOption[] = [
  { key: "A", label: "明显存在 AI 痕迹" },
  { key: "B", label: "暂无明显 AI 痕迹" },
  { key: "C", label: "证据不足，仍需核验" },
]

export const LESSON3_SOURCE_TYPE_OPTIONS: Array<{ value: Module4MaterialSourceType; label: string; hint: string }> = [
  { value: "web", label: "网络来源", hint: "填写链接、平台、栏目、发布时间等可追溯信息。" },
  { value: "ai_generated", label: "AI 生成", hint: "说明生成工具、Prompt 摘要、生成时间或生成记录。" },
  { value: "field_capture", label: "现场采集", hint: "说明拍摄时间、地点、采集方式或采集者备注。" },
  { value: "mixed", label: "混合加工", hint: "说明原始来源，以及裁剪、拼接、二次生成等加工方式。" },
]

export const LESSON3_SOURCE_TYPE_LABELS: Record<Module4MaterialSourceType, string> = {
  web: "网络来源",
  ai_generated: "AI 生成",
  field_capture: "现场采集",
  mixed: "混合加工",
}
