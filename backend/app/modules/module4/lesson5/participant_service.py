"""
文件说明：模块 4 课时 5 学生 participant 绑定与 session 状态服务。
职责：为学生端 active-session、participants attach 与 session state 端点提供业务校验、幂等绑定、进度摘要和事件记录。
更新触发：学生身份口径、session 可连接 phase、participant 冲突规则、进度字段或事件审计口径变化时，需要同步更新本文件。
"""

from __future__ import annotations

import json
import secrets
import sqlite3
from typing import Any

from app.core.database import database_transaction

from . import repository
from .auth import server_now, to_iso8601
from .errors import Lesson5ParticipantError
from .schemas import (
    ActiveSessionResponse,
    AttachParticipantRequest,
    AttachParticipantResponse,
    ParticipantStateDto,
    SessionSettings,
    SessionStateResponse,
)


CONNECTABLE_PHASES = {"pool_locked", "trial_open", "trial_locked", "analytics_open", "revision_open", "closed"}
QUESTION_COUNT_DISTRIBUTION = {6: (3, 3), 8: (4, 4), 10: (5, 5)}


def _generate_participant_id() -> str:
    """生成 lesson5 participant 主键。"""
    return f"l5p_{secrets.token_hex(8)}"


def _generate_event_id() -> str:
    """生成 lesson5 事件主键。"""
    return f"l5evt_{secrets.token_hex(8)}"


def _settings_from_json(raw_settings: str) -> SessionSettings:
    """从 session.settings_json 读取并校验题量设置。"""
    value = json.loads(raw_settings)
    if not isinstance(value, dict):
        raise Lesson5ParticipantError("会话设置数据格式错误，请联系管理员。", 500)
    question_count = int(value.get("questionCount", 0))
    distribution = QUESTION_COUNT_DISTRIBUTION.get(question_count)
    if distribution is None:
        raise Lesson5ParticipantError(f"会话题量不支持：session questionCount={question_count}。", 409)
    news_count, image_count = distribution
    return SessionSettings(questionCount=question_count, newsCount=news_count, imageCount=image_count)


def _session_response(row: sqlite3.Row, now: str) -> ActiveSessionResponse:
    """把 session 行装配为学生端 active-session 响应。"""
    return ActiveSessionResponse(
        sessionId=row["session_id"],
        classId=row["class_id"],
        className=row["class_name"],
        title=row["title"],
        runType=row["run_type"],
        phase=row["phase"],
        settings=_settings_from_json(row["settings_json"]),
        serverNow=now,
    )


def _require_valid_seat_and_client(class_seat_code: str, lesson5_client_id: str, student_name: str) -> None:
    """校验学生端身份字段，避免写入不可定位的 participant。"""
    if len(class_seat_code) != 4 or not class_seat_code.isdigit():
        raise Lesson5ParticipantError("班学号必须为 4 位数字。")
    if not lesson5_client_id.strip():
        raise Lesson5ParticipantError("lesson5ClientId 不能为空。")
    if not student_name.strip():
        raise Lesson5ParticipantError("studentName 不能为空。")


def _load_session_or_404(connection: sqlite3.Connection, session_id: str) -> sqlite3.Row:
    """读取 session，不存在时返回 404 业务错误。"""
    row = repository.get_session(connection, session_id)
    if row is None:
        raise Lesson5ParticipantError(f"会话不存在：sessionId={session_id}。", 404)
    return row


def _assert_connectable_session(row: sqlite3.Row) -> None:
    """确认 session 已锁池且未关闭，学生才允许 attach 与读取 state。"""
    if row["phase"] not in CONNECTABLE_PHASES:
        raise Lesson5ParticipantError(
            f"会话当前不可连接：sessionId={row['session_id']} phase={row['phase']}。",
            409,
        )


def _assert_same_identity(existing: sqlite3.Row, payload: AttachParticipantRequest) -> None:
    """确认重复 attach 的座位、client 与姓名完全一致。"""
    mismatches: list[str] = []
    if existing["class_id"] != payload.classId:
        mismatches.append("classId")
    if existing["class_seat_code"] != payload.classSeatCode:
        mismatches.append("classSeatCode")
    if existing["lesson5_client_id"] != payload.lesson5ClientId:
        mismatches.append("lesson5ClientId")
    if existing["student_name"] != payload.studentName:
        mismatches.append("studentName")
    if mismatches:
        fields = ",".join(mismatches)
        raise Lesson5ParticipantError(
            f"participant 身份冲突：sessionId={payload.sessionId} participantId={existing['participant_id']} fields={fields}。",
            409,
        )


