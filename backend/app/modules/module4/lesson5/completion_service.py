"""
文件说明：模块 4 课时 5 学生完成摘要服务。
职责：为学生 Step4 本地阶段快照汇总本人 V2 提交、试答进度、本人题卡统计、V3 修订状态与 QuickCheck 证据，并校验 participant/client 隐私边界。
更新触发：my-completion-summary API 契约、QuickCheck 口径、completion snapshot 字段、participant/client 校验或 my-report 统计规则变化时，需要同步更新本文件。
"""

from __future__ import annotations

import sqlite3

from app.core.database import database_transaction

from . import repository, report_service, revision_service
from .auth import server_now, to_iso8601
from .errors import Lesson5CompletionError
from .schemas import (
    MyCompletionRevisionDto,
    MyCompletionSummaryResponse,
    QuickCheckDto,
)

PHASE_ORDER = (
    "draft",
    "pool_locked",
    "trial_open",
    "trial_locked",
    "analytics_open",
    "revision_open",
    "closed",
)


def _phase_at_least(phase: str, minimum: str) -> bool:
    """判断 phase 是否已到达指定阶段。"""
    return phase in PHASE_ORDER and PHASE_ORDER.index(phase) >= PHASE_ORDER.index(minimum)


def _load_session_or_404(connection: sqlite3.Connection, session_id: str) -> sqlite3.Row:
    """读取 session，不存在时返回 404 业务错误。"""
    row = repository.get_session(connection, session_id)
    if row is None:
        raise Lesson5CompletionError(f"会话不存在：sessionId={session_id}。", 404)
    return row


def _load_participant(
    connection: sqlite3.Connection,
    *,
    session_id: str,
    participant_id: str,
    lesson5_client_id: str,
) -> sqlite3.Row:
    """校验 participant 属于 session 且 clientId 匹配。"""
    participant = repository.get_participant_by_id(connection, participant_id)
    if participant is None:
        raise Lesson5CompletionError(f"participant 不存在：participantId={participant_id}。", 404)
    if participant["session_id"] != session_id:
        raise Lesson5CompletionError(
            f"participant/session 不匹配：sessionId={session_id} participantId={participant_id}。",
            403,
        )
    if participant["lesson5_client_id"] != lesson5_client_id:
        raise Lesson5CompletionError(f"participant/client 不匹配：participantId={participant_id}。", 403)
    return participant


def _progress_for_participant(
    connection: sqlite3.Connection,
    *,
    session_id: str,
    participant_id: str,
) -> dict[str, int]:
    """从 progress 聚合中取当前 participant 的作答/快评计数。"""
    for row in repository.list_session_progress(connection, session_id):
        if row["participant_id"] == participant_id:
            return {
                "answeredCount": int(row["answered_count"]),
                "ratedCount": int(row["rated_count"]),
            }
    return {"answeredCount": 0, "ratedCount": 0}


def get_my_completion_summary(
    session_id: str,
    participant_id: str,
    lesson5_client_id: str,
) -> MyCompletionSummaryResponse:
    """读取学生完成摘要；要求至少开放 analytics，revision 字段反映当前 V3 状态。"""
    normalized_participant_id = participant_id.strip()
    normalized_client_id = lesson5_client_id.strip()
    generated_at = to_iso8601(server_now())
    with database_transaction() as connection:
        session_row = _load_session_or_404(connection, session_id)
        if not _phase_at_least(session_row["phase"], "analytics_open"):
            raise Lesson5CompletionError(
                f"完成摘要尚未开放：sessionId={session_id} phase={session_row['phase']}。",
                409,
            )
        if repository.count_item_stats_by_session(connection, session_id) == 0:
            raise Lesson5CompletionError(f"请先计算统计：sessionId={session_id}。", 409)
        participant = _load_participant(
            connection,
            session_id=session_id,
            participant_id=normalized_participant_id,
            lesson5_client_id=normalized_client_id,
        )
        stats_rows = repository.list_item_stats_for_author(
            connection,
            session_id=session_id,
            seat_code=participant["class_seat_code"],
        )
        revision_rows = repository.list_revision_plans_for_participant(
            connection,
            session_id=session_id,
            participant_id=normalized_participant_id,
        )
        submitted_count = repository.count_ready_v3_items_for_participant(
            connection,
            session_id=session_id,
            class_id=session_row["class_id"],
            seat_code=participant["class_seat_code"],
        )
        progress = _progress_for_participant(
            connection,
            session_id=session_id,
            participant_id=normalized_participant_id,
        )

    my_item_stats = [report_service._report_item(report_service._item_stats_dto(row)) for row in stats_rows]
    submitted_items = [revision_service.revision_item_from_row(row) for row in revision_rows]
    return MyCompletionSummaryResponse(
        sessionId=session_id,
        participantId=normalized_participant_id,
        v2Submit={
            "authorSeatCode": participant["class_seat_code"],
            "itemCount": len(my_item_stats),
            "hasNews": any(item.kind == "news" for item in my_item_stats),
            "hasImage": any(item.kind == "image" for item in my_item_stats),
        },
        trial=progress,
        myItemStats=my_item_stats,
        revision=MyCompletionRevisionDto(
            readyForLesson6=revision_service.ready_for_lesson6_from_count(submitted_count),
            submittedCount=submitted_count,
            submittedItems=submitted_items,
        ),
        quickCheck=QuickCheckDto(
            t1HasV2Submission=len(my_item_stats) >= 2,
            t2HasTrialStats=len(my_item_stats) > 0,
            t3HasV3Submission=submitted_count >= 1,
        ),
        generatedAt=generated_at,
    )
