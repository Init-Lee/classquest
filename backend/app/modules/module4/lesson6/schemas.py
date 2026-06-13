"""
文件说明：模块 4 课时 6 API 数据结构。
职责：定义教师 V3 发布审核、公共题库 overview、学生本人 V3 发布状态查询与匿名公共挑战的 Pydantic 请求/响应模型，字段统一 camelCase。
更新触发：Lesson6 发布审核端点、公共题库 overview、学生状态查询、公共挑战 runtime 或前端 adapter 契约变化时，需要同步更新本文件。
"""

from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

CardKind = Literal["news", "image"]
PublicationCheckStatus = Literal["pending_teacher_check", "publishable"]
StudentPublicationStatus = Literal["pending_teacher_check", "publishable", "unknown"]
PublicChallengeContext = Literal["lesson6_class", "public_showcase"]


class Lesson5StatsSummaryDto(BaseModel):
    """审核列表与详情中复用的课时 5 试答统计摘要。"""

    validAnswerCount: int = 0
    correctRate: float = 0.0
    avgClarity: Optional[float] = None
    avgThinkingValue: Optional[float] = None
    avgExplanationHelpfulness: Optional[float] = None
    issueFlagRate: float = 0.0
    statsStatus: str = ""


class PublicationReviewListItemDto(BaseModel):
    """教师审核列表中的单条 V3 发布确认记录。"""

    reviewId: str
    itemId: str
    itemVersionId: str
    classId: str
    className: str
    cardKind: CardKind
    itemShortName: str
    studentDisplay: str
    submittedAt: str
    checkStatus: PublicationCheckStatus
    isActivePublic: bool
    lesson5StatsSummary: Optional[Lesson5StatsSummaryDto] = None


class PublicationReviewsSummaryDto(BaseModel):
    """教师审核列表顶部聚合计数。"""

    pendingCount: int = 0
    publishableCount: int = 0
    activePublicCount: int = 0


class PublicationReviewsResponse(BaseModel):
    """GET v3-publication-reviews 成功响应。"""

    items: list[PublicationReviewListItemDto] = Field(default_factory=list)
    summary: PublicationReviewsSummaryDto


class RevisionPlanPreviewDto(BaseModel):
    """审核详情中展示的学生 V3 修订说明。"""

    revisionAction: Optional[str] = None
    diagnosis: dict[str, Any] = Field(default_factory=dict)
    revisionReason: str = ""
    expectedEffect: str = ""
    submittedAt: Optional[str] = None
    updatedAt: Optional[str] = None


class PublicationReviewDetailResponse(PublicationReviewListItemDto):
    """GET 单条审核详情响应，包含完整题卡预览、统计和修订说明。"""

    cardJson: dict[str, Any] = Field(default_factory=dict)
    lesson5Stats: Optional[Lesson5StatsSummaryDto] = None
    revisionPlan: Optional[RevisionPlanPreviewDto] = None
    checkedByUserId: Optional[str] = None
    checkedAt: Optional[str] = None
    teacherNote: str = ""
    createdAt: str
    updatedAt: str


class PublishReviewRequest(BaseModel):
    """POST publish 请求体；教师备注可为空字符串。"""

    teacherNote: str = ""


class PublishReviewResponse(BaseModel):
    """POST publish 成功响应。"""

    reviewId: str
    checkStatus: PublicationCheckStatus
    isActivePublic: bool
    checkedAt: str


class KindCountDto(BaseModel):
    """公共题库 overview 中按卡片类型拆分的计数。"""

    totalPublishable: int = 0
    newsCount: int = 0
    imageCount: int = 0


class PendingReviewCountDto(BaseModel):
    """公共题库 overview 中待审核记录计数。"""

    totalPending: int = 0
    newsCount: int = 0
    imageCount: int = 0


class ChallengeStatsDto(BaseModel):
    """公共挑战运行统计；C1a 只读取已存在表，不生成挑战运行。"""

    lesson6ClassRuns: int = 0
    publicShowcaseRuns: int = 0
    totalRuns: int = 0
    totalAnswers: int = 0
    overallCorrectRate: float = 0.0


class PublicQuestionTopStatsDto(BaseModel):
    """公共题库 top 统计结构，按挑战作答缓存生成。"""

    mostAnswered: list[dict[str, Any]] = Field(default_factory=list)
    lowestCorrectRate: list[dict[str, Any]] = Field(default_factory=list)
    highestCorrectRate: list[dict[str, Any]] = Field(default_factory=list)


