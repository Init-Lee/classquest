"""
文件说明：模块 4 课时 4 同伴互审业务服务层。
职责：实现送审规则校验、审查码/请求 ID 生成、TTL 计算与 repository 编排。
更新触发：互审状态机、TTL、同班/自送/唯一性规则或端点业务逻辑变化时，需要同步更新本文件。
"""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from app.core.database import database_transaction

from . import repository
from .moderation import get_lesson4_moderation_provider
from .schemas import (
    Lesson4CancelReviewRequestPayload,
    Lesson4CancelReviewRequestResponse,
    Lesson4ClaimReviewRequestPayload,
    Lesson4ClaimReviewRequestResponse,
    Lesson4CreateReviewRequestPayload,
    Lesson4CreateReviewRequestResponse,
    Lesson4FetchReviewRequestStatusResponse,
    Lesson4ModerateTextPayload,
    Lesson4PullReviewRequestPayload,
    Lesson4PullReviewRequestResponse,
    Lesson4RecoverPeerReviewStateResponse,
    Lesson4RecoveredInboundRequest,
    Lesson4RecoveredOutboundRequest,
    Lesson4ModerateTextResponse,
    Lesson4ReviewRequestJson,
    Lesson4ReviewerInboxResponse,
    Lesson4ReviewerInboxTask,
    Lesson4SubmitReviewRequestPayload,
    Lesson4SubmitReviewRequestResponse,
)

PENDING_TTL_MINUTES = 6
REVIEW_TTL_MINUTES = 20
_CLAIM_RACE_MESSAGE = "这条任务已被撤回或已被领取，请刷新任务列表。"
_SUBMIT_RACE_MESSAGE = "这条任务已过期或已提交，请刷新任务列表。"
_PULL_RACE_MESSAGE = "反馈尚未提交或已被拉取，请刷新后查看。"


class Lesson4PeerReviewError(Exception):
    """同伴互审业务错误，携带 HTTP 状态码。"""

    def __init__(self, message: str, status_code: int) -> None:
        super().__init__(message)
        self.status_code = status_code


_SHANGHAI_TZ = ZoneInfo("Asia/Shanghai")


def _server_now() -> datetime:
    """返回当前中国标准时间（Asia/Shanghai，UTC+8）。"""
    return datetime.now(_SHANGHAI_TZ)


def _format_iso8601(value: datetime) -> str:
    """格式化为 API 使用的 ISO8601 字符串（含 +08:00 偏移）。"""
    normalized = value.astimezone(_SHANGHAI_TZ).replace(microsecond=0)
    return normalized.isoformat()


def _generate_request_id() -> str:
    """生成互审请求 ID。"""
    return f"req_{secrets.token_hex(8)}"


def _generate_invite_code() -> str:
    """生成 4 位审查码。"""
    return f"{secrets.randbelow(10000):04d}"


def _validate_same_class(author_seat_code: str, target_reviewer_seat_code: str) -> None:
    """校验作者与目标审查者属于同一班级（班学号前两位一致）。"""
    if author_seat_code[:2] != target_reviewer_seat_code[:2]:
        raise Lesson4PeerReviewError("目标同伴必须与你在同一班级。", 400)


def _validate_seat_code(author_seat_code: str) -> None:
    """校验班学号为 4 位数字。"""
    if len(author_seat_code) != 4 or not author_seat_code.isdigit():
        raise Lesson4PeerReviewError("班学号必须为 4 位数字。", 400)


def _validate_not_self_send(author_seat_code: str, target_reviewer_seat_code: str) -> None:
    """校验作者不能自送。"""
    if author_seat_code == target_reviewer_seat_code:
        raise Lesson4PeerReviewError("不能把题卡发送给自己。", 400)


def create_review_request(payload: Lesson4CreateReviewRequestPayload) -> Lesson4CreateReviewRequestResponse:
    """创建 pending 互审请求并持久化冻结 V1 快照。"""
    _validate_not_self_send(payload.authorSeatCode, payload.targetReviewerSeatCode)
    _validate_same_class(payload.authorSeatCode, payload.targetReviewerSeatCode)

    server_now_dt = _server_now()
    server_now = _format_iso8601(server_now_dt)
    pending_expires_at = _format_iso8601(server_now_dt + timedelta(minutes=PENDING_TTL_MINUTES))
    request_id = _generate_request_id()
    invite_code = _generate_invite_code()

    with database_transaction() as connection:
        repository.expire_stale_requests(connection, server_now)

        if repository.count_author_active_outbound(connection, payload.classId, payload.authorSeatCode) > 0:
            raise Lesson4PeerReviewError("你已有未完成的送审，请等待当前互审结束后再发起。", 409)

        if repository.count_target_active_inbound(connection, payload.classId, payload.targetReviewerSeatCode) > 0:
            raise Lesson4PeerReviewError("这位同学当前已有待审任务，请换一位同伴。", 409)

        repository.insert_review_request(
            connection,
            request_id=request_id,
            class_id=payload.classId,
            author_seat_code=payload.authorSeatCode,
            target_reviewer_seat_code=payload.targetReviewerSeatCode,
            invite_code=invite_code,
            request_json=payload.requestJson.dict(),
            created_at=server_now,
            pending_expires_at=pending_expires_at,
        )

    return Lesson4CreateReviewRequestResponse(
        requestId=request_id,
        status="pending",
        inviteCode=invite_code,
        serverNow=server_now,
        pendingExpiresAt=pending_expires_at,
    )


