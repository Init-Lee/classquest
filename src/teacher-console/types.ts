/**
 * 文件说明：teacher-console 前端类型契约。
 * 职责：集中定义教师控制台登录、会话、班级授权、题池 overview、session progress、analytics、revision-plans、admin 管理与 adapter 共享的数据结构，字段对齐后端 camelCase API。
 * 更新触发：课时 5 账号/权限/题池 overview/progress/analytics/revision-plans API 字段、角色枚举、权限枚举或 teacher-console 页面数据契约变化时，需要同步更新本文件。
 */

export type TeacherConsoleMode = "fixture" | "http"
export type TeacherAccountRole = "admin" | "teacher" | "demo"
export type TeacherClassPermission = "manage" | "view"
export type Lesson5SessionRunType = "normal" | "makeup" | "test"
export type Lesson5SessionPhase =
  | "draft"
  | "pool_locked"
  | "trial_open"
  | "trial_locked"
  | "analytics_open"
  | "revision_open"
  | "closed"

export interface TeacherUser {
  userId: string
  account: TeacherLoginAccount
  displayName: string
  role: TeacherAccountRole
}

export interface TeacherClassPermissionItem {
  classId: string
  className: string
  permission: TeacherClassPermission
}

export interface TeacherSession {
  token: string
  user: TeacherUser
  classPermissions: TeacherClassPermissionItem[]
}

export interface TeacherAuthLoginRequest {
  account: TeacherLoginAccount
  password: string
}

export type TeacherAuthLoginResponse = TeacherSession

export interface TeacherAuthMeResponse {
  user: TeacherUser
  classPermissions: TeacherClassPermissionItem[]
}

export interface TeacherAuthLogoutResponse {
  ok: boolean
}

export interface TeacherAdminClass {
  classId: string
  className: string
  gradeLabel: string
  active: boolean
}

export interface TeacherVisibleClass extends TeacherAdminClass {
  permission: TeacherClassPermission
}

export type TeacherPoolCardKind = "news" | "image"
export type Lesson5StatsStatus = "insufficient" | "preliminary" | "stable"
export type Lesson5RevisionAction = "keep" | "minor_fix" | "major_fix" | "hold"
export type Lesson5IssueFlag =
  | "source_insufficient"
  | "explanation_unclear"
  | "option_confusing"
  | "material_mismatch"
  | "other"

export interface TeacherClassPoolItem {
  itemId: string
  classId: string
  authorSeatCode: string
  authorName: string
  cardKind: TeacherPoolCardKind
  currentV2VersionId: string | null
  currentV2ContentHash: string | null
  currentV2ShortName: string | null
  currentV2Status: string | null
  status: string
  updatedAt: string
}

export interface TeacherClassPoolOverview {
  classId: string
  generatedAt: string
  items: TeacherClassPoolItem[]
}

export interface TeacherClassPoolItemDetail {
  itemId: string
  classId: string
  authorSeatCode: string
  authorName: string
  cardKind: TeacherPoolCardKind
  itemVersionId: string
  contentHash: string
  itemShortName?: string | null
  status: string
  material: Record<string, unknown>
  task: Record<string, unknown>
  options: Array<Record<string, unknown>>
  correctOptionKey?: string | null
  cardJson: Record<string, unknown>
  updatedAt: string
}

export interface Lesson5SessionSettings {
  questionCount: number
  newsCount: number
  imageCount: number
}

export interface CreateLesson5SessionSettingsRequest {
  questionCount: number
}

export interface CreateLesson5SessionRequest {
  classId: string
  runType: Lesson5SessionRunType
  title: string
  settings: CreateLesson5SessionSettingsRequest
}

export interface UpdateLesson5SessionSettingsRequest {
  settings: CreateLesson5SessionSettingsRequest
}

export interface Lesson5Session {
  sessionId: string
  classId: string
  className: string
  title: string
  runType: Lesson5SessionRunType
  phase: Lesson5SessionPhase
  settings: Lesson5SessionSettings
  createdAt: string
  updatedAt: string
  poolLockedAt?: string | null
  trialOpenedAt?: string | null
  trialLockedAt?: string | null
  analyticsOpenedAt?: string | null
  revisionOpenedAt?: string | null
  closedAt?: string | null
}

export interface Lesson5SessionListResponse {
  sessions: Lesson5Session[]
}

export interface Lesson5FrozenPoolCounts {
  news: number
  image: number
  total: number
}

export interface Lesson5LockPoolResponse {
  sessionId: string
  phase: Lesson5SessionPhase
  frozen: Lesson5FrozenPoolCounts
}

export interface Lesson5PhaseChangeRequest {
  targetPhase: Lesson5SessionPhase
}

export interface Lesson5PhaseChangeResponse {
  sessionId: string
  phase: Lesson5SessionPhase
  changedAt: string
}

export interface Lesson5SessionOverview {
  session: Lesson5Session
  frozen: Lesson5FrozenPoolCounts
  classPoolAuthorsSubmitted: number
  classPoolAuthorsMissing: number
  classPoolItemsCurrentV2: number
  readiness: string[]
  generatedAt: string
}

export interface Lesson5SessionProgressParticipant {
  participantId: string
  studentName: string
  classSeatCode: string
  answeredCount: number
  ratedCount: number
  completed: boolean
}

export interface Lesson5SessionProgressSummary {
  attachedCount: number
  answeredCount: number
  ratedCount: number
  completedCount: number
  questionCount: number
}

export interface Lesson5SessionProgressResponse {
  sessionId: string
  phase: Lesson5SessionPhase
  settings: Lesson5SessionSettings
  participants: Lesson5SessionProgressParticipant[]
  summary: Lesson5SessionProgressSummary
  generatedAt: string
}

