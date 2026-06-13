"""
文件说明：模块 4 课时 6 发布审核、公共挑战与统计 SQLite 仓储层。
职责：封装 module4_v3_publication_reviews、module4_public_question_bank、公共挑战 runs/items/answers 与 stats 缓存的最小读写 SQL，供 Lesson6 服务复用。
更新触发：发布审核表结构、公共题库 view 字段、公共挑战 runtime、统计缓存、幂等键或发布状态流变化时，需要同步更新本文件。
"""

from __future__ import annotations

import sqlite3
from collections.abc import Sequence


def get_publication_review_by_version(
    connection: sqlite3.Connection,
    item_version_id: str,
) -> sqlite3.Row | None:
    """按 V3 version_id 查询发布审核记录。"""
    return connection.execute(
        """
        SELECT review_id, item_id, item_version_id, class_id, card_kind,
               check_status, is_active_public, checked_by_user_id, checked_at,
               teacher_note, created_at, updated_at
        FROM module4_v3_publication_reviews
        WHERE item_version_id = ?
        """,
        (item_version_id,),
    ).fetchone()


def upsert_pending_publication_review(
    connection: sqlite3.Connection,
    *,
    review_id: str,
    item_id: str,
    item_version_id: str,
    class_id: str,
    card_kind: str,
    now: str,
) -> sqlite3.Row:
    """幂等创建 V3 待发布审核记录，已有记录不降级或覆盖教师结论。"""
    connection.execute(
        """
        INSERT INTO module4_v3_publication_reviews (
          review_id, item_id, item_version_id, class_id, card_kind,
          check_status, is_active_public, checked_by_user_id, checked_at,
          teacher_note, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, 'pending_teacher_check', 0, NULL, NULL, '', ?, ?)
        ON CONFLICT(item_version_id) DO NOTHING
        """,
        (review_id, item_id, item_version_id, class_id, card_kind, now, now),
    )
    row = get_publication_review_by_version(connection, item_version_id)
    if row is None:
        raise RuntimeError("V3 发布审核记录写入后无法读取。")
    return row


def count_public_question_bank(connection: sqlite3.Connection) -> int:
    """统计当前公共题库 view 中可抽取的 V3 题卡数量。"""
    row = connection.execute("SELECT COUNT(*) AS count FROM module4_public_question_bank").fetchone()
    return int(row["count"]) if row else 0


def count_public_question_bank_by_version(
    connection: sqlite3.Connection,
    item_version_id: str,
) -> int:
    """统计指定 V3 version_id 是否已进入公共题库 view。"""
    row = connection.execute(
        """
        SELECT COUNT(*) AS count
        FROM module4_public_question_bank
        WHERE item_version_id = ?
        """,
        (item_version_id,),
    ).fetchone()
    return int(row["count"]) if row else 0


def _class_visibility_clause(
    *,
    class_id: str | None = None,
    visible_class_ids: Sequence[str] | None = None,
    table_alias: str = "r",
) -> tuple[str, list[str]]:
    """生成班级可见性 SQL 条件；空授权列表应返回无结果。"""
    clauses: list[str] = []
    params: list[str] = []
    if class_id:
        clauses.append(f"{table_alias}.class_id = ?")
        params.append(class_id)
    if visible_class_ids is not None:
        if len(visible_class_ids) == 0:
            clauses.append("1 = 0")
        else:
            placeholders = ", ".join("?" for _ in visible_class_ids)
            clauses.append(f"{table_alias}.class_id IN ({placeholders})")
            params.extend(visible_class_ids)
    where_sql = (" AND " + " AND ".join(clauses)) if clauses else ""
    return where_sql, params


