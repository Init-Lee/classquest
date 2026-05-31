/**
 * 文件说明：模块 4 课时 4 V2 就绪评估工具。
 * 职责：综合 Step2 决策与 Step3 V2 确认结果，为 Step4 输出 green/amber/red 就绪状态和分组检查清单。
 * 更新触发：Step4 阻塞规则、清单分组/文案、amber 警告规则、V2 确认条件或 ready_for_lesson5 标准变化时，需要同步更新本文件。
 */

import type {
  Lesson4FeedbackDecision,
  Module4Lesson4V2CardDraft,
  Module4Lesson4V2State,
  Module4MaterialKind,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { evaluateLesson4V2CardReadiness } from "./evaluate-lesson4-v2-card-readiness"
import { areAllCardSectionsPass } from "./get-lesson4-v2-revision-sections"

export type Lesson4ReadyStatus = "green" | "amber" | "red"

export interface Lesson4ReadinessCheck {
  label: string
  passed: boolean
  blocking: boolean
  detail: string
}

export interface Lesson4ReadinessCheckSection {
  title: string
  checks: Lesson4ReadinessCheck[]
}

export interface Lesson4CardReadinessReport {
  cardKind: Module4MaterialKind
  status: Lesson4ReadyStatus
  /** 扁平清单，供状态汇总与测试断言；展示请用 checkSections。 */
  checks: Lesson4ReadinessCheck[]
  checkSections: Lesson4ReadinessCheckSection[]
  messages: string[]
}

export interface Lesson4ReadyForLesson5Evaluation {
  status: Lesson4ReadyStatus
  cards: Record<Module4MaterialKind, Lesson4CardReadinessReport>
  blockingMessages: string[]
}

function buildBaselineChecks({
  readiness,
  confirmed,
  card,
  step2Completed,
  step3Completed,
}: {
  readiness: ReturnType<typeof evaluateLesson4V2CardReadiness>
  confirmed: boolean
  card: Module4Lesson4V2CardDraft
  step2Completed: boolean
  step3Completed: boolean
}): Lesson4ReadinessCheck[] {
  const fieldsComplete = readiness.missing.filter(item => item !== "V2 修改说明").length === 0
  const cardConfirmed = confirmed && card.status === "confirmed"

  return [
    {
      label: "必填字段完整",
      passed: fieldsComplete,
      blocking: true,
      detail: fieldsComplete ? "题卡字段已填写完整" : "仍有必填字段未填写",
    },
    {
      label: "V2 题卡已确认",
      passed: cardConfirmed,
      blocking: true,
      detail: cardConfirmed ? "已在 Step3 确认本题卡" : "请回到 Step3 确认本题卡",
    },
    {
      label: "反馈已收到并完成作者决策",
      passed: step2Completed,
      blocking: true,
      detail: step2Completed ? "Step2 互审反馈已全部处理" : "请回到 Step2 完成作者决策",
    },
    {
      label: "Step3 已完成两卡确认",
      passed: step3Completed,
      blocking: true,
      detail: step3Completed ? "新闻与图片题卡均已在 Step3 确认" : "请回到 Step3 确认两张题卡",
    },
  ]
}

function buildOriginallyOkChecks({
  readiness,
}: {
  readiness: ReturnType<typeof evaluateLesson4V2CardReadiness>
}): Lesson4ReadinessCheck[] {
  const noBlockingFeedback = readiness.unresolvedDecisionIds.length === 0

  return [
    {
      label: "四段互审均为通过",
      passed: true,
      blocking: false,
      detail: "四段均为通过，无需修改",
    },
    {
      label: "互审无必改或安全项",
      passed: noBlockingFeedback,
      blocking: true,
      detail: noBlockingFeedback ? "互审未提出必改或安全反馈" : "仍有必改或安全反馈未解决",
    },
  ]
}

function buildAfterRevisionChecks({
  allSectionsPass,
  card,
  cardDecisions,
  readiness,
  keptMinor,
}: {
  allSectionsPass: boolean
  card: Module4Lesson4V2CardDraft
  cardDecisions: Lesson4FeedbackDecision[]
  readiness: ReturnType<typeof evaluateLesson4V2CardReadiness>
  keptMinor: boolean
}): Lesson4ReadinessCheck[] {
  const checks: Lesson4ReadinessCheck[] = []
  const blockingResolved = readiness.unresolvedDecisionIds.length === 0

  if (!allSectionsPass) {
    checks.push({
      label: "重改/安全反馈已解决",
      passed: blockingResolved,
      blocking: true,
      detail: blockingResolved ? "必改与安全反馈均已处理" : "仍有必改或安全反馈未解决",
    })

    const summaryComplete = card.revision.summary.trim().length > 0
    checks.push({
      label: "修改说明完整",
      passed: summaryComplete,
      blocking: true,
      detail: summaryComplete ? "已填写 V2 整体修改说明" : "请补充 V2 整体修改说明",
    })
  }

  if (keptMinor) {
    const minorReasonRecorded = cardDecisions.every(
      decision => decision.action !== "keep_with_reason" || decision.authorPlan.trim().length > 0,
    )
    checks.push({
      label: "小修保留理由已记录",
      passed: minorReasonRecorded,
      blocking: false,
      detail: minorReasonRecorded ? "小修保留项已说明理由" : "请为保留的小修项补充理由",
    })
  }

  return checks
}

function buildCardReport(
  card: Module4Lesson4V2CardDraft,
  confirmed: boolean,
  decisions: Lesson4FeedbackDecision[],
  step2Completed: boolean,
  step3Completed: boolean,
): Lesson4CardReadinessReport {
  const readiness = evaluateLesson4V2CardReadiness(card, decisions)
  const cardDecisions = decisions.filter(decision => decision.cardKind === card.kind)
  const allSectionsPass = areAllCardSectionsPass(decisions, card, card.kind)
  const keptMinor = cardDecisions.some(decision => decision.level === "minor_fix" && decision.action === "keep_with_reason")
  const baselineChecks = buildBaselineChecks({ readiness, confirmed, card, step2Completed, step3Completed })
  const afterRevisionChecks = buildAfterRevisionChecks({
    allSectionsPass,
    card,
    cardDecisions,
    readiness,
    keptMinor,
  })

  const checkSections: Lesson4ReadinessCheckSection[] = allSectionsPass && !keptMinor
    ? [{ title: "原本即 OK", checks: [...buildOriginallyOkChecks({ readiness }), ...baselineChecks] }]
    : [
      ...(afterRevisionChecks.length > 0
        ? [{ title: "修改与确认", checks: afterRevisionChecks }]
        : []),
      {
        title: allSectionsPass ? "原本即 OK" : "基础就绪",
        checks: allSectionsPass
          ? [...buildOriginallyOkChecks({ readiness }), ...baselineChecks]
          : baselineChecks,
      },
    ]

  const checks = checkSections.flatMap(section => section.checks)
  const blocking = checks.filter(check => check.blocking && !check.passed)

  return {
    cardKind: card.kind,
    status: blocking.length > 0 ? "red" : keptMinor ? "amber" : "green",
    checks,
    checkSections,
    messages: [
      ...readiness.missing.map(item => `缺少${item}`),
      ...readiness.unresolvedDecisionIds.map(() => "仍有重改或安全反馈未解决"),
    ],
  }
}

export function evaluateLesson4ReadyForLesson5({
  v2,
  decisions,
  step2Completed,
  step3Completed,
}: {
  v2: Module4Lesson4V2State
  decisions: Lesson4FeedbackDecision[]
  step2Completed: boolean
  step3Completed: boolean
}): Lesson4ReadyForLesson5Evaluation {
  const news = buildCardReport(v2.newsCard, v2.newsConfirmed, decisions, step2Completed, step3Completed)
  const image = buildCardReport(v2.imageCard, v2.imageConfirmed, decisions, step2Completed, step3Completed)
  const cards = { news, image }
  const blockingMessages = [news, image].flatMap(report => report.status === "red" ? report.messages : [])
  const status: Lesson4ReadyStatus = [news.status, image.status].includes("red")
    ? "red"
    : [news.status, image.status].includes("amber") ? "amber" : "green"

  return { status, cards, blockingMessages }
}
