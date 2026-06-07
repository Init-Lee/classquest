/**
 * 文件说明：模块 4 课时 5 V3 提交前校验工具。
 * 职责：检查 Step4 修订题卡与 revisionPlan 的最低完整度，返回可展示给学生的中文缺失项。
 * 更新触发：后端 V3 提交必填字段、revisionPlan 字段、课时 6 准备规则或 Step4 提交门槛变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson4V2CardDraft,
  Module4Lesson5RevisionPlanState,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export interface Lesson5V3SubmissionValidation {
  valid: boolean
  missing: string[]
}

export function validateLesson5V3Submission(
  card: Module4Lesson4V2CardDraft,
  revisionPlan: Module4Lesson5RevisionPlanState,
): Lesson5V3SubmissionValidation {
  const missing: string[] = []
  if (!["keep", "minor_fix", "major_fix"].includes(revisionPlan.revisionAction)) missing.push("修订动作")
  if (!card.material.titleOrName.trim()) missing.push("素材短名")
  if (!card.material.displayNote.trim()) missing.push("素材展示说明")
  if (!card.task.prompt.trim()) missing.push("判断任务")
  if (card.task.options.length < 2) missing.push("至少 2 个选项")
  if (!card.task.correctOptionKey) missing.push("参考答案")
  if (!card.explanation.text.trim()) missing.push("核心解析")
  if (!card.source.sourceRecord.trim() && !card.source.verificationNote.trim()) missing.push("来源记录或核验说明")
  if (revisionPlan.selectedProblems.length === 0 && !revisionPlan.evidence.trim()) missing.push("诊断问题或证据")
  if (!revisionPlan.revisionReason.trim()) missing.push("修订原因")
  if (!revisionPlan.expectedEffect.trim()) missing.push("预期效果")

  return {
    valid: missing.length === 0,
    missing,
  }
}
