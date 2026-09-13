/**
 * 文件说明：模块 1 课时 2 第 2 关关内分页（第一步选参照 / 第二步拆写法）纯函数。
 * 职责：解析 `?round=1|2`、判断第一步是否可前进、第二步是否可进入、第二轮是否显示右箭头/右下角「下一关」，以及整关完成缺项提示。
 * 更新触发：第 2 关子页编号、第一步选定口径、第二轮前进控件或整关完成条件变化时，需要同步更新本文件。
 */

import { MODULE1_LESSON2_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson2-copy"
import {
  canCompleteModule1Lesson2Step2Round1,
  canCompleteModule1Lesson2Step2Round2Fields,
  getModule1Lesson2ActiveReferenceSlot,
  hasModule1Lesson2WritingPlan,
  projectModule1Lesson2Reference,
  type Module1Lesson1State,
  type Module1Lesson2State,
} from "@/modules/module-1-ai-story/domains/portfolio/types"

/** 课时 2 第 3 关（说明选择理由），不是课时 3。 */
export const MODULE1_LESSON2_STEP3_PATH = "/module/1/lesson/2/step/3"

export type Module1Lesson2Step2Round = 1 | 2

export function parseModule1Lesson2Step2Round(value: string | null | undefined): Module1Lesson2Step2Round {
  return value === "2" ? 2 : 1
}

export function buildModule1Lesson2Step2Path(round: Module1Lesson2Step2Round): string {
  return `/module/1/lesson/2/step/2?round=${round}`
}

/** 关内上一页：第一步没有上一页，第二步回到第一步。左箭头不再回第 1 关。 */
export function getModule1Lesson2Step2PrevRound(round: Module1Lesson2Step2Round): Module1Lesson2Step2Round | null {
  return round === 2 ? 1 : null
}

/** 第一步已选定参照且必填满足，或整关已完成，才能进第二步；教师模式不拦。 */
export function canEnterModule1Lesson2Step2Round(
  state: Module1Lesson2State,
  round: Module1Lesson2Step2Round,
  isTeacherMode = false,
): boolean {
  if (round === 1 || isTeacherMode) return true
  if (state.step2Completed) return true
  return canCompleteModule1Lesson2Step2Round1(state)
}

export function canAdvanceModule1Lesson2Step2Round1(state: Module1Lesson2State): boolean {
  return canCompleteModule1Lesson2Step2Round1(state)
}

/** 第一步右侧箭头进入第二轮；第二步不再渲染右箭头。 */
export function shouldShowModule1Lesson2Step2NextArrow(round: Module1Lesson2Step2Round): boolean {
  return round === 1
}

/** 仅第二步右下角显示「下一关」。 */
export function shouldShowModule1Lesson2Step2NextGateButton(round: Module1Lesson2Step2Round): boolean {
  return round === 2
}

function hasCurrentOriginReferenceCore(state: Module1Lesson2State): boolean {
  const reference = projectModule1Lesson2Reference(state.reference)
  const slot = getModule1Lesson2ActiveReferenceSlot(reference)
  return Boolean(
    (reference.origin === "classroom" || reference.origin === "external")
    && slot.workTitle.trim()
    && slot.author.trim()
    && slot.location.trim()
    && slot.excerpt.trim()
    && slot.sourceNote.trim(),
  )
}

/**
 * 第 2 关整体完成：当前 origin 槽完整参照 + 已阅读 + 2—3 条写法；
 * 若点了某轮复制则该轮 AI 回复必填。课堂/自选分槽只看当前 origin。
 */
export function getModule1Lesson2Step2GateBlockReasons(state: Module1Lesson2State): string[] {
  const reasons: string[] = []
  const reference = projectModule1Lesson2Reference(state.reference)
  const slot = getModule1Lesson2ActiveReferenceSlot(reference)

  if (reference.origin === "external" && reference.foundDraft.round1PromptCopied && !reference.foundDraft.recommendationReply.trim()) {
    reasons.push(MODULE1_LESSON2_SHARED_COPY.round1ReplyRequired)
  }
  if (state.round2PromptCopied && !state.analysisReply.trim()) {
    reasons.push(MODULE1_LESSON2_SHARED_COPY.round2ReplyRequired)
  }
  if (!hasCurrentOriginReferenceCore(state)) {
    reasons.push(MODULE1_LESSON2_SHARED_COPY.step2NeedReference)
  } else if (!slot.sourceConfirmed) {
    reasons.push(MODULE1_LESSON2_SHARED_COPY.step2NeedSourceConfirmed)
  }
  if (!hasModule1Lesson2WritingPlan(state)) {
    reasons.push(MODULE1_LESSON2_SHARED_COPY.step2NeedWritingPlan)
  }
  return reasons
}

export function getModule1Lesson2Step2GateBlockReason(state: Module1Lesson2State): string | null {
  const reasons = getModule1Lesson2Step2GateBlockReasons(state)
  return reasons.length === 0 ? null : reasons.join(" ")
}

export function canCompleteModule1Lesson2Step2Gate(state: Module1Lesson2State): boolean {
  if (!canCompleteModule1Lesson2Step2Round2Fields(state)) return false
  if (!hasModule1Lesson2WritingPlan(state)) return false
  const reference = projectModule1Lesson2Reference(state.reference)
  if (reference.origin === "external" && reference.foundDraft.round1PromptCopied && !reference.foundDraft.recommendationReply.trim()) {
    return false
  }
  return true
}

export function hasModule1Lesson2ConfirmedSummary(
  lesson1: Module1Lesson1State,
  lesson2: Module1Lesson2State,
): boolean {
  return Boolean(
    lesson1.sdg.trim()
    || lesson1.cityIssue.trim()
    || lesson1.audience.trim()
    || lesson2.reference.workTitle.trim()
    || lesson2.writingPlan.trim()
    || lesson2.reason.trim()
    || lesson2.character.who.trim(),
  )
}
