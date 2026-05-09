/**
 * 文件说明：模块 4 课时 2 素材完成度判定工具。
 * 职责：集中判断新闻或图片素材记录是否达到进入下一课所需的基础准备条件，供工作台、报告页和 QuickCheck 复用。
 * 更新触发：课时 2 必填字段、四关复判、来源格式规则、自检项或线索笔记最低要求变化时，需要同步更新本文件。
 */

import type { Module4MaterialScreeningRecord } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export function isValidLesson2Note(value: string): boolean {
  const text = value.trim().replace(/\s+/g, "")
  if (text.length < 8) return false
  return !["无", "没有", "不知道", "不清楚", "随便", "无明显问题", "看不出来"].includes(text)
}

export function isLesson2MaterialComplete(record: Module4MaterialScreeningRecord): boolean {
  return Boolean(record.asset)
    && Boolean(record.postCriteriaStatus)
    && record.titleOrName.trim().length > 0
    && Boolean(record.sourceType)
    && record.sourceRecord.trim().length > 0
    && record.sourceAutoPassed
    && record.selfChecks.typeFits
    && record.selfChecks.contentCompliant
    && record.selfChecks.hasJudgmentValue
    && isValidLesson2Note(record.clueNote)
    && isValidLesson2Note(record.peerFeedbackNote)
}
