"""
文件说明：模块 4 课时 6 V3 发布审核与公共题库 overview 服务。
职责：在 Lesson5 V3 提交成功后创建或复用教师发布确认队列记录，提供教师审核/发布、学生状态查询，并汇总公共挑战运行统计。
更新触发：V3 发布审核创建契约、review_id 生成规则、发布状态初始值、Lesson5 到 Lesson6 衔接方式或公共题库 overview 统计口径变化时，需要同步更新本文件。
"""

from __future__ import annotations

import secrets
import sqlite3
import json
from typing import Any

from app.core.database import database_transaction
from app.modules.module4.lesson5 import repository as lesson5_repository
from app.modules.module4.lesson5.auth import server_now, to_iso8601
from app.modules.module4.lesson5.dependencies import SessionContext

from . import repository, stats_service
from .schemas import (
    ChallengeStatsDto,
    KindCountDto,
    Lesson5StatsSummaryDto,
    PendingReviewCountDto,
    PublicBankOverviewResponse,
    PublicQuestionItemStatDto,
    PublicQuestionItemStatsResponse,
    PublicationReviewDetailResponse,
    PublicationReviewListItemDto,
    PublicationReviewsResponse,
    PublicationReviewsSummaryDto,
    PublicQuestionTopStatsDto,
    PublishReviewRequest,
    PublishReviewResponse,
    RevisionPlanPreviewDto,
    StudentPublicationStatusItemDto,
    StudentPublicationStatusRequest,
    StudentPublicationStatusResponse,
)

VALID_REVIEW_STATUSES = {"pending_teacher_check", "publishable"}


class Lesson6PublicationError(Exception):
    """Lesson6 发布审核业务错误，供 routes 转换为 HTTP 状态码。"""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


def _generate_review_id() -> str:
    """生成 V3 发布审核记录主键。"""
    return f"l6pub_{secrets.token_hex(8)}"


def ensure_publication_review_for_v3(
    connection: sqlite3.Connection,
    *,
    item_id: str,
    item_version_id: str,
    class_id: str,
    card_kind: str,
    now: str,
) -> sqlite3.Row:
    """确保指定 V3 版本存在待教师确认的发布审核记录。"""
    return repository.upsert_pending_publication_review(
        connection,
        review_id=_generate_review_id(),
        item_id=item_id,
        item_version_id=item_version_id,
        class_id=class_id,
        card_kind=card_kind,
        now=now,
    )


def _visible_class_ids(connection: sqlite3.Connection, session: SessionContext) -> list[str] | None:
    """返回当前账号可见班级；demo 为全班可见，teacher 为授权班级。"""
    if session.role == "demo":
        return None
    if session.role != "teacher":
        raise Lesson6PublicationError("需要教师权限。", 403)
    rows = lesson5_repository.list_class_permissions_for_user(connection, session.user_id)
    return [row["class_id"] for row in rows]


def _require_can_view(connection: sqlite3.Connection, session: SessionContext, class_id: str) -> None:
    """校验 teacher/demo 对班级的只读可见性。"""
    if session.role == "demo":
        return
    if session.role != "teacher":
        raise Lesson6PublicationError("需要教师权限。", 403)
    permission = lesson5_repository.get_teacher_class_permission(connection, session.user_id, class_id)
    if permission is None:
        raise Lesson6PublicationError("你没有该班级的查看权限。", 403)


def _require_manage(connection: sqlite3.Connection, session: SessionContext, class_id: str) -> None:
    """校验 teacher 对班级具备 manage 权限；view 权限不能发布。"""
    if session.role != "teacher":
        raise Lesson6PublicationError("需要教师权限。", 403)
    permission = lesson5_repository.get_teacher_class_permission(connection, session.user_id, class_id)
    if permission != "manage":
        raise Lesson6PublicationError("你没有该班级的管理权限。", 403)


def _student_display(row: sqlite3.Row) -> str:
    """按现有四位班学号生成教师列表展示文案。"""
    seat_code = row["author_seat_code"] or ""
    if len(seat_code) == 4 and seat_code.isdigit():
        return f"{int(seat_code[:2]):02d}班 {int(seat_code[2:]):02d}号"
    return seat_code or row["author_name"] or ""


def _safe_json_object(raw: str | None) -> dict[str, Any]:
    """安全解析 JSON 对象，异常或非对象时返回空字典。"""
    if not raw:
        return {}
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return value if isinstance(value, dict) else {}


