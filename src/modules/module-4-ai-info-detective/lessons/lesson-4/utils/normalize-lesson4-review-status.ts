/**
 * 文件说明：模块 4 课时 4 互审状态文案工具。
 * 职责：把出站和入站互审状态转换为学生可读文案，避免组件内重复散落状态标签。
 * 更新触发：课时 4 状态机、状态枚举或页面展示文案变化时，需要同步更新本文件。
 */

import type { Lesson4InboundStatus, Lesson4OutboundStatus } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export function getLesson4OutboundStatusLabel(status: Lesson4OutboundStatus): string {
  const labels: Record<Lesson4OutboundStatus, string> = {
    not_sent: "未送审",
    pending: "等待领取",
    claimed: "审查中",
    submitted: "待拉取反馈",
    pulled: "已收到反馈",
    cancelled: "已撤回",
    expired: "已过期",
  }
  return labels[status]
}

export function getLesson4InboundStatusLabel(status: Lesson4InboundStatus): string {
  const labels: Record<Lesson4InboundStatus, string> = {
    idle: "待刷新",
    available: "可领取",
    claimed: "正在审查",
    submitted: "已提交反馈",
    expired: "已过期",
  }
  return labels[status]
}

/** 收件箱任务或 API 返回的 request 状态（pending/claimed/expired 等）统一中文文案。 */
export function getLesson4RequestStatusLabel(
  status: Extract<Lesson4OutboundStatus, "pending" | "claimed" | "expired">,
): string {
  return getLesson4OutboundStatusLabel(status)
}
