/**
 * 文件说明：模块 4 课时 4 第 1 关同伴互审中转站。
 * 职责：渲染作者送审与审查者领取；claim 题卡经 coerce 写入 portfolio.inbound.claimedRequestJson，并用 ref 兜底展示；两阶段互审工作台由 peer-review-workbench 编排。
 * 更新触发：课时 4 Step1 流程、adapter 契约、页面级同步横幅、inbound/outbound 重置与 hydrate/轮询策略、审查草稿 reviewDraftJson 持久化、通关条件或表单校验规则变化时，需要同步更新本文件。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/shared/ui/button"
import type {
  Module4Lesson4ReviewJson,
  Module4Lesson4ReviewRequestJson,
  Module4Lesson4State,
  Module4MaterialKind,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { coerceLesson4ReviewRequestJson } from "@/modules/module-4-ai-info-detective/api/coerce-lesson4-review-request-json"
import {
  createEmptyModule4Lesson4State,
  createEmptyModule4Lesson4ReviewJson,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import type { Lesson4ReviewerInboxTask } from "@/modules/module-4-ai-info-detective/api/types"
import {
  claimReviewRequest,
  createReviewRequest,
  cancelReviewRequest,
  fetchReviewerInbox,
  fetchReviewRequestStatus,
  isLesson4PeerReviewHttpMode,
  lesson4PeerReviewFixture,
  Lesson4PeerReviewHttpError,
  pullReviewFeedback,
  submitReviewFeedback,
} from "@/modules/module-4-ai-info-detective/api/lesson4-peer-review.adapter"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import {
  patchLesson4TeacherDemoPreset,
  type Lesson4TeacherDemoPresetId,
} from "@/modules/module-4-ai-info-detective/app/lesson4-teacher-demo-presets"
import { Lesson4StepLayout } from "../components/Lesson4StepLayout"
import { Lesson4SyncBanner } from "../components/Lesson4SyncBanner"
import { PeerReviewGateStatus } from "../components/PeerReviewGateStatus"
import { OutboundReviewPanel } from "../components/OutboundReviewPanel"
import { InboundReviewPanel } from "../components/InboundReviewPanel"
import { PeerReviewWorkbench } from "../components/PeerReviewWorkbench"
import { buildLesson4ReviewRequestJson } from "../utils/build-lesson4-review-request"
import { deriveLesson4ClassId } from "../utils/derive-lesson4-class-id"
import { applyLesson4Gate, evaluateLesson4Gate } from "../utils/evaluate-lesson4-gate"
import { createResetLesson4Inbound } from "../utils/reset-lesson4-inbound"
import { createResetLesson4Outbound } from "../utils/reset-lesson4-outbound"
import {
  classifyLesson4PeerReviewError,
  isLesson4OfflinePeerReviewError,
  isLesson4ReviewerSubmissionConfirmed,
  isLesson4StalePeerReviewError,
  isLesson4TerminalReviewStatus,
  type Lesson4SyncPhase,
} from "../utils/lesson4-sync-status"
import {
  moderateLesson4ReviewCard,
} from "@/modules/module-4-ai-info-detective/api/lesson4-review-moderation.adapter"
import type { Lesson4ReviewModerationByField } from "../utils/lesson4-review-moderation-local"
import type { Lesson4ReviewFieldKey } from "../utils/collect-lesson4-review-texts"
import {
  detectChangedReviewFieldKeys,
  omitReviewFieldIssues,
} from "../utils/detect-changed-review-field-keys"
import {
  validateLesson4ReviewCardFeedback,
  validateLesson4ReviewFeedback,
} from "../utils/validate-lesson4-review-feedback"

const PEER_REVIEW_POLL_MS = 20_000
const REVIEW_DRAFT_SAVE_DEBOUNCE_MS = 400
const AUTHOR_ACTIVE_OUTBOUND_CONFLICT = "你已有未完成的送审，请等待当前互审结束后再发起。"

function validateReviewerSeatSuffix(raw: string): string | null {
  if (!/^\d{2}$/.test(raw)) {
    return "请输入同伴学号后两位（01～50）。"
  }
  const seat = Number.parseInt(raw, 10)
  if (!Number.isFinite(seat) || seat < 1 || seat > 50) {
    return "同伴学号后两位须在 01～50 之间。"
  }
  return null
}

export default function Step1PeerReviewRelay() {
  const { portfolio, savePortfolio, isTeacherMode } = useModule4Portfolio()
  const [targetSeatSuffix, setTargetSeatSuffix] = useState("")
  const [reviewCode, setReviewCode] = useState("")
  /** HTTP 进页 hydrate 前勿用 fixture.serverNow，否则与 portfolio 中真实 pendingExpiresAt 相差数小时。 */
  const [serverNow, setServerNow] = useState(() =>
    isLesson4PeerReviewHttpMode() ? "" : lesson4PeerReviewFixture.serverNow,
  )
  const [tasks, setTasks] = useState<Lesson4ReviewerInboxTask[]>([])
  const [reviewJson, setReviewJson] = useState<Module4Lesson4ReviewJson>(() => createEmptyModule4Lesson4ReviewJson())
  const [outboundError, setOutboundError] = useState("")
  const [inboundError, setInboundError] = useState("")
  const [validationMessage, setValidationMessage] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Lesson4ReviewFieldKey, string>>>({})
  const [cardSubmitSuccessMessage, setCardSubmitSuccessMessage] = useState("")
  const [activeReviewKind, setActiveReviewKind] = useState<Module4MaterialKind>("news")
  const [finalSubmitMessage, setFinalSubmitMessage] = useState("")
  const [aiModerating, setAiModerating] = useState(false)
  const [aiUnavailableMessage, setAiUnavailableMessage] = useState("")
  const [moderationByField, setModerationByField] = useState<Lesson4ReviewModerationByField>({})
  const [syncPhase, setSyncPhase] = useState<Lesson4SyncPhase>("idle")
  const [serverReachable, setServerReachable] = useState(false)
  const [busy, setBusy] = useState(false)
  const syncOkTimerRef = useRef<number | null>(null)
  const syncStaleTimerRef = useRef<number | null>(null)
  const portfolioRef = useRef(portfolio)
  portfolioRef.current = portfolio
  /** claim 成功后立即持有题卡 JSON，避免 normalize/持久化竞态导致工作台空白。 */
  const claimedRequestJsonRef = useRef<Module4Lesson4ReviewRequestJson | null>(null)
  /** 每个 claimed requestId 仅从 portfolio 恢复一次 reviewDraftJson，避免防抖回写触发重复 hydrate。 */
  const hydratedReviewDraftRequestIdRef = useRef<string | null>(null)
  const reviewDraftSaveTimerRef = useRef<number | null>(null)
  const pendingReviewDraftRef = useRef<Module4Lesson4ReviewJson | null>(null)
  const reviewJsonRef = useRef(reviewJson)
  reviewJsonRef.current = reviewJson

  /** 每个 requestId 仅 hydrate 一次 status，避免 savePortfolio 或 poll 重复触发。 */
  const hydratedOutboundRequestIdRef = useRef<string | null>(null)
  /** 审查者 inbox 进页 hydrate：每个 classSeatCode 仅拉一次。 */
  const hydratedInboxSeatCodeRef = useRef<string | null>(null)
  /** 审查者 claimed 进页 hydrate：每个 requestId 仅拉一次 status 补齐 reviewExpiresAt。 */
  const hydratedInboundClaimedRequestIdRef = useRef<string | null>(null)
  /** 审查者 submitted 进页 hydrate：每个 requestId 仅与 SQLite 对齐一次。 */
  const hydratedInboundSubmittedRequestIdRef = useRef<string | null>(null)
  /** 作者侧 create 409 或本地 cancelled/expired 时，用 status 端点对齐 portfolio 与 DB（每个 requestId 仅一次）。 */
  const reconciledOutboundRequestIdRef = useRef<string | null>(null)

  const gate = useMemo(() => evaluateLesson4Gate(portfolio?.lesson4 ?? createEmptyModule4Lesson4State()), [portfolio?.lesson4])
  const httpMode = isLesson4PeerReviewHttpMode()

  const reportSyncStart = useCallback(() => {
    if (!httpMode) return
    setSyncPhase("syncing")
  }, [httpMode])

  const reportSyncSuccess = useCallback(() => {
    if (!httpMode) return
    setServerReachable(true)
    setSyncPhase("ok")
    if (syncOkTimerRef.current != null) window.clearTimeout(syncOkTimerRef.current)
    syncOkTimerRef.current = window.setTimeout(() => {
      setSyncPhase(previous => (previous === "ok" ? "idle" : previous))
    }, 3000)
  }, [httpMode])

  const reportSyncStaleReset = useCallback(() => {
    if (!httpMode) return
    setServerReachable(true)
    setSyncPhase("stale_reset")
    if (syncStaleTimerRef.current != null) window.clearTimeout(syncStaleTimerRef.current)
    syncStaleTimerRef.current = window.setTimeout(() => {
      setSyncPhase(previous => (previous === "stale_reset" ? "idle" : previous))
    }, 5000)
  }, [httpMode])

  const reportSyncOffline = useCallback(() => {
    if (!httpMode) return
    setServerReachable(false)
    setSyncPhase("offline")
  }, [httpMode])

  /** 静默 hydrate 遇业务错误：不标 ok/offline，仅结束 syncing 横幅。 */
  const reportSyncIdle = useCallback(() => {
    if (!httpMode) return
    setSyncPhase(previous => (previous === "syncing" ? "idle" : previous))
  }, [httpMode])

  useEffect(() => {
    return () => {
      if (syncOkTimerRef.current != null) window.clearTimeout(syncOkTimerRef.current)
      if (syncStaleTimerRef.current != null) window.clearTimeout(syncStaleTimerRef.current)
      if (reviewDraftSaveTimerRef.current != null) {
        window.clearTimeout(reviewDraftSaveTimerRef.current)
        const pending = pendingReviewDraftRef.current
        const current = portfolioRef.current
        if (pending && current?.lesson4.inbound.status === "claimed") {
          void savePortfolio({
            ...current,
            progress: { lessonId: 4, stepId: 1 },
            lesson4: applyLesson4Gate({
              ...current.lesson4,
              inbound: { ...current.lesson4.inbound, reviewDraftJson: pending },
            }),
          })
        }
      }
    }
  }, [savePortfolio])

  const persistReviewDraft = useCallback(async (draft: Module4Lesson4ReviewJson) => {
    const current = portfolioRef.current
    if (!current || current.lesson4.inbound.status !== "claimed") return
    await savePortfolio({
      ...current,
      progress: { lessonId: 4, stepId: 1 },
      lesson4: applyLesson4Gate({
        ...current.lesson4,
        inbound: {
          ...current.lesson4.inbound,
          reviewDraftJson: draft,
        },
      }),
    })
  }, [savePortfolio])

  const schedulePersistReviewDraft = useCallback((draft: Module4Lesson4ReviewJson) => {
    pendingReviewDraftRef.current = draft
    if (reviewDraftSaveTimerRef.current != null) window.clearTimeout(reviewDraftSaveTimerRef.current)
    reviewDraftSaveTimerRef.current = window.setTimeout(() => {
      reviewDraftSaveTimerRef.current = null
      const next = pendingReviewDraftRef.current
      if (next) void persistReviewDraft(next)
    }, REVIEW_DRAFT_SAVE_DEBOUNCE_MS)
  }, [persistReviewDraft])

  const handleReviewJsonChange = useCallback((next: Module4Lesson4ReviewJson) => {
    const changedFieldKeys = detectChangedReviewFieldKeys(reviewJsonRef.current, next)
    if (changedFieldKeys.length > 0) {
      setFieldErrors(previous => omitReviewFieldIssues(previous, changedFieldKeys))
      setModerationByField(previous => omitReviewFieldIssues(previous, changedFieldKeys))
    }
    setReviewJson(next)
    setCardSubmitSuccessMessage("")
    setAiUnavailableMessage("")
    if (changedFieldKeys.length > 0) {
      setValidationMessage("")
    }
    schedulePersistReviewDraft(next)
  }, [schedulePersistReviewDraft])

  const persistResetOutbound = useCallback(async () => {
    const current = portfolioRef.current
    if (!current) return
    hydratedOutboundRequestIdRef.current = null
    reconciledOutboundRequestIdRef.current = null
    await savePortfolio({
      ...current,
      progress: { lessonId: 4, stepId: 1 },
      lesson4: applyLesson4Gate({
        ...current.lesson4,
        outbound: createResetLesson4Outbound(),
      }),
    })
  }, [savePortfolio])

  const persistResetInbound = useCallback(async () => {
    const current = portfolioRef.current
    if (!current) return
    hydratedInboundClaimedRequestIdRef.current = null
    hydratedInboundSubmittedRequestIdRef.current = null
    hydratedReviewDraftRequestIdRef.current = null
    claimedRequestJsonRef.current = null
    pendingReviewDraftRef.current = null
    if (reviewDraftSaveTimerRef.current != null) {
      window.clearTimeout(reviewDraftSaveTimerRef.current)
      reviewDraftSaveTimerRef.current = null
    }
    setReviewJson(createEmptyModule4Lesson4ReviewJson())
    setTasks([])
    await savePortfolio({
      ...current,
      progress: { lessonId: 4, stepId: 1 },
      lesson4: applyLesson4Gate({
        ...current.lesson4,
        inbound: createResetLesson4Inbound(),
      }),
    })
  }, [savePortfolio])

  useEffect(() => {
    const stored = portfolio?.lesson4.inbound.claimedRequestJson
    if (stored) {
      claimedRequestJsonRef.current = stored
    } else if (portfolio?.lesson4.inbound.status !== "claimed") {
      claimedRequestJsonRef.current = null
    }
  }, [portfolio?.lesson4.inbound.claimedRequestJson, portfolio?.lesson4.inbound.status])

  /** claimed 且 requestId 变化时，从 portfolio 恢复审查草稿（每 requestId 仅一次）。 */
  useEffect(() => {
    if (portfolio?.lesson4.inbound.status !== "claimed") {
      hydratedReviewDraftRequestIdRef.current = null
      return
    }
    const requestId = portfolio.lesson4.inbound.requestId
    if (!requestId || hydratedReviewDraftRequestIdRef.current === requestId) return
    hydratedReviewDraftRequestIdRef.current = requestId
    setReviewJson(portfolio.lesson4.inbound.reviewDraftJson ?? createEmptyModule4Lesson4ReviewJson())
  }, [
    portfolio?.lesson4.inbound.requestId,
    portfolio?.lesson4.inbound.reviewDraftJson,
    portfolio?.lesson4.inbound.status,
  ])

  const applyOutboundStatusResponse = useCallback(async (
    response: Awaited<ReturnType<typeof fetchReviewRequestStatus>>,
  ) => {
    const current = portfolioRef.current
    if (!current) return
    setServerNow(response.serverNow)
    if (isLesson4TerminalReviewStatus(response.status)) {
      await persistResetOutbound()
      return
    }
    await savePortfolio({
      ...current,
      progress: { lessonId: 4, stepId: 1 },
      lesson4: applyLesson4Gate({
        ...current.lesson4,
        outbound: {
          ...current.lesson4.outbound,
          status: response.status,
          reviewExpiresAt: response.reviewExpiresAt ?? current.lesson4.outbound.reviewExpiresAt,
          pendingExpiresAt: response.pendingExpiresAt ?? current.lesson4.outbound.pendingExpiresAt,
          receivedReviewJson: response.reviewJson ?? current.lesson4.outbound.receivedReviewJson,
          completed: response.status === "pulled",
        },
      }),
    })
  }, [persistResetOutbound, savePortfolio])

  const refreshOutboundStatusRef = useRef<(userInitiated?: boolean) => Promise<void>>(async () => {})
  refreshOutboundStatusRef.current = async (userInitiated = false) => {
    const current = portfolioRef.current
    if (!current?.lesson4.outbound.requestId) return
    if (userInitiated) setOutboundError("")
    reportSyncStart()
    try {
      const response = await fetchReviewRequestStatus({
        requestId: current.lesson4.outbound.requestId,
        authorSeatCode: current.student.classSeatCode,
      })
      await applyOutboundStatusResponse(response)
      if (isLesson4TerminalReviewStatus(response.status)) {
        reportSyncStaleReset()
      } else {
        reportSyncSuccess()
      }
    } catch (error) {
      if (isLesson4StalePeerReviewError(error)) {
        setOutboundError("")
        await persistResetOutbound()
        reportSyncStaleReset()
        return
      }
      if (classifyLesson4PeerReviewError(error) === "offline") {
        setOutboundError("")
        reportSyncOffline()
        return
      }
      if (userInitiated) {
        setOutboundError(error instanceof Error ? error.message : "刷新送审状态失败，请稍后再试。")
      } else {
        reportSyncIdle()
      }
    }
  }

  const refreshOutboundStatus = useCallback((userInitiated?: boolean) => refreshOutboundStatusRef.current(userInitiated), [])

  const reconcileInboundClaimedWithServer = useCallback(async (
    current: NonNullable<typeof portfolioRef.current>,
    inboxTasks: Lesson4ReviewerInboxTask[],
  ): Promise<boolean> => {
    if (current.lesson4.inbound.status !== "claimed") return true
    const { requestId, authorSeatCode } = current.lesson4.inbound
    if (!requestId || !authorSeatCode) {
      await persistResetInbound()
      await refreshInboxRef.current(false, true)
      reportSyncStaleReset()
      return true
    }
    const hasMatchingTask = inboxTasks.some(task => task.requestId === requestId)
    try {
      const response = await fetchReviewRequestStatus({ requestId, authorSeatCode })
      setServerNow(response.serverNow)
      if (response.status === "expired" || isLesson4TerminalReviewStatus(response.status)) {
        await persistResetInbound()
        await refreshInboxRef.current(false, true)
        reportSyncStaleReset()
        return true
      }
      if (response.status !== "claimed") {
        await persistResetInbound()
        await refreshInboxRef.current(false, true)
        reportSyncStaleReset()
        return true
      }
      if (!hasMatchingTask && response.reviewExpiresAt) {
        await savePortfolio({
          ...current,
          progress: { lessonId: 4, stepId: 1 },
          lesson4: applyLesson4Gate({
            ...current.lesson4,
            inbound: {
              ...current.lesson4.inbound,
              reviewExpiresAt: response.reviewExpiresAt,
            },
          }),
        })
      }
      return true
    } catch (error) {
      if (classifyLesson4PeerReviewError(error) === "offline") {
        reportSyncOffline()
        return false
      }
      if (isLesson4StalePeerReviewError(error)) {
        setInboundError("")
        await persistResetInbound()
        await refreshInboxRef.current(false, true)
        reportSyncStaleReset()
        return true
      }
      return false
    }
  }, [persistResetInbound, reportSyncOffline, reportSyncStaleReset, savePortfolio])

  const reconcileInboundSubmittedWithServer = useCallback(async (
    current: NonNullable<typeof portfolioRef.current>,
  ): Promise<boolean> => {
    const inboundStatus = current.lesson4.inbound.status
    if (inboundStatus !== "submitted" && inboundStatus !== "expired") return true
    const { requestId, authorSeatCode } = current.lesson4.inbound
    if (!requestId || !authorSeatCode) {
      await persistResetInbound()
      await refreshInboxRef.current(false, true)
      reportSyncStaleReset()
      return true
    }
    try {
      const response = await fetchReviewRequestStatus({ requestId, authorSeatCode })
      setServerNow(response.serverNow)
      if (isLesson4ReviewerSubmissionConfirmed(response.status)) {
        if (inboundStatus !== "submitted" || !current.lesson4.inbound.completed) {
          await savePortfolio({
            ...current,
            progress: { lessonId: 4, stepId: 1 },
            lesson4: applyLesson4Gate({
              ...current.lesson4,
              inbound: {
                ...current.lesson4.inbound,
                status: "submitted",
                completed: true,
              },
            }),
          })
        }
        return true
      }
      await persistResetInbound()
      await refreshInboxRef.current(false, true)
      reportSyncStaleReset()
      return true
    } catch (error) {
      if (classifyLesson4PeerReviewError(error) === "offline") {
        reportSyncOffline()
        return false
      }
      if (isLesson4StalePeerReviewError(error)) {
        setInboundError("")
        await persistResetInbound()
        await refreshInboxRef.current(false, true)
        reportSyncStaleReset()
        return true
      }
      return false
    }
  }, [persistResetInbound, reportSyncOffline, reportSyncStaleReset, savePortfolio])

  const refreshInboxRef = useRef<(userInitiated?: boolean, nested?: boolean) => Promise<void>>(async () => {})
  refreshInboxRef.current = async (userInitiated = false, nested = false) => {
    const current = portfolioRef.current
    if (!current) return
    if (userInitiated) setInboundError("")
    if (!nested) reportSyncStart()
    try {
      const response = await fetchReviewerInbox({
        classId: deriveLesson4ClassId(current.student.classSeatCode, current.student.clazz),
        reviewerSeatCode: current.student.classSeatCode,
      })
      setServerNow(response.serverNow)
      setTasks(response.tasks)

      const latest = portfolioRef.current ?? current
      const nextInbound = { ...latest.lesson4.inbound }
      let inboundChanged = false

      if (response.tasks.length > 0 && latest.lesson4.inbound.status === "idle") {
        nextInbound.status = "available"
        nextInbound.requestId = response.tasks[0].requestId
        nextInbound.authorSeatCode = response.tasks[0].authorSeatCode
        nextInbound.reviewExpiresAt = ""
        nextInbound.completed = false
        inboundChanged = true
      }

      if (response.tasks.length === 0 && latest.lesson4.inbound.status === "available") {
        nextInbound.status = "idle"
        nextInbound.requestId = ""
        nextInbound.authorSeatCode = ""
        nextInbound.reviewExpiresAt = ""
        inboundChanged = true
      }

      if (response.tasks.length > 0 && latest.lesson4.inbound.status === "available") {
        const firstTask = response.tasks[0]
        if (
          latest.lesson4.inbound.requestId !== firstTask.requestId
          || latest.lesson4.inbound.authorSeatCode !== firstTask.authorSeatCode
        ) {
          nextInbound.requestId = firstTask.requestId
          nextInbound.authorSeatCode = firstTask.authorSeatCode
          nextInbound.reviewExpiresAt = ""
          inboundChanged = true
        }
      }

      if (inboundChanged) {
        await savePortfolio({
          ...latest,
          progress: { lessonId: 4, stepId: 1 },
          lesson4: applyLesson4Gate({
            ...latest.lesson4,
            inbound: nextInbound,
          }),
        })
      }

      const afterSave = portfolioRef.current ?? latest
      const claimedOk = await reconcileInboundClaimedWithServer(afterSave, response.tasks)
      const latestAfterClaimed = portfolioRef.current ?? afterSave
      const submittedOk = await reconcileInboundSubmittedWithServer(latestAfterClaimed)
      if (!nested && claimedOk && submittedOk) reportSyncSuccess()
    } catch (error) {
      if (classifyLesson4PeerReviewError(error) === "offline") {
        setInboundError("")
        if (!nested) reportSyncOffline()
        return
      }
      if (!nested) reportSyncIdle()
      if (userInitiated) {
        setInboundError(error instanceof Error ? error.message : "刷新待审任务失败，请稍后再试。")
      }
    }
  }

  const refreshInbox = useCallback((userInitiated?: boolean) => refreshInboxRef.current(userInitiated), [])

  const refreshInboundSubmittedStatusRef = useRef<(userInitiated?: boolean) => Promise<void>>(async () => {})
  refreshInboundSubmittedStatusRef.current = async (userInitiated = false) => {
    const current = portfolioRef.current
    if (!current) return
    if (current.lesson4.inbound.status !== "submitted" && current.lesson4.inbound.status !== "expired") return
    if (userInitiated) setInboundError("")
    reportSyncStart()
    const ok = await reconcileInboundSubmittedWithServer(current)
    if (ok) reportSyncSuccess()
    else if (userInitiated) {
      setInboundError("无法与服务器对齐审查提交状态，请稍后再试。")
    } else {
      reportSyncIdle()
    }
  }

  const handleOutboundCountdownExpire = useCallback(() => {
    if (!isLesson4PeerReviewHttpMode()) return
    void refreshOutboundStatusRef.current()
  }, [])

  const refreshInboundClaimedStatusRef = useRef<(userInitiated?: boolean) => Promise<void>>(async () => {})
  refreshInboundClaimedStatusRef.current = async (userInitiated = false) => {
    const current = portfolioRef.current
    if (!current?.lesson4.inbound.requestId || !current.lesson4.inbound.authorSeatCode) return
    if (userInitiated) setInboundError("")
    reportSyncStart()
    try {
      const response = await fetchReviewRequestStatus({
        requestId: current.lesson4.inbound.requestId,
        authorSeatCode: current.lesson4.inbound.authorSeatCode,
      })
      setServerNow(response.serverNow)
      if (response.status === "expired" || isLesson4TerminalReviewStatus(response.status)) {
        setTasks([])
        await persistResetInbound()
        await refreshInboxRef.current(false, true)
        reportSyncStaleReset()
        return
      }
      if (response.status !== "claimed") {
        setTasks([])
        await persistResetInbound()
        await refreshInboxRef.current(false, true)
        reportSyncStaleReset()
        return
      }
      if (response.reviewExpiresAt) {
        await savePortfolio({
          ...current,
          progress: { lessonId: 4, stepId: 1 },
          lesson4: applyLesson4Gate({
            ...current.lesson4,
            inbound: {
              ...current.lesson4.inbound,
              reviewExpiresAt: response.reviewExpiresAt,
            },
          }),
        })
      }
      reportSyncSuccess()
    } catch (error) {
      if (isLesson4StalePeerReviewError(error)) {
        setInboundError("")
        setTasks([])
        await persistResetInbound()
        await refreshInboxRef.current(false, true)
        reportSyncStaleReset()
        return
      }
      if (classifyLesson4PeerReviewError(error) === "offline") {
        setInboundError("")
        reportSyncOffline()
        return
      }
      if (userInitiated) {
        setInboundError(error instanceof Error ? error.message : "刷新审查状态失败，请稍后再试。")
      } else {
        reportSyncIdle()
      }
    }
  }

  const handleInboundCountdownExpire = useCallback(() => {
    if (!isLesson4PeerReviewHttpMode()) return
    const current = portfolioRef.current
    if (current?.lesson4.inbound.status === "claimed") {
      void refreshInboundClaimedStatusRef.current()
      return
    }
    void refreshInboxRef.current()
  }, [])

  const outboundRequestId = portfolio?.lesson4.outbound.requestId
  const outboundStatus = portfolio?.lesson4.outbound.status
  const inboundStatus = portfolio?.lesson4.inbound.status
  const inboundRequestId = portfolio?.lesson4.inbound.requestId
  const classSeatCode = portfolio?.student.classSeatCode
  const pendingInboundTaskId = tasks.find(task => task.status === "pending")?.requestId

  useEffect(() => {
    if (!outboundRequestId) {
      hydratedOutboundRequestIdRef.current = null
    }
  }, [outboundRequestId])

  /** HTTP 模式进页：作者侧若有 requestId 且处于 pending/claimed/submitted，每个 requestId 仅 hydrate 一次。 */
  useEffect(() => {
    if (!isLesson4PeerReviewHttpMode()) return
    if (!outboundRequestId) return
    if (outboundStatus !== "pending" && outboundStatus !== "claimed" && outboundStatus !== "submitted") return
    if (hydratedOutboundRequestIdRef.current === outboundRequestId) return
    hydratedOutboundRequestIdRef.current = outboundRequestId
    void refreshOutboundStatusRef.current()
  }, [outboundRequestId, outboundStatus])

  /** HTTP 模式进页：审查者侧每个 classSeatCode 仅拉一次 inbox。 */
  useEffect(() => {
    if (!isLesson4PeerReviewHttpMode()) return
    if (!classSeatCode) return
    if (hydratedInboxSeatCodeRef.current === classSeatCode) return
    hydratedInboxSeatCodeRef.current = classSeatCode
    void refreshInboxRef.current()
  }, [classSeatCode])

  /** HTTP 模式进页：审查者 inbound 已 claimed 时拉 status 补齐 reviewExpiresAt 与 serverNow。 */
  useEffect(() => {
    if (!isLesson4PeerReviewHttpMode()) return
    if (!inboundRequestId) {
      hydratedInboundClaimedRequestIdRef.current = null
      return
    }
    if (inboundStatus !== "claimed") {
      hydratedInboundClaimedRequestIdRef.current = null
      return
    }
    if (hydratedInboundClaimedRequestIdRef.current === inboundRequestId) return
    hydratedInboundClaimedRequestIdRef.current = inboundRequestId
    void refreshInboundClaimedStatusRef.current()
  }, [inboundRequestId, inboundStatus])

  /** HTTP 模式进页：审查者 inbound 已 submitted/expired 时用作者视角 status 与 SQLite 对齐。 */
  useEffect(() => {
    if (!isLesson4PeerReviewHttpMode()) return
    if (!inboundRequestId) {
      hydratedInboundSubmittedRequestIdRef.current = null
      return
    }
    if (inboundStatus !== "submitted" && inboundStatus !== "expired") {
      hydratedInboundSubmittedRequestIdRef.current = null
      return
    }
    if (hydratedInboundSubmittedRequestIdRef.current === inboundRequestId) return
    hydratedInboundSubmittedRequestIdRef.current = inboundRequestId
    void refreshInboundSubmittedStatusRef.current()
  }, [inboundRequestId, inboundStatus])

  /** 作者 pending/claimed 阶段每 20s 轮询；不 leading、不依赖 portfolio 浅更新，避免 interval 反复重置。 */
  useEffect(() => {
    if (!isLesson4PeerReviewHttpMode()) return
    if (!outboundRequestId) return
    if (outboundStatus !== "pending" && outboundStatus !== "claimed") return

    const timerId = window.setInterval(() => {
      void refreshOutboundStatusRef.current()
    }, PEER_REVIEW_POLL_MS)

    return () => window.clearInterval(timerId)
  }, [outboundRequestId, outboundStatus])

  /** 审查者有待领 pending 任务时每 20s 轮询 inbox，与倒计时 onExpire 互补。 */
  useEffect(() => {
    if (!isLesson4PeerReviewHttpMode()) return
    if (!pendingInboundTaskId) return
    if (inboundStatus === "submitted" || inboundStatus === "claimed") return

    const timerId = window.setInterval(() => {
      void refreshInboxRef.current()
    }, PEER_REVIEW_POLL_MS)

    return () => window.clearInterval(timerId)
  }, [pendingInboundTaskId, inboundStatus])

  const reconcileAuthorOutboundConflictRef = useRef<() => Promise<string | null>>(async () => null)
  reconcileAuthorOutboundConflictRef.current = async (): Promise<string | null> => {
    const current = portfolioRef.current
    if (!current?.lesson4.outbound.requestId) return null
    try {
      const response = await fetchReviewRequestStatus({
        requestId: current.lesson4.outbound.requestId,
        authorSeatCode: current.student.classSeatCode,
      })
      if (response.status === "pending" || response.status === "claimed" || response.status === "submitted") {
        await applyOutboundStatusResponse(response)
        return "送审状态已与服务器同步，请查看左栏当前进度。"
      }
      if (isLesson4TerminalReviewStatus(response.status)) {
        await persistResetOutbound()
        reportSyncStaleReset()
        return "本地状态已对齐，请再次点击「打包并送审」。"
      }
      return null
    } catch (error) {
      if (classifyLesson4PeerReviewError(error) === "offline") {
        reportSyncOffline()
        return "无法连接服务器，请确认后端已启动后再试。"
      }
      if (isLesson4StalePeerReviewError(error)) {
        await persistResetOutbound()
        reportSyncStaleReset()
        return "本地送审记录已重置，请再次点击「打包并送审」。"
      }
      return null
    }
  }

  const reconcileAuthorOutboundConflict = useCallback(
    () => reconcileAuthorOutboundConflictRef.current(),
    [],
  )

  useEffect(() => {
    if (!outboundRequestId) {
      reconciledOutboundRequestIdRef.current = null
      return
    }
    if (outboundStatus !== "cancelled" && outboundStatus !== "expired") return
    if (reconciledOutboundRequestIdRef.current === outboundRequestId) return
    reconciledOutboundRequestIdRef.current = outboundRequestId
    void reconcileAuthorOutboundConflictRef.current()
  }, [outboundRequestId, outboundStatus])

  if (!portfolio) return null

  const currentClassPrefix = portfolio.student.classSeatCode.slice(0, 2)

  const persistLesson4 = async (nextLesson4: Module4Lesson4State) => {
    const current = portfolioRef.current
    if (!current) return
    await savePortfolio({
      ...current,
      progress: { lessonId: 4, stepId: 1 },
      lesson4: applyLesson4Gate(nextLesson4),
    })
  }

  const handleCreate = async () => {
    setOutboundError("")
    if (!/^\d{2}$/.test(currentClassPrefix)) {
      setOutboundError("当前档案班学号异常，请先回到模块首页检查班级与学号。")
      return
    }
    const suffixError = validateReviewerSeatSuffix(targetSeatSuffix)
    if (suffixError) {
      setOutboundError(suffixError)
      return
    }
    const targetReviewerSeatCode = `${currentClassPrefix}${targetSeatSuffix}`
    if (targetReviewerSeatCode === portfolio.student.classSeatCode) {
      setOutboundError("不能把题卡发送给自己。")
      return
    }
    setBusy(true)
    try {
      const response = await createReviewRequest({
        classId: deriveLesson4ClassId(portfolio.student.classSeatCode, portfolio.student.clazz),
        authorSeatCode: portfolio.student.classSeatCode,
        targetReviewerSeatCode,
        requestJson: buildLesson4ReviewRequestJson(portfolio.lesson3),
      })
      setServerNow(response.serverNow)
      await persistLesson4({
        ...portfolio.lesson4,
        outbound: {
          ...portfolio.lesson4.outbound,
          status: response.status,
          requestId: response.requestId,
          targetReviewerSeatCode,
          inviteCode: response.inviteCode,
          sentAt: response.serverNow,
          pendingExpiresAt: response.pendingExpiresAt,
          reviewExpiresAt: "",
          completed: false,
        },
      })
    } catch (error) {
      if (error instanceof Lesson4PeerReviewHttpError && error.status === 409) {
        if (error.message.includes(AUTHOR_ACTIVE_OUTBOUND_CONFLICT)) {
          const reconciledMessage = await reconcileAuthorOutboundConflict()
          if (reconciledMessage) {
            setOutboundError(reconciledMessage)
            return
          }
        }
      }
      setOutboundError(error instanceof Error ? error.message : "送审失败，请稍后再试。")
    } finally {
      setBusy(false)
    }
  }

  const handleRefreshOutbound = async () => {
    if (!portfolio.lesson4.outbound.requestId) return
    setBusy(true)
    try {
      await refreshOutboundStatus(true)
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async () => {
    if (!portfolio.lesson4.outbound.requestId) return
    setOutboundError("")
    setBusy(true)
    try {
      await cancelReviewRequest({
        requestId: portfolio.lesson4.outbound.requestId,
        authorSeatCode: portfolio.student.classSeatCode,
      })
      await persistLesson4({
        ...portfolio.lesson4,
        outbound: createResetLesson4Outbound(),
      })
    } catch (error) {
      setOutboundError(error instanceof Error ? error.message : "撤回失败，请稍后再试。")
    } finally {
      setBusy(false)
    }
  }

  const handlePull = async () => {
    if (!portfolio.lesson4.outbound.requestId) return
    setOutboundError("")
    setBusy(true)
    try {
      const response = await pullReviewFeedback({
        requestId: portfolio.lesson4.outbound.requestId,
        authorSeatCode: portfolio.student.classSeatCode,
      })
      setServerNow(response.serverNow)
      await persistLesson4({
        ...portfolio.lesson4,
        outbound: {
          ...portfolio.lesson4.outbound,
          status: response.status,
          receivedReviewJson: response.reviewJson,
          completed: true,
        },
      })
    } catch (error) {
      setOutboundError(error instanceof Error ? error.message : "拉取反馈失败，请稍后再试。")
    } finally {
      setBusy(false)
    }
  }

  const handleRefreshInbox = async () => {
    setBusy(true)
    try {
      await refreshInbox(true)
    } finally {
      setBusy(false)
    }
  }

  const handleClaim = async (task: Lesson4ReviewerInboxTask) => {
    setInboundError("")
    if (!/^\d{4}$/.test(reviewCode)) {
      setInboundError("审查码不正确，请和同伴确认后再试。")
      return
    }
    setBusy(true)
    try {
      const response = await claimReviewRequest({
        requestId: task.requestId,
        reviewerSeatCode: portfolio.student.classSeatCode,
        inviteCode: reviewCode,
      })
      setServerNow(response.serverNow)
      const requestJson = coerceLesson4ReviewRequestJson(response.requestJson)
      if (response.status !== "claimed" || !requestJson) {
        setInboundError("审查码不正确，请和同伴确认后再试。")
        return
      }
      claimedRequestJsonRef.current = requestJson
      hydratedReviewDraftRequestIdRef.current = response.requestId
      pendingReviewDraftRef.current = null
      if (reviewDraftSaveTimerRef.current != null) {
        window.clearTimeout(reviewDraftSaveTimerRef.current)
        reviewDraftSaveTimerRef.current = null
      }
      const emptyReview = createEmptyModule4Lesson4ReviewJson()
      setReviewJson(emptyReview)
      setTasks([])
      setReviewCode("")
      await persistLesson4({
        ...portfolio.lesson4,
        inbound: {
          ...portfolio.lesson4.inbound,
          status: "claimed",
          requestId: response.requestId,
          authorSeatCode: task.authorSeatCode,
          reviewExpiresAt: response.reviewExpiresAt ?? "",
          claimedRequestJson: requestJson,
          reviewDraftJson: undefined,
          completed: false,
        },
      })
    } catch (error) {
      if (error instanceof Lesson4PeerReviewHttpError && error.status === 409) {
        setReviewCode("")
        setInboundError(error.message)
        try {
          const inboxResponse = await fetchReviewerInbox({
            classId: deriveLesson4ClassId(portfolio.student.classSeatCode, portfolio.student.clazz),
            reviewerSeatCode: portfolio.student.classSeatCode,
          })
          setServerNow(inboxResponse.serverNow)
          setTasks(inboxResponse.tasks)
        } catch {
          // 409 后刷新失败不覆盖主错误文案。
        }
        return
      }
      setInboundError(error instanceof Error ? error.message : "领取任务失败，请稍后再试。")
    } finally {
      setBusy(false)
    }
  }

  const handleSubmitCard = async (kind: Module4MaterialKind) => {
    setActiveReviewKind(kind)
    setCardSubmitSuccessMessage("")
    setFinalSubmitMessage("")
    /** 异步提交前读 ref，避免 Tab 切换或连续编辑后闭包 reviewJson 滞后（图片卡易踩）。 */
    const snapshot = reviewJsonRef.current
    if (snapshot.cards[kind].approved) return

    const validation = validateLesson4ReviewCardFeedback(snapshot, kind)
    setValidationMessage(validation.message)
    setFieldErrors(validation.fieldErrors)
    if (!validation.valid) return

    setAiModerating(true)
    setAiUnavailableMessage("")
    setModerationByField({})
    try {
      const moderation = await moderateLesson4ReviewCard(snapshot, kind)
      if (moderation.unavailable) {
        setAiUnavailableMessage(moderation.unavailableMessage ?? "AI 审核暂不可用，请联系老师检查服务端配置。")
        if (moderation.offline) {
          reportSyncOffline()
        }
        return
      }
      if (!moderation.pass) {
        setModerationByField(moderation.byField)
        setValidationMessage("AI 审核未通过，请根据输入框下方红色标签修改后重试。")
        return
      }

      const nextReviewJson: Module4Lesson4ReviewJson = {
        ...snapshot,
        cards: {
          ...snapshot.cards,
          [kind]: {
            ...snapshot.cards[kind],
            approved: true,
          },
        },
      }
      setReviewJson(nextReviewJson)
      setValidationMessage("")
      setFieldErrors({})
      setModerationByField({})
      schedulePersistReviewDraft(nextReviewJson)

      const CARD_LABEL: Record<Module4MaterialKind, string> = { news: "新闻题卡", image: "图片题卡" }
      if (kind === "news" && !nextReviewJson.cards.image.approved) {
        setCardSubmitSuccessMessage(`${CARD_LABEL[kind]}审查已通过，请继续填写图片题卡。`)
        setActiveReviewKind("image")
      } else if (kind === "image" && !nextReviewJson.cards.news.approved) {
        setCardSubmitSuccessMessage(`${CARD_LABEL[kind]}审查已通过，请返回完成新闻题卡。`)
        setActiveReviewKind("news")
      } else if (nextReviewJson.cards.news.approved && nextReviewJson.cards.image.approved) {
        setCardSubmitSuccessMessage("两张题卡审查均已通过，请在上方「我要审查别人」区域点击整体提交。")
      } else {
        setCardSubmitSuccessMessage(`${CARD_LABEL[kind]}审查已通过。`)
      }
    } catch (error) {
      if (isLesson4OfflinePeerReviewError(error)) {
        reportSyncOffline()
        setAiUnavailableMessage("无法连接服务器，请确认后端已启动后再试。")
        return
      }
      setValidationMessage(error instanceof Error ? error.message : "AI 审核失败，请稍后重试。")
    } finally {
      setAiModerating(false)
    }
  }

  const handleFinalSubmit = async () => {
    setFinalSubmitMessage("")
    const snapshot = reviewJsonRef.current
    if (!snapshot.cards.news.approved || !snapshot.cards.image.approved) return

    const validation = validateLesson4ReviewFeedback(snapshot)
    setValidationMessage(validation.message)
    if (!validation.valid || !portfolio.lesson4.inbound.requestId) return

    setBusy(true)
    try {
      const response = await submitReviewFeedback({
        requestId: portfolio.lesson4.inbound.requestId,
        reviewerSeatCode: portfolio.student.classSeatCode,
        reviewJson: snapshot,
      })
      setServerNow(response.serverNow)
      claimedRequestJsonRef.current = null
      hydratedReviewDraftRequestIdRef.current = null
      pendingReviewDraftRef.current = null
      setModerationByField({})
      setFieldErrors({})
      setCardSubmitSuccessMessage("")
      if (reviewDraftSaveTimerRef.current != null) {
        window.clearTimeout(reviewDraftSaveTimerRef.current)
        reviewDraftSaveTimerRef.current = null
      }
      await persistLesson4({
        ...portfolio.lesson4,
        inbound: {
          ...portfolio.lesson4.inbound,
          status: response.status === "submitted" ? "submitted" : "expired",
          claimedRequestJson: undefined,
          reviewDraftJson: undefined,
          submittedReviewJson: snapshot,
          completed: response.status === "submitted",
        },
      })
      setFinalSubmitMessage(
        response.status === "submitted"
          ? "审查已整体提交，同伴可在左侧刷新状态并拉取反馈。"
          : "本次互审查阅已过期，请刷新任务列表。",
      )
    } catch (error) {
      setFinalSubmitMessage(error instanceof Error ? error.message : "整体提交失败，请稍后重试。")
    } finally {
      setBusy(false)
    }
  }

  const bothCardsApproved = Boolean(reviewJson.cards.news.approved && reviewJson.cards.image.approved)

  const applyTeacherPreset = useCallback(async (preset: Lesson4TeacherDemoPresetId) => {
    if (!portfolio) return
    const next = patchLesson4TeacherDemoPreset(portfolio, preset)
    hydratedOutboundRequestIdRef.current = null
    hydratedInboxSeatCodeRef.current = null
    hydratedInboundClaimedRequestIdRef.current = null
    hydratedInboundSubmittedRequestIdRef.current = null
    hydratedReviewDraftRequestIdRef.current = null
    reconciledOutboundRequestIdRef.current = null
    claimedRequestJsonRef.current = next.lesson4.inbound.claimedRequestJson ?? null
    pendingReviewDraftRef.current = null
    if (reviewDraftSaveTimerRef.current != null) {
      window.clearTimeout(reviewDraftSaveTimerRef.current)
      reviewDraftSaveTimerRef.current = null
    }
    setServerNow(lesson4PeerReviewFixture.serverNow)
    setTasks(isTeacherMode ? [{
      requestId: lesson4PeerReviewFixture.pendingRequestId,
      authorSeatCode: "0102",
      status: "pending",
      pendingExpiresAt: next.lesson4.outbound.pendingExpiresAt || undefined,
    }] : [])
    setReviewJson(
      next.lesson4.inbound.reviewDraftJson
      ?? next.lesson4.inbound.submittedReviewJson
      ?? createEmptyModule4Lesson4ReviewJson(),
    )
    setOutboundError("")
    setInboundError("")
    setValidationMessage("")
    setFieldErrors({})
    setCardSubmitSuccessMessage("")
    setFinalSubmitMessage("")
    setModerationByField({})
    await savePortfolio(next)
  }, [isTeacherMode, portfolio, savePortfolio])

  const effectiveClaimedRequestJson =
    portfolio.lesson4.inbound.claimedRequestJson ?? claimedRequestJsonRef.current ?? undefined

  return (
    <Lesson4StepLayout
      title="第1关 · 同伴互审中转站"
      subtitle="左侧把我的 V1 双卡送出审查，右侧完成一次同伴题卡审查。"
    >
      <div className="space-y-6">
        {isTeacherMode && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            <p className="font-medium">演示 · 不写入学生 IndexedDB</p>
            <p className="mt-1 text-xs text-amber-800/90">
              同伴互审与文字审核均走 fixture；审查码
              {" "}
              <span className="font-mono font-semibold">{lesson4PeerReviewFixture.inviteCode}</span>
              {" "}
              可领取演示任务。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => void applyTeacherPreset("reset_step1")}>
                初始态
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => void applyTeacherPreset("outbound_pending")}>
                出站 pending
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => void applyTeacherPreset("inbound_claimed")}>
                审查 claimed
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => void applyTeacherPreset("gate_passed")}>
                双条件通关
              </Button>
            </div>
          </div>
        )}
        <Lesson4SyncBanner phase={syncPhase} serverReachable={serverReachable} httpMode={httpMode} />
        <PeerReviewGateStatus gate={gate} />
        <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          如果你们是三人组，可以使用环形互审：1号送给2号，2号送给3号，3号送给1号。
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <OutboundReviewPanel
            state={portfolio.lesson4.outbound}
            serverNow={serverNow}
            classPrefix={currentClassPrefix}
            targetSeatSuffix={targetSeatSuffix}
            error={outboundError}
            busy={busy}
            onTargetSeatSuffixChange={setTargetSeatSuffix}
            onCreate={() => void handleCreate()}
            onRefresh={() => void handleRefreshOutbound()}
            onCancel={() => void handleCancel()}
            onPull={() => void handlePull()}
            onCountdownExpire={handleOutboundCountdownExpire}
          />
          <InboundReviewPanel
            state={portfolio.lesson4.inbound}
            tasks={tasks}
            serverNow={serverNow}
            reviewCode={reviewCode}
            error={inboundError}
            busy={busy}
            bothCardsApproved={bothCardsApproved}
            finalSubmitMessage={finalSubmitMessage}
            onReviewCodeChange={setReviewCode}
            onRefresh={() => void handleRefreshInbox()}
            onClaim={task => void handleClaim(task)}
            onFinalSubmit={() => void handleFinalSubmit()}
            onCountdownExpire={handleInboundCountdownExpire}
          />
        </div>
        {portfolio.lesson4.inbound.status === "claimed" && !effectiveClaimedRequestJson && !busy && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            题卡未能恢复，请等待审查超时后重新领取；若刚领取即出现此提示，请刷新页面重试。
          </p>
        )}
        {effectiveClaimedRequestJson && portfolio.lesson4.inbound.status === "claimed" && (
          <PeerReviewWorkbench
            requestJson={effectiveClaimedRequestJson}
            reviewJson={reviewJson}
            activeKind={activeReviewKind}
            onActiveKindChange={setActiveReviewKind}
            fieldErrors={fieldErrors}
            validationMessage={validationMessage}
            cardSubmitSuccessMessage={cardSubmitSuccessMessage}
            aiModerating={aiModerating}
            aiUnavailableMessage={aiUnavailableMessage}
            moderationByField={moderationByField}
            busy={busy}
            onReviewJsonChange={handleReviewJsonChange}
            onSubmitCard={kind => void handleSubmitCard(kind)}
          />
        )}
      </div>
    </Lesson4StepLayout>
  )
}
