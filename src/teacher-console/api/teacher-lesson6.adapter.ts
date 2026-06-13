/**
 * 文件说明：教师控制台课时 6 发布审核适配器。
 * 职责：提供 V3 发布审核列表、详情、确认发布、公共题库 overview 与逐题统计的 fixture|http 双模式访问能力。
 * 更新触发：课时 6 教师端点路径、发布审核字段、公共题库 overview/逐题统计口径、fixture 状态机或 C2/C5 展示边界变化时，需要同步更新本文件。
 */

import {
  buildTeacherAuthHeaders,
  buildTeacherJsonHeaders,
  fetchTeacherJson,
  fixtureClassPermissions,
  resolveTeacherConsoleEndpoint,
  resolveTeacherConsoleMode,
  TeacherConsoleHttpError,
} from "@/teacher-console/api/teacher-auth.adapter"
import type {
  Lesson6PublicItemStat,
  Lesson6PublicItemStatsResponse,
  Lesson6Overview,
  Lesson6PublicationCheckStatus,
  Lesson6PublishRequest,
  Lesson6PublishResponse,
  Lesson6ReviewDetail,
  Lesson6ReviewItem,
  Lesson6ReviewListQuery,
  Lesson6ReviewsResponse,
  TeacherClassPermissionItem,
  TeacherLesson6Adapter,
  TeacherLoginAccount,
  TeacherPoolCardKind,
} from "@/teacher-console/types"

const TEACHER_LESSON6_BASE_PATH = "/api/v1/teacher/module4/lesson6"
const fixturePrefix = "fixture_teacher_console_"

const demoClassPermissions: TeacherClassPermissionItem[] = Array.from({ length: 12 }, (_, index) => {
  const number = index + 1
  return {
    classId: `g7c${String(number).padStart(2, "0")}`,
    className: `七年级 ${number} 班`,
    permission: "view",
  }
})

function fixtureTimestamp(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()
}

function buildFixtureCardJson(kind: TeacherPoolCardKind, seed: string): Record<string, unknown> {
  const kindLabel = kind === "news" ? "新闻" : "图片"
  const correctOptionKey = kind === "news" ? "B" : "A"
  const material = {
    titleOrName: `${kindLabel}素材 ${seed}`,
    displayNote: "fixture V3 发布审核预览素材，用于教师确认题卡是否可进入公共题库。",
    asset: kind === "image"
      ? {
          dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='520' height='300'><rect width='100%25' height='100%25' fill='%23dbeafe'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%231e3a8a' font-size='24'>Lesson6 Fixture Image</text></svg>",
          alt: "Lesson6 fixture 图片素材",
          mimeType: "image/svg+xml",
        }
      : null,
  }
  const options = [
    { key: "A", text: "选项 A：可信度较高" },
    { key: "B", text: "选项 B：存在 AI 生成或二次编辑疑点" },
    { key: "C", text: "选项 C：需要更多来源交叉核验" },
  ]
  const task = {
    prompt: `请判断这则${kindLabel}素材最适合选择哪一项，并说明核验依据。`,
    options,
    correctOptionKey,
  }
  return {
    id: `fixture_l6_card_${seed}`,
    kind,
    material,
    task,
    options,
    correctOptionKey,
    explanation: {
      text: "V3 已补充判断依据：需要结合素材细节、来源记录和上下文，不只看单一表象。",
    },
    source: {
      sourceType: "课堂素材",
      sourceRecord: "fixture 本地演示数据",
      verificationNote: "教师审核时重点确认来源记录和解析是否可支持标准答案。",
    },
  }
}

