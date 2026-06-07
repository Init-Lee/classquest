/**
 * 文件说明：课时 5 教师控制台会话数据标签页规则。
 * 职责：定义题池/试答/统计/V3 四个标签页的解锁条件、推荐切换与锁定提示文案。
 * 更新触发：session 阶段流转、各面板可读门槛或标签页信息架构变化时，需要同步更新本文件。
 */

import type { Lesson5SessionPhase } from "@/teacher-console/types"

export type Lesson5SessionDataTabId = "pool" | "trial" | "analytics" | "revision"

export interface Lesson5SessionDataTabMeta {
  id: Lesson5SessionDataTabId
  label: string
  description: string
}

export const LESSON5_SESSION_DATA_TABS: Lesson5SessionDataTabMeta[] = [
  {
    id: "pool",
    label: "题池概览",
    description: "查看班级长期 V2 题池与当前会话冻结概览、就绪提示。",
  },
  {
    id: "trial",
    label: "试答进度",
    description: "每 5 秒刷新一次；只显示学生维度进度，不展示答案、解析或来源。",
  },
  {
    id: "analytics",
    label: "统计分析",
    description: "展示 compute-stats 后的题卡级统计；不暴露题卡作者身份。",
  },
  {
    id: "revision",
    label: "V3 观察",
    description: "统计反馈开放后展示学生 V3 计划与准备度；本面板只读观察。",
  },
]

const TRIAL_UNLOCK_PHASES = new Set<Lesson5SessionPhase>([
  "pool_locked",
  "trial_open",
  "trial_locked",
  "analytics_open",
  "revision_open",
  "closed",
])

const ANALYTICS_UNLOCK_PHASES = new Set<Lesson5SessionPhase>([
  "trial_locked",
  "analytics_open",
  "revision_open",
  "closed",
])

const REVISION_UNLOCK_PHASES = new Set<Lesson5SessionPhase>([
  "analytics_open",
  "revision_open",
  "closed",
])

export function isLesson5SessionDataTabUnlocked(
  tabId: Lesson5SessionDataTabId,
  phase: Lesson5SessionPhase | null | undefined,
  hasSession: boolean,
): boolean {
  if (tabId === "pool") return true
  if (!hasSession || !phase) return false
  if (tabId === "trial") return TRIAL_UNLOCK_PHASES.has(phase)
  if (tabId === "analytics") return ANALYTICS_UNLOCK_PHASES.has(phase)
  return REVISION_UNLOCK_PHASES.has(phase)
}

export function getLesson5SessionDataTabLockHint(
  tabId: Lesson5SessionDataTabId,
  phase: Lesson5SessionPhase | null | undefined,
  hasSession: boolean,
): string {
  if (isLesson5SessionDataTabUnlocked(tabId, phase, hasSession)) return ""
  if (!hasSession) return "请先选择或创建一个会话。"
  if (tabId === "trial") {
    return phase === "draft"
      ? "锁定题池后解锁试答进度。"
      : "当前阶段暂不可查看试答进度。"
  }
  if (tabId === "analytics") {
    return "锁定试答后可查看统计分析；请先完成锁池与试答阶段。"
  }
  return "开放统计反馈后可查看 V3 学习任务观察。"
}

export function getRecommendedLesson5SessionDataTab(
  phase: Lesson5SessionPhase | null | undefined,
  hasSession: boolean,
): Lesson5SessionDataTabId {
  if (!hasSession || !phase || phase === "draft") return "pool"
  if (phase === "pool_locked") return "pool"
  if (phase === "trial_open") return "trial"
  if (phase === "trial_locked") return "analytics"
  if (phase === "analytics_open" || phase === "revision_open" || phase === "closed") return "revision"
  return "pool"
}
