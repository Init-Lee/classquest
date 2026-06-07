"""
文件说明：模块 4 课时 5 C1a 账号与班级 seed 脚本。
职责：幂等写入 g7c01~g7c12 班级、xnwy 五个教师控制台账号和初始教师班级授权。
更新触发：课时 5 账号清单、班级范围、默认授权关系或 auth_and_classes.sql schema 变化时，需要同步更新本文件。
"""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import load_backend_env
from app.core.database import database_transaction, initialize_database

ACCOUNT_SEED_ROWS = (
    ("user_xnwy_admin", "xnwy-admin", "管理员", "admin"),
    ("user_xnwy_li", "xnwy-li", "李老师", "teacher"),
    ("user_xnwy_zhang", "xnwy-zhang", "张老师", "teacher"),
    ("user_xnwy_tang", "xnwy-tang", "唐老师", "teacher"),
    ("user_xnwy_demo", "xnwy-demo", "演示账号", "demo"),
)

# 初始授权：必须包含 xnwy-li manage g7c03（真实学生数据在该班，便于联调）；
# 另给三位老师各几个 manage 与个别 view，便于验证「teacher 只见被分配班级」。
ASSIGNMENT_SEED_ROWS = (
    ("user_xnwy_li", "g7c01", "manage"),
    ("user_xnwy_li", "g7c02", "manage"),
    ("user_xnwy_li", "g7c03", "manage"),
    ("user_xnwy_li", "g7c04", "view"),
    ("user_xnwy_zhang", "g7c05", "manage"),
    ("user_xnwy_zhang", "g7c06", "manage"),
    ("user_xnwy_zhang", "g7c07", "view"),
    ("user_xnwy_tang", "g7c08", "manage"),
    ("user_xnwy_tang", "g7c09", "manage"),
    ("user_xnwy_tang", "g7c10", "view"),
)


def utc_now() -> str:
    """返回 UTC ISO 时间戳，供 seed 幂等更新时间使用。"""
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def class_name_from_index(index: int) -> str:
    """根据 1-12 的班级序号生成初一中文班级名。"""
    return f"初一（{index}）班"


def seed_classes(connection: Any, now: str) -> int:
    """幂等写入 g7c01~g7c12 班级。"""
    count = 0
    for index in range(1, 13):
        class_id = f"g7c{index:02d}"
        connection.execute(
            """
            INSERT INTO cq_classes (class_id, class_name, grade_label, active, created_at, updated_at)
            VALUES (?, ?, '七年级', 1, ?, ?)
            ON CONFLICT(class_id) DO UPDATE SET
              class_name = excluded.class_name,
              grade_label = excluded.grade_label,
              active = 1,
              updated_at = excluded.updated_at
            """,
            (class_id, class_name_from_index(index), now, now),
        )
        count += 1
    return count


def seed_accounts(connection: Any, now: str) -> int:
    """幂等写入 xnwy 五个教师控制台账号。"""
    for user_id, account, display_name, role in ACCOUNT_SEED_ROWS:
        connection.execute(
            """
            INSERT INTO cq_users (user_id, account, display_name, role, active, created_at, updated_at)
            VALUES (?, ?, ?, ?, 1, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              account = excluded.account,
              display_name = excluded.display_name,
              role = excluded.role,
              active = 1,
              updated_at = excluded.updated_at
            """,
            (user_id, account, display_name, role, now, now),
        )
    return len(ACCOUNT_SEED_ROWS)


def seed_assignments(connection: Any, now: str) -> int:
    """幂等写入默认教师班级授权，至少包含 xnwy-li manage g7c03。"""
    count = 0
    for user_id, class_id, permission in ASSIGNMENT_SEED_ROWS:
        class_row = connection.execute(
            "SELECT class_name FROM cq_classes WHERE class_id = ?",
            (class_id,),
        ).fetchone()
        if class_row is None:
            raise ValueError(f"默认授权班级不存在：{class_id}")
        connection.execute(
            """
            INSERT INTO cq_teacher_class_assignments (
              assignment_id, user_id, class_id, class_name, permission, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, class_id) DO UPDATE SET
              class_name = excluded.class_name,
              permission = excluded.permission,
              updated_at = excluded.updated_at
            """,
            (f"{user_id}-{class_id}", user_id, class_id, class_row["class_name"], permission, now, now),
        )
        count += 1
    return count


def seed_module4_accounts(database_path: str | None = None) -> dict[str, int]:
    """执行 C1a 账号 seed，返回写入统计。"""
    initialize_database(database_path)
    now = utc_now()
    with database_transaction(database_path) as connection:
        class_count = seed_classes(connection, now)
        account_count = seed_accounts(connection, now)
        assignment_count = seed_assignments(connection, now)
    return {"classes": class_count, "accounts": account_count, "assignments": assignment_count}


if __name__ == "__main__":
    load_backend_env()
    stats = seed_module4_accounts()
    print(
        "已完成模块4课时5账号 seed："
        f"classes={stats['classes']} accounts={stats['accounts']} assignments={stats['assignments']}"
    )