function buildFixtureReview(seed: {
  index: number
  classId: string
  className: string
  kind: TeacherPoolCardKind
  status: Lesson6PublicationCheckStatus
  active: boolean
  seat: string
  hoursAgo: number
}): Lesson6ReviewDetail {
  const itemId = `fixture_l6_item_${seed.classId}_${seed.seat}_${seed.kind}`
  const itemVersionId = `${itemId}_v3_${seed.index}`
  const submittedAt = fixtureTimestamp(seed.hoursAgo)
  const checkedAt = seed.status === "publishable" ? fixtureTimestamp(Math.max(seed.hoursAgo - 1, 0.2)) : null
  return {
    reviewId: `fixture_l6_review_${seed.index}`,
    itemId,
    itemVersionId,
    classId: seed.classId,
    className: seed.className,
    cardKind: seed.kind,
    itemShortName: `${seed.kind === "news" ? "新闻" : "图片"} V3 ${seed.seat}`,
    studentDisplay: `${seed.className.replace("七年级 ", "")} · ${seed.seat}`,
    submittedAt,
    checkStatus: seed.status,
    isActivePublic: seed.active,
    lesson5StatsSummary: {
      validAnswerCount: 8 + seed.index,
      correctRate: seed.kind === "news" ? 0.72 : 0.58,
      avgClarity: seed.kind === "news" ? 2.5 : 2.1,
      avgThinkingValue: 2.4,
      avgExplanationHelpfulness: seed.kind === "news" ? 2.6 : 2.0,
      issueFlagRate: seed.kind === "news" ? 0.12 : 0.28,
      statsStatus: seed.index % 2 === 0 ? "stable" : "preliminary",
    },
    cardJson: buildFixtureCardJson(seed.kind, `${seed.classId}_${seed.seat}`),
    lesson5Stats: {
      validAnswerCount: 8 + seed.index,
      correctRate: seed.kind === "news" ? 0.72 : 0.58,
      avgClarity: seed.kind === "news" ? 2.5 : 2.1,
      avgThinkingValue: 2.4,
      avgExplanationHelpfulness: seed.kind === "news" ? 2.6 : 2.0,
      issueFlagRate: seed.kind === "news" ? 0.12 : 0.28,
      statsStatus: seed.index % 2 === 0 ? "stable" : "preliminary",
    },
    revisionPlan: {
      revisionAction: seed.kind === "news" ? "minor_fix" : "major_fix",
      diagnosis: {
        selectedProblems: seed.kind === "news" ? ["source_insufficient"] : ["explanation_unclear"],
        evidence: "根据课时 5 试答反馈补足证据链。",
      },
      revisionReason: "学生根据同伴作答与统计反馈补充题干限定和解析证据。",
      expectedEffect: "降低误判，帮助公共挑战答题者看懂核验路径。",
      submittedAt,
      updatedAt: submittedAt,
    },
    checkedByUserId: seed.status === "publishable" ? "user_xnwy_li" : null,
    checkedAt,
    teacherNote: seed.status === "publishable" ? "fixture 已确认可发布。" : "",
    createdAt: submittedAt,
    updatedAt: checkedAt ?? submittedAt,
  }
}

let fixtureReviews: Lesson6ReviewDetail[] = [
  buildFixtureReview({ index: 1, classId: "g7c03", className: "七年级 3 班", kind: "news", status: "pending_teacher_check", active: false, seat: "0301", hoursAgo: 2 }),
  buildFixtureReview({ index: 2, classId: "g7c03", className: "七年级 3 班", kind: "image", status: "pending_teacher_check", active: false, seat: "0302", hoursAgo: 4 }),
  buildFixtureReview({ index: 3, classId: "g7c04", className: "七年级 4 班", kind: "news", status: "publishable", active: true, seat: "0401", hoursAgo: 12 }),
  buildFixtureReview({ index: 4, classId: "g7c05", className: "七年级 5 班", kind: "image", status: "pending_teacher_check", active: false, seat: "0501", hoursAgo: 7 }),
]

function parseFixtureAccount(token: string): TeacherLoginAccount | null {
  if (!token.startsWith(fixturePrefix)) return null
  const account = token.slice(fixturePrefix.length)
  return account in fixtureClassPermissions ? account as TeacherLoginAccount : null
}

function listFixturePermissions(token: string): TeacherClassPermissionItem[] {
  const account = parseFixtureAccount(token)
  if (!account) {
    throw new TeacherConsoleHttpError("登录状态已失效，请重新登录。", 401)
  }
  if (account === "xnwy-demo") return demoClassPermissions
  return fixtureClassPermissions[account]
}

function requireFixtureView(token: string, classId: string): TeacherClassPermissionItem {
  const permission = listFixturePermissions(token).find(item => item.classId === classId)
  if (!permission) {
    throw new TeacherConsoleHttpError("当前账号没有查看该班级发布审核的权限。", 403)
  }
  return permission
}

function requireFixtureManage(token: string, classId: string): TeacherClassPermissionItem {
  const account = parseFixtureAccount(token)
  const permission = requireFixtureView(token, classId)
  if (account === "xnwy-demo" || permission.permission !== "manage") {
    throw new TeacherConsoleHttpError("当前账号没有确认该班级题卡发布的权限。", 403)
  }
  return permission
}

function reviewListItem(detail: Lesson6ReviewDetail): Lesson6ReviewItem {
  return {
    reviewId: detail.reviewId,
    itemId: detail.itemId,
    itemVersionId: detail.itemVersionId,
    classId: detail.classId,
    className: detail.className,
    cardKind: detail.cardKind,
    itemShortName: detail.itemShortName,
    studentDisplay: detail.studentDisplay,
    submittedAt: detail.submittedAt,
    checkStatus: detail.checkStatus,
    isActivePublic: detail.isActivePublic,
    lesson5StatsSummary: detail.lesson5StatsSummary,
  }
}

