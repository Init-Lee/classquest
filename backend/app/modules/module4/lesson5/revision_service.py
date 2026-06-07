"""
文件说明：模块 4 课时 5 V3 修订提交与教师修订总览服务。
职责：在 analytics_open 后校验 participant/client 归属、本人题卡边界与 V2 基线版本，幂等写入 V3 题卡版本和 revision_plan，并为教师/demo 装配班级修订状态总览。
更新触发：V3 提交契约、readyForLesson6 口径、revision_plans 表结构、教师修订总览权限或 phase gate 变化时，需要同步更新本文件。
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
from .errors import Lesson5RevisionError
from .pool_service import compute_content_hash, item_short_name, stable_json
from .schemas import (
    ReadyForLesson6,
    RevisionPlanItemDto,
    RevisionPlansResponse,
    RevisionPlansSummaryDto,
    V3SubmissionRequest,
    V3SubmissionResponse,
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
SOURCE_PACKAGE_VERSION = "lesson5-v3-revision-v1"
V3_STATUS = "ready_for_lesson6"


def _generate_revision_plan_id() -> str:
    """生成 revision_plan 主键。"""
    return f"l5rev_{secrets.token_hex(8)}"


def _generate_v3_version_id(item_id: str, content_hash: str) -> str:
    """按内容 hash 生成稳定 V3 version_id。"""
    return f"{item_id}-v3-{content_hash[:16]}"


def _generate_event_id() -> str:
    """生成 lesson5 事件主键。"""
    return f"l5evt_{secrets.token_hex(8)}"


def _phase_at_least(phase: str, minimum: str) -> bool:
    """判断 phase 是否已到达指定阶段。"""
    return phase in PHASE_ORDER and PHASE_ORDER.index(phase) >= PHASE_ORDER.index(minimum)


def _ready_for_lesson6(count: int) -> ReadyForLesson6:
    """把已提交 V3 数量映射为课时 6 准备度。"""
    if count >= 2:
        return "full"
    if count == 1:
        return "partial"
    return "none"


def _load_session_or_404(connection: sqlite3.Connection, session_id: str) -> sqlite3.Row:
    """读取 session，不存在时返回 404 业务错误。"""
    row = repository.get_session(connection, session_id)
    if row is None:
        raise Lesson5RevisionError(f"会话不存在：sessionId={session_id}。", 404)
    return row


def _require_can_view(connection: sqlite3.Connection, session: SessionContext, class_id: str) -> None:
    """校验教师或 demo 的修订总览查看权限。"""
    if session.role == "demo":
        return
    if session.role != "teacher":
        raise Lesson5RevisionError("需要教师权限。", 403)
    permission = repository.get_teacher_class_permission(connection, session.user_id, class_id)
    if permission is None:
        raise Lesson5RevisionError("你没有该班级的查看权限。", 403)


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
        raise Lesson5RevisionError(f"participant 不存在：participantId={participant_id}。", 404)
    if participant["session_id"] != session_id:
        raise Lesson5RevisionError(
            f"participant/session 不匹配：sessionId={session_id} participantId={participant_id}。",
            403,
        )
    if participant["lesson5_client_id"] != lesson5_client_id:
        raise Lesson5RevisionError(f"participant/client 不匹配：participantId={participant_id}。", 403)
    return participant


def _load_owned_item(
    connection: sqlite3.Connection,
    *,
    item_id: str,
    class_id: str,
    seat_code: str,
) -> sqlite3.Row:
    """读取并校验题卡属于当前学生本人。"""
    item = repository.get_question_item(connection, item_id)
    if item is None:
        raise Lesson5RevisionError(f"题卡不存在：itemId={item_id}。", 404)
    if item["class_id"] != class_id or item["author_seat_code"] != seat_code:
        raise Lesson5RevisionError("只能提交本人题卡的 V3 修订。", 403)
    return item


def _load_base_v2(connection: sqlite3.Connection, *, item_id: str, base_v2_version_id: str) -> sqlite3.Row:
    """读取并校验 V3 的 V2 父版本。"""
    version = repository.get_question_item_version(connection, base_v2_version_id)
    if version is None:
        raise Lesson5RevisionError(f"V2 基线版本不存在：baseV2VersionId={base_v2_version_id}。", 404)
    if version["item_id"] != item_id or version["version_label"] != "v2":
        raise Lesson5RevisionError("baseV2VersionId 与 itemId 不匹配。", 403)
    return version


def _extract_correct_option_key(card: dict[str, Any]) -> str:
    """从 V3 卡片中提取标准答案 key。"""
    task = card.get("task") if isinstance(card.get("task"), dict) else {}
    value = task.get("correctOptionKey") if isinstance(task, dict) else None
    if not isinstance(value, str) or not value.strip():
        raise Lesson5RevisionError("v3CardJson.task.correctOptionKey 不能为空。")
    return value.strip()


def _safe_diagnosis(raw: str | None) -> dict[str, Any]:
    """解析 revision_plans.diagnosis_json，异常时返回空对象避免教师面板崩溃。"""
    if not raw:
        return {}
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return value if isinstance(value, dict) else {}


def _revision_item(row: sqlite3.Row) -> RevisionPlanItemDto:
    """把 revision plan 聚合行装配为教师/学生复用 DTO。"""
    return RevisionPlanItemDto(
        studentSeatCode=row["student_seat_code"],
        studentName=row["student_name"],
        participantId=row["participant_id"],
        itemId=row["item_id"],
        cardKind=row["card_kind"],
        baseV2VersionId=row["base_v2_version_id"],
        v3VersionId=row["v3_item_version_id"],
        revisionAction=row["revision_action"],
        diagnosis=_safe_diagnosis(row["diagnosis_json"]),
        revisionReason=row["revision_reason"] or "",
        expectedEffect=row["expected_effect"] or "",
        status=row["status"],
        submittedAt=row["submitted_at"],
        updatedAt=row["updated_at"],
    )


def _insert_event(
    connection: sqlite3.Connection,
    *,
    session_id: str,
    participant_id: str,
    payload: dict[str, Any],
    now: str,
) -> None:
    """写入 V3 提交审计事件，payload 不包含题卡全文。"""
    repository.insert_event(
        connection,
        event_id=_generate_event_id(),
        session_id=session_id,
        actor_role="student",
        actor_id=participant_id,
        event_type="v3_submitted",
        payload_json=json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
        created_at=now,
    )


def submit_v3(payload: V3SubmissionRequest) -> V3SubmissionResponse:
    """提交本人单张题卡 V3，写入长期题库并覆盖 revision_plan。"""
    session_id = payload.sessionId.strip()
    participant_id = payload.participantId.strip()
    lesson5_client_id = payload.lesson5ClientId.strip()
    item_id = payload.itemId.strip()
    base_v2_version_id = payload.baseV2VersionId.strip()
    now = to_iso8601(server_now())
    card = payload.v3CardJson
    content_hash = compute_content_hash(card)
    correct_option_key = _extract_correct_option_key(card)
    revision_plan = payload.revisionPlan
    diagnosis_json = json.dumps(revision_plan.diagnosis.model_dump(), ensure_ascii=False, sort_keys=True)

    with database_transaction() as connection:
        session_row = _load_session_or_404(connection, session_id)
        if not _phase_at_least(session_row["phase"], "analytics_open"):
            raise Lesson5RevisionError(
                f"统计反馈尚未开放，暂不能提交 V3：sessionId={session_id} phase={session_row['phase']}。",
                409,
            )
        participant = _load_participant(
            connection,
            session_id=session_id,
            participant_id=participant_id,
            lesson5_client_id=lesson5_client_id,
        )
        item = _load_owned_item(
            connection,
            item_id=item_id,
            class_id=session_row["class_id"],
            seat_code=participant["class_seat_code"],
        )
        _load_base_v2(connection, item_id=item_id, base_v2_version_id=base_v2_version_id)

        existing_version = repository.find_version_by_hash(
            connection,
            item_id=item_id,
            version_label="v3",
            content_hash=content_hash,
        )
        deduped = existing_version is not None
        if existing_version is None:
            version_row = repository.insert_question_item_version(
                connection,
                item_version_id=_generate_v3_version_id(item_id, content_hash),
                item_id=item_id,
                class_id=session_row["class_id"],
                version_label="v3",
                source_lesson="lesson5",
                source_session_id=session_id,
                base_version_id=base_v2_version_id,
                source_package_version=SOURCE_PACKAGE_VERSION,
                source_lesson4_card_id=None,
                source_package_hash=compute_content_hash(
                    {"revisionPlan": revision_plan.model_dump(), "v3CardJson": card}
                ),
                card_json=json.dumps(card, ensure_ascii=False, sort_keys=True),
                content_hash=content_hash,
                correct_option_key=correct_option_key,
                item_short_name=item_short_name(card, item["card_kind"], item["author_name"]),
                status=V3_STATUS,
                now=now,
            )
        else:
            version_row = existing_version

        repository.set_current_v3_version(
            connection,
            item_id=item_id,
            version_id=version_row["item_version_id"],
            now=now,
        )
        repository.upsert_revision_plan(
            connection,
            revision_plan_id=_generate_revision_plan_id(),
            session_id=session_id,
            participant_id=participant_id,
            student_seat_code=participant["class_seat_code"],
            item_id=item_id,
            base_v2_version_id=base_v2_version_id,
            v3_item_version_id=version_row["item_version_id"],
            card_kind=item["card_kind"],
            diagnosis_json=diagnosis_json,
            revision_action=revision_plan.revisionAction,
            revision_reason=revision_plan.revisionReason.strip(),
            expected_effect=revision_plan.expectedEffect.strip(),
            now=now,
        )
        submitted_count = repository.count_ready_v3_items_for_participant(
            connection,
            session_id=session_id,
            class_id=session_row["class_id"],
            seat_code=participant["class_seat_code"],
        )
        _insert_event(
            connection,
            session_id=session_id,
            participant_id=participant_id,
            payload={
                "itemId": item_id,
                "baseV2VersionId": base_v2_version_id,
                "v3VersionId": version_row["item_version_id"],
                "deduped": deduped,
                "readyForLesson6": _ready_for_lesson6(submitted_count),
            },
            now=now,
        )

    return V3SubmissionResponse(
        ok=True,
        itemId=item_id,
        v3VersionId=version_row["item_version_id"],
        status=version_row["status"],
        readyForLesson6=_ready_for_lesson6(submitted_count),
        deduped=deduped,
    )


def list_revision_plans(session_id: str, session: SessionContext) -> RevisionPlansResponse:
    """读取教师修订总览；teacher 任意授权或 demo 可见。"""
    generated_at = to_iso8601(server_now())
    with database_transaction() as connection:
        session_row = _load_session_or_404(connection, session_id)
        _require_can_view(connection, session, session_row["class_id"])
        if not _phase_at_least(session_row["phase"], "analytics_open"):
            raise Lesson5RevisionError(
                f"统计反馈尚未开放，暂不能读取修订观察：sessionId={session_id} phase={session_row['phase']}。",
                409,
            )
        rows = repository.list_revision_plans_by_session(connection, session_id)

    items = [_revision_item(row) for row in rows]
    ready_by_seat: dict[str, int] = {}
    for item in items:
        if item.status == "submitted":
            ready_by_seat[item.studentSeatCode] = ready_by_seat.get(item.studentSeatCode, 0) + 1
        else:
            ready_by_seat.setdefault(item.studentSeatCode, 0)
    return RevisionPlansResponse(
        sessionId=session_id,
        phase=session_row["phase"],
        items=items,
        summary=RevisionPlansSummaryDto(
            totalItems=len(items),
            submittedItems=sum(1 for item in items if item.status == "submitted"),
            readyFullStudents=sum(1 for count in ready_by_seat.values() if count >= 2),
            readyPartialStudents=sum(1 for count in ready_by_seat.values() if count == 1),
            readyNoneStudents=sum(1 for count in ready_by_seat.values() if count == 0),
        ),
        generatedAt=generated_at,
    )


def revision_item_from_row(row: sqlite3.Row) -> RevisionPlanItemDto:
    """供 completion_service 复用的 revision_plan DTO 装配入口。"""
    return _revision_item(row)


def ready_for_lesson6_from_count(count: int) -> ReadyForLesson6:
    """供 completion_service 复用的准备度映射入口。"""
    return _ready_for_lesson6(count)