def list_publication_reviews(
    connection: sqlite3.Connection,
    *,
    status: str | None = None,
    class_id: str | None = None,
    visible_class_ids: Sequence[str] | None = None,
) -> list[sqlite3.Row]:
    """查询教师发布审核列表，按可见班级、状态和提交时间倒序过滤。"""
    visibility_sql, params = _class_visibility_clause(
        class_id=class_id,
        visible_class_ids=visible_class_ids,
        table_alias="r",
    )
    status_sql = ""
    if status:
        status_sql = " AND r.check_status = ?"
        params.append(status)
    rows = connection.execute(
        f"""
        SELECT
          r.review_id AS review_id,
          r.item_id AS item_id,
          r.item_version_id AS item_version_id,
          r.class_id AS class_id,
          c.class_name AS class_name,
          r.card_kind AS card_kind,
          v.item_short_name AS item_short_name,
          i.author_seat_code AS author_seat_code,
          i.author_name AS author_name,
          v.created_at AS submitted_at,
          r.check_status AS check_status,
          r.is_active_public AS is_active_public,
          s.valid_answer_count AS valid_answer_count,
          s.correct_rate AS correct_rate,
          s.avg_clarity AS avg_clarity,
          s.avg_thinking_value AS avg_thinking_value,
          s.avg_explanation_helpfulness AS avg_explanation_helpfulness,
          s.issue_flag_rate AS issue_flag_rate,
          s.stats_status AS stats_status
        FROM module4_v3_publication_reviews r
        JOIN module4_question_item_versions v
          ON v.item_version_id = r.item_version_id
        JOIN module4_question_items i
          ON i.item_id = r.item_id
        JOIN cq_classes c
          ON c.class_id = r.class_id
        LEFT JOIN module4_lesson5_item_stats s
          ON s.item_id = r.item_id
         AND s.computed_at = (
           SELECT MAX(s2.computed_at)
           FROM module4_lesson5_item_stats s2
           WHERE s2.item_id = r.item_id
         )
        WHERE 1 = 1
          {visibility_sql}
          {status_sql}
        ORDER BY v.created_at DESC, r.created_at DESC
        """,
        params,
    ).fetchall()
    return list(rows)


def get_publication_review_detail(
    connection: sqlite3.Connection,
    review_id: str,
) -> sqlite3.Row | None:
    """读取单条发布审核详情，联出题卡 JSON、课时 5 统计与修订计划。"""
    return connection.execute(
        """
        SELECT
          r.review_id AS review_id,
          r.item_id AS item_id,
          r.item_version_id AS item_version_id,
          r.class_id AS class_id,
          c.class_name AS class_name,
          r.card_kind AS card_kind,
          v.item_short_name AS item_short_name,
          i.author_seat_code AS author_seat_code,
          i.author_name AS author_name,
          v.created_at AS submitted_at,
          v.card_json AS card_json,
          r.check_status AS check_status,
          r.is_active_public AS is_active_public,
          r.checked_by_user_id AS checked_by_user_id,
          r.checked_at AS checked_at,
          r.teacher_note AS teacher_note,
          r.created_at AS created_at,
          r.updated_at AS updated_at,
          s.valid_answer_count AS valid_answer_count,
          s.correct_rate AS correct_rate,
          s.avg_clarity AS avg_clarity,
          s.avg_thinking_value AS avg_thinking_value,
          s.avg_explanation_helpfulness AS avg_explanation_helpfulness,
          s.issue_flag_rate AS issue_flag_rate,
          s.stats_status AS stats_status,
          p.revision_action AS revision_action,
          p.diagnosis_json AS diagnosis_json,
          p.revision_reason AS revision_reason,
          p.expected_effect AS expected_effect,
          p.submitted_at AS revision_submitted_at,
          p.updated_at AS revision_updated_at
        FROM module4_v3_publication_reviews r
        JOIN module4_question_item_versions v
          ON v.item_version_id = r.item_version_id
        JOIN module4_question_items i
          ON i.item_id = r.item_id
        JOIN cq_classes c
          ON c.class_id = r.class_id
        LEFT JOIN module4_lesson5_item_stats s
          ON s.item_id = r.item_id
         AND s.computed_at = (
           SELECT MAX(s2.computed_at)
           FROM module4_lesson5_item_stats s2
           WHERE s2.item_id = r.item_id
         )
        LEFT JOIN module4_lesson5_revision_plans p
          ON p.v3_item_version_id = r.item_version_id
        WHERE r.review_id = ?
        """,
        (review_id,),
    ).fetchone()


