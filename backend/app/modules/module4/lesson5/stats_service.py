"""
文件说明：模块 4 课时 5 题卡统计计算服务。
职责：在 trial_locked 及之后由具备 manage 权限的教师触发 session 级统计，按冻结题池逐题聚合 answer/rating，幂等覆盖写入 item_stats，并记录 stats_computed 事件。
更新触发：课时 5 stats_status 阈值、统计口径、compute-stats 权限、item_stats 表结构或统计事件 payload 变化时，需要同步更新本文件。
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
from .errors import Lesson5StatsError
from .schemas import (
    ComputeStatsResponse,
    IssueFlag,
    STATS_STATUS_PRELIMINARY_MIN,
    STATS_STATUS_STABLE_MIN,
    StatsStatus,
    StatsStatusBreakdownDto,
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
SAMPLE_COMMENT_LIMIT = 3


def _generate_stat_id() -> str:
    """生成 lesson5 item_stats 主键。"""
    return f"l5stat_{secrets.token_hex(8)}"


def _generate_event_id() -> str:
    """生成 lesson5 事件主键。"""
    return f"l5evt_{secrets.token_hex(8)}"


def resolve_stats_status(valid_answer_count: int) -> StatsStatus:
    """按 C6 固定阈值把有效作答数转换为统计样本状态。"""
    if valid_answer_count >= STATS_STATUS_STABLE_MIN:
        return StatsStatus.stable
    if valid_answer_count >= STATS_STATUS_PRELIMINARY_MIN:
        return StatsStatus.preliminary
    return StatsStatus.insufficient


def _phase_at_least(phase: str, minimum: str) -> bool:
    """判断 phase 是否已到达指定阶段。"""
    return phase in PHASE_ORDER and PHASE_ORDER.index(phase) >= PHASE_ORDER.index(minimum)


def _require_teacher_manage(connection: sqlite3.Connection, session: SessionContext, class_id: str) -> None:
    """要求当前账号为 teacher 且具备班级 manage 权限。"""
    if session.role == "demo":
        raise Lesson5StatsError("演示账户为只读模式，无法执行统计计算。", 403)
    if session.role != "teacher":
        raise Lesson5StatsError("需要教师权限。", 403)
    permission = repository.get_teacher_class_permission(connection, session.user_id, class_id)
    if permission != "manage":
        raise Lesson5StatsError("你没有该班级的管理权限。", 403)


def _load_session_or_404(connection: sqlite3.Connection, session_id: str) -> sqlite3.Row:
    """读取 session，不存在时返回 404 业务错误。"""
    row = repository.get_session(connection, session_id)
    if row is None:
        raise Lesson5StatsError(f"会话不存在：sessionId={session_id}。", 404)
    return row


def _parse_issue_flags(raw_rows: str) -> list[str]:
    """从 SQL 聚合出的多行 JSON 字符串中提取去重后的 issueFlag。"""
    allowed = {flag.value for flag in IssueFlag}
    flags: list[str] = []
    for raw in raw_rows.splitlines():
        if not raw.strip():
            continue
        try:
            value = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if not isinstance(value, list):
            continue
        for item in value:
            if isinstance(item, str) and item in allowed and item not in flags:
                flags.append(item)
    return flags


def _parse_sample_comments(raw_rows: str) -> list[str]:
    """从 SQL 聚合出的评论中提取最多三条非空样例。"""
    comments: list[str] = []
    for raw in raw_rows.splitlines():
        comment = raw.strip()
        if comment and comment not in comments:
            comments.append(comment)
        if len(comments) >= SAMPLE_COMMENT_LIMIT:
            break
    return comments


def _round_rate(value: float) -> float:
    """统一四位小数，避免 API 输出长尾浮点。"""
    return round(float(value), 4)


def _round_optional(value: Any) -> float | None:
    """对可为空的平均分做统一四位小数处理。"""
    if value is None:
        return None
    return round(float(value), 4)


def _breakdown_from_statuses(statuses: list[StatsStatus]) -> StatsStatusBreakdownDto:
    """按 stats_status 统计题卡数量。"""
    return StatsStatusBreakdownDto(
        insufficient=sum(1 for status in statuses if status == StatsStatus.insufficient),
        preliminary=sum(1 for status in statuses if status == StatsStatus.preliminary),
        stable=sum(1 for status in statuses if status == StatsStatus.stable),
    )


def _insert_event(
    connection: sqlite3.Connection,
    *,
    session: SessionContext,
    session_id: str,
    computed_item_count: int,
    breakdown: StatsStatusBreakdownDto,
    now: str,
) -> None:
    """记录统计计算事件，payload 不包含学生评论正文或敏感令牌。"""
    repository.insert_event(
        connection,
        event_id=_generate_event_id(),
        session_id=session_id,
        actor_role=session.role,
        actor_id=session.user_id,
        event_type="stats_computed",
        payload_json=json.dumps(
            {
                "computedItemCount": computed_item_count,
                "statsStatusBreakdown": breakdown.model_dump(),
            },
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ),
        created_at=now,
    )


def compute_stats(session_id: str, session: SessionContext) -> ComputeStatsResponse:
    """为指定 session 计算并覆盖写入题卡统计；不会推进 phase。"""
    now = to_iso8601(server_now())
    with database_transaction() as connection:
        session_row = _load_session_or_404(connection, session_id)
        _require_teacher_manage(connection, session, session_row["class_id"])
        if not _phase_at_least(session_row["phase"], "trial_locked"):
            raise Lesson5StatsError(
                f"请先锁定试答再计算统计：sessionId={session_id} phase={session_row['phase']}。",
                409,
            )

        aggregate_rows = repository.aggregate_item_stats(connection, session_id)
        statuses: list[StatsStatus] = []
        for row in aggregate_rows:
            valid_answer_count = int(row["valid_answer_count"])
            correct_count = int(row["correct_count"])
            rating_count = int(row["rating_count"])
            issue_flag_count = int(row["issue_flag_count"])
            correct_rate = _round_rate(correct_count / valid_answer_count) if valid_answer_count else 0.0
            issue_flag_rate = _round_rate(issue_flag_count / rating_count) if rating_count else 0.0
            issue_flags = _parse_issue_flags(row["issue_flags_json_rows"])
            sample_comments = _parse_sample_comments(row["sample_comments_rows"])
            stats_status = resolve_stats_status(valid_answer_count)
            statuses.append(stats_status)

            repository.upsert_item_stats(
                connection,
                stat_id=_generate_stat_id(),
                session_id=session_id,
                item_id=row["item_id"],
                item_version_id=row["item_version_id"],
                valid_answer_count=valid_answer_count,
                correct_count=correct_count,
                correct_rate=correct_rate,
                avg_clarity=_round_optional(row["avg_clarity"]),
                avg_thinking_value=_round_optional(row["avg_thinking_value"]),
                avg_explanation_helpfulness=_round_optional(row["avg_explanation_helpfulness"]),
                issue_flag_count=issue_flag_count,
                issue_flag_rate=issue_flag_rate,
                issue_flags_json=json.dumps(issue_flags, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
                sample_comments_json=json.dumps(sample_comments, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
                stats_status=stats_status.value,
                computed_at=now,
            )

        breakdown = _breakdown_from_statuses(statuses)
        _insert_event(
            connection,
            session=session,
            session_id=session_id,
            computed_item_count=len(aggregate_rows),
            breakdown=breakdown,
            now=now,
        )

    return ComputeStatsResponse(
        sessionId=session_id,
        computedItemCount=len(statuses),
        statsStatusBreakdown=breakdown,
        computedAt=now,
    )
