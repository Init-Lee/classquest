"""
文件说明：模块 4 课时 5 账号、班级、教师授权、登录会话、长期题池与 lesson5 session 的 SQLite 仓储层。
职责：封装 cq_users / cq_classes / cq_teacher_class_assignments / cq_auth_sessions / module4_question_items / module4_question_item_versions / module4_lesson5_* 的读写 SQL，保持 auth/service/pool_service/session_service/revision_service/completion_service 层不直接拼 SQL。
更新触发：上述表结构、索引、会话有效性判定（token/revoked_at/expires_at）、授权全量覆盖写入模式、题池版本规则、revision_plans 或 session 生命周期/锁池表变化时，需要同步更新本文件。
"""

from __future__ import annotations

import sqlite3

ACCOUNT_ROLES = ("admin", "teacher", "demo")


def get_active_user_by_account(connection: sqlite3.Connection, account: str) -> sqlite3.Row | None:
    """按账号查询启用中的用户；用于登录校验。"""
    return connection.execute(
        """
        SELECT user_id, account, display_name, role, active
        FROM cq_users
        WHERE account = ? AND active = 1
        """,
        (account,),
    ).fetchone()


def get_active_user_by_id(connection: sqlite3.Connection, user_id: str) -> sqlite3.Row | None:
    """按 user_id 查询启用中的用户；用于 me 与会话校验。"""
    return connection.execute(
        """
        SELECT user_id, account, display_name, role, active
        FROM cq_users
        WHERE user_id = ? AND active = 1
        """,
        (user_id,),
    ).fetchone()


def get_user_by_id(connection: sqlite3.Connection, user_id: str) -> sqlite3.Row | None:
    """按 user_id 查询用户（不限制 active）；用于 admin 写授权前的存在性/角色校验。"""
    return connection.execute(
        """
        SELECT user_id, account, display_name, role, active
        FROM cq_users
        WHERE user_id = ?
        """,
        (user_id,),
    ).fetchone()


def insert_auth_session(
    connection: sqlite3.Connection,
    *,
    token: str,
    user_id: str,
    role: str,
    created_at: str,
    expires_at: str | None = None,
) -> None:
    """写入一条登录会话；C1 默认 expires_at 为 NULL（令牌不过期），登出时写 revoked_at。"""
    connection.execute(
        """
        INSERT INTO cq_auth_sessions (token, user_id, role, created_at, expires_at, revoked_at)
        VALUES (?, ?, ?, ?, ?, NULL)
        """,
        (token, user_id, role, created_at, expires_at),
    )


def get_valid_session(connection: sqlite3.Connection, token: str, server_now: str) -> sqlite3.Row | None:
    """按 token 查询有效会话并联表取当前用户身份；要求未撤销、未过期且用户启用。"""
    return connection.execute(
        """
        SELECT
          s.token AS token,
          u.user_id AS user_id,
          u.account AS account,
          u.display_name AS display_name,
          u.role AS role
        FROM cq_auth_sessions s
        JOIN cq_users u ON u.user_id = s.user_id
        WHERE s.token = ?
          AND s.revoked_at IS NULL
          AND (s.expires_at IS NULL OR s.expires_at > ?)
          AND u.active = 1
        """,
        (token, server_now),
    ).fetchone()


def revoke_session(connection: sqlite3.Connection, *, token: str, revoked_at: str) -> int:
    """撤销指定 token 的会话；仅撤销尚未撤销的行，返回受影响行数（登出幂等）。"""
    cursor = connection.execute(
        """
        UPDATE cq_auth_sessions
        SET revoked_at = ?
        WHERE token = ? AND revoked_at IS NULL
        """,
        (revoked_at, token),
    )
    return cursor.rowcount


def list_classes(connection: sqlite3.Connection) -> list[sqlite3.Row]:
    """查询全部班级，按 class_id 升序。"""
    rows = connection.execute(
        """
        SELECT class_id, class_name, grade_label, active
        FROM cq_classes
        ORDER BY class_id ASC
        """,
    ).fetchall()
    return list(rows)


def get_class_by_id(connection: sqlite3.Connection, class_id: str) -> sqlite3.Row | None:
    """按 class_id 查询单个班级；用于写授权时回填 className 与校验存在性。"""
    return connection.execute(
        """
        SELECT class_id, class_name, grade_label, active
        FROM cq_classes
        WHERE class_id = ?
        """,
        (class_id,),
    ).fetchone()


def list_account_users(connection: sqlite3.Connection) -> list[sqlite3.Row]:
    """查询 admin/teacher/demo 账号用户（非学生），按角色与账号排序。"""
    placeholders = ", ".join("?" for _ in ACCOUNT_ROLES)
    rows = connection.execute(
        f"""
        SELECT user_id, account, display_name, role
        FROM cq_users
        WHERE role IN ({placeholders})
        ORDER BY role ASC, account ASC
        """,
        ACCOUNT_ROLES,
    ).fetchall()
    return list(rows)


def list_all_teacher_assignments(connection: sqlite3.Connection) -> list[sqlite3.Row]:
    """查询所有教师班级授权明细并联表回填账号、显示名与服务端 className。"""
    rows = connection.execute(
        """
        SELECT
          a.user_id AS user_id,
          u.account AS account,
          u.display_name AS display_name,
          a.class_id AS class_id,
          c.class_name AS class_name,
          a.permission AS permission
        FROM cq_teacher_class_assignments a
        JOIN cq_users u ON u.user_id = a.user_id
        JOIN cq_classes c ON c.class_id = a.class_id
        ORDER BY u.account ASC, a.class_id ASC
        """,
    ).fetchall()
    return list(rows)


def list_class_permissions_for_user(connection: sqlite3.Connection, user_id: str) -> list[sqlite3.Row]:
    """查询某教师的班级授权，className 以 cq_classes 服务端为准回填。"""
    rows = connection.execute(
        """
        SELECT
          a.class_id AS class_id,
          c.class_name AS class_name,
          c.grade_label AS grade_label,
          a.permission AS permission
        FROM cq_teacher_class_assignments a
        JOIN cq_classes c ON c.class_id = a.class_id
        WHERE a.user_id = ?
        ORDER BY a.class_id ASC
        """,
        (user_id,),
    ).fetchall()
    return list(rows)