def publish_review(
    connection: sqlite3.Connection,
    *,
    review_id: str,
    checked_by: str,
    teacher_note: str,
    now: str,
) -> sqlite3.Row | None:
    """确认发布指定 V3 审核记录，并保证同 item 同时只有一条 active public。"""
    review = get_publication_review_detail(connection, review_id)
    if review is None:
        return None
    connection.execute(
        """
        UPDATE module4_v3_publication_reviews
        SET is_active_public = 0,
            updated_at = ?
        WHERE item_id = ?
          AND is_active_public = 1
          AND review_id <> ?
        """,
        (now, review["item_id"], review_id),
    )
    connection.execute(
        """
        UPDATE module4_v3_publication_reviews
        SET check_status = 'publishable',
            is_active_public = 1,
            checked_by_user_id = ?,
            checked_at = ?,
            teacher_note = ?,
            updated_at = ?
        WHERE review_id = ?
        """,
        (checked_by, now, teacher_note, now, review_id),
    )
    return get_publication_review_detail(connection, review_id)


def count_reviews_summary(
    connection: sqlite3.Connection,
    *,
    visible_class_ids: Sequence[str] | None = None,
) -> sqlite3.Row:
    """统计可见范围内 pending、publishable 与 active public 数量。"""
    visibility_sql, params = _class_visibility_clause(visible_class_ids=visible_class_ids, table_alias="r")
    return connection.execute(
        f"""
        SELECT
          SUM(CASE WHEN r.check_status = 'pending_teacher_check' THEN 1 ELSE 0 END) AS pending_count,
          SUM(CASE WHEN r.check_status = 'publishable' THEN 1 ELSE 0 END) AS publishable_count,
          SUM(CASE WHEN r.is_active_public = 1 THEN 1 ELSE 0 END) AS active_public_count
        FROM module4_v3_publication_reviews r
        WHERE 1 = 1
          {visibility_sql}
        """,
        params,
    ).fetchone()


def get_reviews_by_versions(
    connection: sqlite3.Connection,
    keys: Sequence[tuple[str, str]],
) -> dict[tuple[str, str], sqlite3.Row]:
    """按请求中的 item/version 键查询审核记录；不支持按班级或座位枚举。"""
    if not keys:
        return {}
    clauses = " OR ".join("(item_id = ? AND item_version_id = ?)" for _ in keys)
    params: list[str] = []
    for item_id, item_version_id in keys:
        params.extend([item_id, item_version_id])
    rows = connection.execute(
        f"""
        SELECT item_id, item_version_id, check_status, checked_at
        FROM module4_v3_publication_reviews
        WHERE {clauses}
        """,
        params,
    ).fetchall()
    return {(row["item_id"], row["item_version_id"]): row for row in rows}


def count_public_bank_by_kind(
    connection: sqlite3.Connection,
    *,
    visible_class_ids: Sequence[str] | None = None,
) -> sqlite3.Row:
    """按 card_kind 统计当前可见公共题库数量。"""
    visibility_sql, params = _class_visibility_clause(visible_class_ids=visible_class_ids, table_alias="b")
    return connection.execute(
        f"""
        SELECT
          COUNT(*) AS total_count,
          SUM(CASE WHEN b.card_kind = 'news' THEN 1 ELSE 0 END) AS news_count,
          SUM(CASE WHEN b.card_kind = 'image' THEN 1 ELSE 0 END) AS image_count
        FROM module4_public_question_bank b
        WHERE 1 = 1
          {visibility_sql}
        """,
        params,
    ).fetchone()


def count_pending_reviews_by_kind(
    connection: sqlite3.Connection,
    *,
    visible_class_ids: Sequence[str] | None = None,
) -> sqlite3.Row:
    """按 card_kind 统计可见范围内待教师确认数量。"""
    visibility_sql, params = _class_visibility_clause(visible_class_ids=visible_class_ids, table_alias="r")
    return connection.execute(
        f"""
        SELECT
          COUNT(*) AS total_count,
          SUM(CASE WHEN r.card_kind = 'news' THEN 1 ELSE 0 END) AS news_count,
          SUM(CASE WHEN r.card_kind = 'image' THEN 1 ELSE 0 END) AS image_count
        FROM module4_v3_publication_reviews r
        WHERE r.check_status = 'pending_teacher_check'
          {visibility_sql}
        """,
        params,
    ).fetchone()


