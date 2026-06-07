"""
文件说明：模块 4 课时 5 学生 V2 提交与班级题池 overview 服务层。
职责：校验 lesson4 ready 包，按 C0 seed 一致口径计算完整 card_json 的 content_hash，幂等写入长期题池 v2 版本，并为教师端提供班级题池只读概览。
更新触发：ready 包版本、题池 hash/ID 口径、V2 提交流程、题池状态枚举或 pool-overview 响应字段变化时，需要同步更新本文件。
"""

from __future__ import annotations

import hashlib
import json
from typing import Any, Literal

import sqlite3

from app.core.database import database_transaction

from . import repository
from .auth import server_now, to_iso8601
from .errors import Lesson5PoolError
from .schemas import (
    ClassPoolItemDto,
    ClassPoolItemDetailResponse,
    ClassPoolOverviewResponse,
    V2SubmissionItemResult,
    V2SubmissionRequest,
    V2SubmissionResponse,
)

CardKind = Literal["news", "image"]
CARD_KINDS: tuple[CardKind, CardKind] = ("news", "image")
SOURCE_LESSON = "lesson5"
SOURCE_PACKAGE_VERSION = "lesson4-ready-for-lesson5-v1"
VERSION_STATUS = "submitted_to_trial_pool"


def stable_json(value: Any) -> str:
    """生成稳定 JSON；口径须与 C0 seed 保持一致，完整保留 dataUrl。"""
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def compute_content_hash(card: dict[str, Any]) -> str:
    """按完整 card_json 计算 sha256，确保真实提交与 fixture seed 可比。"""
    return hashlib.sha256(stable_json(card).encode("utf-8")).hexdigest()


def item_short_name(card: dict[str, Any], kind: str, author_name: str) -> str:
    """生成题池列表中的短标题；逻辑与 C0 seed 保持一致。"""
    task = card.get("task") if isinstance(card.get("task"), dict) else {}
    material = card.get("material") if isinstance(card.get("material"), dict) else {}
    for key in ("title", "headline", "question"):
        value = task.get(key) if isinstance(task, dict) else None
        if isinstance(value, str) and value.strip():
            return value.strip()[:80]
    for key in ("title", "headline"):
        value = material.get(key) if isinstance(material, dict) else None
        if isinstance(value, str) and value.strip():
            return value.strip()[:80]
    return f"{author_name}-{kind}-v2"


def deterministic_item_id(class_id: str, seat_code: str, kind: str) -> str:
    """为同一学生同类卡生成稳定 item_id；口径与 C0 seed 一致。"""
    return f"m4-{class_id}-{seat_code}-{kind}"


def deterministic_version_id(class_id: str, seat_code: str, kind: str, hash_value: str) -> str:
    """为同一内容生成稳定 version_id；口径与 C0 seed 一致。"""
    return f"m4v-{class_id}-{seat_code}-{kind}-v2-{hash_value[:16]}"


def _require_dict(value: Any, field_name: str) -> dict[str, Any]:
    """校验字段必须是对象并返回。"""
    if not isinstance(value, dict):
        raise Lesson5PoolError(f"{field_name} 必须是对象。")
    return value


def _validate_payload(payload: V2SubmissionRequest) -> dict[str, Any]:
    """校验提交外层字段与 readyPackage 版本。"""
    if len(payload.classSeatCode) != 4 or not payload.classSeatCode.isdigit():
        raise Lesson5PoolError("班学号必须为 4 位数字。")
    if not payload.classId.strip():
        raise Lesson5PoolError("classId 不能为空。")
    if not payload.studentName.strip():
        raise Lesson5PoolError("studentName 不能为空。")
    if not payload.lesson5ClientId.strip():
        raise Lesson5PoolError("lesson5ClientId 不能为空。")

    ready_package = _require_dict(payload.readyPackage, "readyPackage")
    if ready_package.get("packageVersion") != SOURCE_PACKAGE_VERSION:
        raise Lesson5PoolError(f"readyPackage.packageVersion 必须为 {SOURCE_PACKAGE_VERSION}。")
    return ready_package


