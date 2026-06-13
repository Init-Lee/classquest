"""
文件说明：模块 4 课时 6 公共挑战统计服务。
职责：封装 module4_public_question_stats 的增量更新与教师 overview topStats 装配，保持 challenge_service 不直接关心统计 SQL 细节。
更新触发：公共挑战统计字段、context 隔离口径、topStats 展示字段或正确率计算规则变化时，需要同步更新本文件。
"""

from __future__ import annotations

import sqlite3
from typing import Any

from . import repository


def increment_question_stats(
    connection: sqlite3.Connection,
    *,
    item_id: str,
    item_version_id: str,
    context: str,
    is_correct: bool,
    answered_at: str,
) -> None:
    """在同一事务内按题卡版本和 context 增量写入公共挑战统计。"""
    repository.upsert_public_question_stats_increment(
        connection,
        item_id=item_id,
        item_version_id=item_version_id,
        context=context,
        is_correct=is_correct,
        answered_at=answered_at,
    )


def _top_stat_item(row: sqlite3.Row) -> dict[str, Any]:
    """把 topStats SQL 行转换成稳定 camelCase 字典。"""
    return {
        "itemId": row["item_id"],
        "itemVersionId": row["item_version_id"],
        "cardKind": row["card_kind"],
        "itemShortName": row["item_short_name"],
        "totalAnswerCount": int(row["total_answer_count"] or 0),
        "totalCorrectCount": int(row["total_correct_count"] or 0),
        "totalCorrectRate": float(row["total_correct_rate"] or 0),
        "lesson6ClassAnswerCount": int(row["lesson6_class_answer_count"] or 0),
        "lesson6ClassCorrectCount": int(row["lesson6_class_correct_count"] or 0),
        "lesson6ClassCorrectRate": float(row["lesson6_class_correct_rate"] or 0),
        "publicShowcaseAnswerCount": int(row["public_showcase_answer_count"] or 0),
        "publicShowcaseCorrectCount": int(row["public_showcase_correct_count"] or 0),
        "publicShowcaseCorrectRate": float(row["public_showcase_correct_rate"] or 0),
        "lastAnsweredAt": row["last_answered_at"],
    }


def _item_stat(row: sqlite3.Row) -> dict[str, Any]:
    """把全量逐题统计 SQL 行转换成稳定 camelCase 字典。"""
    item = _top_stat_item(row)
    item["publishStatus"] = row["publish_status"]
    return item


def get_public_question_top_stats(connection: sqlite3.Connection, *, limit: int = 5) -> dict[str, list[dict[str, Any]]]:
    """读取教师 public-bank overview 所需三组 topStats。"""
    return {
        "mostAnswered": [
            _top_stat_item(row)
            for row in repository.list_public_question_top_stats(connection, order_by="most_answered", limit=limit)
        ],
        "lowestCorrectRate": [
            _top_stat_item(row)
            for row in repository.list_public_question_top_stats(
                connection,
                order_by="lowest_correct_rate",
                limit=limit,
            )
        ],
        "highestCorrectRate": [
            _top_stat_item(row)
            for row in repository.list_public_question_top_stats(
                connection,
                order_by="highest_correct_rate",
                limit=limit,
            )
        ],
    }


def get_public_question_item_stats(
    connection: sqlite3.Connection,
    *,
    visible_class_ids: list[str] | None = None,
) -> list[dict[str, Any]]:
    """读取教师 public-bank item-stats 所需全量逐题统计。"""
    return [
        _item_stat(row)
        for row in repository.list_public_question_item_stats(connection, visible_class_ids=visible_class_ids)
    ]