def count_public_challenge_stats(connection: sqlite3.Connection) -> sqlite3.Row:
    """读取公共挑战整体运行统计；C1a 阶段通常为 0。"""
    return connection.execute(
        """
        SELECT
          SUM(CASE WHEN context = 'lesson6_class' THEN 1 ELSE 0 END) AS lesson6_class_runs,
          SUM(CASE WHEN context = 'public_showcase' THEN 1 ELSE 0 END) AS public_showcase_runs,
          COUNT(*) AS total_runs,
          (
            SELECT COUNT(*)
            FROM module4_public_challenge_answers
          ) AS total_answers,
          (
            SELECT
              CASE WHEN COUNT(*) = 0 THEN 0
                   ELSE CAST(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(*)
              END
            FROM module4_public_challenge_answers
          ) AS overall_correct_rate
        FROM module4_public_challenge_runs
        """
    ).fetchone()


def list_public_bank_questions(connection: sqlite3.Connection) -> list[sqlite3.Row]:
    """读取可抽取的全局公共题库题卡，并联出当前累计曝光次数。"""
    rows = connection.execute(
        """
        SELECT
          b.review_id AS review_id,
          b.item_id AS item_id,
          b.item_version_id AS item_version_id,
          b.class_id AS class_id,
          b.card_kind AS card_kind,
          b.card_json AS card_json,
          b.correct_option_key AS correct_option_key,
          b.item_short_name AS item_short_name,
          COALESCE(s.total_answer_count, 0) AS total_answer_count
        FROM module4_public_question_bank b
        LEFT JOIN module4_public_question_stats s
          ON s.item_version_id = b.item_version_id
        ORDER BY b.item_version_id ASC
        """
    ).fetchall()
    return list(rows)


def insert_public_challenge_run(
    connection: sqlite3.Connection,
    *,
    run_id: str,
    context: str,
    anon_session_hash: str,
    question_count: int,
    started_at: str,
    user_agent_hash: str | None,
    ip_hash: str | None,
) -> None:
    """写入一条匿名公共挑战 run，只保存哈希化后的 runtime 标识。"""
    connection.execute(
        """
        INSERT INTO module4_public_challenge_runs (
          run_id, context, anon_session_hash, question_count, started_at,
          completed_at, user_agent_hash, ip_hash
        )
        VALUES (?, ?, ?, ?, ?, NULL, ?, ?)
        """,
        (run_id, context, anon_session_hash, question_count, started_at, user_agent_hash, ip_hash),
    )


def insert_public_challenge_run_item(
    connection: sqlite3.Connection,
    *,
    run_item_id: str,
    run_id: str,
    item_id: str,
    item_version_id: str,
    card_kind: str,
    order_index: int,
    assigned_at: str,
) -> None:
    """写入公共挑战 run_item 快照指针。"""
    connection.execute(
        """
        INSERT INTO module4_public_challenge_run_items (
          run_item_id, run_id, item_id, item_version_id, card_kind,
          order_index, status, assigned_at, answered_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'assigned', ?, NULL)
        """,
        (run_item_id, run_id, item_id, item_version_id, card_kind, order_index, assigned_at),
    )


def count_recent_public_challenge_runs(
    connection: sqlite3.Connection,
    *,
    anon_session_hash: str,
    ip_hash: str | None,
    started_after: str,
) -> int:
    """统计同匿名会话与 IP 在窗口期内创建的 run 数，用于轻量限流。"""
    row = connection.execute(
        """
        SELECT COUNT(*) AS count
        FROM module4_public_challenge_runs
        WHERE anon_session_hash = ?
          AND COALESCE(ip_hash, '') = COALESCE(?, '')
          AND started_at >= ?
        """,
        (anon_session_hash, ip_hash, started_after),
    ).fetchone()
    return int(row["count"] or 0) if row else 0


def get_public_challenge_run(connection: sqlite3.Connection, run_id: str) -> sqlite3.Row | None:
    """按 run_id 读取公共挑战 run。"""
    return connection.execute(
        """
        SELECT run_id, context, anon_session_hash, question_count, started_at,
               completed_at, user_agent_hash, ip_hash
        FROM module4_public_challenge_runs
        WHERE run_id = ?
        """,
        (run_id,),
    ).fetchone()