def _parse_review_json(raw: str | None) -> dict[str, Any] | None:
    """解析 review_json 文本；无效或空值返回 None。"""
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def _build_status_response(row: Any, server_now: str) -> Lesson4FetchReviewRequestStatusResponse:
    """按当前行状态组装作者侧 status 响应。"""
    status = row["status"]
    response = Lesson4FetchReviewRequestStatusResponse(
        requestId=row["id"],
        status=status,
        serverNow=server_now,
    )

    if status in ("pending", "claimed"):
        response.pendingExpiresAt = row["pending_expires_at"]
    if status == "claimed" and row["review_expires_at"]:
        response.reviewExpiresAt = row["review_expires_at"]
    if status == "submitted":
        response.submittedAt = row["submitted_at"]
        response.reviewJson = _parse_review_json(row["review_json"])
    if status == "pulled":
        response.reviewJson = _parse_review_json(row["review_json"])

    return response


def get_review_request_status(request_id: str, author_seat_code: str) -> Lesson4FetchReviewRequestStatusResponse:
    """查询作者侧互审请求状态，并在读取前机会式过期 stale 行。"""
    _validate_seat_code(author_seat_code)

    server_now_dt = _server_now()
    server_now = _format_iso8601(server_now_dt)

    with database_transaction() as connection:
        repository.expire_stale_requests(connection, server_now)
        row = repository.get_review_request_by_id(connection, request_id)

        if row is None:
            raise Lesson4PeerReviewError("没有找到这条互审请求，请刷新后重试。", 404)

        if row["author_seat_code"] != author_seat_code:
            raise Lesson4PeerReviewError("当前学号无权操作这条互审请求。", 403)

        return _build_status_response(row, server_now)


def cancel_review_request(request_id: str, payload: Lesson4CancelReviewRequestPayload) -> Lesson4CancelReviewRequestResponse:
    """作者撤回 pending 互审请求；claimed 及之后状态不可撤回。"""
    _validate_seat_code(payload.authorSeatCode)

    server_now_dt = _server_now()
    server_now = _format_iso8601(server_now_dt)

    with database_transaction() as connection:
        repository.expire_stale_requests(connection, server_now)
        row = repository.get_review_request_by_id(connection, request_id)

        if row is None:
            raise Lesson4PeerReviewError("没有找到这条互审请求，请刷新后重试。", 404)

        if row["author_seat_code"] != payload.authorSeatCode:
            raise Lesson4PeerReviewError("当前学号无权操作这条互审请求。", 403)

        if row["status"] == "cancelled":
            return Lesson4CancelReviewRequestResponse(
                requestId=request_id,
                status="cancelled",
                serverNow=server_now,
            )

        if row["status"] != "pending":
            raise Lesson4PeerReviewError("当前状态无法撤回，请刷新后查看。", 409)

        updated = repository.cancel_review_request(
            connection,
            request_id=request_id,
            cancelled_at=server_now,
        )
        if updated == 0:
            raise Lesson4PeerReviewError("当前状态无法撤回，请刷新后查看。", 409)

    return Lesson4CancelReviewRequestResponse(
        requestId=request_id,
        status="cancelled",
        serverNow=server_now,
    )


def get_reviewer_inbox(class_id: str, reviewer_seat_code: str) -> Lesson4ReviewerInboxResponse:
    """审查者刷新收件箱：仅返回任务摘要，不含 requestJson。"""
    _validate_seat_code(reviewer_seat_code)

    server_now_dt = _server_now()
    server_now = _format_iso8601(server_now_dt)

    with database_transaction() as connection:
        repository.expire_stale_requests(connection, server_now)
        rows = repository.list_reviewer_inbox_tasks(connection, class_id, reviewer_seat_code)

    tasks: list[Lesson4ReviewerInboxTask] = []
    for row in rows:
        task = Lesson4ReviewerInboxTask(
            requestId=row["id"],
            authorSeatCode=row["author_seat_code"],
            status=row["status"],
        )
        if row["pending_expires_at"]:
            task.pendingExpiresAt = row["pending_expires_at"]
        tasks.append(task)

    return Lesson4ReviewerInboxResponse(serverNow=server_now, tasks=tasks)


