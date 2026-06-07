"""
文件说明：模块 4 课时 5 学生作答服务。
职责：校验 participant、session phase 与 assignment 归属，执行服务端判分、answer 幂等写入、assignment 状态推进和作答事件记录。
更新触发：课时 5 answer API 契约、phase gate、判分来源、reveal 字段或作答幂等规则变化时，需要同步更新本文件。
"""

from __future__ import annotations

import json
import secrets
import sqlite3
from typing import Any

from app.core.database import database_transaction

from . import repository
from .auth import server_now, to_iso8601
from .errors import Lesson5AnswerError
from .schemas import AnswerRevealDto, AnswerRevealOptionDto, AnswerSubmitRequest, AnswerSubmitResponse


def _generate_answer_id() -> str:
    """生成 lesson5 answer 主键。"""
    return f"l5ans_{secrets.token_hex(8)}"


def _generate_event_id() -> str:
    """生成 lesson5 事件主键。"""
    return f"l5evt_{secrets.token_hex(8)}"


def _load_card_json(row: sqlite3.Row) -> dict[str, Any]:
    """解析 assignment 绑定的冻结题卡 JSON。"""
    try:
        value = json.loads(row["card_json"])
    except json.JSONDecodeError as exc:
        raise Lesson5AnswerError(
            f"冻结题卡 JSON 无法解析：assignmentId={row['assignment_id']} itemVersionId={row['item_version_id']}。",
            409,
        ) from exc
    if not isinstance(value, dict):
        raise Lesson5AnswerError(
            f"冻结题卡 JSON 格式错误：assignmentId={row['assignment_id']} itemVersionId={row['item_version_id']}。",
            409,
        )
    return value


def _task_from_card(card: dict[str, Any], assignment_id: str) -> dict[str, Any]:
    """读取题卡 task；格式错误时给出 assignment 级定位。"""
    task = card.get("task")
    if not isinstance(task, dict):
        raise Lesson5AnswerError(f"题卡缺少有效 task：assignmentId={assignment_id}。", 409)
    return task


def _legal_option_keys(task: dict[str, Any], assignment_id: str) -> set[str]:
    """从 task.options 中提取可提交选项 key。"""
    options = task.get("options")
    if not isinstance(options, list):
        raise Lesson5AnswerError(f"题卡缺少有效 options：assignmentId={assignment_id}。", 409)
    keys: set[str] = set()
    for option in options:
        if isinstance(option, dict) and isinstance(option.get("key"), str):
            key = option["key"].strip()
            if key:
                keys.add(key)
    if not keys:
        raise Lesson5AnswerError(f"题卡没有可提交选项：assignmentId={assignment_id}。", 409)
    return keys


def _text_from_dict(value: Any, *keys: str) -> str:
    """按候选 key 从对象中提取非空文本。"""
    if not isinstance(value, dict):
        return ""
    for key in keys:
        text = value.get(key)
        if isinstance(text, str) and text.strip():
            return text.strip()
    return ""


def _reveal_options_from_task(task: dict[str, Any]) -> list[AnswerRevealOptionDto]:
    """从 task.options 中提取逐选项解答；只在作答响应里返回。"""
    options = task.get("options")
    if not isinstance(options, list):
        return []

    reveal_options: list[AnswerRevealOptionDto] = []
    for option in options:
        if not isinstance(option, dict):
            continue
        reveal_options.append(
            AnswerRevealOptionDto(
                key=_text_from_dict(option, "key"),
                label=_text_from_dict(option, "label", "text", "title"),
                rationale=_text_from_dict(option, "rationale", "explanation", "explanationText"),
            )
        )
    return reveal_options


def _reveal_from_card(card: dict[str, Any], task: dict[str, Any]) -> AnswerRevealDto:
    """从冻结题卡中提取解析、摘要、逐选项解答和来源；只在作答响应里返回。"""
    explanation = task.get("explanation")
    if not isinstance(explanation, str):
        explanation = task.get("explanationText")
    if not isinstance(explanation, str):
        explanation = _text_from_dict(card.get("explanation"), "text", "summary")

    summary = task.get("summary")
    if not isinstance(summary, str):
        summary = _text_from_dict(card.get("revision"), "summary")

    source = task.get("source")
    if source is None:
        source = task.get("sourceRecord")
    if source is None:
        source = task.get("verificationNote")
    if source is None:
        source = card.get("source")

    return AnswerRevealDto(
        explanation=explanation.strip() if isinstance(explanation, str) else "",
        summary=summary.strip() if isinstance(summary, str) else "",
        options=_reveal_options_from_task(task),
        source=source,
    )


def _assert_participant_matches(connection: sqlite3.Connection, payload: AnswerSubmitRequest) -> sqlite3.Row:
    """校验 participant 存在且 clientId 匹配，防止跨设备冒用。"""
    participant = repository.get_participant_by_id(connection, payload.participantId)
    if participant is None:
        raise Lesson5AnswerError(f"participant 不存在：participantId={payload.participantId}。", 404)
    if participant["lesson5_client_id"] != payload.lesson5ClientId:
        raise Lesson5AnswerError(
            f"participant/client 不匹配：participantId={payload.participantId}。",
            403,
        )
    return participant