def count_answered_run_items(connection: sqlite3.Connection, run_id: str) -> int:
    """统计指定 run 中已作答题数。"""
    row = connection.execute(
        """
        SELECT COUNT(*) AS count
        FROM module4_public_challenge_run_items
        WHERE run_id = ? AND status = 'answered'
        """,
        (run_id,),
    ).fetchone()
    return int(row["count"] or 0) if row else 0


def get_next_unanswered_run_item(connection: sqlite3.Connection, run_id: str) -> sqlite3.Row | None:
    """读取指定 run 的下一道未答题，并联出题卡 JSON。"""
    return connection.execute(
        """
        SELECT
          ri.run_item_id AS run_item_id,
          ri.run_id AS run_id,
          ri.item_id AS item_id,
          ri.item_version_id AS item_version_id,
          ri.card_kind AS card_kind,
          ri.order_index AS order_index,
          ri.status AS status,
          v.card_json AS card_json,
          v.correct_option_key AS correct_option_key
        FROM module4_public_challenge_run_items ri
        JOIN module4_question_item_versions v
          ON v.item_version_id = ri.item_version_id
        WHERE ri.run_id = ?
          AND ri.status = 'assigned'
        ORDER BY ri.order_index ASC
        LIMIT 1
        """,
        (run_id,),
    ).fetchone()


def get_public_challenge_run_item_detail(
    connection: sqlite3.Connection,
    *,
    run_id: str,
    run_item_id: str,
) -> sqlite3.Row | None:
    """读取 run_item 详情，并校验其属于指定 run。"""
    return connection.execute(
        """
        SELECT
          ri.run_item_id AS run_item_id,
          ri.run_id AS run_id,
          ri.item_id AS item_id,
          ri.item_version_id AS item_version_id,
          ri.card_kind AS card_kind,
          ri.order_index AS order_index,
          ri.status AS status,
          r.context AS context,
          r.question_count AS question_count,
          v.card_json AS card_json,
          v.correct_option_key AS correct_option_key
        FROM module4_public_challenge_run_items ri
        JOIN module4_public_challenge_runs r
          ON r.run_id = ri.run_id
        JOIN module4_question_item_versions v
          ON v.item_version_id = ri.item_version_id
        WHERE ri.run_id = ?
          AND ri.run_item_id = ?
        """,
        (run_id, run_item_id),
    ).fetchone()


def get_public_challenge_answer_by_run_item(
    connection: sqlite3.Connection,
    run_item_id: str,
) -> sqlite3.Row | None:
    """按 run_item_id 读取已有公共挑战 answer，用于幂等返回。"""
    return connection.execute(
        """
        SELECT
          answer_id, run_id, run_item_id, item_id, item_version_id, context,
          selected_option_key, correct_option_key, is_correct, duration_ms, answered_at
        FROM module4_public_challenge_answers
        WHERE run_item_id = ?
        """,
        (run_item_id,),
    ).fetchone()


