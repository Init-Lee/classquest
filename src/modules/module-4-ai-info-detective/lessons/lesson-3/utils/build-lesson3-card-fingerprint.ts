/**
 * 文件说明：模块 4 课时 3 题卡内容指纹工具。
 * 职责：为单张 V1 题卡生成轻量 contentFingerprint，供第 4 步自测确认与编辑后失效判定使用。
 * 更新触发：题卡四部分字段、选项结构或指纹拼接策略变化时，需要同步更新本文件。
 */

import type { Module4Lesson3QuestionCardDraft } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

/** 根据题卡当前可编辑内容生成稳定指纹字符串 */
export function buildLesson3CardContentFingerprint(card: Module4Lesson3QuestionCardDraft): string {
  const options = card.task.options.map(option => [
    option.key,
    option.label,
    option.rationale ?? "",
  ].join("|")).join(";")

  return [
    card.material.titleOrName,
    card.material.displayNote,
    card.material.assetFingerprint,
    card.task.prompt,
    options,
    card.task.correctOptionKey ?? "",
    card.explanation.text,
    card.source.sourceType ?? "",
    card.source.sourceRecord,
    card.source.verificationNote,
  ].join("::")
}
