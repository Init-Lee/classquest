"""
文件说明：模块 4 课时 5 教师 session 生命周期服务层。
职责：实现教师建会话、列会话、draft 设置更新、锁池冻结当前 V2、phase 顺序推进、会话 overview 与 progress 聚合，并统一校验班级可见/管理权限、demo 只读基线、analytics_open 统计前置 gate 和上海时区时间戳。
更新触发：课时 5 session 状态机、锁池来源、权限边界、overview/progress 字段、analytics_open 前置条件或教师控制台 API 契约变化时，需要同步更新本文件。
"""

from __future__ import annotations

import json
import secrets
import sqlite3
from typing import Any

from app.core.database import database_transaction

from . import repository
from .auth import server_now, to_iso8601
from .dependencies import SessionContext
from .errors import Lesson5SessionError
from .schemas import (
    CreateSessionRequest,
    FrozenPoolCounts,
    LockPoolResponse,
    PhaseChangeRequest,
    PhaseChangeResponse,
    SessionDto,
    SessionListResponse,
    SessionOverviewResponse,
    SessionProgressParticipantDto,
    SessionProgressResponse,
    SessionProgressSummaryDto,
    SessionSettings,
    UpdateSettingsRequest,
)

QUESTION_COUNT_DISTRIBUTION = {
    6: (3, 3),
    8: (4, 4),
    10: (5, 5),
}
RUN_TYPES = {"normal", "makeup", "test"}
PHASE_ORDER = (
    "draft",
    "pool_locked",
    "trial_open",
    "trial_locked",
    "analytics_open",
    "revision_open",
    "closed",
)


def _generate_session_id() -> str:
    """生成 lesson5 session 主键。"""
    return f"l5s_{secrets.token_hex(8)}"


def _generate_session_pool_item_id() -> str:
    """生成 session 冻结池 item 主键。"""
    return f"l5spi_{secrets.token_hex(8)}"


def _generate_event_id() -> str:
    """生成 lesson5 事件主键。"""
    return f"l5evt_{secrets.token_hex(8)}"


def _normalize_settings(question_count: int) -> SessionSettings:
    """校验总题量并派生 news/image 数量。"""
    distribution = QUESTION_COUNT_DISTRIBUTION.get(question_count)
    if distribution is None:
        raise Lesson5SessionError("questionCount 仅支持 6、8、10。")
    news_count, image_count = distribution
    return SessionSettings(questionCount=question_count, newsCount=news_count, imageCount=image_count)


