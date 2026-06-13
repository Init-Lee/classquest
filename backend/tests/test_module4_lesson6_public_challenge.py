"""
文件说明：模块 4 课时 6 匿名公共挑战 API 回归测试。
职责：覆盖公共题库未就绪、3+3 低曝光抽样、不足补齐、建 run 限流、未作答隐私剥离、作答 reveal、幂等统计和 6 题完成 summary。
更新触发：Lesson6 公共挑战端点、抽样/限流规则、题卡隐私边界、answer 幂等规则、run summary 或测试 seed 结构变化时，需要同步更新本文件。
"""

from __future__ import annotations

from collections.abc import Mapping
import json
import os
from pathlib import Path
import sqlite3
import tempfile
from typing import Any
import unittest

from fastapi.testclient import TestClient

from app.main import app
from app.modules.module4.lesson6 import challenge_service
from scripts.seed_module4_lesson6_dev_demo import seed_lesson6_dev_demo
from scripts.seed_module4_accounts import seed_module4_accounts


SENSITIVE_KEYS = {
    "correctOptionKey",
    "explanation",
    "source",
    "authorName",
    "authorSeatCode",
    "classId",
    "className",
    "studentName",
}


def _contains_key(value: Any, keys: set[str]) -> bool:
    """递归判断响应 JSON 是否包含敏感字段名。"""
    if isinstance(value, Mapping):
        return any(key in keys or _contains_key(child, keys) for key, child in value.items())
    if isinstance(value, list):
        return any(_contains_key(child, keys) for child in value)
    return False


