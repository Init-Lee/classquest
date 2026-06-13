"""
文件说明：模块 4 课时 6 匿名公共挑战 FastAPI 路由。
职责：暴露 /public-challenge 下的 run 创建、当前题、作答与摘要端点；端点无登录鉴权，但只把匿名会话、IP 和 User-Agent 交给服务层哈希化存储。
更新触发：公共挑战端点路径、请求/响应字段、匿名 runtime 标识来源、限流策略或隐私边界变化时，需要同步更新本文件。
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

from . import challenge_service
from .schemas import (
    PublicChallengeAnswerRequest,
    PublicChallengeAnswerResponse,
    PublicChallengeCurrentQuestionResponse,
    PublicChallengeRunCreateRequest,
    PublicChallengeRunCreateResponse,
    PublicChallengeSummaryResponse,
)

router = APIRouter(tags=["module4-lesson6-public-challenge"])


def _anon_session_id(request: Request) -> str | None:
    """从请求头读取匿名会话标识；缺省时服务层会使用 anonymous 后再哈希。"""
    return (
        request.headers.get("x-classquest-anon-session")
        or request.headers.get("x-anon-session")
        or request.headers.get("x-session-id")
    )


def _client_ip(request: Request) -> str | None:
    """提取客户端 IP；优先使用反向代理传入的首个 X-Forwarded-For。"""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    return request.client.host if request.client else None


def _error_response(exc: challenge_service.Lesson6ChallengeError) -> JSONResponse | None:
    """把契约要求的 public_bank_not_ready 转为顶层 JSON 错误。"""
    if exc.error == "public_bank_not_ready":
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.error,
                "message": str(exc),
                "availableCount": exc.available_count or 0,
            },
        )
    return None


@router.post("/runs", response_model=PublicChallengeRunCreateResponse)
def post_public_challenge_run(
    payload: PublicChallengeRunCreateRequest,
    request: Request,
) -> PublicChallengeRunCreateResponse:
    """创建匿名公共挑战 run；不要求登录。"""
    try:
        return challenge_service.create_run(
            context=payload.context,
            anon_session_id=_anon_session_id(request),
            ip_address=_client_ip(request),
            user_agent=request.headers.get("user-agent"),
        )
    except challenge_service.Lesson6ChallengeError as exc:
        response = _error_response(exc)
        if response is not None:
            return response  # type: ignore[return-value]
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/runs/{run_id}/current", response_model=PublicChallengeCurrentQuestionResponse)
def get_public_challenge_current(run_id: str) -> PublicChallengeCurrentQuestionResponse:
    """读取指定 run 的下一道未作答题。"""
    try:
        return challenge_service.get_current_question(run_id)
    except challenge_service.Lesson6ChallengeError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/runs/{run_id}/answers", response_model=PublicChallengeAnswerResponse)
def post_public_challenge_answer(
    run_id: str,
    payload: PublicChallengeAnswerRequest,
) -> PublicChallengeAnswerResponse:
    """提交指定 run_item 的答案，重复提交同一题保持幂等。"""
    try:
        return challenge_service.submit_answer(run_id=run_id, payload=payload)
    except challenge_service.Lesson6ChallengeError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/runs/{run_id}/summary", response_model=PublicChallengeSummaryResponse)
def get_public_challenge_summary(run_id: str) -> PublicChallengeSummaryResponse:
    """读取指定公共挑战 run 的完成摘要。"""
    try:
        return challenge_service.get_summary(run_id)
    except challenge_service.Lesson6ChallengeError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