def get_peer_review_recovery_state(
    class_id: str,
    author_seat_code: str,
    reviewer_seat_code: str,
) -> Lesson4RecoverPeerReviewStateResponse:
    """按当前学生身份恢复作者侧与审查者侧最近互审状态。"""
    if not class_id.strip():
        raise Lesson4PeerReviewError("classId 不能为空。", 400)
    _validate_seat_code(author_seat_code)
    _validate_seat_code(reviewer_seat_code)

    server_now_dt = _server_now()
    server_now = _format_iso8601(server_now_dt)

    with database_transaction() as connection:
        repository.expire_stale_requests(connection, server_now)
        outbound_row = repository.get_latest_author_recovery_request(connection, class_id, author_seat_code)
        inbound_row = repository.get_latest_reviewer_recovery_request(connection, class_id, reviewer_seat_code)

    outbound: Lesson4RecoveredOutboundRequest | None = None
    if outbound_row is not None:
        outbound = Lesson4RecoveredOutboundRequest(
            requestId=outbound_row["id"],
            status=outbound_row["status"],
            targetReviewerSeatCode=outbound_row["target_reviewer_seat_code"],
            inviteCode=outbound_row["invite_code"] if outbound_row["status"] == "pending" else None,
            sentAt=outbound_row["created_at"],
            pendingExpiresAt=outbound_row["pending_expires_at"],
            reviewExpiresAt=outbound_row["review_expires_at"],
            submittedAt=outbound_row["submitted_at"],
            reviewJson=_parse_review_json(outbound_row["review_json"]),
        )

    inbound: Lesson4RecoveredInboundRequest | None = None
    if inbound_row is not None:
        request_json = None
        if inbound_row["status"] == "claimed":
            request_json = Lesson4ReviewRequestJson.parse_obj(_parse_request_json(inbound_row["request_json"]))
        inbound = Lesson4RecoveredInboundRequest(
            requestId=inbound_row["id"],
            status=inbound_row["status"],
            authorSeatCode=inbound_row["author_seat_code"],
            reviewExpiresAt=inbound_row["review_expires_at"],
            submittedAt=inbound_row["submitted_at"],
            requestJson=request_json,
            reviewJson=_parse_review_json(inbound_row["review_json"]),
        )

    return Lesson4RecoverPeerReviewStateResponse(
        serverNow=server_now,
        outbound=outbound,
        inbound=inbound,
    )


def _parse_request_json(raw: str | None) -> dict[str, Any]:
    """解析 request_json 文本；无效时抛出业务错误。"""
    if not raw:
        raise Lesson4PeerReviewError("互审题卡数据异常，请让同伴重新送审。", 500)
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise Lesson4PeerReviewError("互审题卡数据异常，请让同伴重新送审。", 500) from exc
    if not isinstance(parsed, dict):
        raise Lesson4PeerReviewError("互审题卡数据异常，请让同伴重新送审。", 500)
    return parsed


def claim_review_request(request_id: str, payload: Lesson4ClaimReviewRequestPayload) -> Lesson4ClaimReviewRequestResponse:
    """审查者输入审查码领取 pending 任务；与 cancel 对称使用 WHERE status='pending' 竞态保护。"""
    _validate_seat_code(payload.reviewerSeatCode)

    server_now_dt = _server_now()
    server_now = _format_iso8601(server_now_dt)
    review_expires_at = _format_iso8601(server_now_dt + timedelta(minutes=REVIEW_TTL_MINUTES))

    with database_transaction() as connection:
        repository.expire_stale_requests(connection, server_now)
        row = repository.get_review_request_by_id(connection, request_id)

        if row is None:
            raise Lesson4PeerReviewError("没有找到这条互审请求，请刷新后重试。", 404)

        if row["target_reviewer_seat_code"] != payload.reviewerSeatCode:
            raise Lesson4PeerReviewError("当前学号无权操作这条互审请求。", 403)

        if row["invite_code"] != payload.inviteCode:
            raise Lesson4PeerReviewError("审查码不正确，请和同伴确认后再试。", 400)

        status = row["status"]
        if status == "expired":
            raise Lesson4PeerReviewError("本次互审已过期，请重新发起。", 410)
        if status != "pending":
            raise Lesson4PeerReviewError(_CLAIM_RACE_MESSAGE, 409)

        updated = repository.claim_review_request(
            connection,
            request_id=request_id,
            claimed_reviewer_seat_code=payload.reviewerSeatCode,
            claimed_at=server_now,
            review_expires_at=review_expires_at,
        )
        if updated == 0:
            raise Lesson4PeerReviewError(_CLAIM_RACE_MESSAGE, 409)

        request_json_dict = _parse_request_json(row["request_json"])

    return Lesson4ClaimReviewRequestResponse(
        requestId=request_id,
        status="claimed",
        serverNow=server_now,
        reviewExpiresAt=review_expires_at,
        requestJson=Lesson4ReviewRequestJson.parse_obj(request_json_dict),
    )