def _extract_card_entry(ready_package: dict[str, Any], kind: CardKind) -> tuple[dict[str, Any], str, str | None]:
    """从 readyPackage.cards 中取出单张卡、正确答案与课时 4 卡 ID。"""
    cards = _require_dict(ready_package.get("cards"), "readyPackage.cards")
    raw_entry = cards.get(kind)
    if raw_entry is None:
        raise Lesson5PoolError(f"readyPackage.cards.{kind} 不能为空。")
    entry = _require_dict(raw_entry, f"readyPackage.cards.{kind}")

    card = entry.get("card") if isinstance(entry.get("card"), dict) else entry
    card = _require_dict(card, f"readyPackage.cards.{kind}")
    task = _require_dict(card.get("task"), f"readyPackage.cards.{kind}.task")
    correct_option_key = task.get("correctOptionKey")
    if not isinstance(correct_option_key, str) or not correct_option_key.strip():
        wrapper_correct_option_key = entry.get("correctOptionKey")
        if isinstance(wrapper_correct_option_key, str) and wrapper_correct_option_key.strip():
            correct_option_key = wrapper_correct_option_key
        else:
            raise Lesson5PoolError(f"readyPackage.cards.{kind}.task.correctOptionKey 不能为空。")

    card_id = card.get("id")
    if not isinstance(card_id, str) or not card_id.strip():
        wrapper_card_id = entry.get("cardId")
        card_id = wrapper_card_id if isinstance(wrapper_card_id, str) and wrapper_card_id.strip() else None
    return card, correct_option_key.strip(), card_id


def _assert_class_exists(connection: sqlite3.Connection, class_id: str) -> None:
    """确认目标班级存在，避免学生提交写入孤儿题池。"""
    if repository.get_class_by_id(connection, class_id) is None:
        raise Lesson5PoolError(f"班级不存在：{class_id}。")


def _submit_one_card(
    connection: sqlite3.Connection,
    *,
    payload: V2SubmissionRequest,
    ready_package_hash: str,
    ready_package: dict[str, Any],
    kind: CardKind,
    now: str,
) -> V2SubmissionItemResult:
    """提交单张卡，命中同 hash 时幂等复用版本，否则插入新 v2 版本。"""
    card, correct_option_key, card_id = _extract_card_entry(ready_package, kind)
    hash_value = compute_content_hash(card)
    item_id = deterministic_item_id(payload.classId, payload.classSeatCode, kind)
    item_row = repository.upsert_question_item(
        connection,
        item_id=item_id,
        class_id=payload.classId,
        author_seat_code=payload.classSeatCode,
        author_name=payload.studentName,
        card_kind=kind,
        now=now,
    )

    existing_version = repository.find_version_by_hash(
        connection,
        item_id=item_row["item_id"],
        content_hash=hash_value,
    )
    if existing_version is not None:
        repository.set_current_v2_version(
            connection,
            item_id=item_row["item_id"],
            version_id=existing_version["item_version_id"],
            now=now,
        )
        return V2SubmissionItemResult(
            itemId=item_row["item_id"],
            v2VersionId=existing_version["item_version_id"],
            status=existing_version["status"],
            deduped=True,
        )

    version_id = deterministic_version_id(payload.classId, payload.classSeatCode, kind, hash_value)
    version_row = repository.insert_question_item_version(
        connection,
        item_version_id=version_id,
        item_id=item_row["item_id"],
        class_id=payload.classId,
        source_lesson=SOURCE_LESSON,
        source_package_version=SOURCE_PACKAGE_VERSION,
        source_lesson4_card_id=card_id,
        source_package_hash=ready_package_hash,
        card_json=json.dumps(card, ensure_ascii=False, sort_keys=True),
        content_hash=hash_value,
        correct_option_key=correct_option_key,
        item_short_name=item_short_name(card, kind, payload.studentName),
        status=VERSION_STATUS,
        now=now,
    )
    repository.set_current_v2_version(
        connection,
        item_id=item_row["item_id"],
        version_id=version_row["item_version_id"],
        now=now,
    )
    return V2SubmissionItemResult(
        itemId=item_row["item_id"],
        v2VersionId=version_row["item_version_id"],
        status=version_row["status"],
        deduped=False,
    )


