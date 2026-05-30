"""
文件说明：后端 SQLite 数据库连接模块。
职责：集中创建 ClassQuest SQLite 连接，启用 WAL/短事务约定，并提供 schema 初始化入口。
更新触发：数据库路径、连接 PRAGMA、事务策略、schema 初始化流程或迁移机制变化时，需要同步更新本文件。
"""

from collections.abc import Iterator, Sequence
from contextlib import contextmanager
from pathlib import Path
import sqlite3

from app.core.config import get_database_path

DEFAULT_BUSY_TIMEOUT_MS = 5000
APP_ROOT = Path(__file__).resolve().parents[1]
LESSON4_REVIEW_REQUESTS_SCHEMA = APP_ROOT / "modules" / "module4" / "sql" / "lesson4_review_requests.sql"
DEFAULT_SCHEMA_PATHS = (LESSON4_REVIEW_REQUESTS_SCHEMA,)


def _ensure_database_parent(database_path: Path) -> None:
    """确保运行时数据库目录存在；调用方传临时文件时同样适用。"""
    database_path.parent.mkdir(parents=True, exist_ok=True)


def connect_database(database_path: str | Path | None = None) -> sqlite3.Connection:
    """创建短生命周期 SQLite 连接，并统一开启运行时 PRAGMA。"""
    resolved_path = get_database_path(str(database_path) if database_path is not None else None)
    _ensure_database_parent(resolved_path)
    connection = sqlite3.connect(resolved_path, timeout=DEFAULT_BUSY_TIMEOUT_MS / 1000, isolation_level=None)
    connection.row_factory = sqlite3.Row
    connection.execute(f"PRAGMA busy_timeout = {DEFAULT_BUSY_TIMEOUT_MS}")
    connection.execute("PRAGMA journal_mode = WAL")
    connection.execute("PRAGMA synchronous = NORMAL")
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


@contextmanager
def database_transaction(database_path: str | Path | None = None) -> Iterator[sqlite3.Connection]:
    """提供短事务边界；业务 repository 应在上下文内完成一次原子写入。"""
    connection = connect_database(database_path)
    try:
        connection.execute("BEGIN IMMEDIATE")
        yield connection
        connection.execute("COMMIT")
    except Exception:
        connection.execute("ROLLBACK")
        raise
    finally:
        connection.close()


def initialize_database(
    database_path: str | Path | None = None,
    schema_paths: Sequence[Path] = DEFAULT_SCHEMA_PATHS,
) -> Path:
    """执行已登记 schema 文件，返回实际初始化的 SQLite 路径。"""
    resolved_path = get_database_path(str(database_path) if database_path is not None else None)
    connection = connect_database(resolved_path)
    try:
        for schema_path in schema_paths:
            connection.executescript(schema_path.read_text(encoding="utf-8"))
    finally:
        connection.close()
    return resolved_path

