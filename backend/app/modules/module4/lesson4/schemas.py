"""
文件说明：模块 4 课时 4 同伴互审 API 数据结构。
职责：定义送审、状态查询等 Pydantic 请求/响应 schema，与前端 api/types.ts 及 API-DRAFT 对齐。
更新触发：课时 4 互审 endpoint、字段、状态枚举或前端 adapter 契约变化时，需要同步更新本文件。
"""

from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, validator

Lesson4OutboundStatus = Literal["pending", "claimed", "submitted", "pulled", "expired", "cancelled"]


class Lesson4SnapshotMeta(BaseModel):
    """冻结 V1 快照元信息。"""

    version: Literal["v1"]
    snapshotCreatedAt: str = Field(..., min_length=1)


class Lesson4ReviewRequestJson(BaseModel):
    """作者送审时的冻结题卡 JSON。"""

    cards: dict[str, Any]
    snapshotMeta: Lesson4SnapshotMeta

    @validator("cards")
    @classmethod
    def validate_cards(cls, value: dict[str, Any]) -> dict[str, Any]:
        """送审必须同时包含 news 与 image 两张题卡。"""
        if "news" not in value or "image" not in value:
            raise ValueError("requestJson.cards 必须同时包含 news 与 image")
        return value


class Lesson4CreateReviewRequestPayload(BaseModel):
    """POST /review-requests 请求体。"""

    classId: str = Field(..., min_length=1)
    authorSeatCode: str = Field(..., min_length=4, max_length=4)
    targetReviewerSeatCode: str = Field(..., min_length=4, max_length=4)
    requestJson: Lesson4ReviewRequestJson

    @validator("authorSeatCode", "targetReviewerSeatCode")
    @classmethod
    def validate_seat_code_digits(cls, value: str) -> str:
        """班学号必须为 4 位数字。"""
        if not value.isdigit():
            raise ValueError("班学号必须为 4 位数字")
        return value


class Lesson4CreateReviewRequestResponse(BaseModel):
    """POST /review-requests 成功响应。"""

    requestId: str
    status: Literal["pending"]
    inviteCode: str
    serverNow: str
    pendingExpiresAt: str


class Lesson4FetchReviewRequestStatusResponse(BaseModel):
    """GET /review-requests/{request_id}/status 成功响应。"""

    requestId: str
    status: Lesson4OutboundStatus
    serverNow: str
    pendingExpiresAt: Optional[str] = None
    reviewExpiresAt: Optional[str] = None
    submittedAt: Optional[str] = None
    reviewJson: Optional[dict[str, Any]] = None


class Lesson4CancelReviewRequestPayload(BaseModel):
    """POST /review-requests/{request_id}/cancel 请求体。"""

    authorSeatCode: str = Field(..., min_length=4, max_length=4)

    @validator("authorSeatCode")
    @classmethod
    def validate_seat_code_digits(cls, value: str) -> str:
        """班学号必须为 4 位数字。"""
        if not value.isdigit():
            raise ValueError("班学号必须为 4 位数字")
        return value


class Lesson4CancelReviewRequestResponse(BaseModel):
    """POST /review-requests/{request_id}/cancel 成功响应。"""

    requestId: str
    status: Literal["cancelled"]
    serverNow: str


Lesson4InboxTaskStatus = Literal["pending", "claimed", "expired"]


class Lesson4ReviewerInboxTask(BaseModel):
    """收件箱任务摘要，不含完整 requestJson。"""

    requestId: str
    authorSeatCode: str
    status: Lesson4InboxTaskStatus
    pendingExpiresAt: Optional[str] = None


class Lesson4ReviewerInboxResponse(BaseModel):
    """GET /review-requests/inbox 成功响应。"""

    serverNow: str
    tasks: list[Lesson4ReviewerInboxTask]


class Lesson4RecoveredOutboundRequest(BaseModel):
    """作者侧恢复出的最近互审请求。"""

    requestId: str
    status: Lesson4OutboundStatus
    targetReviewerSeatCode: str
    inviteCode: Optional[str] = None
    sentAt: str
    pendingExpiresAt: Optional[str] = None
    reviewExpiresAt: Optional[str] = None
    submittedAt: Optional[str] = None
    reviewJson: Optional[dict[str, Any]] = None


class Lesson4RecoveredInboundRequest(BaseModel):
    """审查者侧恢复出的最近互审任务。"""

    requestId: str
    status: Literal["claimed", "submitted", "pulled"]
    authorSeatCode: str
    reviewExpiresAt: Optional[str] = None
    submittedAt: Optional[str] = None
    requestJson: Optional[Lesson4ReviewRequestJson] = None
    reviewJson: Optional[dict[str, Any]] = None