class Module4Lesson6PublicChallengeTest(unittest.TestCase):
    """模块 4 课时 6 C1b 匿名公共挑战黑盒测试。"""

    def setUp(self) -> None:
        """为每个测试准备独立数据库与 TestClient。"""
        self._temp_dir = tempfile.TemporaryDirectory()
        self.database_path = Path(self._temp_dir.name) / "classquest.sqlite"
        os.environ["CLASSQUEST_DATABASE_PATH"] = str(self.database_path)
        os.environ["CLASSQUEST_TEACHER_PASSWORD"] = "test-shared-password"
        seed_module4_accounts(str(self.database_path))
        self.client = TestClient(app)

    def tearDown(self) -> None:
        """清理临时数据库目录与测试环境变量。"""
        self._temp_dir.cleanup()
        os.environ.pop("CLASSQUEST_DATABASE_PATH", None)
        os.environ.pop("CLASSQUEST_TEACHER_PASSWORD", None)

    def _card(self, card_id: str, kind: str, correct_option_key: str = "B") -> dict[str, object]:
        """构造含答案、解析、来源与作者身份的最小 V3 题卡。"""
        return {
            "id": card_id,
            "kind": kind,
            "authorName": "测试学生",
            "authorSeatCode": "0301",
            "classId": "g7c03",
            "material": {
                "titleOrName": f"{kind} 材料 {card_id}",
                "source": {"sourceRecord": "未作答前不得展示"},
                "authorName": "测试学生",
            },
            "task": {
                "prompt": f"{kind} 判断题 {card_id}",
                "options": [
                    {"key": "A", "label": "明显存在 AI 痕迹", "isCorrect": correct_option_key == "A"},
                    {"key": "B", "label": "暂无明显 AI 痕迹", "isCorrect": correct_option_key == "B"},
                    {"key": "C", "label": "证据不足，仍需核验", "isCorrect": correct_option_key == "C"},
                ],
                "correctOptionKey": correct_option_key,
                "explanation": {"text": "作答后才揭示解析。"},
                "source": {
                    "sourceType": "ai_generated",
                    "sourceRecord": "作答后才揭示来源记录。",
                    "verificationNote": "可核验生成记录。",
                    "authorName": "不应泄露",
                },
            },
        }

    def _insert_public_card(
        self,
        index: int,
        kind: str,
        *,
        class_id: str = "g7c03",
        correct_option_key: str = "B",
        total_answer_count: int | None = None,
    ) -> tuple[str, str]:
        """直接写入一张已发布 V3 公共题卡，可选写入曝光统计。"""
        now = f"2026-06-13T12:{index:02d}:00+08:00"
        item_id = f"item_{kind}_{class_id}_{index:02d}"
        version_id = f"ver_{kind}_{class_id}_{index:02d}"
        review_id = f"review_{kind}_{class_id}_{index:02d}"
        card = self._card(f"{kind}-{index}", kind, correct_option_key)
        connection = sqlite3.connect(self.database_path)
        try:
            connection.execute("PRAGMA foreign_keys = ON")
            connection.execute(
                """
                INSERT INTO module4_question_items (
                  item_id, class_id, author_seat_code, author_name, card_kind,
                  current_v2_version_id, current_v3_version_id, status, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, NULL, ?, 'ready_for_lesson6', ?, ?)
                """,
                (item_id, class_id, f"03{index:02d}", f"测试学生{index}", kind, version_id, now, now),
            )
            connection.execute(
                """
                INSERT INTO module4_question_item_versions (
                  item_version_id, item_id, class_id, version_label, source_lesson,
                  source_session_id, base_version_id, source_package_version, source_lesson4_card_id,
                  source_package_hash, card_json, content_hash, correct_option_key, item_short_name,
                  status, created_at, updated_at
                )
                VALUES (?, ?, ?, 'v3', 'dev_seed', NULL, NULL, 'test', NULL, ?, ?, ?, ?, ?, 'ready_for_lesson6', ?, ?)
                """,
                (
                    version_id,
                    item_id,
                    class_id,
                    f"hash-{version_id}",
                    json.dumps(card, ensure_ascii=False, sort_keys=True),
                    f"content-{version_id}",
                    correct_option_key,
                    f"{kind} 题卡 {index}",
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
                VALUES (?, ?, ?, ?, ?, 'publishable', 1, 'user_xnwy_li', ?, '', ?, ?)
                """,
                (review_id, item_id, version_id, class_id, kind, now, now, now),
            )
            if total_answer_count is not None:
                connection.execute(
                    """
                    INSERT INTO module4_public_question_stats (
                      item_version_id, item_id, total_answer_count, total_correct_count, total_correct_rate,
                      lesson6_class_answer_count, lesson6_class_correct_count, lesson6_class_correct_rate,
                      public_showcase_answer_count, public_showcase_correct_count, public_showcase_correct_rate,
                      last_answered_at, updated_at
                    )
                    VALUES (?, ?, ?, 0, 0, ?, 0, 0, 0, 0, 0, ?, ?)
                    """,
                    (version_id, item_id, total_answer_count, total_answer_count, now, now),
                )
            connection.commit()
        finally:
            connection.close()
        return item_id, version_id

    def _insert_public_cards(self, news_count: int, image_count: int, *, split_classes: bool = False) -> None:
        """批量写入公共题卡，必要时分布到两个班级以验证全局题库。"""
        for index in range(1, news_count + 1):
            self._insert_public_card(index, "news", class_id="g7c03")
        for index in range(1, image_count + 1):
            class_id = "g7c05" if split_classes else "g7c03"
            self._insert_public_card(index, "image", class_id=class_id, correct_option_key="A")

    def _create_run(self, context: str = "lesson6_class") -> dict[str, object]:
        """通过公共 API 创建一轮挑战。"""
        response = self.client.post(
            "/api/v1/module4/public-challenge/runs",
            headers={"x-classquest-anon-session": f"anon-{self._testMethodName}", "user-agent": "lesson6-test"},
            json={"context": context},
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def _run_items(self, run_id: str) -> list[sqlite3.Row]:
        """读取指定 run 的 run_items。"""
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        try:
            rows = connection.execute(
                """
                SELECT ri.run_item_id, ri.item_version_id, ri.card_kind, ri.order_index, i.class_id
                FROM module4_public_challenge_run_items ri
                JOIN module4_question_items i ON i.item_id = ri.item_id
                WHERE ri.run_id = ?
                ORDER BY ri.order_index
                """,
                (run_id,),
            ).fetchall()
        finally:
            connection.close()
        return list(rows)

    def test_create_run_returns_public_bank_not_ready_when_less_than_six(self) -> None:
        """公共题库少于 6 题时创建 run 返回 409 与 availableCount。"""
        self._insert_public_cards(2, 3)

        response = self.client.post(
            "/api/v1/module4/public-challenge/runs",
            json={"context": "lesson6_class"},
        )

        self.assertEqual(response.status_code, 409)
        body = response.json()
        self.assertEqual(body["error"], "public_bank_not_ready")
        self.assertEqual(body["availableCount"], 5)

    def test_dev_demo_seed_provides_six_public_challenge_questions(self) -> None:
        """Lesson6 本地演示 seed 应提供足够公共挑战抽取的 6 条 active public 题卡。"""
        stats = seed_lesson6_dev_demo(str(self.database_path), reset=True)

        response = self.client.post(
            "/api/v1/module4/public-challenge/runs",
            headers={"x-classquest-anon-session": "dev-demo-seed-test", "user-agent": "lesson6-test"},
            json={"context": "public_showcase"},
        )

        self.assertEqual(stats["activePublic"], 6)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["questionCount"], 6)

    def test_create_run_draws_six_globally_balanced_without_duplicate_versions(self) -> None:
        """公共挑战从跨班全局题库恰好抽 6 题，并优先保持 3+3。"""
        self._insert_public_cards(4, 4, split_classes=True)

        run = self._create_run()
        rows = self._run_items(run["runId"])

        self.assertEqual(run["questionCount"], 6)
        self.assertEqual(len(rows), 6)
        self.assertEqual(len({row["item_version_id"] for row in rows}), 6)
        self.assertEqual(sum(1 for row in rows if row["card_kind"] == "news"), 3)
        self.assertEqual(sum(1 for row in rows if row["card_kind"] == "image"), 3)
        self.assertEqual({row["class_id"] for row in rows}, {"g7c03", "g7c05"})

    def test_create_run_fills_from_other_kind_when_one_kind_short(self) -> None:
        """单一 kind 不足 3 题时，从另一 kind 补齐到 6 题。"""
        self._insert_public_cards(2, 6)

        run = self._create_run()
        rows = self._run_items(run["runId"])

        self.assertEqual(len(rows), 6)
        self.assertEqual(sum(1 for row in rows if row["card_kind"] == "news"), 2)
        self.assertEqual(sum(1 for row in rows if row["card_kind"] == "image"), 4)

    def test_create_run_returns_429_after_same_anon_session_and_ip_reaches_limit(self) -> None:
        """同匿名 session/IP 短时间重复创建 run 达到限制后返回 429。"""
        self._insert_public_cards(3, 3)
        headers = {
            "x-classquest-anon-session": "rate-limit-anon",
            "x-forwarded-for": "198.51.100.6",
            "user-agent": "lesson6-rate-limit-test",
        }
        for _ in range(challenge_service.RATE_LIMIT_MAX_RUNS):
            response = self.client.post(
                "/api/v1/module4/public-challenge/runs",
                headers=headers,
                json={"context": "lesson6_class"},
            )
            self.assertEqual(response.status_code, 200, response.text)

        limited = self.client.post(
            "/api/v1/module4/public-challenge/runs",
            headers=headers,
            json={"context": "lesson6_class"},
        )

        self.assertEqual(limited.status_code, 429)
        self.assertIn("公共挑战创建过于频繁", limited.json()["detail"])

    def test_current_question_does_not_leak_answer_source_or_author_identity(self) -> None:
        """current 响应不含答案、解析、来源或作者身份字段。"""
        self._insert_public_cards(3, 3)
        run = self._create_run()

        response = self.client.get(f"/api/v1/module4/public-challenge/runs/{run['runId']}/current")

        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertFalse(_contains_key(body["material"], SENSITIVE_KEYS), body)
        self.assertFalse(_contains_key(body["task"], SENSITIVE_KEYS), body)
        self.assertIn("runItemId", body)

    def test_answer_reveals_source_but_remains_idempotent_without_duplicate_stats(self) -> None:
        """answer reveal 含标准答案/解析/来源，重复提交不重复统计。"""
        self._insert_public_cards(3, 3)
        run = self._create_run()
        current = self.client.get(f"/api/v1/module4/public-challenge/runs/{run['runId']}/current").json()

        first = self.client.post(
            f"/api/v1/module4/public-challenge/runs/{run['runId']}/answers",
            json={"runItemId": current["runItemId"], "selectedOptionKey": "B", "durationMs": 1200},
        )
        repeat = self.client.post(
            f"/api/v1/module4/public-challenge/runs/{run['runId']}/answers",
            json={"runItemId": current["runItemId"], "selectedOptionKey": "A", "durationMs": 9999},
        )

        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(repeat.status_code, 200, repeat.text)
        first_body = first.json()
        repeat_body = repeat.json()
        self.assertEqual(repeat_body["correctOptionKey"], first_body["correctOptionKey"])
        self.assertEqual(repeat_body["isCorrect"], first_body["isCorrect"])
        self.assertIn("text", first_body["explanation"])
        self.assertIn("sourceRecord", first_body["source"])
        self.assertNotIn("authorName", first_body["source"])

        connection = sqlite3.connect(self.database_path)
        try:
            answer_count = connection.execute("SELECT COUNT(*) FROM module4_public_challenge_answers").fetchone()[0]
            stats_count = connection.execute("SELECT SUM(total_answer_count) FROM module4_public_question_stats").fetchone()[0]
        finally:
            connection.close()
        self.assertEqual(answer_count, 1)
        self.assertEqual(stats_count, 1)

    def test_summary_completed_after_answering_all_six_questions(self) -> None:
        """6 题答完后 summary 返回 completed=true。"""
        self._insert_public_cards(3, 3)
        run = self._create_run()

        for _ in range(6):
            current = self.client.get(f"/api/v1/module4/public-challenge/runs/{run['runId']}/current")
            self.assertEqual(current.status_code, 200, current.text)
            run_item_id = current.json()["runItemId"]
            answered = self.client.post(
                f"/api/v1/module4/public-challenge/runs/{run['runId']}/answers",
                json={"runItemId": run_item_id, "selectedOptionKey": "B", "durationMs": 1000},
            )
            self.assertEqual(answered.status_code, 200, answered.text)

        summary = self.client.get(f"/api/v1/module4/public-challenge/runs/{run['runId']}/summary")

        self.assertEqual(summary.status_code, 200, summary.text)
        self.assertTrue(summary.json()["completed"])
        self.assertEqual(summary.json()["answeredCount"], 6)
