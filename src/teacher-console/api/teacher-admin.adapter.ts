/**
 * 文件说明：teacher-console 班级、题池与授权 adapter。
 * 职责：提供教师可见班级、班级题池 overview、admin 班级/用户/授权查询和教师授权全量覆盖写入；默认 fixture，http 模式对接后端 API。
 * 更新触发：admin、teacher 或题池 endpoint、请求/响应字段、fixture 授权样例或权限错误映射变化时，需要同步更新本文件。
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
  PutTeacherClassesRequest,
  PutTeacherClassesResponse,
  TeacherAdminAdapter,
  TeacherAdminAssignment,
  TeacherAdminClass,
  TeacherClassPoolItemDetail,
  TeacherClassPoolItem,
  TeacherClassPoolOverview,
  TeacherLoginAccount,
  TeacherUser,
  TeacherVisibleClass,
} from "@/teacher-console/types"

const TEACHER_BASE_PATH = "/api/v1/teacher/module4"
const ADMIN_BASE_PATH = "/api/v1/admin/module4"

const fixtureClasses: TeacherAdminClass[] = Array.from({ length: 12 }, (_, index) => {
  const number = index + 1
  const classId = `g7c${String(number).padStart(2, "0")}`
  return {
    classId,
    className: `七年级 ${number} 班`,
    gradeLabel: "七年级",
    active: true,
  }
})

const fixtureUsers: TeacherUser[] = [
  { userId: "user_xnwy_admin", account: "xnwy-admin", displayName: "西南位育管理员", role: "admin" },
  { userId: "user_xnwy_li", account: "xnwy-li", displayName: "李老师", role: "teacher" },
  { userId: "user_xnwy_zhang", account: "xnwy-zhang", displayName: "张老师", role: "teacher" },
  { userId: "user_xnwy_tang", account: "xnwy-tang", displayName: "唐老师", role: "teacher" },
  { userId: "user_xnwy_demo", account: "xnwy-demo", displayName: "演示账号", role: "demo" },
]

let fixtureAssignments: TeacherAdminAssignment[] = Object.entries(fixtureClassPermissions)
  .flatMap(([account, permissions]) => {
    const user = fixtureUsers.find(item => item.account === account)
    if (!user || user.role !== "teacher") return []
    return permissions.map(permission => ({
      userId: user.userId,
      account: user.account,
      displayName: user.displayName,
      classId: permission.classId,
      className: permission.className,
      permission: permission.permission,
    }))
  })

function getFixtureAccountFromToken(token: string): TeacherLoginAccount | null {
  const prefix = "fixture_teacher_console_"
  if (!token.startsWith(prefix)) return null
  const account = token.slice(prefix.length)
  return fixtureUsers.some(user => user.account === account) ? account as TeacherLoginAccount : null
}

function getFixtureUserFromToken(token: string): TeacherUser {
  const account = getFixtureAccountFromToken(token)
  const user = fixtureUsers.find(item => item.account === account)
  if (!user) {
    throw new TeacherConsoleHttpError("登录状态已失效，请重新登录。", 401)
  }
  return user
}

function requireFixtureAdmin(token: string): void {
  const user = getFixtureUserFromToken(token)
  if (user.role !== "admin") {
    throw new TeacherConsoleHttpError("需要管理员权限。", 403)
  }
}

function resolveClass(classId: string): TeacherAdminClass {
  const target = fixtureClasses.find(item => item.classId === classId)
  if (!target) {
    throw new TeacherConsoleHttpError(`班级不存在：${classId}。`, 400)
  }
  return target
}

function buildFixturePoolItem(
  classId: string,
  index: number,
  cardKind: TeacherClassPoolItem["cardKind"],
): TeacherClassPoolItem {
  const seatCode = `S${String(index).padStart(2, "0")}`
  return {
    itemId: `fixture_pool_${classId}_${seatCode}_${cardKind}`,
    classId,
    authorSeatCode: seatCode,
    authorName: `学生${index}`,
    cardKind,
    currentV2VersionId: `fixture_v2_${classId}_${seatCode}`,
    currentV2ContentHash: `fixture_hash_${classId}_${seatCode}`,
    currentV2ShortName: `${cardKind === "news" ? "新闻" : "图片"}题卡 ${seatCode}`,
    currentV2Status: "v2_ready",
    status: "active",
    updatedAt: new Date(Date.now() - index * 60 * 60 * 1000).toISOString(),
  }
}

function listFixturePoolItems(classId: string): TeacherClassPoolItem[] {
  const fixtureCounts: Record<string, number> = {
    g7c01: 8,
    g7c02: 6,
    g7c03: 10,
  }
  const count = fixtureCounts[classId] ?? 0
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1
    return buildFixturePoolItem(classId, number, index % 2 === 0 ? "news" : "image")
  })
}

function buildFixturePoolItemDetail(item: TeacherClassPoolItem): TeacherClassPoolItemDetail {
  const kindLabel = item.cardKind === "news" ? "新闻" : "图片"
  const correctOptionKey = item.cardKind === "news" ? "B" : "A"
  const material = {
    title: `${kindLabel}题卡素材 ${item.authorSeatCode}`,
    displayNote: "fixture 预览素材，用于教师端题池详情弹窗。",
    asset: item.cardKind === "image"
      ? {
          dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='480' height='270'><rect width='100%25' height='100%25' fill='%23e2e8f0'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%231e293b' font-size='24'>Fixture Image Card</text></svg>",
          mimeType: "image/svg+xml",
          name: "fixture-image-card.svg",
          alt: "Fixture image card preview",
        }
      : null,
  }
  const task = {
    question: `这张${kindLabel}题卡要求学生判断哪一个选项最可信？`,
    options: [
      { key: "A", text: "选项 A：信息可信" },
      { key: "B", text: "选项 B：信息存疑" },
      { key: "C", text: "选项 C：需要更多来源" },
    ],
    correctOptionKey,
    explanation: "fixture 解析：教师端详情用于核对题卡内容，不参与学生作答。",
    source: "本地 fixture 数据",
  }
  return {
    itemId: item.itemId,
    classId: item.classId,
    authorSeatCode: item.authorSeatCode,
    authorName: item.authorName,
    cardKind: item.cardKind,
    itemVersionId: item.currentV2VersionId ?? `${item.itemId}-v2`,
    contentHash: item.currentV2ContentHash ?? "fixture_hash",
    itemShortName: item.currentV2ShortName,
    status: item.currentV2Status ?? item.status,
    material,
    task,
    options: task.options,
    correctOptionKey,
    cardJson: { id: item.itemId, kind: item.cardKind, material, task },
    updatedAt: item.updatedAt,
  }
}

async function listTeacherClassesFixture(token: string): Promise<TeacherVisibleClass[]> {
  const user = getFixtureUserFromToken(token)
  if (user.role === "demo") {
    return fixtureClasses.map(item => ({ ...item, permission: "view" }))
  }
  if (user.role !== "teacher") return []
  return fixtureAssignments
    .filter(item => item.userId === user.userId)
    .map(item => ({
      ...resolveClass(item.classId),
      permission: item.permission,
    }))
}

async function getClassPoolOverviewFixture(token: string, classId: string): Promise<TeacherClassPoolOverview> {
  const classes = await listTeacherClassesFixture(token)
  if (!classes.some(item => item.classId === classId)) {
    throw new TeacherConsoleHttpError("当前账号没有查看该班级题池的权限。", 403)
  }
  return {
    classId,
    generatedAt: new Date().toISOString(),
    items: listFixturePoolItems(classId),
  }
}

async function getClassPoolItemDetailFixture(
  token: string,
  classId: string,
  itemId: string,
): Promise<TeacherClassPoolItemDetail> {
  const overview = await getClassPoolOverviewFixture(token, classId)
  const item = overview.items.find(poolItem => poolItem.itemId === itemId)
  if (!item) {
    throw new TeacherConsoleHttpError("题池题卡不存在或不属于当前班级。", 404)
  }
  return buildFixturePoolItemDetail(item)
}

async function listAdminClassesFixture(token: string): Promise<TeacherAdminClass[]> {
  requireFixtureAdmin(token)
  return fixtureClasses
}

async function listUsersFixture(token: string): Promise<TeacherUser[]> {
  requireFixtureAdmin(token)
  return fixtureUsers
}

async function listClassAssignmentsFixture(token: string): Promise<TeacherAdminAssignment[]> {
  requireFixtureAdmin(token)
  return fixtureAssignments
}

async function putTeacherClassesFixture(
  token: string,
  userId: string,
  payload: PutTeacherClassesRequest,
): Promise<PutTeacherClassesResponse> {
  requireFixtureAdmin(token)
  const target = fixtureUsers.find(item => item.userId === userId)
  if (!target) throw new TeacherConsoleHttpError("目标用户不存在。", 404)
  if (target.role !== "teacher") throw new TeacherConsoleHttpError("只能为教师账号分配班级授权。", 400)

  const nextAssignments = payload.assignments.map(item => {
    const targetClass = resolveClass(item.classId)
    return {
      userId: target.userId,
      account: target.account,
      displayName: target.displayName,
      classId: targetClass.classId,
      className: targetClass.className,
      permission: item.permission,
    }
  })
  fixtureAssignments = [
    ...fixtureAssignments.filter(item => item.userId !== userId),
    ...nextAssignments,
  ]
  fixtureClassPermissions[target.account] = nextAssignments.map(item => ({
    classId: item.classId,
    className: item.className,
    permission: item.permission,
  }))
  return { ok: true, userId, updatedCount: nextAssignments.length }
}

async function listTeacherClassesHttp(token: string): Promise<TeacherVisibleClass[]> {
  const response = await fetchTeacherJson<{ classes: TeacherVisibleClass[] }>(
    resolveTeacherConsoleEndpoint("/classes", TEACHER_BASE_PATH),
    {
      method: "GET",
      headers: buildTeacherAuthHeaders(token),
    },
  )
  return response.classes
}

async function getClassPoolOverviewHttp(token: string, classId: string): Promise<TeacherClassPoolOverview> {
  return await fetchTeacherJson<TeacherClassPoolOverview>(
    resolveTeacherConsoleEndpoint(`/lesson5/classes/${encodeURIComponent(classId)}/pool-overview`, TEACHER_BASE_PATH),
    {
      method: "GET",
      headers: buildTeacherAuthHeaders(token),
    },
  )
}

async function getClassPoolItemDetailHttp(
  token: string,
  classId: string,
  itemId: string,
): Promise<TeacherClassPoolItemDetail> {
  return await fetchTeacherJson<TeacherClassPoolItemDetail>(
    resolveTeacherConsoleEndpoint(
      `/lesson5/classes/${encodeURIComponent(classId)}/pool-items/${encodeURIComponent(itemId)}`,
      TEACHER_BASE_PATH,
    ),
    {
      method: "GET",
      headers: buildTeacherAuthHeaders(token),
    },
  )
}

async function listAdminClassesHttp(token: string): Promise<TeacherAdminClass[]> {
  const response = await fetchTeacherJson<{ classes: TeacherAdminClass[] }>(
    resolveTeacherConsoleEndpoint("/classes", ADMIN_BASE_PATH),
    {
      method: "GET",
      headers: buildTeacherAuthHeaders(token),
    },
  )
  return response.classes
}

async function listUsersHttp(token: string): Promise<TeacherUser[]> {
  const response = await fetchTeacherJson<{ users: TeacherUser[] }>(
    resolveTeacherConsoleEndpoint("/users", ADMIN_BASE_PATH),
    {
      method: "GET",
      headers: buildTeacherAuthHeaders(token),
    },
  )
  return response.users
}

async function listClassAssignmentsHttp(token: string): Promise<TeacherAdminAssignment[]> {
  const response = await fetchTeacherJson<{ assignments: TeacherAdminAssignment[] }>(
    resolveTeacherConsoleEndpoint("/class-assignments", ADMIN_BASE_PATH),
    {
      method: "GET",
      headers: buildTeacherAuthHeaders(token),
    },
  )
  return response.assignments
}

async function putTeacherClassesHttp(
  token: string,
  userId: string,
  payload: PutTeacherClassesRequest,
): Promise<PutTeacherClassesResponse> {
  return await fetchTeacherJson<PutTeacherClassesResponse>(
    resolveTeacherConsoleEndpoint(`/teachers/${encodeURIComponent(userId)}/classes`, ADMIN_BASE_PATH),
    {
      method: "PUT",
      headers: buildTeacherJsonHeaders(token),
      body: JSON.stringify(payload),
    },
  )
}

export const teacherAdminAdapter: TeacherAdminAdapter = {
  listTeacherClasses: token => resolveTeacherConsoleMode() === "http" ? listTeacherClassesHttp(token) : listTeacherClassesFixture(token),
  getClassPoolOverview: (token, classId) => resolveTeacherConsoleMode() === "http"
    ? getClassPoolOverviewHttp(token, classId)
    : getClassPoolOverviewFixture(token, classId),
  getClassPoolItemDetail: (token, classId, itemId) => resolveTeacherConsoleMode() === "http"
    ? getClassPoolItemDetailHttp(token, classId, itemId)
    : getClassPoolItemDetailFixture(token, classId, itemId),
  listAdminClasses: token => resolveTeacherConsoleMode() === "http" ? listAdminClassesHttp(token) : listAdminClassesFixture(token),
  listUsers: token => resolveTeacherConsoleMode() === "http" ? listUsersHttp(token) : listUsersFixture(token),
  listClassAssignments: token => resolveTeacherConsoleMode() === "http" ? listClassAssignmentsHttp(token) : listClassAssignmentsFixture(token),
  putTeacherClasses: (token, userId, payload) => resolveTeacherConsoleMode() === "http"
    ? putTeacherClassesHttp(token, userId, payload)
    : putTeacherClassesFixture(token, userId, payload),
}
