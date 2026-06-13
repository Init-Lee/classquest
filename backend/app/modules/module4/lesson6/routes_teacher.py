"""
文件说明：模块 4 课时 6 教师侧发布审核 FastAPI 路由。
职责：暴露 /lesson6 命名空间下的 V3 发布审核列表、详情、发布确认与公共题库 overview；读取允许 teacher/demo，发布仅允许 teacher 且需班级 manage 权限。
更新触发：Lesson6 教师端点路径、鉴权策略、请求/响应模型或发布审核业务契约变化时，需要同步更新本文件。
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.modules.module4.lesson5.dependencies import SessionContext, get_current_session, require_teacher

from . import publication_service
from .schemas import (
    PublicBankOverviewResponse,
    PublicQuestionItemStatsResponse,
    PublicationReviewDetailResponse,
    PublicationReviewsResponse,
    PublishReviewRequest,
    PublishReviewResponse,
)

router = APIRouter(tags=["module4-lesson6-teacher"])


@router.get("/v3-publication-reviews", response_model=PublicationReviewsResponse)
def get_v3_publication_reviews(
    status: str | None = Query(default=None),
    class_id: str | None = Query(default=None, alias="classId"),
    session: SessionContext = Depends(get_current_session),
) -> PublicationReviewsResponse:
    """列出当前账号可见的 V3 发布审核记录；demo 只读可见。"""
    try:
        return publication_service.list_publication_reviews(status=status, class_id=class_id, session=session)
    except publication_service.Lesson6PublicationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/v3-publication-reviews/{review_id}", response_model=PublicationReviewDetailResponse)
def get_v3_publication_review_detail(
    review_id: str,
    session: SessionContext = Depends(get_current_session),
) -> PublicationReviewDetailResponse:
    """读取单条 V3 发布审核详情；teacher 需可见该班级，demo 只读可见。"""
    try:
        return publication_service.get_publication_review_detail(review_id=review_id, session=session)
    except publication_service.Lesson6PublicationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/v3-publication-reviews/{review_id}/publish", response_model=PublishReviewResponse)
def post_v3_publication_review_publish(
    review_id: str,
    payload: PublishReviewRequest,
    session: SessionContext = Depends(require_teacher),
) -> PublishReviewResponse:
    """确认 V3 题卡可发布；service 内校验该班级 manage 权限。"""
    try:
        return publication_service.publish_review(review_id=review_id, payload=payload, session=session)
    except publication_service.Lesson6PublicationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/public-bank/overview", response_model=PublicBankOverviewResponse)
def get_public_bank_overview(
    session: SessionContext = Depends(get_current_session),
) -> PublicBankOverviewResponse:
    """读取公共题库 overview；teacher 只看授权班级，demo 只读可见。"""
    try:
        return publication_service.get_public_bank_overview(session)
    except publication_service.Lesson6PublicationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/public-bank/item-stats", response_model=PublicQuestionItemStatsResponse)
def get_public_bank_item_stats(
    session: SessionContext = Depends(get_current_session),
) -> PublicQuestionItemStatsResponse:
    """读取公共题库全量逐题统计；teacher 只看授权班级，demo 只读可见。"""
    try:
        return publication_service.get_public_question_item_stats(session)
    except publication_service.Lesson6PublicationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