def submit_v2(payload: V2SubmissionRequest) -> V2SubmissionResponse:
    """学生提交两张 V2 卡进入班级题池；单事务保证 news/image 同步成功或回滚。"""
    ready_package = _validate_payload(payload)
    submitted_at = to_iso8601(server_now())
    ready_package_hash = hashlib.sha256(stable_json(ready_package).encode("utf-8")).hexdigest()

    with database_transaction() as connection:
        _assert_class_exists(connection, payload.classId)
        items = {
            kind: _submit_one_card(
                connection,
                payload=payload,
                ready_package_hash=ready_package_hash,
                ready_package=ready_package,
                kind=kind,
                now=submitted_at,
            )
            for kind in CARD_KINDS
        }

    return V2SubmissionResponse(
        ok=True,
        classId=payload.classId,
        studentName=payload.studentName,
        classSeatCode=payload.classSeatCode,
        items=items,
        submittedAt=submitted_at,
    )


def get_class_pool_overview(class_id: str) -> ClassPoolOverviewResponse:
    """返回指定班级题池当前 v2 概览。"""
    generated_at = to_iso8601(server_now())
    with database_transaction() as connection:
        _assert_class_exists(connection, class_id)
        rows = repository.list_class_pool(connection, class_id)

    items = [
        ClassPoolItemDto(
            itemId=row["item_id"],
            classId=row["class_id"],
            authorSeatCode=row["author_seat_code"],
            authorName=row["author_name"],
            cardKind=row["card_kind"],
            currentV2VersionId=row["current_v2_version_id"],
            currentV2ContentHash=row["current_v2_content_hash"],
            currentV2ShortName=row["current_v2_short_name"],
            currentV2Status=row["current_v2_status"],
            status=row["status"],
            updatedAt=row["updated_at"],
        )
        for row in rows
    ]
    return ClassPoolOverviewResponse(classId=class_id, generatedAt=generated_at, items=items)


def _load_card_json(raw_card_json: str, *, item_id: str, item_version_id: str) -> dict[str, Any]:
    """解析题卡 JSON，异常时带上 item/version 方便定位脏数据。"""
    try:
        value = json.loads(raw_card_json)
    except json.JSONDecodeError as exc:
        raise Lesson5PoolError(
            f"题卡 JSON 无法解析：itemId={item_id} itemVersionId={item_version_id}。",
            409,
        ) from exc
    if not isinstance(value, dict):
        raise Lesson5PoolError(
            f"题卡 JSON 格式错误：itemId={item_id} itemVersionId={item_version_id}。",
            409,
        )
    return value


def _extract_options(task: dict[str, Any]) -> list[dict[str, Any]]:
    """提取选项数组；教师预览允许保留 rationale/explanation 方便核对题卡。"""
    options = task.get("options")
    if not isinstance(options, list):
        return []
    return [dict(option) for option in options if isinstance(option, dict)]


def get_class_pool_item_detail(class_id: str, item_id: str) -> ClassPoolItemDetailResponse:
    """返回班级题池中单个 item 的当前 V2 题卡详情。"""
    with database_transaction() as connection:
        _assert_class_exists(connection, class_id)
        item = repository.get_question_item(connection, item_id)
        if item is None:
            raise Lesson5PoolError(f"题池 item 不存在：itemId={item_id}。", 404)
        if item["class_id"] != class_id:
            raise Lesson5PoolError(
                f"题池 item 不属于当前班级：classId={class_id} itemId={item_id}。",
                404,
            )
        version_id = item["current_v2_version_id"]
        if not version_id:
            raise Lesson5PoolError(f"题池 item 尚无当前 V2：itemId={item_id}。", 404)
        version = repository.get_question_item_version(connection, version_id)
        if version is None or version["item_id"] != item_id or version["class_id"] != class_id:
            raise Lesson5PoolError(
                f"题卡版本不存在或归属不匹配：itemId={item_id} itemVersionId={version_id}。",
                404,
            )

    card = _load_card_json(version["card_json"], item_id=item_id, item_version_id=version_id)
    material = dict(card.get("material")) if isinstance(card.get("material"), dict) else {}
    task = dict(card.get("task")) if isinstance(card.get("task"), dict) else {}
    return ClassPoolItemDetailResponse(
        itemId=item["item_id"],
        classId=item["class_id"],
        authorSeatCode=item["author_seat_code"],
        authorName=item["author_name"],
        cardKind=item["card_kind"],
        itemVersionId=version["item_version_id"],
        contentHash=version["content_hash"],
        itemShortName=version["item_short_name"],
        status=version["status"],
        material=material,
        task=task,
        options=_extract_options(task),
        correctOptionKey=version["correct_option_key"],
        cardJson=card,
        updatedAt=version["updated_at"],
    )
