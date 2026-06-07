"""
文件说明：模块 4 课时 5 云端 fixture 导出工具。
职责：从课时 4 SQLite 备份的 module4_lesson4_review_requests 表中导出指定班级 request_json.cards，生成可供 inspect 对照的本地 JSON。
更新触发：课时 4 互审表结构、request_json 字段、cloud fixture 格式或班级筛选规则变化时，需要同步更新本文件。
"""

from __future__ import annotations

import argparse
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT_DIR = BACKEND_ROOT / "runtime" / "fixtures" / "module4" / "lesson5" / "cloud_lesson4_question_bank"
DEFAULT_CLASS_ID = "class-03"


def load_request_json(raw_value: Any) -> dict[str, Any] | None:
    """解析 request_json 字段；无法解析时返回 None 并跳过该记录。"""
    if not isinstance(raw_value, str) or not raw_value.strip():
        return None
    try:
        value = json.loads(raw_value)
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None


def get_table_columns(connection: sqlite3.Connection) -> set[str]:
    """读取课时 4 互审表列名，兼容不同备份版本。"""
    rows = connection.execute("PRAGMA table_info(module4_lesson4_review_requests)").fetchall()
    return {str(row[1]) for row in rows}


def row_value(row: sqlite3.Row, key: str) -> Any:
    """按列名安全取值。"""
    return row[key] if key in row.keys() else None


def iter_rows(connection: sqlite3.Connection, class_id: str) -> list[sqlite3.Row]:
    """优先用表列筛选班级；无 class_id 列时回退到 Python 解析 request_json。"""
    columns = get_table_columns(connection)
    if "request_json" not in columns:
        raise RuntimeError("module4_lesson4_review_requests 缺少 request_json 字段，无法导出 cards。")
    if "class_id" in columns:
        return connection.execute(
            "SELECT * FROM module4_lesson4_review_requests WHERE class_id = ? ORDER BY rowid",
            (class_id,),
        ).fetchall()
    return connection.execute("SELECT * FROM module4_lesson4_review_requests ORDER BY rowid").fetchall()


def request_matches_class(request_json: dict[str, Any], row: sqlite3.Row, class_id: str) -> bool:
    """判断记录是否属于目标班级，兼容列筛选和 JSON 内嵌字段。"""
    row_class_id = row_value(row, "class_id")
    if row_class_id:
        return row_class_id == class_id
    candidates = [
        request_json.get("classId"),
        request_json.get("class_id"),
        request_json.get("clazz"),
        (request_json.get("snapshotMeta") or {}).get("classId") if isinstance(request_json.get("snapshotMeta"), dict) else None,
    ]
    return class_id in candidates


def build_record(row: sqlite3.Row, request_json: dict[str, Any]) -> dict[str, Any] | None:
    """把一条互审请求转成 cloud fixture 记录。"""
    cards = request_json.get("cards")
    if not isinstance(cards, dict):
        return None
    return {
        "requestId": row_value(row, "request_id") or row_value(row, "id") or row_value(row, "requestId"),
        "authorName": row_value(row, "author_name") or request_json.get("authorName") or request_json.get("studentName"),
        "authorSeatCode": row_value(row, "author_seat_code")
        or request_json.get("authorSeatCode")
        or request_json.get("classSeatCode"),
        "status": row_value(row, "status"),
        "createdAt": row_value(row, "created_at") or row_value(row, "createdAt"),
        "snapshotMeta": request_json.get("snapshotMeta"),
        "cards": cards,
        "sourceKind": "lesson4_peer_review_snapshot",
        "isAuthoritativeV2": False,
        "sourceNote": "课时 4 互审中继库快照，仅用于对照字段形状；课时 5 seed 以学生 portfolio ready 包为权威来源。",
    }


def export_fixture(database_path: Path, class_id: str, out_dir: Path) -> Path:
    """执行 SQLite 导出并返回输出文件路径。"""
    if not database_path.exists():
        raise FileNotFoundError(f"SQLite 备份不存在：{database_path}")
    out_dir.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    try:
        rows = iter_rows(connection, class_id)
        records: list[dict[str, Any]] = []
        for row in rows:
            request_json = load_request_json(row_value(row, "request_json"))
            if request_json is None or not request_matches_class(request_json, row, class_id):
                continue
            record = build_record(row, request_json)
            if record is not None:
                records.append(record)
    finally:
        connection.close()

    payload = {
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "sourceDatabase": str(database_path),
        "classId": class_id,
        "sourceKind": "lesson4_peer_review_snapshot",
        "isAuthoritativeV2": False,
        "sourceNote": "此文件来自课时 4 互审快照，不代表课时 5 权威 V2 入库来源。",
        "records": records,
    }
    out_path = out_dir / f"lesson4_review_requests_{class_id}_cloud_snapshot.json"
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    return out_path


def main() -> None:
    """命令行入口。"""
    parser = argparse.ArgumentParser(description="从课时 4 SQLite 备份导出课时 5 cloud fixture 对照源")
    parser.add_argument("--database-path", required=True)
    parser.add_argument("--class-id", default=DEFAULT_CLASS_ID)
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    args = parser.parse_args()

    out_path = export_fixture(
        database_path=Path(args.database_path).expanduser(),
        class_id=args.class_id,
        out_dir=Path(args.out_dir).expanduser(),
    )
    print(f"已导出 cloud fixture：{out_path}")


if __name__ == "__main__":
    main()
