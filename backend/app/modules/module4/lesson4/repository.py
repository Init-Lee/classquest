"""
文件说明：模块 4 课时 4 同伴互审 SQLite 仓储层。
职责：封装互审请求表的查询、写入与机会式过期更新，保持 service 层不直接拼 SQL。
更新触发：互审表结构、索引、查询模式或过期扫描 SQL 变化时，需要同步更新本文件。
"""

from __future__ import annotations

import json
import sqlite3
from typing import Any

AUTHOR_ACTIVE_OUTBOUND_STATUSES = ("pending", "claimed", "submitted")
TARGET_ACTIVE_INBOUND_STATUSES = ("pending", "claimed")
# 仅 pending 可被 claim；cancelled/expired/submitted 等状态不可领取。
CLAIMABLE_STATUSES = ("pending",)
AUTHOR_RECOVERY_STATUSES = ("pending", "claimed", "submitted", "pulled")
REVIEWER_RECOVERY_STATUSES = ("claimed", "submitted", "pulled")


def expire_stale_requests(connection: sqlite3.Connection, server_now: str) -> None:
    """机会式将已过期的 pending/claimed 请求标记为 expired。"""
    connection.execute(
        """
        UPDATE module4_lesson4_review_requests
        SET status = 'expired', expired_at = ?
        WHERE status = 'pending' AND pending_expires_at <= ?
        """,
        (server_now, server_now),
    )
    connection.execute(
        """
        UPDATE module4_lesson4_review_requests
        SET status = 'expired', expired_at = ?
        WHERE status = 'claimed'
          AND review_expires_at IS NOT NULL
          AND review_expires_at <= ?
        """,
        (server_now, server_now),
    )


def count_author_active_outbound(
    connection: sqlite3.Connection,
    class_id: str,
    author_seat_code: str,
) -> int:
    """统计作者尚未完结的出站请求数量。"""
    placeholders = ", ".join("?" for _ in AUTHOR_ACTIVE_OUTBOUND_STATUSES)
    row = connection.execute(
        f"""
        SELECT COUNT(*) AS total
        FROM module4_lesson4_review_requests
        WHERE class_id = ?
          AND author_seat_code = ?
          AND status IN ({placeholders})
        """,
        (class_id, author_seat_code, *AUTHOR_ACTIVE_OUTBOUND_STATUSES),
    ).fetchone()
    return int(row["total"]) if row else 0


def count_target_active_inbound(
    connection: sqlite3.Connection,
    class_id: str,
    target_reviewer_seat_code: str,
) -> int:
    """统计目标审查者当前 active 入站任务数量。"""
    placeholders = ", ".join("?" for _ in TARGET_ACTIVE_INBOUND_STATUSES)
    row = connection.execute(
        f"""
        SELECT COUNT(*) AS total
        FROM module4_lesson4_review_requests
        WHERE class_id = ?
          AND target_reviewer_seat_code = ?
          AND status IN ({placeholders})
        """,
        (class_id, target_reviewer_seat_code, *TARGET_ACTIVE_INBOUND_STATUSES),
    ).fetchone()
    return int(row["total"]) if row else 0


REVIEWER_INBOX_STATUSES = TARGET_ACTIVE_INBOUND_STATUSES


def list_reviewer_inbox_tasks(
    connection: sqlite3.Connection,
    class_id: str,
    target_reviewer_seat_code: str,
) -> list[sqlite3.Row]:
    """查询发给目标审查者的 active 入站任务摘要（不含 request_json）。"""
    placeholders = ", ".join("?" for _ in REVIEWER_INBOX_STATUSES)
    rows = connection.execute(
        f"""
        SELECT
          id,
          author_seat_code,
          status,
          pending_expires_at
        FROM module4_lesson4_review_requests
        WHERE class_id = ?
          AND target_reviewer_seat_code = ?
          AND status IN ({placeholders})
        ORDER BY created_at ASC
        """,
        (class_id, target_reviewer_seat_code, *REVIEWER_INBOX_STATUSES),
    ).fetchall()
    return list(rows)