class Lesson4RecoverPeerReviewStateResponse(BaseModel):
    """GET /review-requests/recovery 成功响应。"""

    serverNow: str
    outbound: Optional[Lesson4RecoveredOutboundRequest] = None
    inbound: Optional[Lesson4RecoveredInboundRequest] = None


class Lesson4ClaimReviewRequestPayload(BaseModel):
    """POST /review-requests/{request_id}/claim 请求体。"""

    reviewerSeatCode: str = Field(..., min_length=4, max_length=4)
    inviteCode: str = Field(..., min_length=4, max_length=4)

    @validator("reviewerSeatCode")
    @classmethod
    def validate_reviewer_seat_code_digits(cls, value: str) -> str:
        """审查者班学号必须为 4 位数字。"""
        if not value.isdigit():
            raise ValueError("班学号必须为 4 位数字")
        return value

    @validator("inviteCode")
    @classmethod
    def validate_invite_code_digits(cls, value: str) -> str:
        """审查码必须为 4 位数字。"""
        if not value.isdigit():
            raise ValueError("审查码必须为 4 位数字")
        return value


class Lesson4ClaimReviewRequestResponse(BaseModel):
    """POST /review-requests/{request_id}/claim 成功响应。"""

    requestId: str
    status: Literal["claimed"]
    serverNow: str
    reviewExpiresAt: str
    requestJson: Lesson4ReviewRequestJson


class Lesson4ReviewFeedbackJson(BaseModel):
    """审查者提交的 review JSON；cards 须含 news 与 image。"""

    cards: dict[str, Any]

    @validator("cards")
    @classmethod
    def validate_cards(cls, value: dict[str, Any]) -> dict[str, Any]:
        """整体提交必须同时包含 news 与 image 两张题卡反馈。"""
        if "news" not in value or "image" not in value:
            raise ValueError("reviewJson.cards 必须同时包含 news 与 image")
        return value


class Lesson4SubmitReviewRequestPayload(BaseModel):
    """POST /review-requests/{request_id}/submit 请求体。"""

    reviewerSeatCode: str = Field(..., min_length=4, max_length=4)
    reviewJson: Lesson4ReviewFeedbackJson

    @validator("reviewerSeatCode")
    @classmethod
    def validate_reviewer_seat_code_digits(cls, value: str) -> str:
        """审查者班学号必须为 4 位数字。"""
        if not value.isdigit():
            raise ValueError("班学号必须为 4 位数字")
        return value


class Lesson4SubmitReviewRequestResponse(BaseModel):
    """POST /review-requests/{request_id}/submit 成功响应。"""

    requestId: str
    status: Literal["submitted", "expired"]
    serverNow: str
    submittedAt: Optional[str] = None


class Lesson4PullReviewRequestPayload(BaseModel):
    """POST /review-requests/{request_id}/pull 请求体。"""

    authorSeatCode: str = Field(..., min_length=4, max_length=4)

    @validator("authorSeatCode")
    @classmethod
    def validate_author_seat_code_digits(cls, value: str) -> str:
        """作者班学号必须为 4 位数字。"""
        if not value.isdigit():
            raise ValueError("班学号必须为 4 位数字")
        return value


class Lesson4PullReviewRequestResponse(BaseModel):
    """POST /review-requests/{request_id}/pull 成功响应。"""

    requestId: str
    status: Literal["pulled"]
    serverNow: str
    pulledAt: str
    reviewJson: dict[str, Any]


Lesson4ModerateTextCardKey = Literal["news", "image", "overall"]


class Lesson4ModerateTextItem(BaseModel):
    """单段待审核文字。"""

    fieldKey: str = Field(..., min_length=1)
    card: Lesson4ModerateTextCardKey
    label: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)


class Lesson4ModerateTextPayload(BaseModel):
    """POST /review-requests/moderate-text 请求体。"""

    texts: list[Lesson4ModerateTextItem] = Field(..., min_items=1, max_items=12)


class Lesson4ModerateTextFieldResult(BaseModel):
    """单字段审核结果。"""

    model_config = ConfigDict(populate_by_name=True)

    pass_: bool = Field(..., alias="pass")
    reasons: list[str] = Field(default_factory=list)


class Lesson4ModerateTextCardResult(BaseModel):
    """单卡审核结果（由 byField 聚合，兼容旧客户端）。"""

    model_config = ConfigDict(populate_by_name=True)

    pass_: bool = Field(..., alias="pass")
    reasons: list[str] = Field(default_factory=list)


class Lesson4ModerateTextResponse(BaseModel):
    """文字审核响应：按 fieldKey 分组原因，byCard 为聚合视图。"""

    model_config = ConfigDict(populate_by_name=True)

    pass_: bool = Field(..., alias="pass")
    byField: dict[str, Lesson4ModerateTextFieldResult]
    byCard: dict[Lesson4ModerateTextCardKey, Lesson4ModerateTextCardResult]
