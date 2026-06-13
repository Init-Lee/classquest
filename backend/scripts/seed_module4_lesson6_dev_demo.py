"""
文件说明：模块 4 课时 6 本地 HTTP 联调演示数据 seed 脚本。
职责：仅为本地 runtime SQLite 幂等写入 g7c02 的 Lesson6 发布审核、公共题库、公共挑战可抽题库与基础统计演示数据。
更新触发：Lesson6 发布审核 schema、公共挑战抽题条件或 stats 表结构、教师端 overview 契约或本地联调账号口径变化时，需要同步更新本文件。
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import load_backend_env
from app.core.database import database_transaction, initialize_database
from scripts.seed_module4_accounts import seed_module4_accounts

DEFAULT_CLASS_ID = "g7c02"
DEFAULT_TEACHER_USER_ID = "user_xnwy_li"
DEV_PREFIX = "dev_l6"


@dataclass(frozen=True)
class DemoCardSpec:
    """描述一张 Lesson6 演示题卡及其展示统计。"""

    seat_code: str
    student_name: str
    kind: str
    short_name: str
    check_status: str
    is_active_public: bool
    correct_option_key: str
    total_answers: int
    total_correct: int
    lesson6_answers: int
    lesson6_correct: int
    showcase_answers: int
    showcase_correct: int
    valid_answer_count: int
    lesson5_correct_rate: float
    avg_clarity: float
    avg_thinking_value: float
    avg_explanation_helpfulness: float
    issue_flag_rate: float


DEMO_CARDS = (
    DemoCardSpec(
        seat_code="0291",
        student_name="开发演示学生A",
        kind="news",
        short_name="2班演示新闻题：校门口无人机照片真伪",
        check_status="pending_teacher_check",
        is_active_public=False,
        correct_option_key="B",
        total_answers=0,
        total_correct=0,
        lesson6_answers=0,
        lesson6_correct=0,
        showcase_answers=0,
        showcase_correct=0,
        valid_answer_count=18,
        lesson5_correct_rate=0.72,
        avg_clarity=2.7,
        avg_thinking_value=2.6,
        avg_explanation_helpfulness=2.5,
        issue_flag_rate=0.11,
    ),
    DemoCardSpec(
        seat_code="0292",
        student_name="开发演示学生B",
        kind="image",
        short_name="2班演示图片题：操场海报是否为 AI 生成",
        check_status="pending_teacher_check",
        is_active_public=False,
        correct_option_key="A",
        total_answers=0,
        total_correct=0,
        lesson6_answers=0,
        lesson6_correct=0,
        showcase_answers=0,
        showcase_correct=0,
        valid_answer_count=16,
        lesson5_correct_rate=0.63,
        avg_clarity=2.4,
        avg_thinking_value=2.8,
        avg_explanation_helpfulness=2.3,
        issue_flag_rate=0.19,
    ),
    DemoCardSpec(
        seat_code="0293",
        student_name="开发演示学生C",
        kind="news",
        short_name="2班公共新闻题：校园社团报道 AI 痕迹",
        check_status="publishable",
        is_active_public=True,
        correct_option_key="C",
        total_answers=2,
        total_correct=1,
        lesson6_answers=1,
        lesson6_correct=1,
        showcase_answers=1,
        showcase_correct=0,
        valid_answer_count=21,
        lesson5_correct_rate=0.81,
        avg_clarity=2.8,
        avg_thinking_value=2.9,
        avg_explanation_helpfulness=2.7,
        issue_flag_rate=0.05,
    ),
    DemoCardSpec(
        seat_code="0294",
        student_name="开发演示学生D",
        kind="image",
        short_name="2班公共图片题：图书馆宣传图异常细节",
        check_status="publishable",
        is_active_public=True,
        correct_option_key="B",
        total_answers=2,
        total_correct=2,
        lesson6_answers=1,
        lesson6_correct=1,
        showcase_answers=1,
        showcase_correct=1,
        valid_answer_count=20,
        lesson5_correct_rate=0.76,
        avg_clarity=2.6,
        avg_thinking_value=2.7,
        avg_explanation_helpfulness=2.6,
        issue_flag_rate=0.08,
    ),
    DemoCardSpec(
        seat_code="0295",
        student_name="开发演示学生E",
        kind="news",
        short_name="2班公共新闻题：校运会快讯引用链核验",
        check_status="publishable",
        is_active_public=True,
        correct_option_key="A",
        total_answers=1,
        total_correct=1,
        lesson6_answers=1,
        lesson6_correct=1,
        showcase_answers=0,
        showcase_correct=0,
        valid_answer_count=19,
        lesson5_correct_rate=0.74,
        avg_clarity=2.5,
        avg_thinking_value=2.6,
        avg_explanation_helpfulness=2.4,
        issue_flag_rate=0.12,
    ),
    DemoCardSpec(
        seat_code="0296",
        student_name="开发演示学生F",
        kind="image",
        short_name="2班公共图片题：科技节合照局部变形",
        check_status="publishable",
        is_active_public=True,
        correct_option_key="C",
        total_answers=1,
        total_correct=0,
        lesson6_answers=0,
        lesson6_correct=0,
        showcase_answers=1,
        showcase_correct=0,
        valid_answer_count=17,
        lesson5_correct_rate=0.68,
        avg_clarity=2.4,
        avg_thinking_value=2.5,
        avg_explanation_helpfulness=2.5,
        issue_flag_rate=0.15,
    ),
    DemoCardSpec(
        seat_code="0297",
        student_name="开发演示学生G",
        kind="news",
        short_name="2班公共新闻题：社团招新推文时间线异常",
        check_status="publishable",
        is_active_public=True,
        correct_option_key="B",
        total_answers=3,
        total_correct=2,
        lesson6_answers=2,
        lesson6_correct=1,
        showcase_answers=1,
        showcase_correct=1,
        valid_answer_count=22,
        lesson5_correct_rate=0.79,
        avg_clarity=2.7,
        avg_thinking_value=2.8,
        avg_explanation_helpfulness=2.6,
        issue_flag_rate=0.07,
    ),
    DemoCardSpec(
        seat_code="0298",
        student_name="开发演示学生H",
        kind="image",
        short_name="2班公共图片题：食堂公告图文字边缘核验",
        check_status="publishable",
        is_active_public=True,
        correct_option_key="A",
        total_answers=3,
        total_correct=2,
        lesson6_answers=2,
        lesson6_correct=1,
        showcase_answers=1,
        showcase_correct=1,
        valid_answer_count=18,
        lesson5_correct_rate=0.7,
        avg_clarity=2.5,
        avg_thinking_value=2.7,
        avg_explanation_helpfulness=2.5,
        issue_flag_rate=0.1,
    ),
)


def utc_now() -> str:
    """返回 UTC ISO 时间戳，供本地 seed 幂等更新时间使用。"""
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def class_name_from_id(class_id: str) -> str:
    """把 g7c02 这类班级 id 转换为中文班级名。"""
    if class_id.startswith("g7c") and class_id[3:].isdigit():
        return f"初一（{int(class_id[3:])}）班"
    return class_id


def stable_json(value: Any) -> str:
    """生成稳定 JSON 字符串，避免重复 seed 产生不同 hash。"""
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def content_hash(card: dict[str, Any]) -> str:
    """按完整题卡 JSON 计算稳定 sha256。"""
    return hashlib.sha256(stable_json(card).encode("utf-8")).hexdigest()


def item_id_for(class_id: str, spec: DemoCardSpec) -> str:
    """生成本脚本专用 item_id。"""
    return f"{DEV_PREFIX}_{class_id}_{spec.seat_code}_{spec.kind}"


def version_id_for(class_id: str, spec: DemoCardSpec) -> str:
    """生成本脚本专用 V3 version_id。"""
    return f"{DEV_PREFIX}_{class_id}_{spec.seat_code}_{spec.kind}_v3"


def review_id_for(class_id: str, spec: DemoCardSpec) -> str:
    """生成本脚本专用发布审核 review_id。"""
    return f"{DEV_PREFIX}_{class_id}_{spec.seat_code}_{spec.kind}_review"


def make_card(class_id: str, spec: DemoCardSpec) -> dict[str, Any]:
    """构造不含真实学生信息的 Lesson6 V3 演示题卡。"""
    return {
        "id": f"{DEV_PREFIX}-{class_id}-{spec.seat_code}-{spec.kind}",
        "kind": spec.kind,
        "material": {
            "titleOrName": spec.short_name,
            "sourceLabel": "本地开发演示素材",
            "description": "这是一条为教师端 HTTP 联调准备的虚构材料，不对应真实学生或真实新闻。",
        },
        "task": {
            "prompt": "请判断这张题卡中的材料是否存在明显 AI 生成或编辑痕迹。",
            "options": [
                {"key": "A", "label": "存在明显 AI 痕迹"},
                {"key": "B", "label": "暂未发现明显 AI 痕迹"},
                {"key": "C", "label": "证据不足，需要继续核验"},
            ],
            "correctOptionKey": spec.correct_option_key,
            "explanation": {"text": "演示解析：结合边缘细节、来源记录和常识一致性进行核验。"},
            "source": {
                "sourceType": "dev_seed",
                "sourceRecord": "本地 Lesson6 教师端演示数据，由 seed 脚本生成。",
                "verificationNote": "仅用于开发联调，禁止作为真实课堂数据使用。",
            },
        },
    }


def ensure_dev_session(connection: Any, class_id: str, now: str) -> str:
    """写入承载课时 5 统计摘要的本地演示 session。"""
    session_id = f"{DEV_PREFIX}_{class_id}_stats_session"
    class_name = class_name_from_id(class_id)
    connection.execute(
        """
        INSERT INTO module4_lesson5_sessions (
          session_id, class_id, class_name, title, run_type, phase, settings_json,
          created_by_user_id, created_at, updated_at, pool_locked_at,
          trial_opened_at, trial_locked_at, analytics_opened_at, revision_opened_at, closed_at
        )
        VALUES (?, ?, ?, ?, 'test', 'analytics_open', ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
        ON CONFLICT(session_id) DO UPDATE SET
          class_name = excluded.class_name,
          title = excluded.title,
          phase = 'analytics_open',
          settings_json = excluded.settings_json,
          updated_at = excluded.updated_at,
          analytics_opened_at = excluded.analytics_opened_at
        """,
        (
            session_id,
            class_id,
            class_name,
            "Lesson6 教师端本地演示统计会话",
            json.dumps({"questionCount": 4, "source": "lesson6_dev_demo"}, ensure_ascii=False, sort_keys=True),
            DEFAULT_TEACHER_USER_ID,
            now,
            now,
            now,
            now,
            now,
            now,
        ),
    )
    return session_id


def seed_question(connection: Any, class_id: str, spec: DemoCardSpec, session_id: str, now: str) -> None:
    """写入单张 V3 题卡、发布审核记录、课时 5 摘要统计与公共挑战 topStats 缓存。"""
    item_id = item_id_for(class_id, spec)
    version_id = version_id_for(class_id, spec)
    review_id = review_id_for(class_id, spec)
    card = make_card(class_id, spec)
    hash_value = content_hash(card)
    checked_at = now if spec.check_status == "publishable" else None
    checked_by = DEFAULT_TEACHER_USER_ID if spec.check_status == "publishable" else None
    teacher_note = "本地演示：已确认可进入公共题库。" if spec.check_status == "publishable" else ""
    connection.execute(
        """
        INSERT INTO module4_question_items (
          item_id, class_id, author_seat_code, author_name, card_kind,
          current_v2_version_id, current_v3_version_id, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, NULL, ?, 'ready_for_lesson6', ?, ?)
        ON CONFLICT(item_id) DO UPDATE SET
          class_id = excluded.class_id,
          author_seat_code = excluded.author_seat_code,
          author_name = excluded.author_name,
          card_kind = excluded.card_kind,
          current_v3_version_id = excluded.current_v3_version_id,
          status = 'ready_for_lesson6',
          updated_at = excluded.updated_at
        """,
        (item_id, class_id, spec.seat_code, spec.student_name, spec.kind, version_id, now, now),
    )
    connection.execute(
        """
        INSERT INTO module4_question_item_versions (
          item_version_id, item_id, class_id, version_label, source_lesson,
          source_session_id, base_version_id, source_package_version, source_lesson4_card_id,
          source_package_hash, card_json, content_hash, correct_option_key, item_short_name,
          status, created_at, updated_at
        )
        VALUES (?, ?, ?, 'v3', 'dev_seed', ?, NULL, 'lesson6-dev-demo-v1', NULL, ?, ?, ?, ?, ?, 'ready_for_lesson6', ?, ?)
        ON CONFLICT(item_version_id) DO UPDATE SET
          card_json = excluded.card_json,
          content_hash = excluded.content_hash,
          correct_option_key = excluded.correct_option_key,
          item_short_name = excluded.item_short_name,
          status = 'ready_for_lesson6',
          updated_at = excluded.updated_at
        """,
        (
            version_id,
            item_id,
            class_id,
            session_id,
            f"{DEV_PREFIX}-{hash_value}",
            json.dumps(card, ensure_ascii=False, sort_keys=True),
            hash_value,
            spec.correct_option_key,
            spec.short_name,
            now,
            now,
        ),
    )
    connection.execute(
        """
        INSERT INTO module4_v3_publication_reviews (
          review_id, item_id, item_version_id, class_id, card_kind,
          check_status, is_active_public, checked_by_user_id, checked_at,
          teacher_note, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(item_version_id) DO UPDATE SET
          class_id = excluded.class_id,
          card_kind = excluded.card_kind,
          check_status = excluded.check_status,
          is_active_public = excluded.is_active_public,
          checked_by_user_id = excluded.checked_by_user_id,
          checked_at = excluded.checked_at,
          teacher_note = excluded.teacher_note,
          updated_at = excluded.updated_at
        """,
        (
            review_id,
            item_id,
            version_id,
            class_id,
            spec.kind,
            spec.check_status,
            1 if spec.is_active_public else 0,
            checked_by,
            checked_at,
            teacher_note,
            now,
            now,
        ),
    )
    connection.execute(
        """
        INSERT INTO module4_lesson5_item_stats (
          stat_id, session_id, item_id, item_version_id,
          valid_answer_count, correct_count, correct_rate,
          avg_clarity, avg_thinking_value, avg_explanation_helpfulness,
          issue_flag_count, issue_flag_rate, issue_flags_json, sample_comments_json,
          stats_status, computed_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'stable', ?)
        ON CONFLICT(session_id, item_version_id) DO UPDATE SET
          item_id = excluded.item_id,
          valid_answer_count = excluded.valid_answer_count,
          correct_count = excluded.correct_count,
          correct_rate = excluded.correct_rate,
          avg_clarity = excluded.avg_clarity,
          avg_thinking_value = excluded.avg_thinking_value,
          avg_explanation_helpfulness = excluded.avg_explanation_helpfulness,
          issue_flag_count = excluded.issue_flag_count,
          issue_flag_rate = excluded.issue_flag_rate,
          issue_flags_json = excluded.issue_flags_json,
          sample_comments_json = excluded.sample_comments_json,
          stats_status = 'stable',
          computed_at = excluded.computed_at
        """,
        (
            f"{DEV_PREFIX}_{class_id}_{spec.seat_code}_{spec.kind}_l5stat",
            session_id,
            item_id,
            version_id,
            spec.valid_answer_count,
            round(spec.valid_answer_count * spec.lesson5_correct_rate),
            spec.lesson5_correct_rate,
            spec.avg_clarity,
            spec.avg_thinking_value,
            spec.avg_explanation_helpfulness,
            round(spec.valid_answer_count * spec.issue_flag_rate),
            spec.issue_flag_rate,
            json.dumps({"source_insufficient": round(spec.valid_answer_count * spec.issue_flag_rate)}, ensure_ascii=False),
            json.dumps(["演示评论：证据说明比较清楚，可继续补充来源核验。"], ensure_ascii=False),
            now,
        ),
    )
    if spec.is_active_public:
        total_correct_rate = spec.total_correct / spec.total_answers if spec.total_answers else 0
        lesson6_rate = spec.lesson6_correct / spec.lesson6_answers if spec.lesson6_answers else 0
        showcase_rate = spec.showcase_correct / spec.showcase_answers if spec.showcase_answers else 0
        connection.execute(
            """
            INSERT INTO module4_public_question_stats (
              item_version_id, item_id, total_answer_count, total_correct_count, total_correct_rate,
              lesson6_class_answer_count, lesson6_class_correct_count, lesson6_class_correct_rate,
              public_showcase_answer_count, public_showcase_correct_count, public_showcase_correct_rate,
              last_answered_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(item_version_id) DO UPDATE SET
              item_id = excluded.item_id,
              total_answer_count = excluded.total_answer_count,
              total_correct_count = excluded.total_correct_count,
              total_correct_rate = excluded.total_correct_rate,
              lesson6_class_answer_count = excluded.lesson6_class_answer_count,
              lesson6_class_correct_count = excluded.lesson6_class_correct_count,
              lesson6_class_correct_rate = excluded.lesson6_class_correct_rate,
              public_showcase_answer_count = excluded.public_showcase_answer_count,
              public_showcase_correct_count = excluded.public_showcase_correct_count,
              public_showcase_correct_rate = excluded.public_showcase_correct_rate,
              last_answered_at = excluded.last_answered_at,
              updated_at = excluded.updated_at
            """,
            (
                version_id,
                item_id,
                spec.total_answers,
                spec.total_correct,
                total_correct_rate,
                spec.lesson6_answers,
                spec.lesson6_correct,
                lesson6_rate,
                spec.showcase_answers,
                spec.showcase_correct,
                showcase_rate,
                now,
                now,
            ),
        )


def seed_challenge_runtime(connection: Any, class_id: str, now: str) -> None:
    """写入少量匿名挑战 run/answer 聚合来源，让 overview 的 challengeStats 非空。"""
    public_specs = [spec for spec in DEMO_CARDS if spec.is_active_public]
    contexts = ("lesson6_class", "public_showcase")
    answer_index = 1
    for context_index, context in enumerate(contexts, start=1):
        run_id = f"{DEV_PREFIX}_{class_id}_{context}_run"
        connection.execute(
            """
            INSERT INTO module4_public_challenge_runs (
              run_id, context, anon_session_hash, question_count, started_at,
              completed_at, user_agent_hash, ip_hash
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(run_id) DO UPDATE SET
              context = excluded.context,
              question_count = excluded.question_count,
              completed_at = excluded.completed_at
            """,
            (
                run_id,
                context,
                f"{DEV_PREFIX}_{class_id}_{context}_anon_hash",
                len(public_specs),
                now,
                now,
                f"{DEV_PREFIX}_{class_id}_ua_hash",
                f"{DEV_PREFIX}_{class_id}_ip_hash",
            ),
        )
        for order_index, spec in enumerate(public_specs, start=1):
            item_id = item_id_for(class_id, spec)
            version_id = version_id_for(class_id, spec)
            run_item_id = f"{run_id}_item_{order_index}"
            selected_option = spec.correct_option_key
            if context == "public_showcase" and spec.kind == "news":
                selected_option = "A" if spec.correct_option_key != "A" else "B"
            is_correct = int(selected_option == spec.correct_option_key)
            connection.execute(
                """
                INSERT INTO module4_public_challenge_run_items (
                  run_item_id, run_id, item_id, item_version_id, card_kind,
                  order_index, status, assigned_at, answered_at
                )
                VALUES (?, ?, ?, ?, ?, ?, 'answered', ?, ?)
                ON CONFLICT(run_item_id) DO UPDATE SET
                  status = 'answered',
                  answered_at = excluded.answered_at
                """,
                (run_item_id, run_id, item_id, version_id, spec.kind, order_index, now, now),
            )
            connection.execute(
                """
                INSERT INTO module4_public_challenge_answers (
                  answer_id, run_id, run_item_id, item_id, item_version_id,
                  context, selected_option_key, correct_option_key, is_correct,
                  duration_ms, answered_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(run_item_id) DO UPDATE SET
                  selected_option_key = excluded.selected_option_key,
                  correct_option_key = excluded.correct_option_key,
                  is_correct = excluded.is_correct,
                  duration_ms = excluded.duration_ms,
                  answered_at = excluded.answered_at
                """,
                (
                    f"{DEV_PREFIX}_{class_id}_answer_{answer_index}",
                    run_id,
                    run_item_id,
                    item_id,
                    version_id,
                    context,
                    selected_option,
                    spec.correct_option_key,
                    is_correct,
                    1800 + answer_index * 120,
                    now,
                ),
            )
            answer_index += 1


def reset_demo_data(connection: Any, class_id: str) -> None:
    """按本脚本稳定前缀删除演示数据，不触碰其它本地数据。"""
    like_prefix = f"{DEV_PREFIX}_{class_id}_%"
    connection.execute("DELETE FROM module4_public_challenge_answers WHERE answer_id LIKE ?", (like_prefix,))
    connection.execute("DELETE FROM module4_public_challenge_run_items WHERE run_item_id LIKE ?", (like_prefix,))
    connection.execute("DELETE FROM module4_public_challenge_runs WHERE run_id LIKE ?", (like_prefix,))
    connection.execute("DELETE FROM module4_public_question_stats WHERE item_version_id LIKE ?", (like_prefix,))
    connection.execute("DELETE FROM module4_lesson5_item_stats WHERE stat_id LIKE ?", (like_prefix,))
    connection.execute("DELETE FROM module4_v3_publication_reviews WHERE review_id LIKE ?", (like_prefix,))
    connection.execute("DELETE FROM module4_question_item_versions WHERE item_version_id LIKE ?", (like_prefix,))
    connection.execute("DELETE FROM module4_question_items WHERE item_id LIKE ?", (like_prefix,))
    connection.execute("DELETE FROM module4_lesson5_sessions WHERE session_id = ?", (f"{DEV_PREFIX}_{class_id}_stats_session",))


def seed_lesson6_dev_demo(database_path: str | None = None, class_id: str = DEFAULT_CLASS_ID, *, reset: bool = False) -> dict[str, int]:
    """执行 Lesson6 本地演示数据 seed，返回写入统计。"""
    initialize_database(database_path)
    seed_module4_accounts(database_path)
    now = utc_now()
    with database_transaction(database_path) as connection:
        if reset:
            reset_demo_data(connection, class_id)
        session_id = ensure_dev_session(connection, class_id, now)
        for spec in DEMO_CARDS:
            seed_question(connection, class_id, spec, session_id, now)
        seed_challenge_runtime(connection, class_id, now)
    return {
        "classId": 1,
        "pendingReviews": sum(1 for spec in DEMO_CARDS if spec.check_status == "pending_teacher_check"),
        "activePublic": sum(1 for spec in DEMO_CARDS if spec.is_active_public),
        "challengeRuns": 2,
        "challengeAnswers": sum(1 for spec in DEMO_CARDS if spec.is_active_public) * 2,
    }


def clear_lesson6_dev_demo(database_path: str | None = None, class_id: str = DEFAULT_CLASS_ID) -> None:
    """只清理本脚本写入的 Lesson6 本地演示数据。"""
    initialize_database(database_path)
    with database_transaction(database_path) as connection:
        reset_demo_data(connection, class_id)


def main() -> None:
    """命令行入口。"""
    parser = argparse.ArgumentParser(description="写入模块 4 课时 6 本地教师端演示数据")
    parser.add_argument("--database-path", default=None, help="SQLite 路径；留空时使用 CLASSQUEST_DATABASE_PATH 或默认运行时路径")
    parser.add_argument("--class-id", default=DEFAULT_CLASS_ID, help="目标班级，默认 g7c02")
    parser.add_argument("--reset", action="store_true", help="先删除本脚本 dev_l6 前缀的旧演示数据")
    parser.add_argument("--clear", action="store_true", help="只删除本脚本 dev_l6 前缀的演示数据，不重新写入")
    args = parser.parse_args()

    load_backend_env()
    if args.clear:
        clear_lesson6_dev_demo(args.database_path, args.class_id)
        print(f"已清理模块4课时6本地演示数据：classId={args.class_id}")
        return
    stats = seed_lesson6_dev_demo(args.database_path, args.class_id, reset=args.reset)
    print(
        "已完成模块4课时6本地演示 seed："
        f"classId={args.class_id} pendingReviews={stats['pendingReviews']} "
        f"activePublic={stats['activePublic']} challengeRuns={stats['challengeRuns']} "
        f"challengeAnswers={stats['challengeAnswers']}"
    )


if __name__ == "__main__":
    main()