def delete_teacher_assignments(connection: sqlite3.Connection, user_id: str) -> int:
    """删除某教师的全部班级授权；用于全量覆盖写入前清空旧行。"""
    cursor = connection.execute(
        "DELETE FROM cq_teacher_class_assignments WHERE user_id = ?",
        (user_id,),
    )
    return cursor.rowcount


def insert_teacher_assignment(
    connection: sqlite3.Connection,
    *,
    assignment_id: str,
    user_id: str,
    class_id: str,
    class_name: str,
    permission: str,
    created_at: str,
    updated_at: str,
) -> None:
    """写入一条教师班级授权。"""
    connection.execute(
        """
        INSERT INTO cq_teacher_class_assignments (
          assignment_id, user_id, class_id, class_name, permission, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (assignment_id, user_id, class_id, class_name, permission, created_at, updated_at),
    )


def get_teacher_class_permission(
    connection: sqlite3.Connection,
    user_id: str,
    class_id: str,
) -> str | None:
    """查询某教师对某班级的授权级别；无授权返回 None。"""
    row = connection.execute(
        """
        SELECT permission
        FROM cq_teacher_class_assignments
        WHERE user_id = ? AND class_id = ?
        """,
        (user_id, class_id),
    ).fetchone()
    return row["permission"] if row else None


def upsert_question_item(
    connection: sqlite3.Connection,
    *,
    item_id: str,
    class_id: str,
    author_seat_code: str,
    author_name: str,
    card_kind: str,
    now: str,
) -> sqlite3.Row:
    """按「班级 + 作者座位 + 卡片类型」幂等写入题池 item，并返回数据库中的当前行。"""
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
        (item_id, class_id, author_seat_code, author_name, card_kind, now, now),
    )
    row = connection.execute(
        """
        SELECT item_id, class_id, author_seat_code, author_name, card_kind,
               current_v2_version_id, current_v3_version_id, status, created_at, updated_at
        FROM module4_question_items
        WHERE class_id = ? AND author_seat_code = ? AND card_kind = ?
        """,
        (class_id, author_seat_code, card_kind),
    ).fetchone()
    if row is None:
        raise RuntimeError("题池 item 写入后无法读取。")
    return row


def find_version_by_hash(
    connection: sqlite3.Connection,
    *,
    item_id: str,
    content_hash: str,
    version_label: str = "v2",
) -> sqlite3.Row | None:
    """按 item、version_label 与 content_hash 查找已有版本，用于重复提交幂等。"""
    return connection.execute(
        """
        SELECT item_version_id, item_id, class_id, version_label, source_lesson,
               source_package_version, source_lesson4_card_id, card_json,
               content_hash, correct_option_key, item_short_name, status,
               created_at, updated_at
        FROM module4_question_item_versions
        WHERE item_id = ? AND version_label = ? AND content_hash = ?
        """,
        (item_id, version_label, content_hash),
    ).fetchone()


def get_question_item(connection: sqlite3.Connection, item_id: str) -> sqlite3.Row | None:
    """按 item_id 读取长期题池 item。"""
    return connection.execute(
        """
        SELECT item_id, class_id, author_seat_code, author_name, card_kind,
               current_v2_version_id, current_v3_version_id, status, created_at, updated_at
        FROM module4_question_items
        WHERE item_id = ?
        """,
        (item_id,),
    ).fetchone()


def get_question_item_version(connection: sqlite3.Connection, item_version_id: str) -> sqlite3.Row | None:
    """按 item_version_id 读取长期题池版本。"""
    return connection.execute(
        """
        SELECT item_version_id, item_id, class_id, version_label, source_lesson,
               source_session_id, base_version_id, source_package_version,
               source_lesson4_card_id, source_package_hash, card_json,
               content_hash, correct_option_key, item_short_name, status,
               created_at, updated_at
        FROM module4_question_item_versions
        WHERE item_version_id = ?
        """,
        (item_version_id,),
    ).fetchone()


def insert_question_item_version(
    connection: sqlite3.Connection,
    *,
    item_version_id: str,
    item_id: str,
    class_id: str,
    version_label: str = "v2",
    source_lesson: str,
    source_session_id: str | None = None,
    base_version_id: str | None = None,
    source_package_version: str,
    source_lesson4_card_id: str | None,
    source_package_hash: str,
    card_json: str,
    content_hash: str,
    correct_option_key: str,
    item_short_name: str,
    status: str,
    now: str,
) -> sqlite3.Row:
    """幂等写入题卡版本；同 item/version/hash 冲突时刷新展示字段。"""
    connection.execute(
        """
        INSERT INTO module4_question_item_versions (
          item_version_id, item_id, class_id, version_label, source_lesson,
          source_session_id, base_version_id, source_package_version, source_lesson4_card_id,
          source_package_hash, card_json, content_hash, correct_option_key, item_short_name,
          status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(item_id, version_label, content_hash) DO UPDATE SET
          source_session_id = excluded.source_session_id,
          base_version_id = excluded.base_version_id,
          source_package_version = excluded.source_package_version,
          source_lesson4_card_id = excluded.source_lesson4_card_id,
          source_package_hash = excluded.source_package_hash,
          card_json = excluded.card_json,
          correct_option_key = excluded.correct_option_key,
          item_short_name = excluded.item_short_name,
          status = excluded.status,
          updated_at = excluded.updated_at
        """,
        (
            item_version_id,
            item_id,
            class_id,
            version_label,
            source_lesson,
            source_session_id,
            base_version_id,
            source_package_version,
            source_lesson4_card_id,
            source_package_hash,
            card_json,
            content_hash,
            correct_option_key,
            item_short_name,
            status,
            now,
            now,
        ),
    )
    row = find_version_by_hash(connection, item_id=item_id, version_label=version_label, content_hash=content_hash)
    if row is None:
        raise RuntimeError("题卡版本写入后无法读取。")
    return row


def set_current_v2_version(
    connection: sqlite3.Connection,
    *,
    item_id: str,
    version_id: str,
    now: str,
) -> None:
    """把 item 当前 v2 指针切到指定版本。"""
    connection.execute(
        """
        UPDATE module4_question_items
        SET current_v2_version_id = ?,
            status = 'v2_submitted',
            updated_at = ?
        WHERE item_id = ?
        """,
        (version_id, now, item_id),
    )


def set_current_v3_version(
    connection: sqlite3.Connection,
    *,
    item_id: str,
    version_id: str,
    now: str,
) -> None:
    """把 item 当前 v3 指针切到指定版本，并标记可供课时 6 使用。"""
    connection.execute(
        """
        UPDATE module4_question_items
        SET current_v3_version_id = ?,
            status = 'ready_for_lesson6',
            updated_at = ?
        WHERE item_id = ?
        """,
        (version_id, now, item_id),
    )


def list_class_pool(connection: sqlite3.Connection, class_id: str) -> list[sqlite3.Row]:
    """查询某班级题池 item 及其当前 v2 版本摘要。"""
    rows = connection.execute(
        """
        SELECT
          i.item_id AS item_id,
          i.class_id AS class_id,
          i.author_seat_code AS author_seat_code,
          i.author_name AS author_name,
          i.card_kind AS card_kind,
          i.current_v2_version_id AS current_v2_version_id,
          i.status AS status,
          i.updated_at AS updated_at,
          v.content_hash AS current_v2_content_hash,
          v.item_short_name AS current_v2_short_name,
          v.status AS current_v2_status
        FROM module4_question_items i
        LEFT JOIN module4_question_item_versions v
          ON v.item_version_id = i.current_v2_version_id
        WHERE i.class_id = ?
        ORDER BY i.author_seat_code ASC, i.card_kind ASC
        """,
        (class_id,),
    ).fetchall()
    return list(rows)


def insert_session(
    connection: sqlite3.Connection,
    *,
    session_id: str,
    class_id: str,
    class_name: str,
    title: str,
    run_type: str,
    phase: str,
    settings_json: str,
    created_by_user_id: str,
    now: str,
) -> None:
    """写入一条 lesson5 session。"""
    connection.execute(
        """
        INSERT INTO module4_lesson5_sessions (
          session_id, class_id, class_name, title, run_type, phase, settings_json,
          created_by_user_id, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            session_id,
            class_id,
            class_name,
            title,
            run_type,
            phase,
            settings_json,
            created_by_user_id,
            now,
            now,
        ),
    )


def get_session(connection: sqlite3.Connection, session_id: str) -> sqlite3.Row | None:
    """按 session_id 查询 lesson5 session。"""
    return connection.execute(
        """
        SELECT
          session_id, class_id, class_name, title, run_type, phase, settings_json,
          created_by_user_id, created_at, updated_at, pool_locked_at, trial_opened_at,
          trial_locked_at, analytics_opened_at, revision_opened_at, closed_at
        FROM module4_lesson5_sessions
        WHERE session_id = ?
        """,
        (session_id,),
    ).fetchone()


def list_sessions_by_class(connection: sqlite3.Connection, class_id: str) -> list[sqlite3.Row]:
    """查询某班级 lesson5 sessions，按创建时间倒序。"""
    rows = connection.execute(
        """
        SELECT
          session_id, class_id, class_name, title, run_type, phase, settings_json,
          created_by_user_id, created_at, updated_at, pool_locked_at, trial_opened_at,
          trial_locked_at, analytics_opened_at, revision_opened_at, closed_at
        FROM module4_lesson5_sessions
        WHERE class_id = ?
        ORDER BY created_at DESC, session_id DESC
        """,
        (class_id,),
    ).fetchall()
    return list(rows)


def update_session_settings(
    connection: sqlite3.Connection,
    *,
    session_id: str,
    settings_json: str,
    now: str,
) -> int:
    """更新 draft session 的设置 JSON，返回受影响行数。"""
    cursor = connection.execute(
        """
        UPDATE module4_lesson5_sessions
        SET settings_json = ?, updated_at = ?
        WHERE session_id = ?
        """,
        (settings_json, now, session_id),
    )
    return cursor.rowcount


_PHASE_TIMESTAMP_COLUMNS = {
    "pool_locked": "pool_locked_at",
    "trial_open": "trial_opened_at",
    "trial_locked": "trial_locked_at",
    "analytics_open": "analytics_opened_at",
    "revision_open": "revision_opened_at",
    "closed": "closed_at",
}


def update_session_phase(
    connection: sqlite3.Connection,
    *,
    session_id: str,
    phase: str,
    now: str,
) -> int:
    """更新 session phase，并在进入带时间戳的阶段时写对应时间列。"""
    timestamp_column = _PHASE_TIMESTAMP_COLUMNS.get(phase)
    if timestamp_column is None:
        cursor = connection.execute(
            """
            UPDATE module4_lesson5_sessions
            SET phase = ?, updated_at = ?
            WHERE session_id = ?
            """,
            (phase, now, session_id),
        )
        return cursor.rowcount
    cursor = connection.execute(
        f"""
        UPDATE module4_lesson5_sessions
        SET phase = ?, updated_at = ?, {timestamp_column} = COALESCE({timestamp_column}, ?)
        WHERE session_id = ?
        """,
        (phase, now, now, session_id),
    )
    return cursor.rowcount


def list_current_v2_versions_for_class(connection: sqlite3.Connection, class_id: str) -> list[sqlite3.Row]:
    """读取某班级长期题池中当前 V2 版本，作为 session 锁池冻结来源。"""
    rows = connection.execute(
        """
        SELECT
          i.item_id AS item_id,
          i.class_id AS class_id,
          i.author_seat_code AS author_seat_code,
          i.author_name AS author_name,
          i.card_kind AS card_kind,
          i.current_v2_version_id AS item_version_id,
          v.item_short_name AS item_short_name,
          v.status AS version_status
        FROM module4_question_items i
        JOIN module4_question_item_versions v
          ON v.item_version_id = i.current_v2_version_id
        WHERE i.class_id = ?
          AND i.current_v2_version_id IS NOT NULL
        ORDER BY i.author_seat_code ASC, i.card_kind ASC
        """,
        (class_id,),
    ).fetchall()
    return list(rows)


def insert_session_pool_item(
    connection: sqlite3.Connection,
    *,
    session_pool_item_id: str,
    session_id: str,
    class_id: str,
    item_id: str,
    item_version_id: str,
    author_seat_code: str,
    author_name: str,
    card_kind: str,
    included_at: str,
) -> None:
    """写入一条 session 冻结题池 item。"""
    connection.execute(
        """
        INSERT INTO module4_lesson5_session_pool_items (
          session_pool_item_id, session_id, class_id, item_id, item_version_id,
          author_seat_code, author_name, card_kind, included_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            session_pool_item_id,
            session_id,
            class_id,
            item_id,
            item_version_id,
            author_seat_code,
            author_name,
            card_kind,
            included_at,
        ),
    )


def list_session_pool_items(connection: sqlite3.Connection, session_id: str) -> list[sqlite3.Row]:
    """查询某 session 已冻结题池 item。"""
    rows = connection.execute(
        """
        SELECT
          session_pool_item_id, session_id, class_id, item_id, item_version_id,
          author_seat_code, author_name, card_kind, included_at
        FROM module4_lesson5_session_pool_items
        WHERE session_id = ?
        ORDER BY author_seat_code ASC, card_kind ASC
        """,
        (session_id,),
    ).fetchall()
    return list(rows)


def count_session_pool_by_kind(connection: sqlite3.Connection, session_id: str) -> dict[str, int]:
    """按 news/image 统计 session 冻结题池数量。"""
    rows = connection.execute(
        """
        SELECT card_kind, COUNT(*) AS count
        FROM module4_lesson5_session_pool_items
        WHERE session_id = ?
        GROUP BY card_kind
        """,
        (session_id,),
    ).fetchall()
    counts = {"news": 0, "image": 0}
    for row in rows:
        counts[row["card_kind"]] = int(row["count"])
    return counts


def count_class_pool_authors(connection: sqlite3.Connection, class_id: str) -> int:
    """统计某班级已有当前 V2 的学生作者人数。"""
    row = connection.execute(
        """
        SELECT COUNT(DISTINCT author_seat_code) AS count
        FROM module4_question_items
        WHERE class_id = ?
          AND current_v2_version_id IS NOT NULL
        """,
        (class_id,),
    ).fetchone()
    return int(row["count"]) if row else 0


def count_class_current_v2_items(connection: sqlite3.Connection, class_id: str) -> int:
    """统计某班级当前 V2 题卡数量。"""
    row = connection.execute(
        """
        SELECT COUNT(*) AS count
        FROM module4_question_items
        WHERE class_id = ?
          AND current_v2_version_id IS NOT NULL
        """,
        (class_id,),
    ).fetchone()
    return int(row["count"]) if row else 0


def insert_event(
    connection: sqlite3.Connection,
    *,
    event_id: str,
    session_id: str | None,
    actor_role: str,
    actor_id: str,
    event_type: str,
    payload_json: str,
    created_at: str,
) -> None:
    """写入 lesson5 session 审计事件。"""
    connection.execute(
        """
        INSERT INTO module4_lesson5_events (
          event_id, session_id, actor_role, actor_id, event_type, payload_json, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (event_id, session_id, actor_role, actor_id, event_type, payload_json, created_at),
    )


def get_active_session_for_class(connection: sqlite3.Connection, class_id: str) -> sqlite3.Row | None:
    """查询指定班级最新可连接 session；draft/closed 不对学生开放。"""
    return connection.execute(
        """
        SELECT
          session_id, class_id, class_name, title, run_type, phase, settings_json,
          created_by_user_id, created_at, updated_at, pool_locked_at, trial_opened_at,
          trial_locked_at, analytics_opened_at, revision_opened_at, closed_at
        FROM module4_lesson5_sessions
        WHERE class_id = ?
          AND phase NOT IN ('draft', 'closed')
        ORDER BY created_at DESC, session_id DESC
        LIMIT 1
        """,
        (class_id,),
    ).fetchone()


def get_participant_by_id(connection: sqlite3.Connection, participant_id: str) -> sqlite3.Row | None:
    """按 participant_id 查询学生绑定记录。"""
    return connection.execute(
        """
        SELECT participant_id, session_id, class_id, student_name, class_seat_code,
               lesson5_client_id, joined_at, last_seen_at
        FROM module4_lesson5_participants
        WHERE participant_id = ?
        """,
        (participant_id,),
    ).fetchone()


def get_participant_by_seat(
    connection: sqlite3.Connection,
    *,
    session_id: str,
    class_seat_code: str,
) -> sqlite3.Row | None:
    """按 session 与座位码查询 participant，用于 attach 幂等与冲突检测。"""
    return connection.execute(
        """
        SELECT participant_id, session_id, class_id, student_name, class_seat_code,
               lesson5_client_id, joined_at, last_seen_at
        FROM module4_lesson5_participants
        WHERE session_id = ? AND class_seat_code = ?
        """,
        (session_id, class_seat_code),
    ).fetchone()


def get_participant_by_client(
    connection: sqlite3.Connection,
    *,
    session_id: str,
    lesson5_client_id: str,
) -> sqlite3.Row | None:
    """按 session 与客户端 ID 查询 participant，用于 attach 幂等与冲突检测。"""
    return connection.execute(
        """
        SELECT participant_id, session_id, class_id, student_name, class_seat_code,
               lesson5_client_id, joined_at, last_seen_at
        FROM module4_lesson5_participants
        WHERE session_id = ? AND lesson5_client_id = ?
        """,
        (session_id, lesson5_client_id),
    ).fetchone()


def insert_participant(
    connection: sqlite3.Connection,
    *,
    participant_id: str,
    session_id: str,
    class_id: str,
    student_name: str,
    class_seat_code: str,
    lesson5_client_id: str,
    now: str,
) -> None:
    """写入一条 participant 绑定记录。"""
    connection.execute(
        """
        INSERT INTO module4_lesson5_participants (
          participant_id, session_id, class_id, student_name, class_seat_code,
          lesson5_client_id, joined_at, last_seen_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (participant_id, session_id, class_id, student_name, class_seat_code, lesson5_client_id, now, now),
    )


def update_participant_last_seen(
    connection: sqlite3.Connection,
    *,
    participant_id: str,
    now: str,
) -> int:
    """刷新 participant 最近可见时间；重复 attach 与轮询 state 使用。"""
    cursor = connection.execute(
        """
        UPDATE module4_lesson5_participants
        SET last_seen_at = ?
        WHERE participant_id = ?
        """,
        (now, participant_id),
    )
    return cursor.rowcount


def count_participant_answers(connection: sqlite3.Connection, *, session_id: str, participant_id: str) -> int:
    """统计 participant 在当前 session 的有效首次作答数量。"""
    row = connection.execute(
        """
        SELECT COUNT(*) AS count
        FROM module4_lesson5_answers
        WHERE session_id = ?
          AND participant_id = ?
          AND excluded_from_stats = 0
          AND is_first_valid_attempt = 1
        """,
        (session_id, participant_id),
    ).fetchone()
    return int(row["count"]) if row else 0


def count_participant_ratings(connection: sqlite3.Connection, *, session_id: str, participant_id: str) -> int:
    """统计 participant 在当前 session 的有效首次评分数量。"""
    row = connection.execute(
        """
        SELECT COUNT(*) AS count
        FROM module4_lesson5_ratings
        WHERE session_id = ?
          AND participant_id = ?
          AND excluded_from_stats = 0
          AND is_first_valid_rating = 1
        """,
        (session_id, participant_id),
    ).fetchone()
    return int(row["count"]) if row else 0


def list_session_pool_items_for_assignment(connection: sqlite3.Connection, session_id: str) -> list[sqlite3.Row]:
    """读取冻结池与对应版本内容，assignment 只能从该列表生成。"""
    rows = connection.execute(
        """
        SELECT
          p.session_pool_item_id AS session_pool_item_id,
          p.session_id AS session_id,
          p.class_id AS class_id,
          p.item_id AS item_id,
          p.item_version_id AS item_version_id,
          p.author_seat_code AS author_seat_code,
          p.author_name AS author_name,
          p.card_kind AS card_kind,
          p.included_at AS included_at,
          v.card_json AS card_json,
          v.item_short_name AS item_short_name
        FROM module4_lesson5_session_pool_items p
        JOIN module4_question_item_versions v
          ON v.item_version_id = p.item_version_id
        WHERE p.session_id = ?
        ORDER BY p.card_kind ASC, p.author_seat_code ASC, p.session_pool_item_id ASC
        """,
        (session_id,),
    ).fetchall()
    return list(rows)


def count_valid_answers_by_pool_item(
    connection: sqlite3.Connection,
    *,
    session_id: str,
    item_version_id: str,
) -> int:
    """统计某冻结题卡版本在当前 session 已收到的有效首次作答数。"""
    row = connection.execute(
        """
        SELECT COUNT(*) AS count
        FROM module4_lesson5_answers
        WHERE session_id = ?
          AND item_version_id = ?
          AND excluded_from_stats = 0
          AND is_first_valid_attempt = 1
        """,
        (session_id, item_version_id),
    ).fetchone()
    return int(row["count"]) if row else 0


def list_assignments_for_participant(
    connection: sqlite3.Connection,
    *,
    session_id: str,
    participant_id: str,
) -> list[sqlite3.Row]:
    """读取 participant 已持久化 assignments，并带出冻结版本内容。"""
    rows = connection.execute(
        """
        SELECT
          a.assignment_id AS assignment_id,
          a.session_id AS session_id,
          a.participant_id AS participant_id,
          a.respondent_seat_code AS respondent_seat_code,
          a.session_pool_item_id AS session_pool_item_id,
          a.item_id AS item_id,
          a.item_version_id AS item_version_id,
          a.order_index AS order_index,
          a.assignment_reason AS assignment_reason,
          a.is_required AS is_required,
          a.status AS status,
          a.created_at AS created_at,
          p.card_kind AS card_kind,
          p.author_seat_code AS author_seat_code,
          v.card_json AS card_json,
          v.item_short_name AS item_short_name
        FROM module4_lesson5_assignments a
        JOIN module4_lesson5_session_pool_items p
          ON p.session_pool_item_id = a.session_pool_item_id
        JOIN module4_question_item_versions v
          ON v.item_version_id = a.item_version_id
        WHERE a.session_id = ?
          AND a.participant_id = ?
        ORDER BY a.order_index ASC
        """,
        (session_id, participant_id),
    ).fetchall()
    return list(rows)


def insert_assignment(
    connection: sqlite3.Connection,
    *,
    assignment_id: str,
    session_id: str,
    participant_id: str,
    respondent_seat_code: str,
    session_pool_item_id: str,
    item_id: str,
    item_version_id: str,
    order_index: int,
    assignment_reason: str,
    created_at: str,
) -> None:
    """写入一条 assignment；唯一约束保证同 participant 不重复分配同题。"""
    connection.execute(
        """
        INSERT INTO module4_lesson5_assignments (
          assignment_id, session_id, participant_id, respondent_seat_code,
          session_pool_item_id, item_id, item_version_id, order_index,
          assignment_reason, is_required, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'assigned', ?)
        """,
        (
            assignment_id,
            session_id,
            participant_id,
            respondent_seat_code,
            session_pool_item_id,
            item_id,
            item_version_id,
            order_index,
            assignment_reason,
            created_at,
        ),
    )


def get_assignment_by_id(connection: sqlite3.Connection, assignment_id: str) -> sqlite3.Row | None:
    """按 assignment_id 读取分配记录，并带出冻结题卡版本内容用于作答校验。"""
    return connection.execute(
        """
        SELECT
          a.assignment_id AS assignment_id,
          a.session_id AS session_id,
          a.participant_id AS participant_id,
          a.respondent_seat_code AS respondent_seat_code,
          a.session_pool_item_id AS session_pool_item_id,
          a.item_id AS item_id,
          a.item_version_id AS item_version_id,
          a.order_index AS order_index,
          a.assignment_reason AS assignment_reason,
          a.is_required AS is_required,
          a.status AS status,
          a.created_at AS created_at,
          p.card_kind AS card_kind,
          v.card_json AS card_json,
          v.correct_option_key AS correct_option_key,
          v.item_short_name AS item_short_name
        FROM module4_lesson5_assignments a
        JOIN module4_lesson5_session_pool_items p
          ON p.session_pool_item_id = a.session_pool_item_id
        JOIN module4_question_item_versions v
          ON v.item_version_id = a.item_version_id
        WHERE a.assignment_id = ?
        """,
        (assignment_id,),
    ).fetchone()


def find_correct_option_key(connection: sqlite3.Connection, item_version_id: str) -> str | None:
    """读取题卡版本的服务端标准答案，用于判分。"""
    row = connection.execute(
        """
        SELECT correct_option_key
        FROM module4_question_item_versions
        WHERE item_version_id = ?
        """,
        (item_version_id,),
    ).fetchone()
    return row["correct_option_key"] if row else None


def insert_answer(
    connection: sqlite3.Connection,
    *,
    answer_id: str,
    session_id: str,
    assignment_id: str,
    participant_id: str,
    item_id: str,
    item_version_id: str,
    respondent_seat_code: str,
    selected_option_key: str,
    correct_option_key: str,
    is_correct: bool,
    idempotency_key: str | None,
    answered_at: str,
) -> None:
    """写入一条官方 answer；assignment 唯一约束保证重复提交不重复计数。"""
    connection.execute(
        """
        INSERT INTO module4_lesson5_answers (
          answer_id, session_id, assignment_id, participant_id, item_id, item_version_id,
          respondent_seat_code, selected_option_key, correct_option_key, is_correct,
          is_first_valid_attempt, excluded_from_stats, excluded_reason, idempotency_key, answered_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, NULL, ?, ?)
        """,
        (
            answer_id,
            session_id,
            assignment_id,
            participant_id,
            item_id,
            item_version_id,
            respondent_seat_code,
            selected_option_key,
            correct_option_key,
            1 if is_correct else 0,
            idempotency_key,
            answered_at,
        ),
    )


def get_answer_by_assignment_id(connection: sqlite3.Connection, assignment_id: str) -> sqlite3.Row | None:
    """按 assignment_id 读取已有官方 answer。"""
    return connection.execute(
        """
        SELECT
          answer_id, session_id, assignment_id, participant_id, item_id, item_version_id,
          respondent_seat_code, selected_option_key, correct_option_key, is_correct,
          is_first_valid_attempt, excluded_from_stats, excluded_reason, idempotency_key, answered_at
        FROM module4_lesson5_answers
        WHERE assignment_id = ?
        """,
        (assignment_id,),
    ).fetchone()


def get_answer_by_id(connection: sqlite3.Connection, answer_id: str) -> sqlite3.Row | None:
    """按 answer_id 读取已有官方 answer。"""
    return connection.execute(
        """
        SELECT
          answer_id, session_id, assignment_id, participant_id, item_id, item_version_id,
          respondent_seat_code, selected_option_key, correct_option_key, is_correct,
          is_first_valid_attempt, excluded_from_stats, excluded_reason, idempotency_key, answered_at
        FROM module4_lesson5_answers
        WHERE answer_id = ?
        """,
        (answer_id,),
    ).fetchone()


def update_assignment_status(connection: sqlite3.Connection, *, assignment_id: str, status: str) -> int:
    """更新 assignment 状态；状态合法性由表 CHECK 与上层业务共同约束。"""
    cursor = connection.execute(
        """
        UPDATE module4_lesson5_assignments
        SET status = ?
        WHERE assignment_id = ?
        """,
        (status, assignment_id),
    )
    return cursor.rowcount


def insert_rating(
    connection: sqlite3.Connection,
    *,
    rating_id: str,
    session_id: str,
    answer_id: str,
    assignment_id: str,
    participant_id: str,
    item_id: str,
    item_version_id: str,
    respondent_seat_code: str,
    clarity: int,
    thinking_value: int,
    explanation_helpfulness: int,
    issue_flags_json: str,
    comment: str,
    rated_at: str,
) -> None:
    """写入一条官方 rating；answer 唯一约束保证重复评分不重复计数。"""
    connection.execute(
        """
        INSERT INTO module4_lesson5_ratings (
          rating_id, session_id, answer_id, assignment_id, participant_id, item_id, item_version_id,
          respondent_seat_code, clarity, thinking_value, explanation_helpfulness,
          issue_flags_json, comment, is_first_valid_rating, excluded_from_stats, rated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)
        """,
        (
            rating_id,
            session_id,
            answer_id,
            assignment_id,
            participant_id,
            item_id,
            item_version_id,
            respondent_seat_code,
            clarity,
            thinking_value,
            explanation_helpfulness,
            issue_flags_json,
            comment,
            rated_at,
        ),
    )


def get_rating_by_answer_id(connection: sqlite3.Connection, answer_id: str) -> sqlite3.Row | None:
    """按 answer_id 读取已有官方 rating。"""
    return connection.execute(
        """
        SELECT
          rating_id, session_id, answer_id, assignment_id, participant_id, item_id, item_version_id,
          respondent_seat_code, clarity, thinking_value, explanation_helpfulness,
          issue_flags_json, comment, is_first_valid_rating, excluded_from_stats, rated_at
        FROM module4_lesson5_ratings
        WHERE answer_id = ?
        """,
        (answer_id,),
    ).fetchone()


def list_session_progress(connection: sqlite3.Connection, session_id: str) -> list[sqlite3.Row]:
    """按 participant 聚合 session 进度；不读取答案、解析或题目作者信息。"""
    rows = connection.execute(
        """
        SELECT
          p.participant_id AS participant_id,
          p.student_name AS student_name,
          p.class_seat_code AS class_seat_code,
          COALESCE(a.answered_count, 0) AS answered_count,
          COALESCE(r.rated_count, 0) AS rated_count
        FROM module4_lesson5_participants p
        LEFT JOIN (
          SELECT participant_id, COUNT(*) AS answered_count
          FROM module4_lesson5_answers
          WHERE session_id = ?
            AND excluded_from_stats = 0
            AND is_first_valid_attempt = 1
          GROUP BY participant_id
        ) a ON a.participant_id = p.participant_id
        LEFT JOIN (
          SELECT participant_id, COUNT(*) AS rated_count
          FROM module4_lesson5_ratings
          WHERE session_id = ?
            AND excluded_from_stats = 0
            AND is_first_valid_rating = 1
          GROUP BY participant_id
        ) r ON r.participant_id = p.participant_id
        WHERE p.session_id = ?
        ORDER BY p.class_seat_code ASC, p.participant_id ASC
        """,
        (session_id, session_id, session_id),
    ).fetchall()
    return list(rows)


def aggregate_item_stats(connection: sqlite3.Connection, session_id: str) -> list[sqlite3.Row]:
    """按冻结题卡版本聚合 answer/rating 统计原始值；服务层负责解析 JSON 与计算派生字段。"""
    rows = connection.execute(
        """
        SELECT
          p.session_id AS session_id,
          p.item_id AS item_id,
          p.item_version_id AS item_version_id,
          p.card_kind AS card_kind,
          COALESCE(a.valid_answer_count, 0) AS valid_answer_count,
          COALESCE(a.correct_count, 0) AS correct_count,
          COALESCE(r.rating_count, 0) AS rating_count,
          r.avg_clarity AS avg_clarity,
          r.avg_thinking_value AS avg_thinking_value,
          r.avg_explanation_helpfulness AS avg_explanation_helpfulness,
          COALESCE(r.flagged_rating_count, 0) AS issue_flag_count,
          COALESCE(r.issue_flags_json_rows, '') AS issue_flags_json_rows,
          COALESCE(r.sample_comments_rows, '') AS sample_comments_rows
        FROM module4_lesson5_session_pool_items p
        LEFT JOIN (
          SELECT
            item_version_id,
            COUNT(*) AS valid_answer_count,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct_count
          FROM module4_lesson5_answers
          WHERE session_id = ?
            AND excluded_from_stats = 0
            AND is_first_valid_attempt = 1
          GROUP BY item_version_id
        ) a ON a.item_version_id = p.item_version_id
        LEFT JOIN (
          SELECT
            item_version_id,
            COUNT(*) AS rating_count,
            AVG(clarity) AS avg_clarity,
            AVG(thinking_value) AS avg_thinking_value,
            AVG(explanation_helpfulness) AS avg_explanation_helpfulness,
            SUM(CASE WHEN issue_flags_json != '[]' THEN 1 ELSE 0 END) AS flagged_rating_count,
            GROUP_CONCAT(issue_flags_json, char(10)) AS issue_flags_json_rows,
            GROUP_CONCAT(NULLIF(TRIM(comment), ''), char(10)) AS sample_comments_rows
          FROM module4_lesson5_ratings
          WHERE session_id = ?
            AND excluded_from_stats = 0
            AND is_first_valid_rating = 1
          GROUP BY item_version_id
        ) r ON r.item_version_id = p.item_version_id
        WHERE p.session_id = ?
        ORDER BY p.card_kind ASC, p.author_seat_code ASC, p.item_version_id ASC
        """,
        (session_id, session_id, session_id),
    ).fetchall()
    return list(rows)


def upsert_item_stats(
    connection: sqlite3.Connection,
    *,
    stat_id: str,
    session_id: str,
    item_id: str,
    item_version_id: str,
    valid_answer_count: int,
    correct_count: int,
    correct_rate: float,
    avg_clarity: float | None,
    avg_thinking_value: float | None,
    avg_explanation_helpfulness: float | None,
    issue_flag_count: int,
    issue_flag_rate: float,
    issue_flags_json: str,
    sample_comments_json: str,
    stats_status: str,
    computed_at: str,
) -> None:
    """幂等写入题卡统计；同 session/item_version 覆盖重算结果。"""
    connection.execute(
        """
        INSERT INTO module4_lesson5_item_stats (
          stat_id, session_id, item_id, item_version_id,
          valid_answer_count, correct_count, correct_rate,
          avg_clarity, avg_thinking_value, avg_explanation_helpfulness,
          issue_flag_count, issue_flag_rate, issue_flags_json, sample_comments_json,
          stats_status, computed_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          stats_status = excluded.stats_status,
          computed_at = excluded.computed_at
        """,
        (
            stat_id,
            session_id,
            item_id,
            item_version_id,
            valid_answer_count,
            correct_count,
            correct_rate,
            avg_clarity,
            avg_thinking_value,
            avg_explanation_helpfulness,
            issue_flag_count,
            issue_flag_rate,
            issue_flags_json,
            sample_comments_json,
            stats_status,
            computed_at,
        ),
    )


def list_item_stats_by_session(connection: sqlite3.Connection, session_id: str) -> list[sqlite3.Row]:
    """读取 session 下全部题卡统计，并补齐冻结题卡类型；不返回作者身份。"""
    rows = connection.execute(
        """
        SELECT
          s.stat_id AS stat_id,
          s.session_id AS session_id,
          s.item_id AS item_id,
          s.item_version_id AS item_version_id,
          p.card_kind AS card_kind,
          s.valid_answer_count AS valid_answer_count,
          s.correct_count AS correct_count,
          s.correct_rate AS correct_rate,
          s.avg_clarity AS avg_clarity,
          s.avg_thinking_value AS avg_thinking_value,
          s.avg_explanation_helpfulness AS avg_explanation_helpfulness,
          s.issue_flag_count AS issue_flag_count,
          s.issue_flag_rate AS issue_flag_rate,
          s.issue_flags_json AS issue_flags_json,
          s.sample_comments_json AS sample_comments_json,
          s.stats_status AS stats_status,
          s.computed_at AS computed_at,
          v.item_short_name AS item_short_name
        FROM module4_lesson5_item_stats s
        JOIN module4_lesson5_session_pool_items p
          ON p.session_id = s.session_id AND p.item_version_id = s.item_version_id
        LEFT JOIN module4_question_item_versions v
          ON v.item_version_id = s.item_version_id
        WHERE s.session_id = ?
        ORDER BY p.card_kind ASC, p.author_seat_code ASC, s.item_version_id ASC
        """,
        (session_id,),
    ).fetchall()
    return list(rows)


def list_item_stats_for_author(
    connection: sqlite3.Connection,
    *,
    session_id: str,
    seat_code: str,
) -> list[sqlite3.Row]:
    """读取某作者座位在 session 冻结池中的题卡统计；用于学生本人 my-report。"""
    rows = connection.execute(
        """
        SELECT
          s.stat_id AS stat_id,
          s.session_id AS session_id,
          s.item_id AS item_id,
          s.item_version_id AS item_version_id,
          p.card_kind AS card_kind,
          s.valid_answer_count AS valid_answer_count,
          s.correct_count AS correct_count,
          s.correct_rate AS correct_rate,
          s.avg_clarity AS avg_clarity,
          s.avg_thinking_value AS avg_thinking_value,
          s.avg_explanation_helpfulness AS avg_explanation_helpfulness,
          s.issue_flag_count AS issue_flag_count,
          s.issue_flag_rate AS issue_flag_rate,
          s.issue_flags_json AS issue_flags_json,
          s.sample_comments_json AS sample_comments_json,
          s.stats_status AS stats_status,
          s.computed_at AS computed_at,
          v.item_short_name AS item_short_name
        FROM module4_lesson5_item_stats s
        JOIN module4_lesson5_session_pool_items p
          ON p.session_id = s.session_id AND p.item_version_id = s.item_version_id
        LEFT JOIN module4_question_item_versions v
          ON v.item_version_id = s.item_version_id
        WHERE s.session_id = ?
          AND p.author_seat_code = ?
        ORDER BY p.card_kind ASC, s.item_version_id ASC
        """,
        (session_id, seat_code),
    ).fetchall()
    return list(rows)


def count_item_stats_by_session(connection: sqlite3.Connection, session_id: str) -> int:
    """统计 session 下已落库的题卡统计行数；用于 phase gate 与报告读取前置校验。"""
    row = connection.execute(
        """
        SELECT COUNT(*) AS count
        FROM module4_lesson5_item_stats
        WHERE session_id = ?
        """,
        (session_id,),
    ).fetchone()
    return int(row["count"]) if row else 0


def upsert_revision_plan(
    connection: sqlite3.Connection,
    *,
    revision_plan_id: str,
    session_id: str,
    participant_id: str,
    student_seat_code: str,
    item_id: str,
    base_v2_version_id: str,
    v3_item_version_id: str,
    card_kind: str,
    diagnosis_json: str,
    revision_action: str,
    revision_reason: str,
    expected_effect: str,
    now: str,
) -> sqlite3.Row:
    """幂等写入或覆盖学生单张题卡的 V3 修订计划。"""
    connection.execute(
        """
        INSERT INTO module4_lesson5_revision_plans (
          revision_plan_id, session_id, participant_id, student_seat_code,
          item_id, base_v2_version_id, v3_item_version_id, card_kind,
          diagnosis_json, revision_action, revision_reason, expected_effect,
          status, created_at, updated_at, submitted_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?)
        ON CONFLICT(session_id, participant_id, item_id) DO UPDATE SET
          base_v2_version_id = excluded.base_v2_version_id,
          v3_item_version_id = excluded.v3_item_version_id,
          card_kind = excluded.card_kind,
          diagnosis_json = excluded.diagnosis_json,
          revision_action = excluded.revision_action,
          revision_reason = excluded.revision_reason,
          expected_effect = excluded.expected_effect,
          status = 'submitted',
          updated_at = excluded.updated_at,
          submitted_at = excluded.submitted_at
        """,
        (
            revision_plan_id,
            session_id,
            participant_id,
            student_seat_code,
            item_id,
            base_v2_version_id,
            v3_item_version_id,
            card_kind,
            diagnosis_json,
            revision_action,
            revision_reason,
            expected_effect,
            now,
            now,
            now,
        ),
    )
    row = connection.execute(
        """
        SELECT revision_plan_id, session_id, participant_id, student_seat_code,
               item_id, base_v2_version_id, v3_item_version_id, card_kind,
               diagnosis_json, revision_action, revision_reason, expected_effect,
               status, created_at, updated_at, submitted_at
        FROM module4_lesson5_revision_plans
        WHERE session_id = ? AND participant_id = ? AND item_id = ?
        """,
        (session_id, participant_id, item_id),
    ).fetchone()
    if row is None:
        raise RuntimeError("修订计划写入后无法读取。")
    return row


def list_revision_plans_for_participant(
    connection: sqlite3.Connection,
    *,
    session_id: str,
    participant_id: str,
) -> list[sqlite3.Row]:
    """读取某 participant 已提交的 V3 修订计划。"""
    rows = connection.execute(
        """
        SELECT
          r.revision_plan_id AS revision_plan_id,
          r.session_id AS session_id,
          r.participant_id AS participant_id,
          r.student_seat_code AS student_seat_code,
          p.student_name AS student_name,
          r.item_id AS item_id,
          r.base_v2_version_id AS base_v2_version_id,
          r.v3_item_version_id AS v3_item_version_id,
          r.card_kind AS card_kind,
          r.diagnosis_json AS diagnosis_json,
          r.revision_action AS revision_action,
          r.revision_reason AS revision_reason,
          r.expected_effect AS expected_effect,
          r.status AS status,
          r.created_at AS created_at,
          r.updated_at AS updated_at,
          r.submitted_at AS submitted_at
        FROM module4_lesson5_revision_plans r
        JOIN module4_lesson5_participants p ON p.participant_id = r.participant_id
        WHERE r.session_id = ? AND r.participant_id = ?
        ORDER BY r.card_kind ASC, r.item_id ASC
        """,
        (session_id, participant_id),
    ).fetchall()
    return list(rows)


def list_revision_plans_by_session(connection: sqlite3.Connection, session_id: str) -> list[sqlite3.Row]:
    """按冻结题池 item 读取教师修订总览，未提交项也返回 none 状态。"""
    rows = connection.execute(
        """
        SELECT
          p.author_seat_code AS student_seat_code,
          p.author_name AS student_name,
          part.participant_id AS participant_id,
          p.item_id AS item_id,
          p.card_kind AS card_kind,
          p.item_version_id AS base_v2_version_id,
          r.v3_item_version_id AS v3_item_version_id,
          r.diagnosis_json AS diagnosis_json,
          r.revision_action AS revision_action,
          r.revision_reason AS revision_reason,
          r.expected_effect AS expected_effect,
          COALESCE(r.status, 'none') AS status,
          r.updated_at AS updated_at,
          r.submitted_at AS submitted_at
        FROM module4_lesson5_session_pool_items p
        LEFT JOIN module4_lesson5_participants part
          ON part.session_id = p.session_id AND part.class_seat_code = p.author_seat_code
        LEFT JOIN module4_lesson5_revision_plans r
          ON r.session_id = p.session_id AND r.item_id = p.item_id
        WHERE p.session_id = ?
        ORDER BY p.author_seat_code ASC, p.card_kind ASC, p.item_id ASC
        """,
        (session_id,),
    ).fetchall()
    return list(rows)


def count_ready_v3_items_for_participant(
    connection: sqlite3.Connection,
    *,
    session_id: str,
    class_id: str,
    seat_code: str,
) -> int:
    """统计某学生在当前 session 已提交并指向 ready V3 的题卡数量。"""
    row = connection.execute(
        """
        SELECT COUNT(DISTINCT i.item_id) AS count
        FROM module4_question_items i
        JOIN module4_question_item_versions v
          ON v.item_version_id = i.current_v3_version_id
        WHERE i.class_id = ?
          AND i.author_seat_code = ?
          AND v.version_label = 'v3'
          AND v.source_session_id = ?
          AND v.status = 'ready_for_lesson6'
        """,
        (class_id, seat_code, session_id),
    ).fetchone()
    return int(row["count"]) if row else 0