class PublicQuestionItemStatDto(BaseModel):
    """公共题库逐题统计结构，仅包含 item-version 汇总字段。"""

    itemId: str
    itemVersionId: str
    publishStatus: PublicationCheckStatus
    cardKind: CardKind
    itemShortName: str
    totalAnswerCount: int = 0
    totalCorrectCount: int = 0
    totalCorrectRate: float = 0.0
    lesson6ClassAnswerCount: int = 0
    lesson6ClassCorrectCount: int = 0
    lesson6ClassCorrectRate: float = 0.0
    publicShowcaseAnswerCount: int = 0
    publicShowcaseCorrectCount: int = 0
    publicShowcaseCorrectRate: float = 0.0
    lastAnsweredAt: Optional[str] = None


class PublicQuestionItemStatsResponse(BaseModel):
    """GET public-bank/item-stats 成功响应。"""

    items: list[PublicQuestionItemStatDto] = Field(default_factory=list)


class PublicBankOverviewResponse(BaseModel):
    """GET public-bank/overview 成功响应。"""

    publicBank: KindCountDto
    pendingReview: PendingReviewCountDto
    challengeStats: ChallengeStatsDto
    topStats: PublicQuestionTopStatsDto


class StudentPublicationStatusQueryItem(BaseModel):
    """学生本地档案提交的单张 V3 item/version 查询键。"""

    model_config = ConfigDict(extra="forbid")

    kind: CardKind
    itemId: str = Field(..., min_length=1)
    itemVersionId: str = Field(..., min_length=1)


class StudentPublicationStatusRequest(BaseModel):
    """POST my-v3-publication-status 请求体；不接收班级或座位条件。"""

    model_config = ConfigDict(extra="forbid")

    items: list[StudentPublicationStatusQueryItem] = Field(default_factory=list)


class StudentPublicationStatusItemDto(BaseModel):
    """学生本人 V3 发布状态响应项，仅回显请求中的 item/version 键。"""

    kind: CardKind
    itemId: str
    itemVersionId: str
    status: StudentPublicationStatus
    label: str
    checkedAt: str = ""


class StudentPublicationStatusResponse(BaseModel):
    """POST my-v3-publication-status 成功响应。"""

    items: list[StudentPublicationStatusItemDto] = Field(default_factory=list)
    syncedAt: str


class PublicChallengeRunCreateRequest(BaseModel):
    """POST public-challenge/runs 请求体；只允许两个既定 context。"""

    model_config = ConfigDict(extra="forbid")

    context: PublicChallengeContext


class PublicChallengeRunCreateResponse(BaseModel):
    """创建匿名公共挑战 run 的成功响应。"""

    runId: str
    context: PublicChallengeContext
    questionCount: int
    startedAt: str


class PublicChallengeCurrentQuestionResponse(BaseModel):
    """当前下一题响应；未作答前不包含答案、解析、来源或作者身份。"""

    runId: str
    runItemId: Optional[str] = None
    orderIndex: Optional[int] = None
    questionCount: int
    answeredCount: int = 0
    completed: bool = False
    kind: Optional[CardKind] = None
    material: dict[str, Any] = Field(default_factory=dict)
    task: dict[str, Any] = Field(default_factory=dict)


class PublicChallengeAnswerRequest(BaseModel):
    """POST public-challenge/runs/{runId}/answers 请求体。"""

    model_config = ConfigDict(extra="forbid")

    runItemId: str = Field(..., min_length=1)
    selectedOptionKey: str = Field(..., min_length=1)
    durationMs: Optional[int] = Field(default=None, ge=0)


class PublicChallengeProgressDto(BaseModel):
    """公共挑战作答进度。"""

    answeredCount: int
    questionCount: int


class PublicChallengeNextDto(BaseModel):
    """公共挑战下一题指针。"""

    hasNext: bool
    nextOrderIndex: Optional[int] = None


class PublicChallengeAnswerResponse(BaseModel):
    """作答后的判分与揭示响应；不包含作者身份。"""

    isCorrect: bool
    correctOptionKey: str
    explanation: dict[str, Any] = Field(default_factory=dict)
    source: Optional[Any] = None
    progress: PublicChallengeProgressDto
    next: PublicChallengeNextDto


class PublicChallengeSummaryResponse(BaseModel):
    """公共挑战 run 完成摘要。"""

    runId: str
    completed: bool
    questionCount: int
    answeredCount: int
    context: PublicChallengeContext
    completedAt: Optional[str] = None