def _settings_to_json(settings: SessionSettings) -> str:
    """把会话设置序列化为稳定 JSON 存储。"""
    return json.dumps(settings.model_dump(), ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _settings_from_json(raw_settings: str) -> SessionSettings:
    """从 settings_json 读取设置；兼容只含 questionCount 的早期草稿数据。"""
    value = json.loads(raw_settings)
    if not isinstance(value, dict):
        raise Lesson5SessionError("会话设置数据格式错误，请联系管理员。", 500)
    question_count = int(value.get("questionCount", 0))
    return _normalize_settings(question_count)


def _session_dto(row: sqlite3.Row) -> SessionDto:
    """把 session 表行装配为 API DTO。"""
    return SessionDto(
        sessionId=row["session_id"],
        classId=row["class_id"],
        className=row["class_name"],
        title=row["title"],
        runType=row["run_type"],
        phase=row["phase"],
        settings=_settings_from_json(row["settings_json"]),
        createdAt=row["created_at"],
        updatedAt=row["updated_at"],
        poolLockedAt=row["pool_locked_at"],
        trialOpenedAt=row["trial_opened_at"],
        trialLockedAt=row["trial_locked_at"],
        analyticsOpenedAt=row["analytics_opened_at"],
        revisionOpenedAt=row["revision_opened_at"],
        closedAt=row["closed_at"],
    )


def _require_teacher_manage(connection: sqlite3.Connection, session: SessionContext, class_id: str) -> None:
    """要求当前会话为 teacher 且对目标班级具备 manage 权限。"""
    if session.role == "demo":
        raise Lesson5SessionError("演示账户为只读模式，无法执行写操作。", 403)
    if session.role != "teacher":
        raise Lesson5SessionError("需要教师权限。", 403)
    permission = repository.get_teacher_class_permission(connection, session.user_id, class_id)
    if permission != "manage":
        raise Lesson5SessionError("你没有该班级的管理权限。", 403)


def _require_can_view(connection: sqlite3.Connection, session: SessionContext, class_id: str) -> None:
    """校验只读查看权限；demo 可看全部班级，teacher 需有任意授权。"""
    if session.role == "demo":
        return
    if session.role != "teacher":
        raise Lesson5SessionError("需要教师权限。", 403)
    permission = repository.get_teacher_class_permission(connection, session.user_id, class_id)
    if permission is None:
        raise Lesson5SessionError("你没有该班级的查看权限。", 403)


def _load_session_or_404(connection: sqlite3.Connection, session_id: str) -> sqlite3.Row:
    """读取 session，不存在时返回 404 业务错误。"""
    row = repository.get_session(connection, session_id)
    if row is None:
        raise Lesson5SessionError("会话不存在。", 404)
    return row


def _pool_counts(connection: sqlite3.Connection, session_id: str) -> FrozenPoolCounts:
    """读取冻结题池计数并装配响应模型。"""
    counts = repository.count_session_pool_by_kind(connection, session_id)
    news = counts["news"]
    image = counts["image"]
    return FrozenPoolCounts(news=news, image=image, total=news + image)


def _insert_event(
    connection: sqlite3.Connection,
    *,
    session: SessionContext,
    session_id: str,
    event_type: str,
    payload: dict[str, Any],
    now: str,
) -> None:
    """写入教师 session 控制事件，payload 不包含任何口令或 token。"""
    repository.insert_event(
        connection,
        event_id=_generate_event_id(),
        session_id=session_id,
        actor_role=session.role,
        actor_id=session.user_id,
        event_type=event_type,
        payload_json=json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
        created_at=now,
    )


def create_session(payload: CreateSessionRequest, session: SessionContext) -> SessionDto:
    """创建 draft session；写操作要求 teacher manage 权限。"""
    title = payload.title.strip()
    if not title:
        raise Lesson5SessionError("title 不能为空。")
    if payload.runType not in RUN_TYPES:
        raise Lesson5SessionError("runType 仅支持 normal、makeup、test。")
    settings = _normalize_settings(payload.settings.questionCount)
    now = to_iso8601(server_now())
    session_id = _generate_session_id()

    with database_transaction() as connection:
        class_row = repository.get_class_by_id(connection, payload.classId)
        if class_row is None:
            raise Lesson5SessionError(f"班级不存在：{payload.classId}。", 404)
        _require_teacher_manage(connection, session, payload.classId)
        repository.insert_session(
            connection,
            session_id=session_id,
            class_id=payload.classId,
            class_name=class_row["class_name"],
            title=title,
            run_type=payload.runType,
            phase="draft",
            settings_json=_settings_to_json(settings),
            created_by_user_id=session.user_id,
            now=now,
        )
        _insert_event(
            connection,
            session=session,
            session_id=session_id,
            event_type="session_created",
            payload={"classId": payload.classId, "runType": payload.runType, "questionCount": settings.questionCount},
            now=now,
        )
        row = _load_session_or_404(connection, session_id)
    return _session_dto(row)


def list_sessions(class_id: str, session: SessionContext) -> SessionListResponse:
    """列出某班级可见 session；demo 只读可见全部班级。"""
    with database_transaction() as connection:
        if repository.get_class_by_id(connection, class_id) is None:
            raise Lesson5SessionError(f"班级不存在：{class_id}。", 404)
        _require_can_view(connection, session, class_id)
        rows = repository.list_sessions_by_class(connection, class_id)
    return SessionListResponse(sessions=[_session_dto(row) for row in rows])


def update_settings(session_id: str, payload: UpdateSettingsRequest, session: SessionContext) -> SessionDto:
    """更新 draft session 设置；锁池后禁止修改。"""
    settings = _normalize_settings(payload.settings.questionCount)
    now = to_iso8601(server_now())

    with database_transaction() as connection:
        row = _load_session_or_404(connection, session_id)
        _require_teacher_manage(connection, session, row["class_id"])
        if row["phase"] != "draft":
            raise Lesson5SessionError("会话锁池后不能修改设置。", 409)
        repository.update_session_settings(
            connection,
            session_id=session_id,
            settings_json=_settings_to_json(settings),
            now=now,
        )
        _insert_event(
            connection,
            session=session,
            session_id=session_id,
            event_type="session_settings_updated",
            payload={"questionCount": settings.questionCount},
            now=now,
        )
        updated = _load_session_or_404(connection, session_id)
    return _session_dto(updated)


def lock_pool(session_id: str, session: SessionContext) -> LockPoolResponse:
    """冻结当前班级 V2 题池，并把 session 从 draft 推进到 pool_locked。"""
    now = to_iso8601(server_now())

    with database_transaction() as connection:
        row = _load_session_or_404(connection, session_id)
        _require_teacher_manage(connection, session, row["class_id"])
        if row["phase"] != "draft":
            raise Lesson5SessionError("只有 draft 会话可以锁池。", 409)
        if repository.list_session_pool_items(connection, session_id):
            raise Lesson5SessionError("该会话已经冻结过题池。", 409)

        source_rows = repository.list_current_v2_versions_for_class(connection, row["class_id"])
        for source in source_rows:
            repository.insert_session_pool_item(
                connection,
                session_pool_item_id=_generate_session_pool_item_id(),
                session_id=session_id,
                class_id=row["class_id"],
                item_id=source["item_id"],
                item_version_id=source["item_version_id"],
                author_seat_code=source["author_seat_code"],
                author_name=source["author_name"],
                card_kind=source["card_kind"],
                included_at=now,
            )
        repository.update_session_phase(connection, session_id=session_id, phase="pool_locked", now=now)
        counts = _pool_counts(connection, session_id)
        _insert_event(
            connection,
            session=session,
            session_id=session_id,
            event_type="pool_locked",
            payload={"frozen": counts.model_dump()},
            now=now,
        )
    return LockPoolResponse(sessionId=session_id, phase="pool_locked", frozen=counts)


def advance_phase(session_id: str, payload: PhaseChangeRequest, session: SessionContext) -> PhaseChangeResponse:
    """按 7 段状态机顺序推进 phase；pool_locked 只能通过 lock_pool 进入。"""
    target_phase = payload.targetPhase
    if target_phase not in PHASE_ORDER:
        raise Lesson5SessionError("targetPhase 不是有效阶段。")
    now = to_iso8601(server_now())

    with database_transaction() as connection:
        row = _load_session_or_404(connection, session_id)
        _require_teacher_manage(connection, session, row["class_id"])
        if target_phase == "pool_locked":
            raise Lesson5SessionError("进入 pool_locked 必须调用 lock-pool 端点。", 409)
        current_index = PHASE_ORDER.index(row["phase"])
        target_index = PHASE_ORDER.index(target_phase)
        if target_index != current_index + 1:
            raise Lesson5SessionError("phase 只能按顺序推进，不能越级或回退。", 409)
        if row["phase"] == "trial_locked" and target_phase == "analytics_open":
            if repository.count_item_stats_by_session(connection, session_id) == 0:
                raise Lesson5SessionError("开放统计前请先计算统计。", 409)
        repository.update_session_phase(connection, session_id=session_id, phase=target_phase, now=now)
        _insert_event(
            connection,
            session=session,
            session_id=session_id,
            event_type="phase_changed",
            payload={"from": row["phase"], "to": target_phase},
            now=now,
        )
    return PhaseChangeResponse(sessionId=session_id, phase=target_phase, changedAt=now)


def get_session_overview(session_id: str, session: SessionContext) -> SessionOverviewResponse:
    """返回 session overview；只读权限即可查看，demo 可看全部班级。"""
    generated_at = to_iso8601(server_now())

    with database_transaction() as connection:
        row = _load_session_or_404(connection, session_id)
        _require_can_view(connection, session, row["class_id"])
        counts = _pool_counts(connection, session_id)
        submitted_authors = repository.count_class_pool_authors(connection, row["class_id"])
        current_v2_items = repository.count_class_current_v2_items(connection, row["class_id"])

    dto = _session_dto(row)
    required_authors = dto.settings.questionCount // 2
    missing_authors = max(0, required_authors - submitted_authors)
    readiness: list[str] = []
    if dto.phase == "draft":
        readiness.append("当前会话尚未锁池，冻结题池以 lock-pool 结果为准。")
    if current_v2_items < dto.settings.questionCount:
        readiness.append(
            f"当前班级 V2 题卡 {current_v2_items} 张，少于本会话目标 {dto.settings.questionCount} 张。"
        )
    if counts.total and (counts.news < dto.settings.newsCount or counts.image < dto.settings.imageCount):
        readiness.append("已冻结题池未达到本会话 news/image 目标分布，后续分配需人工确认。")

    return SessionOverviewResponse(
        session=dto,
        frozen=counts,
        classPoolAuthorsSubmitted=submitted_authors,
        classPoolAuthorsMissing=missing_authors,
        classPoolItemsCurrentV2=current_v2_items,
        readiness=readiness,
        generatedAt=generated_at,
    )


def get_session_progress(session_id: str, session: SessionContext) -> SessionProgressResponse:
    """返回教师侧 session 进度聚合；只读权限即可查看，demo 可看全部班级。"""
    generated_at = to_iso8601(server_now())

    with database_transaction() as connection:
        row = _load_session_or_404(connection, session_id)
        _require_can_view(connection, session, row["class_id"])
        settings = _settings_from_json(row["settings_json"])
        progress_rows = repository.list_session_progress(connection, session_id)

    participants = [
        SessionProgressParticipantDto(
            participantId=progress["participant_id"],
            studentName=progress["student_name"],
            classSeatCode=progress["class_seat_code"],
            answeredCount=int(progress["answered_count"]),
            ratedCount=int(progress["rated_count"]),
            completed=(
                int(progress["answered_count"]) >= settings.questionCount
                and int(progress["rated_count"]) >= settings.questionCount
            ),
        )
        for progress in progress_rows
    ]
    return SessionProgressResponse(
        sessionId=session_id,
        phase=row["phase"],
        settings=settings,
        participants=participants,
        summary=SessionProgressSummaryDto(
            attachedCount=len(participants),
            answeredCount=sum(participant.answeredCount for participant in participants),
            ratedCount=sum(participant.ratedCount for participant in participants),
            completedCount=sum(1 for participant in participants if participant.completed),
            questionCount=settings.questionCount,
        ),
        generatedAt=generated_at,
    )