def _insert_event(
    connection: sqlite3.Connection,
    *,
    session_id: str,
    participant_id: str,
    event_type: str,
    payload: dict[str, Any],
    now: str,
) -> None:
    """写入学生侧 session 事件，payload 不包含密钥或 token。"""
    repository.insert_event(
        connection,
        event_id=_generate_event_id(),
        session_id=session_id,
        actor_role="student",
        actor_id=participant_id,
        event_type=event_type,
        payload_json=json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
        created_at=now,
    )


def get_active_session(class_id: str) -> ActiveSessionResponse:
    """按班级查询最新可连接 session；无结果返回 404。"""
    normalized_class_id = class_id.strip()
    now = to_iso8601(server_now())
    with database_transaction() as connection:
        class_row = repository.get_class_by_id(connection, normalized_class_id)
        if class_row is None:
            raise Lesson5ParticipantError(f"班级不存在：classId={normalized_class_id}。", 404)
        row = repository.get_active_session_for_class(connection, normalized_class_id)
        if row is None:
            raise Lesson5ParticipantError(f"当前班级暂无可连接会话：classId={normalized_class_id}。", 404)
    return _session_response(row, now)


def attach_participant(payload: AttachParticipantRequest) -> AttachParticipantResponse:
    """把学生绑定到 session；同 session、座位码、clientId 与姓名完全一致时幂等返回。"""
    payload.classId = payload.classId.strip()
    payload.classSeatCode = payload.classSeatCode.strip()
    payload.lesson5ClientId = payload.lesson5ClientId.strip()
    payload.studentName = payload.studentName.strip()
    _require_valid_seat_and_client(payload.classSeatCode, payload.lesson5ClientId, payload.studentName)
    now = to_iso8601(server_now())

    with database_transaction() as connection:
        session_row = _load_session_or_404(connection, payload.sessionId)
        if session_row["class_id"] != payload.classId:
            raise Lesson5ParticipantError(
                f"session/class 不匹配：sessionId={payload.sessionId} sessionClassId={session_row['class_id']} requestClassId={payload.classId}。",
                409,
            )
        _assert_connectable_session(session_row)

        by_seat = repository.get_participant_by_seat(
            connection,
            session_id=payload.sessionId,
            class_seat_code=payload.classSeatCode,
        )
        by_client = repository.get_participant_by_client(
            connection,
            session_id=payload.sessionId,
            lesson5_client_id=payload.lesson5ClientId,
        )
        if by_seat is not None and by_client is not None and by_seat["participant_id"] != by_client["participant_id"]:
            raise Lesson5ParticipantError(
                f"participant 身份冲突：sessionId={payload.sessionId} seat={payload.classSeatCode} client 已绑定不同记录。",
                409,
            )
        existing = by_seat or by_client
        if existing is not None:
            _assert_same_identity(existing, payload)
            repository.update_participant_last_seen(connection, participant_id=existing["participant_id"], now=now)
            participant_id = existing["participant_id"]
        else:
            participant_id = _generate_participant_id()
            repository.insert_participant(
                connection,
                participant_id=participant_id,
                session_id=payload.sessionId,
                class_id=payload.classId,
                student_name=payload.studentName,
                class_seat_code=payload.classSeatCode,
                lesson5_client_id=payload.lesson5ClientId,
                now=now,
            )
            _insert_event(
                connection,
                session_id=payload.sessionId,
                participant_id=participant_id,
                event_type="participant_attached",
                payload={"classId": payload.classId, "classSeatCode": payload.classSeatCode},
                now=now,
            )

    return AttachParticipantResponse(participantId=participant_id, sessionId=payload.sessionId, phase=session_row["phase"], serverNow=now)


def get_session_state(session_id: str, participant_id: str) -> SessionStateResponse:
    """读取学生侧 session 状态；participant 必须属于该 session。"""
    now = to_iso8601(server_now())
    with database_transaction() as connection:
        session_row = _load_session_or_404(connection, session_id)
        _assert_connectable_session(session_row)
        participant_row = repository.get_participant_by_id(connection, participant_id)
        if participant_row is None:
            raise Lesson5ParticipantError(f"participant 不存在：participantId={participant_id}。", 404)
        if participant_row["session_id"] != session_id:
            raise Lesson5ParticipantError(
                f"participant/session 不匹配：sessionId={session_id} participantId={participant_id}。",
                409,
            )
        repository.update_participant_last_seen(connection, participant_id=participant_id, now=now)
        settings = _settings_from_json(session_row["settings_json"])
        answered_count = repository.count_participant_answers(connection, session_id=session_id, participant_id=participant_id)
        rated_count = repository.count_participant_ratings(connection, session_id=session_id, participant_id=participant_id)

    return SessionStateResponse(
        sessionId=session_id,
        phase=session_row["phase"],
        settings=settings,
        participant=ParticipantStateDto(
            participantId=participant_id,
            answeredCount=answered_count,
            ratedCount=rated_count,
            completed=answered_count >= settings.questionCount and rated_count >= settings.questionCount,
        ),
        serverNow=now,
    )
