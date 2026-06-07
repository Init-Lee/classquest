"""
文件说明：模块 4 课时 5 账号、认证、班级授权、题池、session、answer、rating、progress、stats、report、revision 与 completion API 数据结构。
职责：定义登录/Me/登出、admin 班级与授权管理、teacher 班级列表、学生 V2/V3 提交、班级题池 overview、教师 session 生命周期、学生 assignment/answer/rating、教师 progress/stats/analytics/revision-plans 与学生 my-report/completion-summary 的 Pydantic 请求/响应 schema，字段统一 camelCase，对齐 API 契约与前端 adapter。
更新触发：课时 5 auth/admin/teacher 账号端点、学生提交流、题池 overview、session/锁池/phase、answer/rating/progress/stats/report/revision/completion 字段、角色或权限枚举、前端 adapter 契约变化时，需要同步更新本文件。
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

AccountRole = Literal["admin", "teacher", "demo"]
ClassPermission = Literal["manage", "view"]


class UserDTO(BaseModel):
    """登录用户基础信息（不含任何口令字段）。"""

    userId: str
    account: str
    displayName: str
    role: AccountRole


class ClassPermissionDTO(BaseModel):
    """教师对单个班级的授权信息；className 以服务端 cq_classes 为准回填。"""

    classId: str
    className: str
    permission: ClassPermission


class LoginRequest(BaseModel):
    """POST /auth/login 请求体；demo 账号可省略 password，其它账号仍走后端统一口令。"""

    account: str = Field(..., min_length=1)
    password: str = ""


class LoginResponse(BaseModel):
    """POST /auth/login 成功响应；demo 的全班只读视图由 teacher/classes 提供。"""

    token: str
    user: UserDTO
    classPermissions: list[ClassPermissionDTO] = Field(default_factory=list)


class MeResponse(BaseModel):
    """GET /auth/me 成功响应；按当前有效会话回填用户与班级授权。"""

    user: UserDTO
    classPermissions: list[ClassPermissionDTO] = Field(default_factory=list)


class LogoutResponse(BaseModel):
    """POST /auth/logout 成功响应。"""

    ok: bool


class ClassDTO(BaseModel):
    """班级基础信息，供 admin 班级列表使用。"""

    classId: str
    className: str
    gradeLabel: str
    active: bool


class ClassListResponse(BaseModel):
    """GET /admin/module4/classes 成功响应。"""

    classes: list[ClassDTO] = Field(default_factory=list)


class UserListResponse(BaseModel):
    """GET /admin/module4/users 成功响应（仅 admin/teacher/demo，非学生）。"""

    users: list[UserDTO] = Field(default_factory=list)


class ClassAssignmentDTO(BaseModel):
    """教师班级授权明细，供 admin class-assignments 视图使用。"""

    userId: str
    account: str
    displayName: str
    classId: str
    className: str
    permission: ClassPermission


class AssignmentsResponse(BaseModel):
    """GET /admin/module4/class-assignments 成功响应。"""

    assignments: list[ClassAssignmentDTO] = Field(default_factory=list)


class PutTeacherClassItem(BaseModel):
    """PUT teachers/{user_id}/classes 单条授权项；className 仅作前端展示参考，服务端以 cq_classes 回填。"""

    classId: str = Field(..., min_length=1)
    className: Optional[str] = None
    permission: ClassPermission


class PutTeacherClassesRequest(BaseModel):
    """PUT teachers/{user_id}/classes 请求体；assignments 为目标教师的全量授权（空数组表示清空）。"""

    assignments: list[PutTeacherClassItem] = Field(default_factory=list)


class PutTeacherClassesResponse(BaseModel):
    """PUT teachers/{user_id}/classes 成功响应。"""

    ok: bool
    userId: str
    updatedCount: int


class TeacherClassDTO(BaseModel):
    """教师可见的单个班级及其授权级别。"""

    classId: str
    className: str
    gradeLabel: str
    permission: ClassPermission


class TeacherClassesResponse(BaseModel):
    """GET /teacher/module4/classes 成功响应；demo 返回全部班级的 view 只读视图。"""

    classes: list[TeacherClassDTO] = Field(default_factory=list)


CardKind = Literal["news", "image"]
SessionRunType = Literal["normal", "makeup", "test"]
SessionPhase = Literal[
    "draft",
    "pool_locked",
    "trial_open",
    "trial_locked",
    "analytics_open",
    "revision_open",
    "closed",
]
PoolItemStatus = Literal[
    "empty",
    "v2_submitted",
    "in_trial",
    "needs_revision",
    "ready_for_lesson6",
    "excluded",
]
PoolVersionStatus = Literal[
    "draft",
    "submitted_to_trial_pool",
    "used_in_session",
    "ready_for_lesson6",
    "superseded",
    "excluded",
]
RevisionAction = Literal["keep", "minor_fix", "major_fix", "hold"]
ReadyForLesson6 = Literal["none", "partial", "full"]


class V2SubmissionRequest(BaseModel):
    """学生从课时 5 Step1 提交 lesson4 ready 包的请求体。"""

    classId: str = Field(..., min_length=1)
    studentName: str = Field(..., min_length=1)
    classSeatCode: str = Field(..., min_length=1)
    lesson5ClientId: str = Field(..., min_length=1)
    readyPackage: dict[str, Any]


class V2SubmissionItemResult(BaseModel):
    """单张 V2 卡进入题池后的结果；deduped 表示命中同 hash 版本。"""

    itemId: str
    v2VersionId: str
    status: PoolVersionStatus
    deduped: bool


class V2SubmissionResponse(BaseModel):
    """学生 V2 提交成功响应。"""

    ok: bool
    classId: str
    studentName: str
    classSeatCode: str
    items: dict[CardKind, V2SubmissionItemResult]
    submittedAt: str


class ClassPoolItemDto(BaseModel):
    """教师题池 overview 中的一条题卡 item。"""

    itemId: str
    classId: str
    authorSeatCode: str
    authorName: str
    cardKind: CardKind
    currentV2VersionId: Optional[str] = None
    currentV2ContentHash: Optional[str] = None
    currentV2ShortName: Optional[str] = None
    currentV2Status: Optional[PoolVersionStatus] = None
    status: PoolItemStatus
    updatedAt: str


class ClassPoolOverviewResponse(BaseModel):
    """教师查看某班级题池的只读 overview 响应。"""

    classId: str
    generatedAt: str
    items: list[ClassPoolItemDto] = Field(default_factory=list)


class ClassPoolItemDetailResponse(BaseModel):
    """教师点击题池 item 后读取的当前 V2 题卡详情；仅供授权教师/演示账号只读预览。"""

    itemId: str
    classId: str
    authorSeatCode: str
    authorName: str
    cardKind: CardKind
    itemVersionId: str
    contentHash: str
    itemShortName: Optional[str] = None
    status: PoolVersionStatus
    material: dict[str, Any] = Field(default_factory=dict)
    task: dict[str, Any] = Field(default_factory=dict)
    options: list[dict[str, Any]] = Field(default_factory=list)
    correctOptionKey: Optional[str] = None
    cardJson: dict[str, Any] = Field(default_factory=dict)
    updatedAt: str


class SessionSettings(BaseModel):
    """课时 5 会话设置；news/image 数量由服务端按 questionCount 派生。"""

    questionCount: int = Field(..., ge=1)
    newsCount: int
    imageCount: int


class CreateSessionSettingsRequest(BaseModel):
    """创建会话时前端只提交总题量，服务端补齐 news/image 分布。"""

    questionCount: int


class CreateSessionRequest(BaseModel):
    """POST /lesson5/sessions 请求体。"""

    classId: str = Field(..., min_length=1)
    runType: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    settings: CreateSessionSettingsRequest


class SessionDto(BaseModel):
    """教师端 session 列表与详情使用的会话摘要。"""

    sessionId: str
    classId: str
    className: str
    title: str
    runType: SessionRunType
    phase: SessionPhase
    settings: SessionSettings
    createdAt: str
    updatedAt: str
    poolLockedAt: Optional[str] = None
    trialOpenedAt: Optional[str] = None
    trialLockedAt: Optional[str] = None
    analyticsOpenedAt: Optional[str] = None
    revisionOpenedAt: Optional[str] = None
    closedAt: Optional[str] = None


class SessionListResponse(BaseModel):
    """GET /lesson5/sessions 成功响应。"""

    sessions: list[SessionDto] = Field(default_factory=list)


class UpdateSettingsRequest(BaseModel):
    """PATCH /lesson5/sessions/{session_id}/settings 请求体。"""

    settings: CreateSessionSettingsRequest


class FrozenPoolCounts(BaseModel):
    """会话冻结题池按卡片类型计数。"""

    news: int
    image: int
    total: int


class LockPoolResponse(BaseModel):
    """POST /lesson5/sessions/{session_id}/lock-pool 成功响应。"""

    sessionId: str
    phase: SessionPhase
    frozen: FrozenPoolCounts


class PhaseChangeRequest(BaseModel):
    """POST /lesson5/sessions/{session_id}/phase 请求体。"""

    targetPhase: str = Field(..., min_length=1)


class PhaseChangeResponse(BaseModel):
    """phase 推进成功响应。"""

    sessionId: str
    phase: SessionPhase
    changedAt: str


class SessionOverviewResponse(BaseModel):
    """教师端 session overview：会话元信息、冻结计数与当前班级提交状态。"""

    session: SessionDto
    frozen: FrozenPoolCounts
    classPoolAuthorsSubmitted: int
    classPoolAuthorsMissing: int
    classPoolItemsCurrentV2: int
    readiness: list[str] = Field(default_factory=list)
    generatedAt: str


class ActiveSessionResponse(BaseModel):
    """学生端 active-session 成功响应；无可连接会话时路由返回 404。"""

    sessionId: str
    classId: str
    className: str
    title: str
    runType: SessionRunType
    phase: SessionPhase
    settings: SessionSettings
    serverNow: str


class AttachParticipantRequest(BaseModel):
    """POST /participants/attach 请求体；学生端以班级、座位码与本机 clientId 绑定 session。"""

    sessionId: str = Field(..., min_length=1)
    classId: str = Field(..., min_length=1)
    studentName: str = Field(..., min_length=1)
    classSeatCode: str = Field(..., min_length=1)
    lesson5ClientId: str = Field(..., min_length=1)


class AttachParticipantResponse(BaseModel):
    """学生 attach 成功响应；重复 attach 返回同一个 participantId。"""

    participantId: str
    sessionId: str
    phase: SessionPhase
    serverNow: str


class ParticipantStateDto(BaseModel):
    """学生在当前 session 下的进度摘要；C4a 阶段 answered/rated 通常为 0。"""

    participantId: str
    answeredCount: int
    ratedCount: int
    completed: bool


class SessionStateResponse(BaseModel):
    """学生轮询 session 状态响应；participant 必须属于该 session。"""

    sessionId: str
    phase: SessionPhase
    settings: SessionSettings
    participant: ParticipantStateDto
    serverNow: str


class AssignmentDto(BaseModel):
    """学生端 assignment 展示 DTO；不暴露正确答案、解析、来源或作者身份。"""

    assignmentId: str
    itemId: str
    itemVersionId: str
    cardKind: CardKind
    orderIndex: int
    material: dict[str, Any] = Field(default_factory=dict)
    task: dict[str, Any] = Field(default_factory=dict)
    options: list[dict[str, Any]] = Field(default_factory=list)
    itemShortName: Optional[str] = None


class AssignmentListResponse(BaseModel):
    """学生端 assignment 列表响应；首次生成后持久化，后续重复读取保持顺序稳定。"""

    sessionId: str
    participantId: str
    assignments: list[AssignmentDto] = Field(default_factory=list)
    serverNow: str


class IssueFlag(str, Enum):
    """课时 5 快评问题标记固定集合，服务端用于拒绝未登记标记。"""

    source_insufficient = "source_insufficient"
    explanation_unclear = "explanation_unclear"
    option_confusing = "option_confusing"
    material_mismatch = "material_mismatch"
    other = "other"


class StatsStatus(str, Enum):
    """题卡统计样本状态；阈值由 C6 数据反馈口径固定。"""

    insufficient = "insufficient"
    preliminary = "preliminary"
    stable = "stable"


STATS_STATUS_PRELIMINARY_MIN = 3
STATS_STATUS_STABLE_MIN = 8


class DiagnosisHint(str, Enum):
    """学生报告中的最小固定诊断提示集合。"""

    needs_more_samples = "needs_more_samples"
    low_correct_rate = "low_correct_rate"
    low_clarity = "low_clarity"
    low_thinking_value = "low_thinking_value"
    low_explanation_helpfulness = "low_explanation_helpfulness"
    high_issue_flag_rate = "high_issue_flag_rate"


class AnswerSubmitRequest(BaseModel):
    """POST /assignments/{assignment_id}/answer 请求体；学生身份沿用 participant + clientId。"""

    participantId: str = Field(..., min_length=1)
    lesson5ClientId: str = Field(..., min_length=1)
    selectedOptionKey: str = Field(..., min_length=1)
    idempotencyKey: Optional[str] = None


class AnswerRevealOptionDto(BaseModel):
    """作答成功后揭示的单个选项解答；仅在 answer 响应中出现。"""

    key: str = ""
    label: str = ""
    rationale: str = ""


class AnswerRevealDto(BaseModel):
    """作答成功后揭示的解析、摘要、逐选项解答与来源；仅在 answer 响应中出现。"""

    explanation: str = ""
    summary: str = ""
    options: list[AnswerRevealOptionDto] = Field(default_factory=list)
    source: Optional[Any] = None


class AnswerSubmitResponse(BaseModel):
    """学生提交 answer 后的官方判分与揭示响应。"""

    answerId: str
    assignmentId: str
    itemId: str
    itemVersionId: str
    selectedOptionKey: str
    correctOptionKey: str
    isCorrect: bool
    reveal: AnswerRevealDto
    answeredAt: str


class RatingSubmitRequest(BaseModel):
    """POST /answers/{answer_id}/rating 请求体；三维评分由服务端校验为 1-3。"""

    participantId: str = Field(..., min_length=1)
    lesson5ClientId: str = Field(..., min_length=1)
    clarity: int
    thinkingValue: int
    explanationHelpfulness: int
    issueFlags: list[str] = Field(default_factory=list)
    comment: str = ""


class RatingSubmitResponse(BaseModel):
    """学生提交 rating 后的幂等确认响应。"""

    ratingId: str
    answerId: str
    assignmentId: str
    ratedAt: str


class SessionProgressParticipantDto(BaseModel):
    """教师进度视图中的单个学生聚合行，不包含答案、解析或题目作者信息。"""

    participantId: str
    studentName: str
    classSeatCode: str
    answeredCount: int
    ratedCount: int
    completed: bool


class SessionProgressSummaryDto(BaseModel):
    """教师进度视图的全班聚合计数。"""

    attachedCount: int
    answeredCount: int
    ratedCount: int
    completedCount: int
    questionCount: int


class SessionProgressResponse(BaseModel):
    """教师端 session progress 响应；仅暴露进度聚合。"""

    sessionId: str
    phase: SessionPhase
    settings: SessionSettings
    participants: list[SessionProgressParticipantDto] = Field(default_factory=list)
    summary: SessionProgressSummaryDto
    generatedAt: str


class ItemStatsDto(BaseModel):
    """单张冻结题卡的班级统计结果；不包含作者座位与姓名。"""

    itemId: str
    itemVersionId: str
    itemShortName: Optional[str] = None
    kind: CardKind
    validAnswerCount: int
    correctCount: int
    correctRate: float
    avgClarity: Optional[float] = None
    avgThinkingValue: Optional[float] = None
    avgExplanationHelpfulness: Optional[float] = None
    issueFlagCount: int
    issueFlagRate: float
    issueFlags: list[IssueFlag] = Field(default_factory=list)
    sampleComments: list[str] = Field(default_factory=list)
    statsStatus: StatsStatus
    computedAt: str


class StatsStatusBreakdownDto(BaseModel):
    """按样本状态聚合的题卡数量。"""

    insufficient: int = 0
    preliminary: int = 0
    stable: int = 0


class ComputeStatsResponse(BaseModel):
    """POST compute-stats 成功响应；compute 只落统计，不推进 phase。"""

    sessionId: str
    computedItemCount: int
    statsStatusBreakdown: StatsStatusBreakdownDto
    computedAt: str


class SessionAnalyticsSummaryDto(BaseModel):
    """教师 analytics 的班级级汇总，不暴露题卡作者身份。"""

    itemCount: int
    validAnswerCount: int
    averageCorrectRate: Optional[float] = None
    averageIssueFlagRate: Optional[float] = None
    statsStatusBreakdown: StatsStatusBreakdownDto


class SessionAnalyticsResponse(BaseModel):
    """GET analytics 成功响应；默认只返回题卡级统计与班级汇总。"""

    sessionId: str
    phase: SessionPhase
    settings: SessionSettings
    items: list[ItemStatsDto] = Field(default_factory=list)
    summary: SessionAnalyticsSummaryDto
    generatedAt: str


class MyReportItemStatsDto(ItemStatsDto):
    """学生 my-report 中的本人题卡统计，附带诊断提示。"""

    diagnosisHints: list[DiagnosisHint] = Field(default_factory=list)


class MyReportResponse(BaseModel):
    """GET my-report 成功响应；仅返回当前 participant 本人作者题卡。"""

    sessionId: str
    participantId: str
    items: list[MyReportItemStatsDto] = Field(default_factory=list)
    generatedAt: str


class V3RevisionDiagnosis(BaseModel):
    """V3 修订计划中的诊断证据；selectedProblems 使用前端固定枚举字符串透传。"""

    selectedProblems: list[str] = Field(default_factory=list)
    evidence: str = ""


class V3RevisionPlanPayload(BaseModel):
    """学生提交 V3 时携带的修订计划。"""

    revisionAction: RevisionAction
    diagnosis: V3RevisionDiagnosis = Field(default_factory=V3RevisionDiagnosis)
    revisionReason: str = ""
    expectedEffect: str = ""


class V3SubmissionRequest(BaseModel):
    """POST /v3-submissions 请求体；允许 analytics_open 后提交本人题卡。"""

    sessionId: str = Field(..., min_length=1)
    participantId: str = Field(..., min_length=1)
    lesson5ClientId: str = Field(..., min_length=1)
    itemId: str = Field(..., min_length=1)
    baseV2VersionId: str = Field(..., min_length=1)
    revisionPlan: V3RevisionPlanPayload
    v3CardJson: dict[str, Any]


class V3SubmissionResponse(BaseModel):
    """学生 V3 提交成功响应；deduped 表示命中同内容 hash 的既有 V3。"""

    ok: bool
    itemId: str
    v3VersionId: str
    status: PoolVersionStatus
    readyForLesson6: ReadyForLesson6
    deduped: bool


class RevisionPlanItemDto(BaseModel):
    """教师修订总览中的单张题卡修订状态。"""

    studentSeatCode: str
    studentName: str
    participantId: Optional[str] = None
    itemId: str
    cardKind: CardKind
    baseV2VersionId: str
    v3VersionId: Optional[str] = None
    revisionAction: Optional[RevisionAction] = None
    diagnosis: dict[str, Any] = Field(default_factory=dict)
    revisionReason: str = ""
    expectedEffect: str = ""
    status: Literal["none", "submitted"]
    submittedAt: Optional[str] = None
    updatedAt: Optional[str] = None


class RevisionPlansSummaryDto(BaseModel):
    """教师修订总览聚合计数。"""

    totalItems: int
    submittedItems: int
    readyFullStudents: int
    readyPartialStudents: int
    readyNoneStudents: int


class RevisionPlansResponse(BaseModel):
    """GET revision-plans 成功响应；按冻结题池 item 返回班级修订状态。"""

    sessionId: str
    phase: SessionPhase
    items: list[RevisionPlanItemDto] = Field(default_factory=list)
    summary: RevisionPlansSummaryDto
    generatedAt: str


class MyCompletionRevisionDto(BaseModel):
    """学生完成摘要中的 V3 修订状态。"""

    readyForLesson6: ReadyForLesson6
    submittedCount: int
    submittedItems: list[RevisionPlanItemDto] = Field(default_factory=list)


class QuickCheckDto(BaseModel):
    """本地快照 QuickCheck 的服务端证据摘要。"""

    t1HasV2Submission: bool
    t2HasTrialStats: bool
    t3HasV3Submission: bool


class MyCompletionSummaryResponse(BaseModel):
    """GET my-completion-summary 成功响应；供学生 Step4 生成本地阶段快照。"""

    sessionId: str
    participantId: str
    v2Submit: dict[str, Any] = Field(default_factory=dict)
    trial: dict[str, Any] = Field(default_factory=dict)
    myItemStats: list[MyReportItemStatsDto] = Field(default_factory=list)
    revision: MyCompletionRevisionDto
    quickCheck: QuickCheckDto
    generatedAt: str
