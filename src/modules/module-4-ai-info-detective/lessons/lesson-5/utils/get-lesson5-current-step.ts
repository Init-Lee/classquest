/**
 * 文件说明：模块 4 课时 5 当前步骤工具。
 * 职责：为课时注册表提供 lesson5 当前步骤解析入口，统计开放后指向 Step3，Step4 从报告页进入。
 * 更新触发：课时 5 新增 Step2+、analytics_open 进入条件、完成判定或进度指针规则变化时，需要同步更新本文件。
 */

import type { Module4Lesson5State } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { isLesson5Step4Complete } from "./is-lesson5-step4-complete"

export function getLesson5CurrentStep(state?: Module4Lesson5State): number {
  if (isLesson5Step4Complete(state)) return 4
  if (
    state?.connectedSession?.phase === "analytics_open"
    || state?.connectedSession?.phase === "revision_open"
    || state?.connectedSession?.phase === "closed"
  ) return 3
  return state?.submissionSummary ? 2 : 1
}