def get_latest_author_recovery_request(
    connection: sqlite3.Connection,
    class_id: str,
    author_seat_code: str,
) -> sqlite3.Row | None:
    """按班级与作者学号查询最近可恢复的出站请求。"""
    placeholders = ", ".join("?" for _ in AUTHOR_RECOVERY_STATUSES)
    return connection.execute(
        f"""
        SELECT
          id,
          author_seat_code,
          target_reviewer_seat_code,
          invite_code,
          status,
          request_json,
          review_json,
          created_at,
          pending_expires_at,
          review_expires_at,
          submitted_at,
          pulled_at
        FROM module4_lesson4_review_requests
        WHERE class_id = ?
          AND author_seat_code = ?
          AND status IN ({placeholders})
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (class_id, author_seat_code, *AUTHOR_RECOVERY_STATUSES),
    ).fetchone()


def get_latest_reviewer_recovery_request(
    connection: sqlite3.Connection,
    class_id: str,
    reviewer_seat_code: str,
) -> sqlite3.Row | None:
    """按班级与已领取审查者学号查询最近可恢复的入站任务。"""
    placeholders = ", ".join("?" for _ in REVIEWER_RECOVERY_STATUSES)
    return connection.execute(
        f"""
        SELECT
          id,
          author_seat_code,
          target_reviewer_seat_code,
          claimed_reviewer_seat_code,
          status,
          request_json,
          review_json,
          created_at,
          pending_expires_at,
          review_expires_at,
          submitted_at,
          pulled_at
        FROM module4_lesson4_review_requests
        WHERE class_id = ?
          AND claimed_reviewer_seat_code = ?
          AND status IN ({placeholders})
        ORDER BY COALESCE(pulled_at, submitted_at, created_at) DESC, created_at DESC
        LIMIT 1
        """,
        (class_id, reviewer_seat_code, *REVIEWER_RECOVERY_STATUSES),
    ).fetchone()


def get_review_request_by_id(connection: sqlite3.Connection, request_id: str) -> sqlite3.Row | None:
    """按 ID 查询单条互审请求。"""
    return connection.execute(
        """
        SELECT
          id,
          author_seat_code,
          target_reviewer_seat_code,
          claimed_reviewer_seat_code,
          invite_code,
          status,
          request_json,
          pending_expires_at,
          review_expires_at,
          submitted_at,
          pulled_at,
          review_json
        FROM module4_lesson4_review_requests
        WHERE id = ?
        """,
        (request_id,),
    ).fetchone()


def cancel_review_request(
    connection: sqlite3.Connection,
    *,
    request_id: str,
    cancelled_at: str,
) -> int:
    """将 pending 请求标记为 cancelled；返回受影响行数。"""
    cursor = connection.execute(
        """
        UPDATE module4_lesson4_review_requests
        SET status = 'cancelled', cancelled_at = ?
        WHERE id = ? AND status = 'pending'
        """,
        (cancelled_at, request_id),
    )
    return cursor.rowcount


def claim_review_request(
    connection: sqlite3.Connection,
    *,
    request_id: str,
    claimed_reviewer_seat_code: str,
    claimed_at: str,
    review_expires_at: str,
) -> int:
    """将 pending 请求标记为 claimed；返回受影响行数（与 cancel 对称的竞态保护）。"""
    cursor = connection.execute(
        """
        UPDATE module4_lesson4_review_requests
        SET
          status = 'claimed',
          claimed_reviewer_seat_code = ?,
          claimed_at = ?,
          review_expires_at = ?
        WHERE id = ? AND status = 'pending'
        """,
        (claimed_reviewer_seat_code, claimed_at, review_expires_at, request_id),
    )
    return cursor.rowcount


def submit_review_request(
    connection: sqlite3.Connection,
    *,
    request_id: str,
    claimed_reviewer_seat_code: str,
    review_json: dict[str, Any],
    submitted_at: str,
) -> int:
    """将 claimed 请求标记为 submitted 并写入 review_json；返回受影响行数。"""
    cursor = connection.execute(
        """
        UPDATE module4_lesson4_review_requests
        SET status = 'submitted', review_json = ?, submitted_at = ?
        WHERE id = ? AND status = 'claimed' AND claimed_reviewer_seat_code = ?
        """,
        (
            json.dumps(review_json, ensure_ascii=False),
            submitted_at,
            request_id,
            claimed_reviewer_seat_code,
        ),
    )
    return cursor.rowcount


def pull_review_request(
    connection: sqlite3.Connection,
    *,
    request_id: str,
    author_seat_code: str,
    pulled_at: str,
) -> int:
    """将 submitted 请求标记为 pulled；返回受影响行数。"""
    cursor = connection.execute(
        """
        UPDATE module4_lesson4_review_requests
        SET status = 'pulled', pulled_at = ?
        WHERE id = ? AND status = 'submitted' AND author_seat_code = ?
        """,
        (pulled_at, request_id, author_seat_code),
    )
    return cursor.rowcount


def insert_review_request(
    connection: sqlite3.Connection,
    *,
    request_id: str,
    class_id: str,
    author_seat_code: str,
    target_reviewer_seat_code: str,
    invite_code: str,
    request_json: dict[str, Any],
    created_at: str,
    pending_expires_at: str,
) -> None:
    """写入一条 pending 状态的互审请求。"""
    connection.execute(
        """
        INSERT INTO module4_lesson4_review_requests (
          id,
          class_id,
          author_seat_code,
          target_reviewer_seat_code,
          claimed_reviewer_seat_code,
          invite_code,
          status,
          request_json,
          review_json,
          created_at,
          pending_expires_at,
          claimed_at,
          review_expires_at,
          submitted_at,
          pulled_at,
          cancelled_at,
          expired_at
        ) VALUES (?, ?, ?, ?, NULL, ?, 'pending', ?, NULL, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL)
        """,
        (
            request_id,
            class_id,
            author_seat_code,
            target_reviewer_seat_code,
            invite_code,
            json.dumps(request_json, ensure_ascii=False),
            created_at,
            pending_expires_at,
        ),
    )