def submit_review_request(
    request_id: str,
    payload: Lesson4SubmitReviewRequestPayload,
) -> Lesson4SubmitReviewRequestResponse:
    """审查者提交 claimed 任务的 review JSON；claimed TTL 过期后返回 expired 且不写入。"""
    _validate_seat_code(payload.reviewerSeatCode)

    server_now_dt = _server_now()
    server_now = _format_iso8601(server_now_dt)
    review_json_dict = payload.reviewJson.dict()

    with database_transaction() as connection:
        repository.expire_stale_requests(connection, server_now)
        row = repository.get_review_request_by_id(connection, request_id)

        if row is None:
            raise Lesson4PeerReviewError("没有找到这条互审请求，请刷新后重试。", 404)

        if row["target_reviewer_seat_code"] != payload.reviewerSeatCode:
            raise Lesson4PeerReviewError("当前学号无权操作这条互审请求。", 403)

        status = row["status"]
        if status == "expired":
            return Lesson4SubmitReviewRequestResponse(
                requestId=request_id,
                status="expired",
                serverNow=server_now,
            )

        if status != "claimed":
            raise Lesson4PeerReviewError(_SUBMIT_RACE_MESSAGE, 409)

        if row["claimed_reviewer_seat_code"] != payload.reviewerSeatCode:
            raise Lesson4PeerReviewError("当前学号无权操作这条互审请求。", 403)

        updated = repository.submit_review_request(
            connection,
            request_id=request_id,
            claimed_reviewer_seat_code=payload.reviewerSeatCode,
            review_json=review_json_dict,
            submitted_at=server_now,
        )
        if updated == 0:
            raise Lesson4PeerReviewError(_SUBMIT_RACE_MESSAGE, 409)

    return Lesson4SubmitReviewRequestResponse(
        requestId=request_id,
        status="submitted",
        serverNow=server_now,
        submittedAt=server_now,
    )


def pull_review_request(
    request_id: str,
    payload: Lesson4PullReviewRequestPayload,
) -> Lesson4PullReviewRequestResponse:
    """作者拉取 submitted 任务的 review JSON；submitted → pulled。"""
    _validate_seat_code(payload.authorSeatCode)

    server_now_dt = _server_now()
    server_now = _format_iso8601(server_now_dt)

    with database_transaction() as connection:
        repository.expire_stale_requests(connection, server_now)
        row = repository.get_review_request_by_id(connection, request_id)

        if row is None:
            raise Lesson4PeerReviewError("没有找到这条互审请求，请刷新后重试。", 404)

        if row["author_seat_code"] != payload.authorSeatCode:
            raise Lesson4PeerReviewError("当前学号无权操作这条互审请求。", 403)

        status = row["status"]
        if status == "pulled":
            review_json = _parse_review_json(row["review_json"])
            if not review_json:
                raise Lesson4PeerReviewError("互审反馈数据异常，请刷新后重试。", 500)
            return Lesson4PullReviewRequestResponse(
                requestId=request_id,
                status="pulled",
                serverNow=server_now,
                pulledAt=row["pulled_at"] or server_now,
                reviewJson=review_json,
            )

        if status != "submitted":
            raise Lesson4PeerReviewError(_PULL_RACE_MESSAGE, 409)

        review_json = _parse_review_json(row["review_json"])
        if not review_json:
            raise Lesson4PeerReviewError("互审反馈数据异常，请刷新后重试。", 500)

        updated = repository.pull_review_request(
            connection,
            request_id=request_id,
            author_seat_code=payload.authorSeatCode,
            pulled_at=server_now,
        )
        if updated == 0:
            raise Lesson4PeerReviewError(_PULL_RACE_MESSAGE, 409)

    return Lesson4PullReviewRequestResponse(
        requestId=request_id,
        status="pulled",
        serverNow=server_now,
        pulledAt=server_now,
        reviewJson=review_json,
    )


async def moderate_review_text(payload: Lesson4ModerateTextPayload) -> Lesson4ModerateTextResponse:
    """提交审查前审核互审文字：规则预审 + mock/Qwen。"""
    provider = get_lesson4_moderation_provider()
    return await provider.moderate(payload.texts)
