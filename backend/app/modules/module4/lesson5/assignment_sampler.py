"""
文件说明：模块 4 课时 5 学生 assignment 生成与读取服务。
职责：从 session 冻结池为 participant 生成稳定试答分配，执行排除自作题、news/image 均衡、coverage-first 排序与持久化幂等读取。
更新触发：题量分布、coverage-first 采样策略、assignment 响应字段、候选不足错误口径或冻结池 schema 变化时，需要同步更新本文件。
"""

from __future__ import annotations

import hashlib
import json
from typing import Any

import sqlite3

from app.core.database import database_transaction

from . import repository
from .auth import server_now, to_iso8601
from .errors import Lesson5AssignmentError
from .participant_service import CONNECTABLE_PHASES, _settings_from_json
from .schemas import AssignmentDto, AssignmentListResponse, SessionSettings


SENSITIVE_TASK_KEYS = {
    "correctOptionKey",
    "correctAnswer",
    "answer",
    "explanation",
    "explanationText",
    "source",
    "sourceRecord",
    "verificationNote",
}


def _assignment_id(session_id: str, participant_id: str, item_version_id: str) -> str:
    """生成稳定 assignment 主键，避免同一 participant 重复生成时漂移。"""
    digest = hashlib.sha256(f"{session_id}:{participant_id}:{item_version_id}".encode("utf-8")).hexdigest()
    return f"l5a_{digest[:16]}"


def _tie_break(session_id: str, participant_id: str, session_pool_item_id: str) -> str:
    """为同 coverage 的候选生成稳定确定性排序键。"""
    raw = f"{session_id}:{participant_id}:{session_pool_item_id}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _load_json_card(row: sqlite3.Row) -> dict[str, Any]:
    """读取冻结版本 card_json；格式异常时返回可定位 409。"""
    try:
        value = json.loads(row["card_json"])
    except json.JSONDecodeError as exc:
        raise Lesson5AssignmentError(
            f"冻结题卡 JSON 无法解析：sessionId={row['session_id']} itemVersionId={row['item_version_id']}。",
            409,
        ) from exc
    if not isinstance(value, dict):
        raise Lesson5AssignmentError(
            f"冻结题卡 JSON 格式错误：sessionId={row['session_id']} itemVersionId={row['item_version_id']}。",
            409,
        )
    return value


