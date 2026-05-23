/**
 * 文件说明：模块 4 课时 3 默认选项与来源类型数据。
 * 职责：集中提供题目卡 V1 的判断选项 key 常量、默认 A/B/C 文案与增减选项工具，供编辑器、预览和自检复用。
 * 更新触发：课时 3 题目选项 key 范围、默认文案、来源类型枚举或展示文案变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson3OptionKey,
  Module4MaterialSourceType,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import type { JudgmentOption } from "@/modules/module-4-ai-info-detective/domains/question-card/types"

/** 课时 3 判断题可选 key，顺序即追加顺序 */
export const LESSON3_OPTION_KEYS: Module4Lesson3OptionKey[] = ["A", "B", "C", "D", "E", "F"]

/** 与 LESSON3_OPTION_KEYS 对齐，供外部引用 */
export const OPTION_KEYS = LESSON3_OPTION_KEYS

export const LESSON3_MIN_OPTIONS = 3
export const LESSON3_MAX_OPTIONS = 6

/** @deprecated 请使用 LESSON3_MAX_OPTIONS */
export const MAX_OPTIONS = LESSON3_MAX_OPTIONS

export const LESSON3_DEFAULT_OPTIONS: JudgmentOption[] = [
  { key: "A", label: "明显存在 AI 痕迹" },
  { key: "B", label: "暂无明显 AI 痕迹" },
  { key: "C", label: "证据不足，仍需核验" },
]

/** 与 LESSON3_DEFAULT_OPTIONS 同义，兼容旧命名 */
export const LESSON3_DEFAULT_JUDGMENT_OPTIONS = LESSON3_DEFAULT_OPTIONS

export function isLesson3OptionKey(value: string): value is Module4Lesson3OptionKey {
  return LESSON3_OPTION_KEYS.includes(value as Module4Lesson3OptionKey)
}

export function appendLesson3Option(options: JudgmentOption[]): JudgmentOption[] {
  if (options.length >= LESSON3_MAX_OPTIONS) return options
  const nextKey = LESSON3_OPTION_KEYS[options.length]
  return [...options, { key: nextKey, label: "" }]
}

export function removeLastLesson3Option(
  options: JudgmentOption[],
  correctOptionKey?: Module4Lesson3OptionKey,
): { options: JudgmentOption[]; correctOptionKey?: Module4Lesson3OptionKey } {
  if (options.length <= LESSON3_MIN_OPTIONS) {
    return { options, correctOptionKey }
  }
  const removedKey = options[options.length - 1]?.key
  const nextOptions = options.slice(0, -1)
  const nextCorrect = removedKey && correctOptionKey === removedKey ? undefined : correctOptionKey
  return { options: nextOptions, correctOptionKey: nextCorrect }
}

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
