/**
 * 文件说明：模块 4 课时 4 通关条件计算工具。
 * 职责：按“我的题卡已被审查”和“我已完成一次审查”两个独立条件计算 Step1 gate，不要求互审双方成对。
 * 更新触发：课时 4 通关条件、环形互审规则或 Module4Lesson4State 字段变化时，需要同步更新本文件。
 */

import type { Module4Lesson4State } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export interface Lesson4GateEvaluation {
  outboundReviewed: boolean
  inboundReviewed: boolean
  gatePassed: boolean
}

export function evaluateLesson4Gate(state: Module4Lesson4State): Lesson4GateEvaluation {
  const outboundReviewed = state.outbound.completed
  const inboundReviewed = state.inbound.completed
  return {
    outboundReviewed,
    inboundReviewed,
    gatePassed: outboundReviewed && inboundReviewed,
  }
}

export function applyLesson4Gate(state: Module4Lesson4State): Module4Lesson4State {
  const gate = evaluateLesson4Gate(state)
  return {
    ...state,
    gatePassed: gate.gatePassed,
    step1Completed: gate.gatePassed,
  }
}
