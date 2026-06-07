"""
文件说明：模块 4 课时 5 统计报告读取服务。
职责：为教师 analytics 与学生 my-report 提供只读装配，校验教师/demo 可见权限、学生 participant + clientId 归属、analytics_open 阶段和统计已计算前置条件。
更新触发：课时 5 analytics/my-report API 契约、隐私边界、诊断提示规则、phase gate 或 item_stats 读取口径变化时，需要同步更新本文件。
"""

from __future__ import annotations

import json
import sqlite3

from app.core.database import database_transaction

from . import repository
from .auth import server_now, to_iso8601
from .dependencies import SessionContext
from .errors import Lesson5ReportError
from .schemas import (
    DiagnosisHint,
    ItemStatsDto,
    MyReportItemStatsDto,
    MyReportResponse,
    SessionAnalyticsResponse,
    SessionAnalyticsSummaryDto,
    SessionSettings,
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


def _phase_at_least(phase: str, minimum: str) -> bool:
    """判断 phase 是否已到达指定阶段。"""
    return phase in PHASE_ORDER and PHASE_ORDER.index(phase) >= PHASE_ORDER.index(minimum)


def _settings_from_json(raw_settings: str) -> SessionSettings:
    """从 session.settings_json 读取题量设置。"""
    value = json.loads(raw_settings)
    if not isinstance(value, dict):
        raise Lesson5ReportError("会话设置数据格式错误，请联系管理员。", 500)
    question_count = int(value.get("questionCount", 0))
    if question_count == 6:
        return SessionSettings(questionCount=6, newsCount=3, imageCount=3)
    if question_count == 8:
        return SessionSettings(questionCount=8, newsCount=4, imageCount=4)
    if question_count == 10:
        return SessionSettings(questionCount=10, newsCount=5, imageCount=5)
    raise Lesson5ReportError(f"会话题量不支持：questionCount={question_count}。", 409)


def _load_session_or_404(connection: sqlite3.Connection, session_id: str) -> sqlite3.Row:
    """读取 session，不存在时返回 404 业务错误。"""
    row = repository.get_session(connection, session_id)
    if row is None:
        raise Lesson5ReportError(f"会话不存在：sessionId={session_id}。", 404)
    return row


def _require_can_view(connection: sqlite3.Connection, session: SessionContext, class_id: str) -> None:
    """校验教师或 demo 的只读 analytics 查看权限。"""
    if session.role == "demo":
        return
    if session.role != "teacher":
        raise Lesson5ReportError("需要教师权限。", 403)
    permission = repository.get_teacher_class_permission(connection, session.user_id, class_id)
    if permission is None:
        raise Lesson5ReportError("你没有该班级的查看权限。", 403)


def _loads_list(raw: str, *, session_id: str, item_version_id: str) -> list[str]:
    """解析 item_stats JSON 列表，格式错误时给出可定位上下文。"""
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise Lesson5ReportError(
            f"统计 JSON 无法解析：sessionId={session_id} itemVersionId={item_version_id}。",
            500,
        ) from exc
    if not isinstance(value, list):
        raise Lesson5ReportError(
            f"统计 JSON 格式错误：sessionId={session_id} itemVersionId={item_version_id}。",
            500,
        )
    return [item for item in value if isinstance(item, str)]


def _item_stats_dto(row: sqlite3.Row) -> ItemStatsDto:
    """把 item_stats 行装配为不含作者身份的 DTO。"""
    issue_flags = _loads_list(
        row["issue_flags_json"],
        session_id=row["session_id"],
        item_version_id=row["item_version_id"],
    )
    sample_comments = _loads_list(
        row["sample_comments_json"],
        session_id=row["session_id"],
        item_version_id=row["item_version_id"],
    )
    return ItemStatsDto(
        itemId=row["item_id"],
        itemVersionId=row["item_version_id"],
        itemShortName=row["item_short_name"] if row["item_short_name"] else None,
        kind=row["card_kind"],
        validAnswerCount=int(row["valid_answer_count"]),
        correctCount=int(row["correct_count"]),
        correctRate=float(row["correct_rate"]),
        avgClarity=float(row["avg_clarity"]) if row["avg_clarity"] is not None else None,
        avgThinkingValue=float(row["avg_thinking_value"]) if row["avg_thinking_value"] is not None else None,
        avgExplanationHelpfulness=(
            float(row["avg_explanation_helpfulness"]) if row["avg_explanation_helpfulness"] is not None else None
        ),
        issueFlagCount=int(row["issue_flag_count"]),
        issueFlagRate=float(row["issue_flag_rate"]),
        issueFlags=issue_flags,
        sampleComments=sample_comments,
        statsStatus=StatsStatus(row["stats_status"]),
        computedAt=row["computed_at"],
    )


def _breakdown(items: list[ItemStatsDto]) -> StatsStatusBreakdownDto:
    """按 statsStatus 汇总题卡数量。"""
    return StatsStatusBreakdownDto(
        insufficient=sum(1 for item in items if item.statsStatus == StatsStatus.insufficient),
        preliminary=sum(1 for item in items if item.statsStatus == StatsStatus.preliminary),
        stable=sum(1 for item in items if item.statsStatus == StatsStatus.stable),
    )


def _average(values: list[float]) -> float | None:
    """计算四位小数平均值；空数组返回 None。"""
    if not values:
        return None
    return round(sum(values) / len(values), 4)


def _diagnosis_hints(item: ItemStatsDto) -> list[DiagnosisHint]:
    """按最小固定规则生成学生可读诊断提示。"""
    hints: list[DiagnosisHint] = []
    if item.statsStatus == StatsStatus.insufficient:
        hints.append(DiagnosisHint.needs_more_samples)
    if item.correctRate < 0.6:
        hints.append(DiagnosisHint.low_correct_rate)
    if item.avgClarity is not None and item.avgClarity < 2:
        hints.append(DiagnosisHint.low_clarity)
    if item.avgThinkingValue is not None and item.avgThinkingValue < 2:
        hints.append(DiagnosisHint.low_thinking_value)
    if item.avgExplanationHelpfulness is not None and item.avgExplanationHelpfulness < 2:
        hints.append(DiagnosisHint.low_explanation_helpfulness)
    if item.issueFlagRate >= 0.3:
        hints.append(DiagnosisHint.high_issue_flag_rate)
    return hints


def _report_item(item: ItemStatsDto) -> MyReportItemStatsDto:
    """把通用题卡统计扩展为学生报告项。"""
    return MyReportItemStatsDto(**item.model_dump(), diagnosisHints=_diagnosis_hints(item))


def _require_stats_computed(connection: sqlite3.Connection, session_id: str) -> None:
    """要求 session 已存在 item_stats 结果。"""
    if repository.count_item_stats_by_session(connection, session_id) == 0:
        raise Lesson5ReportError(f"请先计算统计：sessionId={session_id}。", 409)


def get_session_analytics(session_id: str, session: SessionContext) -> SessionAnalyticsResponse:
    """读取教师 analytics；teacher 任意授权或 demo 可见，默认不暴露作者身份。"""
    generated_at = to_iso8601(server_now())
    with database_transaction() as connection:
        session_row = _load_session_or_404(connection, session_id)
        _require_can_view(connection, session, session_row["class_id"])
        _require_stats_computed(connection, session_id)
        rows = repository.list_item_stats_by_session(connection, session_id)

    items = [_item_stats_dto(row) for row in rows]
    return SessionAnalyticsResponse(
        sessionId=session_id,
        phase=session_row["phase"],
        settings=_settings_from_json(session_row["settings_json"]),
        items=items,
        summary=SessionAnalyticsSummaryDto(
            itemCount=len(items),
            validAnswerCount=sum(item.validAnswerCount for item in items),
            averageCorrectRate=_average([item.correctRate for item in items]),
            averageIssueFlagRate=_average([item.issueFlagRate for item in items]),
            statsStatusBreakdown=_breakdown(items),
        ),
        generatedAt=generated_at,
    )


def get_my_report(session_id: str, participant_id: str, lesson5_client_id: str) -> MyReportResponse:
    """读取学生本人题卡报告；要求 analytics_open 且 participant/clientId 匹配。"""
    normalized_participant_id = participant_id.strip()
    normalized_client_id = lesson5_client_id.strip()
    generated_at = to_iso8601(server_now())
    with database_transaction() as connection:
        session_row = _load_session_or_404(connection, session_id)
        if not _phase_at_least(session_row["phase"], "analytics_open"):
            raise Lesson5ReportError(
                f"统计报告尚未开放：sessionId={session_id} phase={session_row['phase']}。",
                409,
            )
        _require_stats_computed(connection, session_id)
        participant = repository.get_participant_by_id(connection, normalized_participant_id)
        if participant is None:
            raise Lesson5ReportError(f"participant 不存在：participantId={normalized_participant_id}。", 404)
        if participant["session_id"] != session_id:
            raise Lesson5ReportError(
                f"participant/session 不匹配：sessionId={session_id} participantId={normalized_participant_id}。",
                403,
            )
        if participant["lesson5_client_id"] != normalized_client_id:
            raise Lesson5ReportError(
                f"participant/client 不匹配：participantId={normalized_participant_id}。",
                403,
            )
        rows = repository.list_item_stats_for_author(
            connection,
            session_id=session_id,
            seat_code=participant["class_seat_code"],
        )

    items = [_report_item(_item_stats_dto(row)) for row in rows]
    return MyReportResponse(
        sessionId=session_id,
        participantId=normalized_participant_id,
        items=items,
        generatedAt=generated_at,
    )