export interface Lesson5StatsStatusBreakdown {
  insufficient: number
  preliminary: number
  stable: number
}

export interface Lesson5ComputeStatsResponse {
  sessionId: string
  computedItemCount: number
  statsStatusBreakdown: Lesson5StatsStatusBreakdown
  computedAt: string
}

export interface Lesson5ItemStatsDto {
  itemId: string
  itemVersionId: string
  itemShortName?: string | null
  kind: TeacherPoolCardKind
  validAnswerCount: number
  correctCount: number
  correctRate: number
  avgClarity: number | null
  avgThinkingValue: number | null
  avgExplanationHelpfulness: number | null
  issueFlagCount: number
  issueFlagRate: number
  issueFlags: Lesson5IssueFlag[]
  sampleComments: string[]
  statsStatus: Lesson5StatsStatus
  computedAt: string
}

export interface Lesson5SessionAnalyticsSummary {
  itemCount: number
  validAnswerCount: number
  averageCorrectRate: number | null
  averageIssueFlagRate: number | null
  statsStatusBreakdown: Lesson5StatsStatusBreakdown
}

export interface Lesson5SessionAnalyticsResponse {
  sessionId: string
  phase: Lesson5SessionPhase
  settings: Lesson5SessionSettings
  items: Lesson5ItemStatsDto[]
  summary: Lesson5SessionAnalyticsSummary
  generatedAt: string
}

export interface Lesson5RevisionPlanItemDto {
  studentSeatCode: string
  studentName: string
  participantId?: string | null
  itemId: string
  cardKind: TeacherPoolCardKind
  baseV2VersionId: string
  v3VersionId?: string | null
  revisionAction?: Lesson5RevisionAction | null
  diagnosis: Record<string, unknown>
  revisionReason: string
  expectedEffect: string
  status: "none" | "submitted"
  submittedAt?: string | null
  updatedAt?: string | null
}

export interface Lesson5RevisionPlansSummary {
  totalItems: number
  submittedItems: number
  readyFullStudents: number
  readyPartialStudents: number
  readyNoneStudents: number
}

export interface Lesson5RevisionPlansResponse {
  sessionId: string
  phase: Lesson5SessionPhase
  items: Lesson5RevisionPlanItemDto[]
  summary: Lesson5RevisionPlansSummary
  generatedAt: string
}

export interface TeacherAdminAssignment {
  userId: string
  account: TeacherLoginAccount
  displayName: string
  classId: string
  className: string
  permission: TeacherClassPermission
}

export interface PutTeacherClassAssignment {
  classId: string
  className?: string
  permission: TeacherClassPermission
}

export interface PutTeacherClassesRequest {
  assignments: PutTeacherClassAssignment[]
}

export interface PutTeacherClassesResponse {
  ok: boolean
  userId: string
  updatedCount: number
}

export const TEACHER_LOGIN_ACCOUNTS = [
  "xnwy-admin",
  "xnwy-li",
  "xnwy-zhang",
  "xnwy-tang",
  "xnwy-demo",
] as const

export type TeacherLoginAccount = typeof TEACHER_LOGIN_ACCOUNTS[number]

export interface TeacherAuthAdapter {
  login: (payload: TeacherAuthLoginRequest) => Promise<TeacherAuthLoginResponse>
  me: (token: string) => Promise<TeacherAuthMeResponse>
  logout: (token: string) => Promise<TeacherAuthLogoutResponse>
}

export interface TeacherAdminAdapter {
  listTeacherClasses: (token: string) => Promise<TeacherVisibleClass[]>
  getClassPoolOverview: (token: string, classId: string) => Promise<TeacherClassPoolOverview>
  getClassPoolItemDetail: (token: string, classId: string, itemId: string) => Promise<TeacherClassPoolItemDetail>
  listAdminClasses: (token: string) => Promise<TeacherAdminClass[]>
  listUsers: (token: string) => Promise<TeacherUser[]>
  listClassAssignments: (token: string) => Promise<TeacherAdminAssignment[]>
  putTeacherClasses: (
    token: string,
    userId: string,
    payload: PutTeacherClassesRequest,
  ) => Promise<PutTeacherClassesResponse>
}

export interface TeacherLesson5Adapter {
  createSession: (token: string, payload: CreateLesson5SessionRequest) => Promise<Lesson5Session>
  listSessions: (token: string, classId: string) => Promise<Lesson5SessionListResponse>
  updateSettings: (
    token: string,
    sessionId: string,
    payload: UpdateLesson5SessionSettingsRequest,
  ) => Promise<Lesson5Session>
  lockPool: (token: string, sessionId: string) => Promise<Lesson5LockPoolResponse>
  changePhase: (
    token: string,
    sessionId: string,
    payload: Lesson5PhaseChangeRequest,
  ) => Promise<Lesson5PhaseChangeResponse>
  getOverview: (token: string, sessionId: string) => Promise<Lesson5SessionOverview>
  fetchSessionProgress: (token: string, sessionId: string) => Promise<Lesson5SessionProgressResponse>
  computeStats: (token: string, sessionId: string) => Promise<Lesson5ComputeStatsResponse>
  fetchSessionAnalytics: (token: string, sessionId: string) => Promise<Lesson5SessionAnalyticsResponse>
  fetchRevisionPlans: (token: string, sessionId: string) => Promise<Lesson5RevisionPlansResponse>
  checkSessionStatsComputed: (token: string, sessionId: string) => Promise<boolean>
}
