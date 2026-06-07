"""
文件说明：模块 4 课时 5 学生快评服务。
职责：校验 answer 归属与 participant 身份，执行三维评分、issueFlags 与评论长度校验，幂等写入 rating、推进 assignment 状态并记录评分事件。
更新触发：课时 5 rating API 契约、评分维度、issueFlags 枚举、评论限制或评分幂等规则变化时，需要同步更新本文件。
"""

from __future__ import annotations

import json
import secrets
import sqlite3

from app.core.database import database_transaction

from . import repository
from .auth import server_now, to_iso8601
from .errors import Lesson5RatingError
from .schemas import IssueFlag, RatingSubmitRequest, RatingSubmitResponse


COMMENT_MAX_LENGTH = 500


def _generate_rating_id() -> str:
    """生成 lesson5 rating 主键。"""
    return f"l5rt_{secrets.token_hex(8)}"


def _generate_event_id() -> str:
    """生成 lesson5 事件主键。"""
    return f"l5evt_{secrets.token_hex(8)}"


def _assert_participant_matches(connection: sqlite3.Connection, payload: RatingSubmitRequest) -> sqlite3.Row:
    """校验 participant 存在且 clientId 匹配。"""
    participant = repository.get_participant_by_id(connection, payload.participantId)
    if participant is None:
        raise Lesson5RatingError(f"participant 不存在：participantId={payload.participantId}。", 404)
    if participant["lesson5_client_id"] != payload.lesson5ClientId:
        raise Lesson5RatingError(
            f"participant/client 不匹配：participantId={payload.participantId}。",
            403,
        )
    return participant


def _validate_new_rating_payload(payload: RatingSubmitRequest) -> tuple[list[str], str]:
    """校验新评分内容；重复评分命中既有 rating 时不会重复校验正文。"""
    for field_name, value in (
        ("clarity", payload.clarity),
        ("thinkingValue", payload.thinkingValue),
        ("explanationHelpfulness", payload.explanationHelpfulness),
    ):
        if value not in (1, 2, 3):
            raise Lesson5RatingError(f"{field_name} 必须是 1、2、3 之一。", 400)

    allowed_flags = {flag.value for flag in IssueFlag}
    normalized_flags: list[str] = []
    for flag in payload.issueFlags:
        normalized = flag.strip()
        if normalized not in allowed_flags:
            raise Lesson5RatingError(f"issueFlag 未登记：{normalized}。", 400)
        if normalized not in normalized_flags:
            normalized_flags.append(normalized)

    comment = payload.comment.strip()
    if len(comment) > COMMENT_MAX_LENGTH:
        raise Lesson5RatingError(f"comment 不能超过 {COMMENT_MAX_LENGTH} 个字符。", 400)
    return normalized_flags, comment


def _rating_response(row: sqlite3.Row) -> RatingSubmitResponse:
    """把 rating 行装配为学生 rating 响应。"""
    return RatingSubmitResponse(
        ratingId=row["rating_id"],
        answerId=row["answer_id"],
        assignmentId=row["assignment_id"],
        ratedAt=row["rated_at"],
    )


def _insert_event(
    connection: sqlite3.Connection,
    *,
    rating: sqlite3.Row,
    now: str,
) -> None:
    """记录评分事件，payload 只包含定位与评分维度。"""
    repository.insert_event(
        connection,
        event_id=_generate_event_id(),
        session_id=rating["session_id"],
        actor_role="student",
        actor_id=rating["participant_id"],
        event_type="rating_submitted",
        payload_json=json.dumps(
            {
                "answerId": rating["answer_id"],
                "assignmentId": rating["assignment_id"],
                "ratingId": rating["rating_id"],
                "clarity": rating["clarity"],
                "thinkingValue": rating["thinking_value"],
                "explanationHelpfulness": rating["explanation_helpfulness"],
            },
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ),
        created_at=now,
    )


def submit_rating(answer_id: str, payload: RatingSubmitRequest) -> RatingSubmitResponse:
    """提交学生 rating；重复提交同 answer 幂等返回既有官方 rating。"""
    normalized_payload = RatingSubmitRequest(
        participantId=payload.participantId.strip(),
        lesson5ClientId=payload.lesson5ClientId.strip(),
        clarity=payload.clarity,
        thinkingValue=payload.thinkingValue,
        explanationHelpfulness=payload.explanationHelpfulness,
        issueFlags=payload.issueFlags,
        comment=payload.comment,
    )
    now = to_iso8601(server_now())

    with database_transaction() as connection:
        participant = _assert_participant_matches(connection, normalized_payload)
        answer = repository.get_answer_by_id(connection, answer_id)
        if answer is None:
            raise Lesson5RatingError(f"answer 不存在：answerId={answer_id}。", 404)
        if answer["participant_id"] != normalized_payload.participantId:
            raise Lesson5RatingError(
                f"answer/participant 不匹配：answerId={answer_id} participantId={normalized_payload.participantId}。",
                403,
            )
        if answer["session_id"] != participant["session_id"]:
            raise Lesson5RatingError(
                f"answer/session 不匹配：answerId={answer_id} participantId={normalized_payload.participantId}。",
                409,
            )

        session = repository.get_session(connection, answer["session_id"])
        if session is None:
            raise Lesson5RatingError(f"会话不存在：sessionId={answer['session_id']}。", 404)
        if session["phase"] != "trial_open":
            raise Lesson5RatingError(
                f"当前阶段不能提交 rating：sessionId={session['session_id']} phase={session['phase']}。",
                409,
            )

        existing = repository.get_rating_by_answer_id(connection, answer_id)
        if existing is not None:
            return _rating_response(existing)

        issue_flags, comment = _validate_new_rating_payload(normalized_payload)
        repository.insert_rating(
            connection,
            rating_id=_generate_rating_id(),
            session_id=answer["session_id"],
            answer_id=answer["answer_id"],
            assignment_id=answer["assignment_id"],
            participant_id=answer["participant_id"],
            item_id=answer["item_id"],
            item_version_id=answer["item_version_id"],
            respondent_seat_code=answer["respondent_seat_code"],
            clarity=normalized_payload.clarity,
            thinking_value=normalized_payload.thinkingValue,
            explanation_helpfulness=normalized_payload.explanationHelpfulness,
            issue_flags_json=json.dumps(issue_flags, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
            comment=comment,
            rated_at=now,
        )
        repository.update_assignment_status(connection, assignment_id=answer["assignment_id"], status="rated")
        inserted = repository.get_rating_by_answer_id(connection, answer_id)
        if inserted is None:
            raise Lesson5RatingError("rating 写入后无法读取。", 500)
        _insert_event(connection, rating=inserted, now=now)

    return _rating_response(inserted)