def _stats_from_row(row: sqlite3.Row) -> Lesson5StatsSummaryDto | None:
    """从审核 SQL 行装配课时 5 统计摘要；无统计时返回 None。"""
    if row["valid_answer_count"] is None:
        return None
    return Lesson5StatsSummaryDto(
        validAnswerCount=int(row["valid_answer_count"]),
        correctRate=float(row["correct_rate"] or 0),
        avgClarity=float(row["avg_clarity"]) if row["avg_clarity"] is not None else None,
        avgThinkingValue=float(row["avg_thinking_value"]) if row["avg_thinking_value"] is not None else None,
        avgExplanationHelpfulness=(
            float(row["avg_explanation_helpfulness"])
            if row["avg_explanation_helpfulness"] is not None
            else None
        ),
        issueFlagRate=float(row["issue_flag_rate"] or 0),
        statsStatus=row["stats_status"] or "",
    )


def _review_list_item(row: sqlite3.Row) -> PublicationReviewListItemDto:
    """把发布审核列表 SQL 行转换为 DTO。"""
    return PublicationReviewListItemDto(
        reviewId=row["review_id"],
        itemId=row["item_id"],
        itemVersionId=row["item_version_id"],
        classId=row["class_id"],
        className=row["class_name"],
        cardKind=row["card_kind"],
        itemShortName=row["item_short_name"],
        studentDisplay=_student_display(row),
        submittedAt=row["submitted_at"],
        checkStatus=row["check_status"],
        isActivePublic=bool(row["is_active_public"]),
        lesson5StatsSummary=_stats_from_row(row),
    )


def _review_detail(row: sqlite3.Row) -> PublicationReviewDetailResponse:
    """把发布审核详情 SQL 行转换为 DTO。"""
    revision_plan = None
    if row["revision_action"] is not None:
        revision_plan = RevisionPlanPreviewDto(
            revisionAction=row["revision_action"],
            diagnosis=_safe_json_object(row["diagnosis_json"]),
            revisionReason=row["revision_reason"] or "",
            expectedEffect=row["expected_effect"] or "",
            submittedAt=row["revision_submitted_at"],
            updatedAt=row["revision_updated_at"],
        )
    return PublicationReviewDetailResponse(
        **_review_list_item(row).model_dump(),
        cardJson=_safe_json_object(row["card_json"]),
        lesson5Stats=_stats_from_row(row),
        revisionPlan=revision_plan,
        checkedByUserId=row["checked_by_user_id"],
        checkedAt=row["checked_at"],
        teacherNote=row["teacher_note"] or "",
        createdAt=row["created_at"],
        updatedAt=row["updated_at"],
    )


def _summary_from_row(row: sqlite3.Row) -> PublicationReviewsSummaryDto:
    """把 summary SQL 行转换为 DTO，处理 SQLite SUM 空值。"""
    return PublicationReviewsSummaryDto(
        pendingCount=int(row["pending_count"] or 0),
        publishableCount=int(row["publishable_count"] or 0),
        activePublicCount=int(row["active_public_count"] or 0),
    )


def list_publication_reviews(
    *,
    status: str | None,
    class_id: str | None,
    session: SessionContext,
) -> PublicationReviewsResponse:
    """教师/demo 读取 V3 发布审核列表；teacher 只看授权班级。"""
    if status and status not in VALID_REVIEW_STATUSES:
        raise Lesson6PublicationError(f"不支持的审核状态：{status}。")
    with database_transaction() as connection:
        visible_class_ids = _visible_class_ids(connection, session)
        if class_id:
            _require_can_view(connection, session, class_id)
        rows = repository.list_publication_reviews(
            connection,
            status=status,
            class_id=class_id,
            visible_class_ids=visible_class_ids,
        )
        summary_row = repository.count_reviews_summary(connection, visible_class_ids=visible_class_ids)
    return PublicationReviewsResponse(
        items=[_review_list_item(row) for row in rows],
        summary=_summary_from_row(summary_row),
    )


def get_publication_review_detail(
    *,
    review_id: str,
    session: SessionContext,
) -> PublicationReviewDetailResponse:
    """教师/demo 读取单条 V3 发布审核详情。"""
    with database_transaction() as connection:
        row = repository.get_publication_review_detail(connection, review_id)
        if row is None:
            raise Lesson6PublicationError(f"发布审核记录不存在：reviewId={review_id}。", 404)
        _require_can_view(connection, session, row["class_id"])
    return _review_detail(row)


