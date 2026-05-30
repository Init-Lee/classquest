/**
 * 文件说明：模块 4 课时 4 判断选项 key 校验工具。
 * 职责：校验互审试答选项 key 是否合法，避免跨课时 import lesson-3 工具。
 * 更新触发：Module4Lesson3OptionKey 范围变化时，需要同步更新本文件。
 */

import type { Module4Lesson3OptionKey } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

const OPTION_KEYS: Module4Lesson3OptionKey[] = ["A", "B", "C", "D", "E", "F"]

export function isLesson4PeerReviewOptionKey(value: string): value is Module4Lesson3OptionKey {
  return OPTION_KEYS.includes(value as Module4Lesson3OptionKey)
}