async function listReviewsFixture(token: string, query: Lesson6ReviewListQuery = {}): Promise<Lesson6ReviewsResponse> {
  const permissions = listFixturePermissions(token)
  const visibleClassIds = new Set(permissions.map(item => item.classId))
  const visibleReviews = fixtureReviews.filter(item => visibleClassIds.has(item.classId))
  const filteredReviews = visibleReviews
    .filter(item => !query.classId || item.classId === query.classId)
    .filter(item => !query.status || item.checkStatus === query.status)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
  return {
    items: filteredReviews.map(reviewListItem),
    summary: {
      pendingCount: visibleReviews.filter(item => item.checkStatus === "pending_teacher_check").length,
      publishableCount: visibleReviews.filter(item => item.checkStatus === "publishable").length,
      activePublicCount: visibleReviews.filter(item => item.isActivePublic).length,
    },
  }
}

async function getReviewDetailFixture(token: string, reviewId: string): Promise<Lesson6ReviewDetail> {
  const detail = fixtureReviews.find(item => item.reviewId === reviewId)
  if (!detail) {
    throw new TeacherConsoleHttpError("发布审核记录不存在，请刷新列表后重试。", 404)
  }
  requireFixtureView(token, detail.classId)
  return detail
}

async function publishReviewFixture(
  token: string,
  reviewId: string,
  payload: Lesson6PublishRequest,
): Promise<Lesson6PublishResponse> {
  const detail = fixtureReviews.find(item => item.reviewId === reviewId)
  if (!detail) {
    throw new TeacherConsoleHttpError("发布审核记录不存在，请刷新列表后重试。", 404)
  }
  requireFixtureManage(token, detail.classId)
  const checkedAt = new Date().toISOString()
  fixtureReviews = fixtureReviews.map(item => {
    if (item.itemId === detail.itemId && item.reviewId !== detail.reviewId) {
      return { ...item, isActivePublic: false }
    }
    if (item.reviewId === detail.reviewId) {
      return {
        ...item,
        checkStatus: "publishable",
        isActivePublic: true,
        checkedAt,
        teacherNote: payload.teacherNote.trim(),
        updatedAt: checkedAt,
      }
    }
    return item
  })
  return {
    reviewId,
    checkStatus: "publishable",
    isActivePublic: true,
    checkedAt,
  }
}

async function getOverviewFixture(token: string): Promise<Lesson6Overview> {
  const permissions = listFixturePermissions(token)
  const visibleClassIds = new Set(permissions.map(item => item.classId))
  const visibleReviews = fixtureReviews.filter(item => visibleClassIds.has(item.classId))
  const publicItems = visibleReviews.filter(item => item.checkStatus === "publishable" && item.isActivePublic)
  const pendingItems = visibleReviews.filter(item => item.checkStatus === "pending_teacher_check")
  return {
    publicBank: {
      totalPublishable: publicItems.length,
      newsCount: publicItems.filter(item => item.cardKind === "news").length,
      imageCount: publicItems.filter(item => item.cardKind === "image").length,
    },
    pendingReview: {
      totalPending: pendingItems.length,
      newsCount: pendingItems.filter(item => item.cardKind === "news").length,
      imageCount: pendingItems.filter(item => item.cardKind === "image").length,
    },
    challengeStats: {
      lesson6ClassRuns: 3,
      publicShowcaseRuns: 2,
      totalRuns: 5,
      totalAnswers: 18,
      overallCorrectRate: 0.61,
    },
    topStats: {
      mostAnswered: publicItems.slice(0, 3).map(item => ({ ...reviewListItem(item), totalAnswerCount: 12, totalCorrectRate: 0.67 })),
      lowestCorrectRate: publicItems.slice(0, 3).map(item => ({ ...reviewListItem(item), totalAnswerCount: 6, totalCorrectRate: 0.42 })),
      highestCorrectRate: publicItems.slice(0, 3).map(item => ({ ...reviewListItem(item), totalAnswerCount: 8, totalCorrectRate: 0.83 })),
    },
  }
}

function buildFixtureItemStat(item: Lesson6ReviewDetail, index: number): Lesson6PublicItemStat {
  const totalAnswerCount = index === 0 ? 14 : index === 1 ? 6 : 0
  const totalCorrectCount = index === 0 ? 8 : index === 1 ? 3 : 0
  const lesson6ClassAnswerCount = index === 0 ? 8 : index === 1 ? 2 : 0
  const lesson6ClassCorrectCount = index === 0 ? 7 : index === 1 ? 1 : 0
  const publicShowcaseAnswerCount = totalAnswerCount - lesson6ClassAnswerCount
  const publicShowcaseCorrectCount = totalCorrectCount - lesson6ClassCorrectCount
  return {
    itemId: item.itemId,
    itemVersionId: item.itemVersionId,
    publishStatus: item.checkStatus,
    cardKind: item.cardKind,
    itemShortName: item.itemShortName,
    totalAnswerCount,
    totalCorrectCount,
    totalCorrectRate: totalAnswerCount === 0 ? 0 : totalCorrectCount / totalAnswerCount,
    lesson6ClassAnswerCount,
    lesson6ClassCorrectCount,
    lesson6ClassCorrectRate: lesson6ClassAnswerCount === 0 ? 0 : lesson6ClassCorrectCount / lesson6ClassAnswerCount,
    publicShowcaseAnswerCount,
    publicShowcaseCorrectCount,
    publicShowcaseCorrectRate: publicShowcaseAnswerCount === 0 ? 0 : publicShowcaseCorrectCount / publicShowcaseAnswerCount,
    lastAnsweredAt: totalAnswerCount === 0 ? null : fixtureTimestamp(1 + index),
  }
}

