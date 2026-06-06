"""
文件说明：模块 4 课时 4 同伴互审 FastAPI 路由。
职责：暴露学生侧互审 HTTP endpoint，将请求委托 service 并映射业务错误为 HTTP 状态码。
更新触发：课时 4 endpoint、路由前缀、错误映射或响应模型变化时，需要同步更新本文件。
"""

import httpx
from fastapi import APIRouter, HTTPException, Query, status

from .moderation import Lesson4ModerationProviderError
from .schemas import (
    Lesson4CancelReviewRequestPayload,
    Lesson4CancelReviewRequestResponse,
    Lesson4ClaimReviewRequestPayload,
    Lesson4ClaimReviewRequestResponse,
    Lesson4CreateReviewRequestPayload,
    Lesson4CreateReviewRequestResponse,
    Lesson4FetchReviewRequestStatusResponse,
    Lesson4ModerateTextPayload,
    Lesson4ModerateTextResponse,
    Lesson4PullReviewRequestPayload,
    Lesson4PullReviewRequestResponse,
    Lesson4RecoverPeerReviewStateResponse,
    Lesson4ReviewerInboxResponse,
    Lesson4SubmitReviewRequestPayload,
    Lesson4SubmitReviewRequestResponse,
)
from .service import (
    Lesson4PeerReviewError,
    cancel_review_request,
    claim_review_request,
    create_review_request,
    get_peer_review_recovery_state,
    get_review_request_status,
    get_reviewer_inbox,
    moderate_review_text,
    pull_review_request,
    submit_review_request,
)

router = APIRouter(prefix="/lesson4", tags=["module4-lesson4"])


@router.post("/review-requests", response_model=Lesson4CreateReviewRequestResponse)
def post_review_request(payload: Lesson4CreateReviewRequestPayload) -> Lesson4CreateReviewRequestResponse:
    """创建同伴互审请求，冻结 V1 题卡快照并返回 4 位审查码。"""
    try:
        return create_review_request(payload)
    except Lesson4PeerReviewError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/review-requests/inbox", response_model=Lesson4ReviewerInboxResponse)
def get_review_requests_inbox_route(
    classId: str = Query(..., min_length=1),
    reviewerSeatCode: str = Query(..., min_length=4, max_length=4),
) -> Lesson4ReviewerInboxResponse:
    """审查者刷新收件箱；仅返回任务摘要，不含 requestJson。"""
    try:
        return get_reviewer_inbox(classId, reviewerSeatCode)
    except Lesson4PeerReviewError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/review-requests/recovery", response_model=Lesson4RecoverPeerReviewStateResponse)
def get_review_requests_recovery_route(
    classId: str = Query(..., min_length=1),
    authorSeatCode: str = Query(..., min_length=4, max_length=4),
    reviewerSeatCode: str = Query(..., min_length=4, max_length=4),
) -> Lesson4RecoverPeerReviewStateResponse:
    """进页恢复当前学生作为作者/审查者的最近互审状态。"""
    try:
        return get_peer_review_recovery_state(classId, authorSeatCode, reviewerSeatCode)
    except Lesson4PeerReviewError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/review-requests/{request_id}/status", response_model=Lesson4FetchReviewRequestStatusResponse)
def get_review_request_status_route(
    request_id: str,
    authorSeatCode: str = Query(..., min_length=4, max_length=4),
) -> Lesson4FetchReviewRequestStatusResponse:
    """作者查询互审请求状态；pending/claimed 含倒计时字段，submitted 含 reviewJson。"""
    try:
        return get_review_request_status(request_id, authorSeatCode)
    except Lesson4PeerReviewError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/review-requests/{request_id}/cancel", response_model=Lesson4CancelReviewRequestResponse)
def post_review_request_cancel_route(
    request_id: str,
    payload: Lesson4CancelReviewRequestPayload,
) -> Lesson4CancelReviewRequestResponse:
    """作者撤回 pending 互审请求；cancelled 后不可被 claim。"""
    try:
        return cancel_review_request(request_id, payload)
    except Lesson4PeerReviewError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/review-requests/{request_id}/claim", response_model=Lesson4ClaimReviewRequestResponse)
def post_review_request_claim_route(
    request_id: str,
    payload: Lesson4ClaimReviewRequestPayload,
) -> Lesson4ClaimReviewRequestResponse:
    """审查者输入审查码领取 pending 任务，返回完整题卡 JSON。"""
    try:
        return claim_review_request(request_id, payload)
    except Lesson4PeerReviewError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/review-requests/{request_id}/submit", response_model=Lesson4SubmitReviewRequestResponse)
def post_review_request_submit_route(
    request_id: str,
    payload: Lesson4SubmitReviewRequestPayload,
) -> Lesson4SubmitReviewRequestResponse:
    """审查者提交 claimed 任务的 review JSON；仅 claimed 且未超时方可写入。"""
    try:
        return submit_review_request(request_id, payload)
    except Lesson4PeerReviewError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/review-requests/{request_id}/pull", response_model=Lesson4PullReviewRequestResponse)
def post_review_request_pull_route(
    request_id: str,
    payload: Lesson4PullReviewRequestPayload,
) -> Lesson4PullReviewRequestResponse:
    """作者拉取 submitted 任务的 review JSON；submitted → pulled。"""
    try:
        return pull_review_request(request_id, payload)
    except Lesson4PeerReviewError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/review-requests/moderate-text", response_model=Lesson4ModerateTextResponse)
async def post_review_moderate_text_route(payload: Lesson4ModerateTextPayload) -> Lesson4ModerateTextResponse:
    """提交审查前审核互审文字；按 fieldKey 返回分组原因，byCard 为聚合视图。"""
    try:
        return await moderate_review_text(payload)
    except Lesson4ModerationProviderError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI 审核调用失败，状态码：{exc.response.status_code}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI 审核网络调用失败，请检查后端网络或超时设置",
        ) from exc