def insert_public_challenge_answer(
    connection: sqlite3.Connection,
    *,
    answer_id: str,
    run_id: str,
    run_item_id: str,
    item_id: str,
    item_version_id: str,
    context: str,
    selected_option_key: str,
    correct_option_key: str,
    is_correct: bool,
    duration_ms: int | None,
    answered_at: str,
) -> None:
    """写入公共挑战 answer；run_item 唯一约束保证重复提交不重复计数。"""
    connection.execute(
        """
        INSERT INTO module4_public_challenge_answers (
          answer_id, run_id, run_item_id, item_id, item_version_id, context,
          selected_option_key, correct_option_key, is_correct, duration_ms, answered_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            answer_id,
            run_id,
            run_item_id,
            item_id,
            item_version_id,
            context,
            selected_option_key,
            correct_option_key,
            1 if is_correct else 0,
            duration_ms,
            answered_at,
        ),
    )


def mark_public_challenge_run_item_answered(
    connection: sqlite3.Connection,
    *,
    run_item_id: str,
    answered_at: str,
) -> None:
    """把公共挑战 run_item 标记为已答。"""
    connection.execute(
        """
        UPDATE module4_public_challenge_run_items
        SET status = 'answered',
            answered_at = ?
        WHERE run_item_id = ?
        """,
        (answered_at, run_item_id),
    )


def mark_public_challenge_run_completed(
    connection: sqlite3.Connection,
    *,
    run_id: str,
    completed_at: str,
) -> None:
    """在全部题答完后写入 run completed_at，已完成时保持幂等。"""
    connection.execute(
        """
        UPDATE module4_public_challenge_runs
        SET completed_at = COALESCE(completed_at, ?)
        WHERE run_id = ?
        """,
        (completed_at, run_id),
    )


def get_public_challenge_next_order_index(
    connection: sqlite3.Connection,
    run_id: str,
) -> int | None:
    """读取下一道未答题的 1-based orderIndex。"""
    row = connection.execute(
        """
        SELECT order_index
        FROM module4_public_challenge_run_items
        WHERE run_id = ? AND status = 'assigned'
        ORDER BY order_index ASC
        LIMIT 1
        """,
        (run_id,),
    ).fetchone()
    return int(row["order_index"]) if row else None


def get_public_challenge_summary(connection: sqlite3.Connection, run_id: str) -> sqlite3.Row | None:
    """读取公共挑战 run 摘要。"""
    return connection.execute(
        """
        SELECT
          r.run_id AS run_id,
          r.context AS context,
          r.question_count AS question_count,
          r.completed_at AS completed_at,
          COUNT(ri.run_item_id) AS total_items,
          SUM(CASE WHEN ri.status = 'answered' THEN 1 ELSE 0 END) AS answered_count
        FROM module4_public_challenge_runs r
        LEFT JOIN module4_public_challenge_run_items ri
          ON ri.run_id = r.run_id
        WHERE r.run_id = ?
        GROUP BY r.run_id
        """,
        (run_id,),
    ).fetchone()


def upsert_public_question_stats_increment(
    connection: sqlite3.Connection,
    *,
    item_id: str,
    item_version_id: str,
    context: str,
    is_correct: bool,
    answered_at: str,
) -> None:
    """按 context 增量更新公共题卡统计缓存。"""
    correct_delta = 1 if is_correct else 0
    lesson6_answer_delta = 1 if context == "lesson6_class" else 0
    lesson6_correct_delta = correct_delta if context == "lesson6_class" else 0
    showcase_answer_delta = 1 if context == "public_showcase" else 0
    showcase_correct_delta = correct_delta if context == "public_showcase" else 0
    connection.execute(
        """
        INSERT INTO module4_public_question_stats (
          item_version_id, item_id,
          total_answer_count, total_correct_count, total_correct_rate,
          lesson6_class_answer_count, lesson6_class_correct_count, lesson6_class_correct_rate,
          public_showcase_answer_count, public_showcase_correct_count, public_showcase_correct_rate,
          last_answered_at, updated_at
        )
        VALUES (
          ?, ?,
          1, ?, ?,
          ?, ?, CASE WHEN ? = 0 THEN 0 ELSE CAST(? AS REAL) / ? END,
          ?, ?, CASE WHEN ? = 0 THEN 0 ELSE CAST(? AS REAL) / ? END,
          ?, ?
        )
        ON CONFLICT(item_version_id) DO UPDATE SET
          total_answer_count = total_answer_count + 1,
          total_correct_count = total_correct_count + ?,
          total_correct_rate = CAST(total_correct_count + ? AS REAL) / (total_answer_count + 1),
          lesson6_class_answer_count = lesson6_class_answer_count + ?,
          lesson6_class_correct_count = lesson6_class_correct_count + ?,
          lesson6_class_correct_rate = CASE
            WHEN lesson6_class_answer_count + ? = 0 THEN 0
            ELSE CAST(lesson6_class_correct_count + ? AS REAL) / (lesson6_class_answer_count + ?)
          END,
          public_showcase_answer_count = public_showcase_answer_count + ?,
          public_showcase_correct_count = public_showcase_correct_count + ?,
          public_showcase_correct_rate = CASE
            WHEN public_showcase_answer_count + ? = 0 THEN 0
            ELSE CAST(public_showcase_correct_count + ? AS REAL) / (public_showcase_answer_count + ?)
          END,
          last_answered_at = ?,
          updated_at = ?
        """,
        (
            item_version_id,
            item_id,
            correct_delta,
            float(correct_delta),
            lesson6_answer_delta,
            lesson6_correct_delta,
            lesson6_answer_delta,
            lesson6_correct_delta,
            lesson6_answer_delta,
            showcase_answer_delta,
            showcase_correct_delta,
            showcase_answer_delta,
            showcase_correct_delta,
            showcase_answer_delta,
            answered_at,
            answered_at,
            correct_delta,
            correct_delta,
            lesson6_answer_delta,
            lesson6_correct_delta,
            lesson6_answer_delta,
            lesson6_correct_delta,
            lesson6_answer_delta,
            showcase_answer_delta,
            showcase_correct_delta,
            showcase_answer_delta,
            showcase_correct_delta,
            showcase_answer_delta,
            answered_at,
            answered_at,
        ),
    )


def list_public_question_top_stats(
    connection: sqlite3.Connection,
    *,
    order_by: str,
    limit: int = 5,
) -> list[sqlite3.Row]:
    """读取公共题卡 top 统计；order_by 由服务层白名单传入。"""
    if order_by not in {"most_answered", "lowest_correct_rate", "highest_correct_rate"}:
        raise ValueError(f"不支持的 topStats 排序：{order_by}")
    order_sql = {
        "most_answered": "s.total_answer_count DESC, s.total_correct_rate ASC, b.item_version_id ASC",
        "lowest_correct_rate": "s.total_correct_rate ASC, s.total_answer_count DESC, b.item_version_id ASC",
        "highest_correct_rate": "s.total_correct_rate DESC, s.total_answer_count DESC, b.item_version_id ASC",
    }[order_by]
    rows = connection.execute(
        f"""
        SELECT
          b.item_id AS item_id,
          b.item_version_id AS item_version_id,
          b.card_kind AS card_kind,
          b.item_short_name AS item_short_name,
          s.total_answer_count AS total_answer_count,
          s.total_correct_count AS total_correct_count,
          s.total_correct_rate AS total_correct_rate,
          s.lesson6_class_answer_count AS lesson6_class_answer_count,
          s.lesson6_class_correct_count AS lesson6_class_correct_count,
          s.lesson6_class_correct_rate AS lesson6_class_correct_rate,
          s.public_showcase_answer_count AS public_showcase_answer_count,
          s.public_showcase_correct_count AS public_showcase_correct_count,
          s.public_showcase_correct_rate AS public_showcase_correct_rate,
          s.last_answered_at AS last_answered_at
        FROM module4_public_question_stats s
        JOIN module4_public_question_bank b
          ON b.item_version_id = s.item_version_id
        WHERE s.total_answer_count > 0
        ORDER BY {order_sql}
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return list(rows)


def list_public_question_item_stats(
    connection: sqlite3.Connection,
    *,
    visible_class_ids: Sequence[str] | None = None,
) -> list[sqlite3.Row]:
    """读取可见公共题库全量逐题统计；无作答题卡按 0 兜底。"""
    visibility_sql, params = _class_visibility_clause(visible_class_ids=visible_class_ids, table_alias="b")
    rows = connection.execute(
        f"""
        SELECT
          b.item_id AS item_id,
          b.item_version_id AS item_version_id,
          b.card_kind AS card_kind,
          b.item_short_name AS item_short_name,
          'publishable' AS publish_status,
          COALESCE(s.total_answer_count, 0) AS total_answer_count,
          COALESCE(s.total_correct_count, 0) AS total_correct_count,
          COALESCE(s.total_correct_rate, 0) AS total_correct_rate,
          COALESCE(s.lesson6_class_answer_count, 0) AS lesson6_class_answer_count,
          COALESCE(s.lesson6_class_correct_count, 0) AS lesson6_class_correct_count,
          COALESCE(s.lesson6_class_correct_rate, 0) AS lesson6_class_correct_rate,
          COALESCE(s.public_showcase_answer_count, 0) AS public_showcase_answer_count,
          COALESCE(s.public_showcase_correct_count, 0) AS public_showcase_correct_count,
          COALESCE(s.public_showcase_correct_rate, 0) AS public_showcase_correct_rate,
          s.last_answered_at AS last_answered_at
        FROM module4_public_question_bank b
        LEFT JOIN module4_public_question_stats s
          ON s.item_version_id = b.item_version_id
        WHERE 1 = 1
          {visibility_sql}
        ORDER BY COALESCE(s.total_answer_count, 0) DESC, b.item_version_id ASC
        """,
        params,
    ).fetchall()
    return list(rows)