def _answer_response(answer: sqlite3.Row, assignment: sqlite3.Row) -> AnswerSubmitResponse:
    """把 answer 与 assignment 行装配为学生 answer 响应。"""
    card = _load_card_json(assignment)
    task = _task_from_card(card, assignment["assignment_id"])
    return AnswerSubmitResponse(
        answerId=answer["answer_id"],
        assignmentId=answer["assignment_id"],
        itemId=answer["item_id"],
        itemVersionId=answer["item_version_id"],
        selectedOptionKey=answer["selected_option_key"],
        correctOptionKey=answer["correct_option_key"],
        isCorrect=bool(answer["is_correct"]),
        reveal=_reveal_from_card(card, task),
        answeredAt=answer["answered_at"],
    )


def _insert_event(
    connection: sqlite3.Connection,
    *,
    answer: sqlite3.Row,
    now: str,
) -> None:
    """记录作答事件，payload 不包含解析、来源或口令。"""
    repository.insert_event(
        connection,
        event_id=_generate_event_id(),
        session_id=answer["session_id"],
        actor_role="student",
        actor_id=answer["participant_id"],
        event_type="answer_submitted",
        payload_json=json.dumps(
            {
                "assignmentId": answer["assignment_id"],
                "answerId": answer["answer_id"],
                "itemVersionId": answer["item_version_id"],
                "isCorrect": bool(answer["is_correct"]),
            },
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ),
        created_at=now,
    )


def submit_answer(assignment_id: str, payload: AnswerSubmitRequest) -> AnswerSubmitResponse:
    """提交学生 answer；重复提交同 assignment 幂等返回既有官方 answer。"""
    participant_id = payload.participantId.strip()
    lesson5_client_id = payload.lesson5ClientId.strip()
    selected_option_key = payload.selectedOptionKey.strip()
    idempotency_key = payload.idempotencyKey.strip() if payload.idempotencyKey else None
    if not selected_option_key:
        raise Lesson5AnswerError("selectedOptionKey 不能为空。")

    normalized_payload = AnswerSubmitRequest(
        participantId=participant_id,
        lesson5ClientId=lesson5_client_id,
        selectedOptionKey=selected_option_key,
        idempotencyKey=idempotency_key,
    )
    now = to_iso8601(server_now())

    with database_transaction() as connection:
        participant = _assert_participant_matches(connection, normalized_payload)
        assignment = repository.get_assignment_by_id(connection, assignment_id)
        if assignment is None:
            raise Lesson5AnswerError(f"assignment 不存在：assignmentId={assignment_id}。", 404)
        if assignment["participant_id"] != participant_id:
            raise Lesson5AnswerError(
                f"assignment/participant 不匹配：assignmentId={assignment_id} participantId={participant_id}。",
                403,
            )
        if assignment["session_id"] != participant["session_id"]:
            raise Lesson5AnswerError(
                f"assignment/session 不匹配：assignmentId={assignment_id} participantId={participant_id}。",
                409,
            )

        session = repository.get_session(connection, assignment["session_id"])
        if session is None:
            raise Lesson5AnswerError(f"会话不存在：sessionId={assignment['session_id']}。", 404)
        if session["phase"] != "trial_open":
            raise Lesson5AnswerError(
                f"当前阶段不能提交 answer：sessionId={session['session_id']} phase={session['phase']}。",
                409,
            )

        existing = repository.get_answer_by_assignment_id(connection, assignment_id)
        if existing is not None:
            return _answer_response(existing, assignment)

        card = _load_card_json(assignment)
        task = _task_from_card(card, assignment_id)
        legal_keys = _legal_option_keys(task, assignment_id)
        if selected_option_key not in legal_keys:
            raise Lesson5AnswerError(
                f"selectedOptionKey 不属于该题选项：assignmentId={assignment_id} selectedOptionKey={selected_option_key}。",
                400,
            )
        correct_option_key = repository.find_correct_option_key(connection, assignment["item_version_id"])
        if correct_option_key is None:
            raise Lesson5AnswerError(f"题卡版本不存在：itemVersionId={assignment['item_version_id']}。", 404)

        repository.insert_answer(
            connection,
            answer_id=_generate_answer_id(),
            session_id=assignment["session_id"],
            assignment_id=assignment["assignment_id"],
            participant_id=participant_id,
            item_id=assignment["item_id"],
            item_version_id=assignment["item_version_id"],
            respondent_seat_code=assignment["respondent_seat_code"],
            selected_option_key=selected_option_key,
            correct_option_key=correct_option_key,
            is_correct=selected_option_key == correct_option_key,
            idempotency_key=idempotency_key,
            answered_at=now,
        )
        repository.update_assignment_status(connection, assignment_id=assignment_id, status="answered")
        inserted = repository.get_answer_by_assignment_id(connection, assignment_id)
        if inserted is None:
            raise Lesson5AnswerError("answer 写入后无法读取。", 500)
        _insert_event(connection, answer=inserted, now=now)

    return _answer_response(inserted, assignment)
