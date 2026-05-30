/**
 * 文件说明：模块 4 课时 4 素材来源类型展示文案。
 * 职责：为互审工作台预览/反馈面板提供来源类型中文标签，避免跨课时 import lesson-3 数据。
 * 更新触发：Module4MaterialSourceType 枚举或课堂展示文案变化时，需要同步更新本文件。
 */

import type { Module4MaterialSourceType } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export const LESSON4_SOURCE_TYPE_LABELS: Record<Module4MaterialSourceType, string> = {
  web: "网络来源",
  ai_generated: "AI 生成",
  field_capture: "现场采集",
  mixed: "混合加工",
}
