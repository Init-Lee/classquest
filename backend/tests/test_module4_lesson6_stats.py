"""
文件说明：模块 4 课时 6 公共挑战统计回归测试。
职责：验证 lesson6_class 与 public_showcase 统计隔离、runtime 原始 IP/User-Agent 不落库，以及教师 public-bank overview 的 challengeStats/topStats 数值。
更新触发：公共挑战 stats 表结构、增量统计规则、runtime 隐私字段、教师 overview 契约或测试 seed 结构变化时，需要同步更新本文件。
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest

from fastapi.testclient import TestClient

from app.main import app
from scripts.seed_module4_accounts import seed_module4_accounts


class Module4Lesson6StatsTest(unittest.TestCase):
    """模块 4 课时 6 C1b 公共挑战统计测试。"""

    def setUp(self) -> None:
        """为每个测试准备独立数据库与统一后端口令。"""
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

    def _card(self, card_id: str, kind: str, correct_option_key: str) -> dict[str, object]:
        """构造用于统计测试的最小 V3 题卡。"""
        return {
            "id": card_id,
            "kind": kind,
            "material": {"titleOrName": f"{kind} 材料 {card_id}"},
            "task": {
                "prompt": f"{kind} 判断题 {card_id}",
                "options": [
                    {"key": "A", "label": "选项 A"},
                    {"key": "B", "label": "选项 B"},
                    {"key": "C", "label": "选项 C"},
                ],
                "correctOptionKey": correct_option_key,
                "explanation": {"text": "统计测试解析。"},
                "source": {
                    "sourceType": "human_curated",
                    "sourceRecord": "统计测试来源。",
                    "verificationNote": "统计测试核验。",
                },
            },
        }

    def _insert_public_card(self, index: int, kind: str, correct_option_key: str) -> None:
        """直接写入一张已发布 V3 公共题卡。"""
        now = f"2026-06-13T13:{index:02d}:00+08:00"
        item_id = f"stats_item_{kind}_{index:02d}"
        version_id = f"stats_ver_{kind}_{index:02d}"
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
                VALUES (?, 'g7c03', ?, ?, ?, NULL, ?, 'ready_for_lesson6', ?, ?)
                """,
                (item_id, f"04{index:02d}", f"统计学生{index}", kind, version_id, now, now),
            )
            connection.execute(
                """
                INSERT INTO module4_question_item_versions (
                  item_version_id, item_id, class_id, version_label, source_lesson,
                  source_session_id, base_version_id, source_package_version, source_lesson4_card_id,
                  source_package_hash, card_json, content_hash, correct_option_key, item_short_name,
                  status, created_at, updated_at
                )
                VALUES (?, ?, 'g7c03', 'v3', 'dev_seed', NULL, NULL, 'test', NULL, ?, ?, ?, ?, ?, 'ready_for_lesson6', ?, ?)
                """,
                (
                    version_id,
                    item_id,
                    f"hash-{version_id}",
                    json.dumps(card, ensure_ascii=False, sort_keys=True),
                    f"content-{version_id}",
                    correct_option_key,
                    f"统计 {kind} 题卡 {index}",
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
                VALUES (?, ?, ?, 'g7c03', ?, 'publishable', 1, 'user_xnwy_li', ?, '', ?, ?)
                """,
                (f"stats_review_{kind}_{index:02d}", item_id, version_id, kind, now, now, now),
            )
            connection.commit()
        finally:
            connection.close()

    def _insert_public_cards(self) -> None:
        """写入满足公共挑战 3+3 的题卡集合。"""
        for index in range(1, 4):
            self._insert_public_card(index, "news", "B")
            self._insert_public_card(index, "image", "A")

    def _create_run(self, context: str, *, anon_session: str = "stats-anon") -> str:
        """通过公共 API 创建挑战 run，返回 runId。"""
        response = self.client.post(
            "/api/v1/module4/public-challenge/runs",
            headers={
                "x-classquest-anon-session": anon_session,
                "x-forwarded-for": "203.0.113.10",
                "user-agent": "Raw Stats Test Agent/1.0",
            },
            json={"context": context},
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["runId"]

    def _answer_current(self, run_id: str, *, correct: bool) -> dict[str, object]:
        """作答当前题，可指定答对或答错。"""
        current = self.client.get(f"/api/v1/module4/public-challenge/runs/{run_id}/current")
        self.assertEqual(current.status_code, 200, current.text)
        body = current.json()
        correct_key = "B" if body["kind"] == "news" else "A"
        selected = correct_key if correct else ("A" if correct_key != "A" else "B")
        response = self.client.post(
            f"/api/v1/module4/public-challenge/runs/{run_id}/answers",
            json={"runItemId": body["runItemId"], "selectedOptionKey": selected, "durationMs": 2000},
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def _login(self, account: str = "xnwy-li", password: str = "test-shared-password") -> str:
        """登录指定教师或 demo 账号并返回 token。"""
        response = self.client.post(
            "/api/v1/module4/auth/login",
            json={"account": account, "password": password},
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["token"]

    def test_stats_isolate_context_counts_and_total_is_sum(self) -> None:
        """两个 context 各答一题后，分 context 计数隔离且 total 等于二者之和。"""
        self._insert_public_cards()
        class_run_id = self._create_run("lesson6_class", anon_session="stats-class")
        showcase_run_id = self._create_run("public_showcase", anon_session="stats-showcase")
        self._answer_current(class_run_id, correct=True)
        self._answer_current(showcase_run_id, correct=False)

        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        try:
            row = connection.execute(
                """
                SELECT
                  SUM(total_answer_count) AS total_answers,
                  SUM(total_correct_count) AS total_correct,
                  SUM(lesson6_class_answer_count) AS class_answers,
                  SUM(lesson6_class_correct_count) AS class_correct,
                  SUM(public_showcase_answer_count) AS showcase_answers,
                  SUM(public_showcase_correct_count) AS showcase_correct
                FROM module4_public_question_stats
                """
            ).fetchone()
        finally:
            connection.close()

        self.assertEqual(row["total_answers"], row["class_answers"] + row["showcase_answers"])
        self.assertEqual(row["total_correct"], row["class_correct"] + row["showcase_correct"])
        self.assertEqual(row["class_answers"], 1)
        self.assertEqual(row["class_correct"], 1)
        self.assertEqual(row["showcase_answers"], 1)
        self.assertEqual(row["showcase_correct"], 0)

    def test_runs_and_answers_store_only_hashes_not_raw_ip_or_user_agent(self) -> None:
        """runs/answers 不保存原始 IP 或 UA，只在 runs 表保存哈希列。"""
        self._insert_public_cards()
        run_id = self._create_run("public_showcase", anon_session="privacy-check")
        self._answer_current(run_id, correct=True)

        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        try:
            run = connection.execute(
                """
                SELECT anon_session_hash, ip_hash, user_agent_hash
                FROM module4_public_challenge_runs
                WHERE run_id = ?
                """,
                (run_id,),
            ).fetchone()
            answer_columns = {
                row["name"]
                for row in connection.execute("PRAGMA table_info(module4_public_challenge_answers)").fetchall()
            }
        finally:
            connection.close()

        self.assertIsNotNone(run["anon_session_hash"])
        self.assertIsNotNone(run["ip_hash"])
        self.assertIsNotNone(run["user_agent_hash"])
        self.assertNotEqual(run["ip_hash"], "203.0.113.10")
        self.assertNotEqual(run["user_agent_hash"], "Raw Stats Test Agent/1.0")
        self.assertNotIn("ip", answer_columns)
        self.assertNotIn("user_agent", answer_columns)

    def test_teacher_overview_returns_challenge_stats_and_top_stats(self) -> None:
        """教师 overview 返回公共挑战运行统计和 topStats。"""
        self._insert_public_cards()
        class_run_id = self._create_run("lesson6_class", anon_session="overview-class")
        showcase_run_id = self._create_run("public_showcase", anon_session="overview-showcase")
        self._answer_current(class_run_id, correct=True)
        self._answer_current(showcase_run_id, correct=False)
        token = self._login()

        response = self.client.get(
            "/api/v1/teacher/module4/lesson6/public-bank/overview",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertEqual(body["challengeStats"]["lesson6ClassRuns"], 1)
        self.assertEqual(body["challengeStats"]["publicShowcaseRuns"], 1)
        self.assertEqual(body["challengeStats"]["totalRuns"], 2)
        self.assertEqual(body["challengeStats"]["totalAnswers"], 2)
        self.assertEqual(body["challengeStats"]["overallCorrectRate"], 0.5)
        self.assertGreaterEqual(len(body["topStats"]["mostAnswered"]), 1)
        self.assertGreaterEqual(len(body["topStats"]["lowestCorrectRate"]), 1)
        self.assertGreaterEqual(len(body["topStats"]["highestCorrectRate"]), 1)
        self.assertIn("totalAnswerCount", body["topStats"]["mostAnswered"][0])

    def test_teacher_item_stats_returns_all_items_context_counts_zero_fallback_and_demo_readonly(self) -> None:
        """item-stats 返回全量可发布题卡、context 拆分、0 兜底，且 demo 可只读访问。"""
        self._insert_public_cards()
        class_run_id = self._create_run("lesson6_class", anon_session="item-stats-class")
        showcase_run_id = self._create_run("public_showcase", anon_session="item-stats-showcase")
        self._answer_current(class_run_id, correct=True)
        self._answer_current(showcase_run_id, correct=False)
        token = self._login()

        response = self.client.get(
            "/api/v1/teacher/module4/lesson6/public-bank/item-stats",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertEqual(len(body["items"]), 6)
        self.assertEqual(sum(item["totalAnswerCount"] for item in body["items"]), 2)
        self.assertEqual(sum(item["totalCorrectCount"] for item in body["items"]), 1)
        self.assertEqual(sum(item["lesson6ClassAnswerCount"] for item in body["items"]), 1)
        self.assertEqual(sum(item["lesson6ClassCorrectCount"] for item in body["items"]), 1)
        self.assertEqual(sum(item["publicShowcaseAnswerCount"] for item in body["items"]), 1)
        self.assertEqual(sum(item["publicShowcaseCorrectCount"] for item in body["items"]), 0)
        self.assertGreaterEqual(len([item for item in body["items"] if item["totalAnswerCount"] == 0]), 4)
        self.assertTrue(all(item["publishStatus"] == "publishable" for item in body["items"]))
        forbidden_fields = {
            "authorName",
            "authorSeatCode",
            "studentDisplay",
            "runId",
            "anonSessionId",
            "ip",
            "userAgent",
        }
        self.assertTrue(forbidden_fields.isdisjoint(body["items"][0].keys()))

        demo_token = self._login("xnwy-demo", password="")
        demo_response = self.client.get(
            "/api/v1/teacher/module4/lesson6/public-bank/item-stats",
            headers={"Authorization": f"Bearer {demo_token}"},
        )
        self.assertEqual(demo_response.status_code, 200, demo_response.text)
        self.assertEqual(len(demo_response.json()["items"]), 6)
