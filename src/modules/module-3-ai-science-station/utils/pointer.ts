/**
 * 文件说明：进度指针工具函数
 * 职责：提供进度指针的安全更新逻辑，确保指针只前进不后退；
 *       以及根据实际完成状态修正导入文件中可能过期的指针。
 * 更新触发：新增课时或进度指针规则调整时；修复指针倒退 BUG 相关逻辑时。
 */

import type { ProgressPointer } from "@/modules/module-3-ai-science-station/domains/progress/types"
import type { ModulePortfolio } from "@/modules/module-3-ai-science-station/domains/portfolio/types"

/**
 * 进度指针只前进不后退。
 *
 * 当新的 lessonId/stepId 比当前指针更靠前（课时更小或步骤更小）时，
 * 忽略本次更新并返回原始指针，避免用户回退编辑时误将指针倒拨。
 */
export function advancePointer(
  current: ProgressPointer,
  lessonId: 1 | 2 | 3 | 4 | 5 | 6,
  stepId: number
): ProgressPointer {
  const isAhead =
    lessonId > current.lessonId ||
    (lessonId === current.lessonId && stepId > current.stepId)

  if (isAhead) {
    return { lessonId, stepId, updatedAt: new Date().toISOString() }
  }
  return current
}

/**
 * 根据档案实际完成状态修正进度指针。
 *
 * 导入的继续学习包可能含有过期指针（如保存时指针在课时1第2关，
 * 但档案数据实际已完成课时2），此函数检测后自动将指针推进到
 * 与实际完成状态相符的最低合理位置，避免用户导入后被引导至错误关卡。
 */
export function resolvePointerFromState(portfolio: ModulePortfolio): ProgressPointer {
  const now = new Date().toISOString()
  const p = portfolio.pointer

  /**
   * 必须从「更高课时已完成」向下判断，否则会出现：
   * 课时3已完成时直接 return {3,5}，导致课时4/5 已完成但指针仍被锁在课时3的 BUG。
   * 同理：课时6已完成时必须先于课时5判断，否则指针会错误停在 {5,2}。
   */
  // 课时6已完成 → 指针至少应为 {6, 2}（课时6共2关）
  if (portfolio.lesson6?.completed) {
    if (p.lessonId < 6 || (p.lessonId === 6 && p.stepId < 2)) {
      return { lessonId: 6, stepId: 2, updatedAt: now }
    }
    return p
  }

  // 课时5已完成 → 指针至少应为 {5, 2}（课时5共2关）
  if (portfolio.lesson5?.completed) {
    if (p.lessonId < 5 || (p.lessonId === 5 && p.stepId < 2)) {
      return { lessonId: 5, stepId: 2, updatedAt: now }
    }
    return p
  }

  // 课时4已完成 → 指针至少应为 {4, 5}（课时4共5关；若下一课开放则由注册表层再推进到 {5,1}）
  if (portfolio.lesson4?.completed) {
    if (p.lessonId < 4 || (p.lessonId === 4 && p.stepId < 5)) {
      return { lessonId: 4, stepId: 5, updatedAt: now }
    }
    return p
  }

  // 课时3已完成 → 指针至少应为 {3, 5}（课时3共5关）
  if (portfolio.lesson3?.completed) {
    if (p.lessonId < 3 || (p.lessonId === 3 && p.stepId < 5)) {
      return { lessonId: 3, stepId: 5, updatedAt: now }
    }
    return p
  }

  // 课时3第2关已完成 → 指针至少应为 {3, 2}
  if (portfolio.lesson3?.toolboxCompleted) {
    if (p.lessonId < 3 || (p.lessonId === 3 && p.stepId < 2)) {
      return { lessonId: 3, stepId: 2, updatedAt: now }
    }
    return p
  }

  // 课时3第1关已确认 → 指针至少应为 {3, 1}
  if (portfolio.lesson3?.missionAcknowledged) {
    if (p.lessonId < 3) {
      return { lessonId: 3, stepId: 1, updatedAt: now }
    }
    return p
  }

  // 课时2已完成 → 指针至少应为 {2, 5}（课时2共5关）
  if (portfolio.lesson2?.completed) {
    if (p.lessonId < 2 || (p.lessonId === 2 && p.stepId < 5)) {
      return { lessonId: 2, stepId: 5, updatedAt: now }
    }
    return p
  }

  // 课时1已完成（但课时2未完成）→ 指针至少应为 {2, 1}
  if (portfolio.lesson1?.completed) {
    if (p.lessonId < 2) {
      return { lessonId: 2, stepId: 1, updatedAt: now }
    }
    return p
  }

  return p
}