def publish_review(
    *,
    review_id: str,
    payload: PublishReviewRequest,
    session: SessionContext,
) -> PublishReviewResponse:
    """教师确认 V3 可发布，并切换同 item 的 active public 指针。"""
    now = to_iso8601(server_now())
    with database_transaction() as connection:
        existing = repository.get_publication_review_detail(connection, review_id)
        if existing is None:
            raise Lesson6PublicationError(f"发布审核记录不存在：reviewId={review_id}。", 404)
        _require_manage(connection, session, existing["class_id"])
        row = repository.publish_review(
            connection,
            review_id=review_id,
            checked_by=session.user_id,
            teacher_note=payload.teacherNote.strip(),
            now=now,
        )
        if row is None:
            raise Lesson6PublicationError(f"发布审核记录不存在：reviewId={review_id}。", 404)
    return PublishReviewResponse(
        reviewId=row["review_id"],
        checkStatus=row["check_status"],
        isActivePublic=bool(row["is_active_public"]),
        checkedAt=row["checked_at"],
    )


def _kind_counts(row: sqlite3.Row) -> KindCountDto:
    """把公共题库 kind 计数 SQL 行转换为 DTO。"""
    return KindCountDto(
        totalPublishable=int(row["total_count"] or 0),
        newsCount=int(row["news_count"] or 0),
        imageCount=int(row["image_count"] or 0),
    )


def _pending_counts(row: sqlite3.Row) -> PendingReviewCountDto:
    """把 pending kind 计数 SQL 行转换为 DTO。"""
    return PendingReviewCountDto(
        totalPending=int(row["total_count"] or 0),
        newsCount=int(row["news_count"] or 0),
        imageCount=int(row["image_count"] or 0),
    )


def get_public_bank_overview(session: SessionContext) -> PublicBankOverviewResponse:
    """教师/demo 读取公共题库 overview，包含公共挑战运行统计与题卡 topStats。"""
    with database_transaction() as connection:
        visible_class_ids = _visible_class_ids(connection, session)
        public_bank = repository.count_public_bank_by_kind(connection, visible_class_ids=visible_class_ids)
        pending_review = repository.count_pending_reviews_by_kind(connection, visible_class_ids=visible_class_ids)
        challenge_stats = repository.count_public_challenge_stats(connection)
        top_stats = stats_service.get_public_question_top_stats(connection)
    return PublicBankOverviewResponse(
        publicBank=_kind_counts(public_bank),
        pendingReview=_pending_counts(pending_review),
        challengeStats=ChallengeStatsDto(
            lesson6ClassRuns=int(challenge_stats["lesson6_class_runs"] or 0),
            publicShowcaseRuns=int(challenge_stats["public_showcase_runs"] or 0),
            totalRuns=int(challenge_stats["total_runs"] or 0),
            totalAnswers=int(challenge_stats["total_answers"] or 0),
            overallCorrectRate=float(challenge_stats["overall_correct_rate"] or 0),
        ),
        topStats=PublicQuestionTopStatsDto(**top_stats),
    )


def get_public_question_item_stats(session: SessionContext) -> PublicQuestionItemStatsResponse:
    """教师/demo 读取公共题库全量逐题统计；不返回作者或应答者身份。"""
    with database_transaction() as connection:
        visible_class_ids = _visible_class_ids(connection, session)
        items = stats_service.get_public_question_item_stats(connection, visible_class_ids=visible_class_ids)
    return PublicQuestionItemStatsResponse(items=[PublicQuestionItemStatDto(**item) for item in items])


def get_my_publication_status(payload: StudentPublicationStatusRequest) -> StudentPublicationStatusResponse:
    """按学生本地档案提交的 item/version 键返回发布状态，不支持按班级或座位枚举。"""
    synced_at = to_iso8601(server_now())
    keys = [(item.itemId.strip(), item.itemVersionId.strip()) for item in payload.items]
    with database_transaction() as connection:
        matched = repository.get_reviews_by_versions(connection, keys)

    response_items: list[StudentPublicationStatusItemDto] = []
    for item in payload.items:
        key = (item.itemId.strip(), item.itemVersionId.strip())
        row = matched.get(key)
        if row is None:
            status = "unknown"
            label = "暂未同步"
            checked_at = ""
        elif row["check_status"] == "publishable":
            status = "publishable"
            label = "已确认可发布"
            checked_at = row["checked_at"] or ""
        else:
            status = "pending_teacher_check"
            label = "等待教师确认"
            checked_at = row["checked_at"] or ""
        response_items.append(
            StudentPublicationStatusItemDto(
                kind=item.kind,
                itemId=item.itemId,
                itemVersionId=item.itemVersionId,
                status=status,
                label=label,
                checkedAt=checked_at,
            )
        )
    return StudentPublicationStatusResponse(items=response_items, syncedAt=synced_at)