def _public_task(card: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """移除 task 中的答案/解析/来源字段，并单独返回清洗后的 options。"""
    raw_task = card.get("task")
    task = dict(raw_task) if isinstance(raw_task, dict) else {}
    for key in SENSITIVE_TASK_KEYS:
        task.pop(key, None)

    raw_options = task.get("options")
    options: list[dict[str, Any]] = []
    if isinstance(raw_options, list):
        for option in raw_options:
            if isinstance(option, dict):
                clean_option = dict(option)
                clean_option.pop("isCorrect", None)
                clean_option.pop("correct", None)
                clean_option.pop("rationale", None)
                clean_option.pop("explanation", None)
                clean_option.pop("explanationText", None)
                options.append(clean_option)
    task["options"] = options
    return task, options


def _assignment_dto(row: sqlite3.Row) -> AssignmentDto:
    """把 assignment 查询行装配为学生可见 DTO。"""
    card = _load_json_card(row)
    raw_material = card.get("material")
    material = dict(raw_material) if isinstance(raw_material, dict) else {}
    task, options = _public_task(card)
    return AssignmentDto(
        assignmentId=row["assignment_id"],
        itemId=row["item_id"],
        itemVersionId=row["item_version_id"],
        cardKind=row["card_kind"],
        orderIndex=int(row["order_index"]),
        material=material,
        task=task,
        options=options,
        itemShortName=row["item_short_name"],
    )


def _required_counts(settings: SessionSettings) -> tuple[int, int]:
    """根据总题量派生 news/image 题量，C4a 只支持 6/8/10。"""
    if settings.questionCount not in (6, 8, 10):
        raise Lesson5AssignmentError(f"会话题量不支持：questionCount={settings.questionCount}。", 409)
    return settings.questionCount // 2, settings.questionCount // 2


def _select_kind(
    connection: sqlite3.Connection,
    *,
    session_id: str,
    participant_id: str,
    rows: list[sqlite3.Row],
    card_kind: str,
    required_count: int,
) -> list[sqlite3.Row]:
    """按 coverage-first 与稳定 tie-break 选择某类题卡。"""
    candidates = [row for row in rows if row["card_kind"] == card_kind]
    if len(candidates) < required_count:
        raise Lesson5AssignmentError(
            f"assignment 候选不足：sessionId={session_id} participantId={participant_id} "
            f"cardKind={card_kind} required={required_count} available={len(candidates)}。",
            409,
        )
    ranked = sorted(
        candidates,
        key=lambda row: (
            repository.count_valid_answers_by_pool_item(
                connection,
                session_id=session_id,
                item_version_id=row["item_version_id"],
            ),
            _tie_break(session_id, participant_id, row["session_pool_item_id"]),
            row["session_pool_item_id"],
        ),
    )
    return ranked[:required_count]


def _persist_assignments(
    connection: sqlite3.Connection,
    *,
    session_id: str,
    participant_id: str,
    respondent_seat_code: str,
    selected_rows: list[sqlite3.Row],
    now: str,
) -> None:
    """把首次采样结果写入 assignments，后续读取以数据库为准。"""
    for order_index, row in enumerate(selected_rows):
        repository.insert_assignment(
            connection,
            assignment_id=_assignment_id(session_id, participant_id, row["item_version_id"]),
            session_id=session_id,
            participant_id=participant_id,
            respondent_seat_code=respondent_seat_code,
            session_pool_item_id=row["session_pool_item_id"],
            item_id=row["item_id"],
            item_version_id=row["item_version_id"],
            order_index=order_index,
            assignment_reason="coverage_first",
            created_at=now,
        )


def get_or_create_assignments(session_id: str, participant_id: str) -> AssignmentListResponse:
    """读取或首次生成 participant 的 assignment 列表。"""
    now = to_iso8601(server_now())
    with database_transaction() as connection:
        session_row = repository.get_session(connection, session_id)
        if session_row is None:
            raise Lesson5AssignmentError(f"会话不存在：sessionId={session_id}。", 404)
        if session_row["phase"] not in CONNECTABLE_PHASES:
            raise Lesson5AssignmentError(
                f"会话当前不可生成 assignments：sessionId={session_id} phase={session_row['phase']}。",
                409,
            )
        participant_row = repository.get_participant_by_id(connection, participant_id)
        if participant_row is None:
            raise Lesson5AssignmentError(f"participant 不存在：participantId={participant_id}。", 404)
        if participant_row["session_id"] != session_id:
            raise Lesson5AssignmentError(
                f"participant/session 不匹配：sessionId={session_id} participantId={participant_id}。",
                409,
            )

        existing = repository.list_assignments_for_participant(
            connection,
            session_id=session_id,
            participant_id=participant_id,
        )
        if not existing:
            settings = _settings_from_json(session_row["settings_json"])
            news_count, image_count = _required_counts(settings)
            pool_rows = [
                row
                for row in repository.list_session_pool_items_for_assignment(connection, session_id)
                if row["author_seat_code"] != participant_row["class_seat_code"]
            ]
            selected_rows = [
                *_select_kind(
                    connection,
                    session_id=session_id,
                    participant_id=participant_id,
                    rows=pool_rows,
                    card_kind="news",
                    required_count=news_count,
                ),
                *_select_kind(
                    connection,
                    session_id=session_id,
                    participant_id=participant_id,
                    rows=pool_rows,
                    card_kind="image",
                    required_count=image_count,
                ),
            ]
            _persist_assignments(
                connection,
                session_id=session_id,
                participant_id=participant_id,
                respondent_seat_code=participant_row["class_seat_code"],
                selected_rows=selected_rows,
                now=now,
            )
            existing = repository.list_assignments_for_participant(
                connection,
                session_id=session_id,
                participant_id=participant_id,
            )

    return AssignmentListResponse(
        sessionId=session_id,
        participantId=participant_id,
        assignments=[_assignment_dto(row) for row in existing],
        serverNow=now,
    )
