/**
 * 文件说明：课时 1 来源类型说明数据。
 * 职责：列出模块 4 题目卡可接受的四类来源记录要求，供 Step 5 任务确认与后续题卡创作复用。
 * 更新触发：来源类型、来源记录要求或可信发布规则变化时，需要同步更新本文件。
 */

import type { SourceType } from "@/modules/module-4-ai-info-detective/domains/question-card/types"

export interface SourceTypeDefinition {
  key: SourceType
  title: string
  requirement: string
}

export const SOURCE_TYPES: SourceTypeDefinition[] = [
  {
    key: "web",
    title: "网络来源",
    requirement: "填写链接或平台名称。",
  },
  {
    key: "ai_generated",
    title: "AI 生成",
    requirement: "填写 Prompt 摘要或生成截图说明。",
  },
  {
    key: "field_capture",
    title: "现场采集",
    requirement: "填写拍摄时间地点或采集方式。",
  },
  {
    key: "mixed",
    title: "混合加工",
    requirement: "填写改写、拼接或二次生成说明。",
  },
]
