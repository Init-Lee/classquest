/**
 * 文件说明：模块 4 课时 6 教师发布审核页。
 * 职责：串联可见班级筛选、V3 发布审核队列、题卡详情预览、确认可发布操作与 C5 统计标签页，作为课时 6 教师端审核与观察主入口。
 * 更新触发：Lesson6 教师审核 API、公共题库 overview、统计接口、班级权限口径、页面信息架构或 C2/C5 审核流程变化时，需要同步更新本文件。
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { cn } from "@/shared/utils/cn"
import { teacherAdminAdapter } from "@/teacher-console/api/teacher-admin.adapter"
import { teacherLesson6Adapter } from "@/teacher-console/api/teacher-lesson6.adapter"
import { canManageTeacherClass } from "@/teacher-console/app/teacher-permissions"
import { useTeacherConsole } from "@/teacher-console/app/TeacherConsoleProvider"
import { Lesson6ChallengeStatsPanel } from "@/teacher-console/components/Lesson6ChallengeStatsPanel"
import { Lesson6ContextComparisonCard } from "@/teacher-console/components/Lesson6ContextComparisonCard"
import { Lesson6ItemPerformanceTable } from "@/teacher-console/components/Lesson6ItemPerformanceTable"
import { Lesson6PublicBankOverview } from "@/teacher-console/components/Lesson6PublicBankOverview"
import { Lesson6V3ReviewPreviewDialog } from "@/teacher-console/components/Lesson6V3ReviewPreviewDialog"
import { Lesson6V3ReviewQueue } from "@/teacher-console/components/Lesson6V3ReviewQueue"
import { PermissionGuard } from "@/teacher-console/components/PermissionGuard"
import type {
  Lesson6Overview,
  Lesson6PublicItemStatsResponse,
  Lesson6PublicationCheckStatus,
  Lesson6ReviewDetail,
  Lesson6ReviewItem,
  Lesson6ReviewsResponse,
  TeacherVisibleClass,
} from "@/teacher-console/types"

type Lesson6StatusFilter = Lesson6PublicationCheckStatus | "all"
type Lesson6ReviewTabId = "review" | "challengeStats" | "itemStats"

const LESSON6_REVIEW_TABS: Array<{
  id: Lesson6ReviewTabId
  label: string
  description: string
}> = [
  {
    id: "review",
    label: "公共题库与发布审核",
    description: "查看公共题库概览，并处理 V3 发布审核队列与预览确认。",
  },
  {
    id: "challengeStats",
    label: "公共挑战基础统计",
    description: "查看公共挑战运行、作答量、正确率、Top 题卡简表与课上/访客对比。",
  },
  {
    id: "itemStats",
    label: "公共题库逐题统计",
    description: "按 item-version 查看全量题目表现，并支持关键列正序/逆序排序。",
  },
]

function statusQuery(status: Lesson6StatusFilter): Lesson6PublicationCheckStatus | undefined {
  return status === "all" ? undefined : status
}

export default function Module4Lesson6ReviewPage() {
  const { session } = useTeacherConsole()
  const [searchParams] = useSearchParams()
  const [classes, setClasses] = useState<TeacherVisibleClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<Lesson6StatusFilter>("pending_teacher_check")
  const [reviews, setReviews] = useState<Lesson6ReviewsResponse | null>(null)
  const [overview, setOverview] = useState<Lesson6Overview | null>(null)
  const [itemStats, setItemStats] = useState<Lesson6PublicItemStatsResponse | null>(null)
  const [loadingClasses, setLoadingClasses] = useState(Boolean(session))
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [loadingOverview, setLoadingOverview] = useState(false)
  const [loadingItemStats, setLoadingItemStats] = useState(false)
  const [busy, setBusy] = useState(false)
  const [bulkPublishing, setBulkPublishing] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDetail, setPreviewDetail] = useState<Lesson6ReviewDetail | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState("")
  const [activeTab, setActiveTab] = useState<Lesson6ReviewTabId>("review")

  const selectedClass = useMemo(
    () => classes.find(item => item.classId === selectedClassId) ?? null,
    [classes, selectedClassId],
  )

  const canManagePreviewClass = previewDetail
    ? canManageTeacherClass(session, previewDetail.classId)
    : false

  const canPublishReviewItem = useCallback(
    (item: Lesson6ReviewItem) => canManageTeacherClass(session, item.classId),
    [session],
  )

  const activeTabMeta = LESSON6_REVIEW_TABS.find(item => item.id === activeTab) ?? LESSON6_REVIEW_TABS[0]

  const loadReviews = useCallback(async (nextClassId = selectedClassId, nextStatus = selectedStatus) => {
    if (!session) return
    setLoadingReviews(true)
    setError("")
    try {
      const response = await teacherLesson6Adapter.listReviews(session.token, {
        classId: nextClassId || undefined,
        status: statusQuery(nextStatus),
      })
      setReviews(response)
    } catch (err) {
      setReviews(null)
      setError(err instanceof Error ? err.message : "课时 6 发布审核队列加载失败，请稍后再试。")
    } finally {
      setLoadingReviews(false)
    }
  }, [selectedClassId, selectedStatus, session])

  const loadOverview = useCallback(async () => {
    if (!session) return
    setLoadingOverview(true)
    try {
      const response = await teacherLesson6Adapter.getOverview(session.token)
      setOverview(response)
    } catch (err) {
      setOverview(null)
      setError(err instanceof Error ? err.message : "课时 6 公共题库概览加载失败，请稍后再试。")
    } finally {
      setLoadingOverview(false)
    }
  }, [session])

  const loadItemStats = useCallback(async () => {
    if (!session) return
    setLoadingItemStats(true)
    try {
      const response = await teacherLesson6Adapter.getPublicItemStats(session.token)
      setItemStats(response)
    } catch (err) {
      setItemStats(null)
      setError(err instanceof Error ? err.message : "课时 6 逐题统计加载失败，请稍后再试。")
    } finally {
      setLoadingItemStats(false)
    }
  }, [session])

  useEffect(() => {
    if (!session) return
    setLoadingClasses(true)
    setError("")
    void teacherAdminAdapter.listTeacherClasses(session.token)
      .then(nextClasses => {
        setClasses(nextClasses)
        const requestedClassId = searchParams.get("classId") ?? ""
        const requestedVisible = nextClasses.some(item => item.classId === requestedClassId)
        setSelectedClassId(current => {
          if (current && nextClasses.some(item => item.classId === current)) return current
          if (requestedVisible) return requestedClassId
          return ""
        })
      })
      .catch(err => setError(err instanceof Error ? err.message : "班级列表加载失败，请稍后再试。"))
      .finally(() => setLoadingClasses(false))
  }, [searchParams, session])

  useEffect(() => {
    void loadReviews()
  }, [loadReviews])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  useEffect(() => {
    void loadItemStats()
  }, [loadItemStats])

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId)
    setMessage("")
    setError("")
  }

  const handleStatusChange = (status: Lesson6StatusFilter) => {
    setSelectedStatus(status)
    setMessage("")
    setError("")
  }

  const handlePreview = async (item: Lesson6ReviewItem) => {
    if (!session) return
    setPreviewOpen(true)
    setPreviewDetail(null)
    setPreviewError("")
    setPreviewLoading(true)
    try {
      const detail = await teacherLesson6Adapter.getReviewDetail(session.token, item.reviewId)
      setPreviewDetail(detail)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "审核详情加载失败，请稍后再试。")
    } finally {
      setPreviewLoading(false)
    }
  }

  const handlePublish = async (teacherNote: string) => {
    if (!session || !previewDetail) return
    const confirmed = window.confirm("确认后，这张 V3 题卡将进入公共题库，并可能出现在课时 6 公共挑战中。确认可发布吗？")
    if (!confirmed) return
    setBusy(true)
    setMessage("")
    setError("")
    setPreviewError("")
    try {
      const response = await teacherLesson6Adapter.publishReview(session.token, previewDetail.reviewId, { teacherNote })
      setMessage(`已确认可发布：${previewDetail.itemShortName || previewDetail.itemVersionId}。`)
      setPreviewDetail(current => current
        ? {
            ...current,
            checkStatus: response.checkStatus,
            isActivePublic: response.isActivePublic,
            checkedAt: response.checkedAt,
            teacherNote,
            updatedAt: response.checkedAt,
          }
        : current)
      await Promise.all([loadReviews(), loadOverview(), loadItemStats()])
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "确认发布失败，请确认账号具备该班级 manage 权限。")
    } finally {
      setBusy(false)
    }
  }

  const handleBulkPublish = async (items: Lesson6ReviewItem[]) => {
    if (!session || items.length === 0) return
    const confirmed = window.confirm(`将批量确认已选 ${items.length} 张待审核 V3 题卡进入公共题库。确认继续吗？`)
    if (!confirmed) return
    setBulkPublishing(true)
    setMessage("")
    setError("")
    try {
      let successCount = 0
      const failedNames: string[] = []
      for (const item of items) {
        try {
          await teacherLesson6Adapter.publishReview(session.token, item.reviewId, {
            teacherNote: "批量确认可发布。",
          })
          successCount += 1
        } catch {
          failedNames.push(item.itemShortName || item.itemVersionId)
        }
      }
      setMessage(`批量确认完成：成功 ${successCount} 张${failedNames.length > 0 ? `，失败 ${failedNames.length} 张：${failedNames.join("、")}` : ""}。`)
      await Promise.all([loadReviews(), loadOverview(), loadItemStats()])
    } catch (err) {
      setError(err instanceof Error ? err.message : "批量确认失败，请刷新后重试。")
    } finally {
      setBulkPublishing(false)
    }
  }

  return (
    <PermissionGuard allow={["teacher", "demo"]}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">模块 4 · 课时 6 发布审核</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                教师在这里预览学生 V3 题卡、查看课时 5 试答统计和修订说明，并对可管理班级确认「可发布」；demo 与只读授权账号只能查看，不能发布。
              </p>
            </div>
            {selectedClass && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                {selectedClass.className} · {selectedClass.permission === "manage" ? "可管理" : "只读"}
              </span>
            )}
          </div>
        </section>

        {(message || error) && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {error || message}
          </div>
        )}

        <div className="space-y-0">
          <div className="flex flex-wrap items-end gap-1 px-1" role="tablist" aria-label="课时 6 审核与统计标签页">
            {LESSON6_REVIEW_TABS.map(tab => {
              const selected = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  title={tab.description}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 rounded-t-xl border border-b-0 px-4 py-2.5 text-sm font-medium transition-colors",
                    selected
                      ? "z-10 -mb-px border-slate-200 bg-white text-slate-900 shadow-sm"
                      : "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900",
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <section
            role="tabpanel"
            aria-label={activeTabMeta.label}
            className="rounded-b-2xl rounded-tr-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 border-b border-slate-100 pb-4">
              <h2 className="text-lg font-semibold text-slate-900">{activeTabMeta.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{activeTabMeta.description}</p>
            </div>

            {activeTab === "review" && (
              <div className="space-y-4">
                <Lesson6PublicBankOverview overview={overview} loading={loadingOverview} />
                {loadingClasses ? (
                  <p className="text-sm text-muted-foreground">正在加载教师班级...</p>
                ) : (
                  <Lesson6V3ReviewQueue
                    classes={classes}
                    items={reviews?.items ?? []}
                    summary={reviews?.summary ?? null}
                    selectedClassId={selectedClassId}
                    selectedStatus={selectedStatus}
                    loading={loadingReviews}
                    bulkPublishing={bulkPublishing}
                    canPublishItem={canPublishReviewItem}
                    onClassChange={handleClassChange}
                    onStatusChange={handleStatusChange}
                    onRefresh={() => void Promise.all([loadReviews(), loadOverview(), loadItemStats()])}
                    onPreview={item => void handlePreview(item)}
                    onBulkPublish={items => void handleBulkPublish(items)}
                  />
                )}
              </div>
            )}

            {activeTab === "challengeStats" && (
              <div className="space-y-4">
                <Lesson6ChallengeStatsPanel overview={overview} loading={loadingOverview} />
                <Lesson6ContextComparisonCard
                  items={itemStats?.items ?? []}
                  loading={loadingItemStats}
                  publicBankCount={overview?.publicBank.totalPublishable ?? itemStats?.items.length ?? 0}
                />
              </div>
            )}

            {activeTab === "itemStats" && (
              <Lesson6ItemPerformanceTable
                items={itemStats?.items ?? []}
                loading={loadingItemStats}
                publicBankCount={overview?.publicBank.totalPublishable ?? itemStats?.items.length ?? 0}
              />
            )}
          </section>
        </div>

        <Lesson6V3ReviewPreviewDialog
          open={previewOpen}
          detail={previewDetail}
          loading={previewLoading}
          publishing={busy}
          canManage={canManagePreviewClass}
          error={previewError}
          onOpenChange={setPreviewOpen}
          onPublish={handlePublish}
        />
      </div>
    </PermissionGuard>
  )
}
