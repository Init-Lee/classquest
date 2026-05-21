/**
 * 文件说明：模块 4 课时 3 单张题卡自审工具。
 * 职责：根据题卡 V1 的素材、题干、答案、解析和来源字段生成嵌入式自审状态。
 * 更新触发：题卡必填字段、解析字数建议或自审指标变化时，需要同步更新本文件。
 */

import type { Module4Lesson3CardSelfCheck, Module4Lesson3QuestionCardDraft } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export function evaluateLesson3SelfCheck(card: Module4Lesson3QuestionCardDraft): Module4Lesson3CardSelfCheck {
  const materialReady = card.material.titleOrName.trim().length > 0 && Boolean(card.material.asset || card.material.displayNote.trim())
  const taskReady = card.task.prompt.trim().length > 0 && card.task.options.length === 3
  const answerSelected = card.task.correctOptionKey === "A" || card.task.correctOptionKey === "B" || card.task.correctOptionKey === "C"
  const explanationLength = card.explanation.text.trim().length
  const explanationReady = explanationLength >= 20 && !/我觉得像\s*AI|我感觉像\s*AI/.test(card.explanation.text)
  const sourceReady = Boolean(card.source.sourceType) && card.source.sourceRecord.trim().length >= 6
  const verificationReady = card.source.verificationNote.trim().length >= 8

  return {
    materialReady,
    taskReady,
    answerSelected,
    explanationReady,
    sourceReady,
    verificationReady,
    allRequiredPassed: materialReady && taskReady && answerSelected && explanationReady && sourceReady && verificationReady,
    lastCheckedAt: new Date().toISOString(),
  }
}