async function getPublicItemStatsFixture(token: string): Promise<Lesson6PublicItemStatsResponse> {
  const permissions = listFixturePermissions(token)
  const visibleClassIds = new Set(permissions.map(item => item.classId))
  const items = fixtureReviews
    .filter(item => visibleClassIds.has(item.classId))
    .filter(item => item.checkStatus === "publishable" && item.isActivePublic)
    .map(buildFixtureItemStat)
    .sort((a, b) => b.totalAnswerCount - a.totalAnswerCount || a.itemVersionId.localeCompare(b.itemVersionId))
  return { items }
}

function buildListQuery(query: Lesson6ReviewListQuery = {}): string {
  const params = new URLSearchParams()
  if (query.status) params.set("status", query.status)
  if (query.classId) params.set("classId", query.classId)
  const value = params.toString()
  return value ? `?${value}` : ""
}

async function listReviewsHttp(token: string, query: Lesson6ReviewListQuery = {}): Promise<Lesson6ReviewsResponse> {
  return await fetchTeacherJson<Lesson6ReviewsResponse>(
    resolveTeacherConsoleEndpoint(`/v3-publication-reviews${buildListQuery(query)}`, TEACHER_LESSON6_BASE_PATH),
    {
      method: "GET",
      headers: buildTeacherAuthHeaders(token),
    },
  )
}

async function getReviewDetailHttp(token: string, reviewId: string): Promise<Lesson6ReviewDetail> {
  return await fetchTeacherJson<Lesson6ReviewDetail>(
    resolveTeacherConsoleEndpoint(`/v3-publication-reviews/${encodeURIComponent(reviewId)}`, TEACHER_LESSON6_BASE_PATH),
    {
      method: "GET",
      headers: buildTeacherAuthHeaders(token),
    },
  )
}

async function publishReviewHttp(
  token: string,
  reviewId: string,
  payload: Lesson6PublishRequest,
): Promise<Lesson6PublishResponse> {
  return await fetchTeacherJson<Lesson6PublishResponse>(
    resolveTeacherConsoleEndpoint(`/v3-publication-reviews/${encodeURIComponent(reviewId)}/publish`, TEACHER_LESSON6_BASE_PATH),
    {
      method: "POST",
      headers: buildTeacherJsonHeaders(token),
      body: JSON.stringify(payload),
    },
  )
}

async function getOverviewHttp(token: string): Promise<Lesson6Overview> {
  return await fetchTeacherJson<Lesson6Overview>(
    resolveTeacherConsoleEndpoint("/public-bank/overview", TEACHER_LESSON6_BASE_PATH),
    {
      method: "GET",
      headers: buildTeacherAuthHeaders(token),
    },
  )
}

async function getPublicItemStatsHttp(token: string): Promise<Lesson6PublicItemStatsResponse> {
  return await fetchTeacherJson<Lesson6PublicItemStatsResponse>(
    resolveTeacherConsoleEndpoint("/public-bank/item-stats", TEACHER_LESSON6_BASE_PATH),
    {
      method: "GET",
      headers: buildTeacherAuthHeaders(token),
    },
  )
}

export const teacherLesson6Adapter: TeacherLesson6Adapter = {
  listReviews: (token, query) => resolveTeacherConsoleMode() === "http" ? listReviewsHttp(token, query) : listReviewsFixture(token, query),
  getReviewDetail: (token, reviewId) => resolveTeacherConsoleMode() === "http" ? getReviewDetailHttp(token, reviewId) : getReviewDetailFixture(token, reviewId),
  publishReview: (token, reviewId, payload) => resolveTeacherConsoleMode() === "http" ? publishReviewHttp(token, reviewId, payload) : publishReviewFixture(token, reviewId, payload),
  getOverview: token => resolveTeacherConsoleMode() === "http" ? getOverviewHttp(token) : getOverviewFixture(token),
  getPublicItemStats: token => resolveTeacherConsoleMode() === "http" ? getPublicItemStatsHttp(token) : getPublicItemStatsFixture(token),
}
