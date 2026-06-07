"""
文件说明：模块 4 课时 5 fixture seed 脚本。
职责：读取 inspect 生成的归一化 V2 提交包，在本地 SQLite 中写入班级、fixture 教师授权、长期题池 item 与 v2 version。
更新触发：题池 schema、归一化输入格式、content_hash 口径、class_id 映射或 full-test-session 模拟策略变化时，需要同步更新本文件。
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import load_backend_env
from app.core.database import database_transaction, initialize_database

DEFAULT_NORMALIZED_PATH = (
    BACKEND_ROOT / "runtime" / "fixtures" / "module4" / "lesson5" / "generated" / "lesson5_v2_submissions.normalized.json"
)
SOURCE_LESSON = "dev_seed"
SOURCE_PACKAGE_VERSION = "lesson4-ready-for-lesson5-v1"
FIXTURE_TEACHER_ID = "fixture-teacher-module4-lesson5"
FIXTURE_TEACHER_ACCOUNT = "fixture.teacher.module4.lesson5"


def stable_json(value: Any) -> str:
    """生成稳定 JSON；本阶段保留完整 dataUrl，C0 需人工核对 hash 口径。"""
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def content_hash(card: dict[str, Any]) -> str:
    """按完整 card_json 计算稳定 sha256。"""
    return hashlib.sha256(stable_json(card).encode("utf-8")).hexdigest()


def utc_now() -> str:
    """返回 UTC ISO 时间戳，供 seed 记录写入使用。"""
    return datetime.now(timezone.utc).isoformat()


def load_normalized(path: Path) -> list[dict[str, Any]]:
    """读取 inspect 输出的归一化提交列表。"""
    if not path.exists():
        raise FileNotFoundError(f"归一化 fixture 文件不存在：{path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    submissions = payload.get("submissions") if isinstance(payload, dict) else None
    if not isinstance(submissions, list):
        raise ValueError(f"归一化 fixture 文件缺少 submissions 数组：{path}")
    return [item for item in submissions if isinstance(item, dict)]


def class_name_from_id(class_id: str) -> str:
    """把 g7c03 还原成中文班级名，供 fixture 班级记录使用。"""
    if len(class_id) >= 5 and class_id.startswith("g7c") and class_id[3:].isdigit():
        return f"初一（{int(class_id[3:])}）班"
    return class_id


def item_short_name(card: dict[str, Any], kind: str, author_name: str) -> str:
    """生成题池列表里的短标题。"""
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
    """为同一学生同类卡生成稳定 item_id。"""
    return f"m4-{class_id}-{seat_code}-{kind}"


def deterministic_version_id(class_id: str, seat_code: str, kind: str, hash_value: str) -> str:
    """为同一内容生成稳定 version_id，重复 seed 不产生重复版本。"""
    return f"m4v-{class_id}-{seat_code}-{kind}-v2-{hash_value[:16]}"


def ensure_fixture_class_and_teacher(connection: Any, class_id: str, now: str) -> None:
    """写入开发样本班级与 fixture 教师授权。"""
    class_name = class_name_from_id(class_id)
    connection.execute(
        """
        INSERT INTO cq_classes (class_id, class_name, grade_label, active, created_at, updated_at)
        VALUES (?, ?, ?, 1, ?, ?)
        ON CONFLICT(class_id) DO UPDATE SET
          class_name = excluded.class_name,
          grade_label = excluded.grade_label,
          active = 1,
          updated_at = excluded.updated_at
        """,
        (class_id, class_name, "七年级", now, now),
    )
    connection.execute(
        """
        INSERT INTO cq_users (user_id, account, display_name, role, active, created_at, updated_at)
        VALUES (?, ?, ?, 'teacher', 1, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          account = excluded.account,
          display_name = excluded.display_name,
          role = 'teacher',
          active = 1,
          updated_at = excluded.updated_at
        """,
        (FIXTURE_TEACHER_ID, FIXTURE_TEACHER_ACCOUNT, "课时5 fixture 教师", now, now),
    )
    connection.execute(
        """
        INSERT INTO cq_teacher_class_assignments (
          assignment_id, user_id, class_id, class_name, permission, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, 'manage', ?, ?)
        ON CONFLICT(user_id, class_id) DO UPDATE SET
          class_name = excluded.class_name,
          permission = 'manage',
          updated_at = excluded.updated_at
        """,
        (f"{FIXTURE_TEACHER_ID}-{class_id}", FIXTURE_TEACHER_ID, class_id, class_name, now, now),
    )


def validate_submission(submission: dict[str, Any], target_class_id: str) -> tuple[str, str, list[dict[str, Any]]]:
    """校验一条归一化提交是否可写入目标班级题池。"""
    source_class_id = submission.get("classIdSuggestion")
    if source_class_id and source_class_id != target_class_id:
        raise ValueError(
            f"提交来源班级 {source_class_id} 与目标班级 {target_class_id} 不一致：{submission.get('sourceFile')}"
        )
    student_name = submission.get("studentName")
    seat_code = submission.get("classSeatCode")
    cards = submission.get("cards")
    if not isinstance(student_name, str) or not student_name.strip():
        raise ValueError(f"缺少 studentName：{submission.get('sourceFile')}")
    if not isinstance(seat_code, str) or not seat_code.strip():
        raise ValueError(f"缺少 classSeatCode：{submission.get('sourceFile')}")
    if not isinstance(cards, list) or not cards:
        raise ValueError(f"缺少 cards：{submission.get('sourceFile')}")
    return student_name.strip(), seat_code.strip(), [card for card in cards if isinstance(card, dict)]


def seed_card(
    connection: Any,
    *,
    class_id: str,
    student_name: str,
    seat_code: str,
    card_entry: dict[str, Any],
    now: str,
) -> tuple[str, str]:
    """写入单张 V2 卡片的 item 与 version。"""
    kind = card_entry.get("kind")
    card = card_entry.get("card")
    correct_option_key = card_entry.get("correctOptionKey")
    if kind not in {"news", "image"}:
        raise ValueError(f"不支持的 card kind：{kind}")
    if not isinstance(card, dict):
        raise ValueError(f"{student_name} {seat_code} {kind} 缺少 card_json")
    if not isinstance(correct_option_key, str) or not correct_option_key.strip():
        raise ValueError(f"{student_name} {seat_code} {kind} 缺少 task.correctOptionKey")

    hash_value = content_hash(card)
    item_id = deterministic_item_id(class_id, seat_code, kind)
    version_id = deterministic_version_id(class_id, seat_code, kind, hash_value)
    connection.execute(
        """
        INSERT INTO module4_question_items (
          item_id, class_id, author_seat_code, author_name, card_kind,
          current_v2_version_id, current_v3_version_id, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, NULL, NULL, 'v2_submitted', ?, ?)
        ON CONFLICT(class_id, author_seat_code, card_kind) DO UPDATE SET
          author_name = excluded.author_name,
          status = 'v2_submitted',
          updated_at = excluded.updated_at
        """,
        (item_id, class_id, seat_code, student_name, kind, now, now),
    )
    connection.execute(
        """
        INSERT INTO module4_question_item_versions (
          item_version_id, item_id, class_id, version_label, source_lesson,
          source_session_id, base_version_id, source_package_version, source_lesson4_card_id,
          source_package_hash, card_json, content_hash, correct_option_key, item_short_name,
          status, created_at, updated_at
        )
        VALUES (?, ?, ?, 'v2', ?, NULL, NULL, ?, ?, NULL, ?, ?, ?, ?, 'submitted_to_trial_pool', ?, ?)
        ON CONFLICT(item_id, version_label, content_hash) DO UPDATE SET
          card_json = excluded.card_json,
          correct_option_key = excluded.correct_option_key,
          item_short_name = excluded.item_short_name,
          status = 'submitted_to_trial_pool',
          updated_at = excluded.updated_at
        """,
        (
            version_id,
            item_id,
            class_id,
            SOURCE_LESSON,
            SOURCE_PACKAGE_VERSION,
            card_entry.get("cardId"),
            json.dumps(card, ensure_ascii=False, sort_keys=True),
            hash_value,
            correct_option_key.strip(),
            item_short_name(card, kind, student_name),
            now,
            now,
        ),
    )
    connection.execute(
        """
        UPDATE module4_question_items
        SET current_v2_version_id = ?, updated_at = ?
        WHERE item_id = ?
        """,
        (version_id, now, item_id),
    )
    return item_id, version_id


def seed_pool_only(database_path: str | None, normalized_path: Path, class_id: str) -> dict[str, int]:
    """执行 pool-only seed 并返回写入统计。"""
    submissions = load_normalized(normalized_path)
    initialize_database(database_path)
    now = utc_now()
    item_count = 0
    version_count = 0
    with database_transaction(database_path) as connection:
        ensure_fixture_class_and_teacher(connection, class_id, now)
        for submission in submissions:
            student_name, seat_code, cards = validate_submission(submission, class_id)
            for card_entry in cards:
                seed_card(
                    connection,
                    class_id=class_id,
                    student_name=student_name,
                    seat_code=seat_code,
                    card_entry=card_entry,
                    now=now,
                )
                item_count += 1
                version_count += 1
    return {"submissions": len(submissions), "itemsProcessed": item_count, "versionsProcessed": version_count}


def main() -> None:
    """命令行入口。"""
    parser = argparse.ArgumentParser(description="写入模块 4 课时 5 fixture 题池数据")
    parser.add_argument("--class-id", default="g7c03")
    parser.add_argument("--mode", choices=["pool-only", "full-test-session"], default="pool-only")
    parser.add_argument("--normalized", default=str(DEFAULT_NORMALIZED_PATH))
    parser.add_argument("--database-path")
    args = parser.parse_args()

    if args.mode == "full-test-session":
        raise SystemExit("full-test-session 尚未在 Phase 0 实现；本阶段只支持 --mode pool-only。")

    load_backend_env()
    stats = seed_pool_only(
        database_path=args.database_path,
        normalized_path=Path(args.normalized).expanduser(),
        class_id=args.class_id,
    )
    print(
        "已完成课时5 pool-only seed："
        f"class_id={args.class_id}, submissions={stats['submissions']}, "
        f"itemsProcessed={stats['itemsProcessed']}, versionsProcessed={stats['versionsProcessed']}"
    )


if __name__ == "__main__":
    main()
