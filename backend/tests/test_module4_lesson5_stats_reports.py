"""
文件说明：模块 4 课时 5 C6a compute-stats、analytics 与 my-report API 回归测试。
职责：使用临时 SQLite 覆盖统计计算 phase gate、item_stats 聚合与幂等覆盖、analytics 只读权限、my-report 身份校验和 stats_status 阈值。
更新触发：C6a stats/report API 契约、统计口径、phase gate、item_stats 表结构或诊断提示规则变化时，需要同步更新本文件。
"""

from __future__ import annotations

import os
from pathlib import Path
import sqlite3
import tempfile
import unittest

from fastapi.testclient import TestClient

from app.main import app
from app.modules.module4.lesson5.stats_service import resolve_stats_status
from scripts.seed_module4_accounts import seed_module4_accounts


def _card(card_id: str, kind: str, correct_option_key: str) -> dict[str, object]:
    """构造带标准答案的最小 V2 题卡。"""
    return {
        "id": card_id,
        "kind": kind,
        "material": {"title": f"{kind} 材料 {card_id}"},
        "task": {
            "question": f"{kind} 判断题 {card_id}",
            "options": [
                {"key": "A", "text": "选项 A"},
                {"key": "B", "text": "选项 B"},
                {"key": "C", "text": "选项 C"},
            ],
            "correctOptionKey": correct_option_key,
        },
    }


def _submission_payload(seat_code: str, student_name: str) -> dict[str, object]:
    """构造 lesson4-ready-for-lesson5-v1 提交包。"""
    return {
        "classId": "g7c03",
        "studentName": student_name,
        "classSeatCode": seat_code,
        "lesson5ClientId": f"l5c_test_{seat_code}",
        "readyPackage": {
            "packageVersion": "lesson4-ready-for-lesson5-v1",
            "createdAt": "2026-06-06T20:00:00+08:00",
            "student": {"name": student_name, "className": "初一（3）班", "classSeatCode": seat_code},
            "cards": {
                "news": _card(f"news-card-{seat_code}", "news", "B"),
                "image": _card(f"image-card-{seat_code}", "image", "A"),
            },
        },
    }


class Module4Lesson5StatsReportsApiTest(unittest.TestCase):
    """模块 4 课时 5 C6a stats/report API 黑盒测试。"""

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

    def _login(self, account: str = "xnwy-li", password: str = "test-shared-password") -> str:
        """使用指定账号登录并返回 token。"""
        response = self.client.post(
            "/api/v1/module4/auth/login",
            json={"account": account, "password": password},
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["token"]

    def _headers(self, token: str) -> dict[str, str]:
        """生成 Bearer token 请求头。"""
        return {"Authorization": f"Bearer {token}"}

    def _submit_many(self, count: int) -> None:
        """提交指定数量学生的 news/image V2 到长期题池。"""
        for index in range(1, count + 1):
            seat_code = f"03{index:02d}"
            response = self.client.post(
                "/api/v1/module4/lesson5/v2-submissions",
                json=_submission_payload(seat_code, f"测试学生{index}"),
            )
            self.assertEqual(response.status_code, 200, response.text)

    def _create_locked_session(self, question_count: int = 6) -> tuple[str, str]:
        """创建并锁定 g7c03 session，返回 session_id 与教师 token。"""
        token = self._login()
        created = self.client.post(
            "/api/v1/teacher/module4/lesson5/sessions",
            headers=self._headers(token),
            json={
                "classId": "g7c03",
                "runType": "normal",
                "title": f"C6a 测试会话 {question_count}",
                "settings": {"questionCount": question_count},
            },
        )
        self.assertEqual(created.status_code, 200, created.text)
        session_id = created.json()["sessionId"]
        locked = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/lock-pool",
            headers=self._headers(token),
        )
        self.assertEqual(locked.status_code, 200, locked.text)
        return session_id, token

    def _advance_phase(self, session_id: str, token: str, target_phase: str) -> int:
        """推进 phase 并返回状态码。"""
        response = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/phase",
            headers=self._headers(token),
            json={"targetPhase": target_phase},
        )
        return response.status_code

    def _lock_trial(self, session_id: str, token: str) -> None:
        """把 session 推进到 trial_locked。"""
        self.assertEqual(self._advance_phase(session_id, token, "trial_open"), 200)
        self.assertEqual(self._advance_phase(session_id, token, "trial_locked"), 200)

    def _compute_stats(self, session_id: str, token: str) -> dict[str, object]:
        """调用 compute-stats 并返回响应 JSON。"""
        response = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/compute-stats",
            headers=self._headers(token),
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def _attach(self, session_id: str, seat_code: str = "0301", student_name: str = "测试学生1") -> dict[str, object]:
        """按指定学生身份 attach participant 并返回响应 JSON。"""
        response = self.client.post(
            "/api/v1/module4/lesson5/participants/attach",
            json={
                "sessionId": session_id,
                "classId": "g7c03",
                "studentName": student_name,
                "classSeatCode": seat_code,
                "lesson5ClientId": f"l5c_test_{seat_code}",
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def _pool_rows(self, session_id: str) -> list[sqlite3.Row]:
        """读取冻结池题卡，供测试直接构造统计样本。"""
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        try:
            rows = connection.execute(
                """
                SELECT session_pool_item_id, item_id, item_version_id, card_kind
                FROM module4_lesson5_session_pool_items
                WHERE session_id = ?
                ORDER BY card_kind ASC, author_seat_code ASC, item_version_id ASC
                """,
                (session_id,),
            ).fetchall()
        finally:
            connection.close()
        return list(rows)

    def _insert_stats_sources(self, session_id: str, pool_rows: list[sqlite3.Row]) -> None:
        """直接写入 answer/rating 样本，形成 insufficient/preliminary/stable 三档。"""
        connection = sqlite3.connect(self.database_path)
        try:
            now = "2026-06-07T15:00:00+08:00"
            for index in range(1, 9):
                seat_code = f"09{index:02d}"
                connection.execute(
                    """
                    INSERT INTO module4_lesson5_participants (
                      participant_id, session_id, class_id, student_name, class_seat_code,
                      lesson5_client_id, joined_at, last_seen_at
                    )
                    VALUES (?, ?, 'g7c03', ?, ?, ?, ?, ?)
                    """,
                    (f"l5p_stats_{index}", session_id, f"统计学生{index}", seat_code, f"l5c_stats_{index}", now, now),
                )

            counts = [2, 3, 8]
            correct_counts = [1, 2, 6]
            for item_index, pool_row in enumerate(pool_rows[:3]):
                for answer_index in range(1, counts[item_index] + 1):
                    participant_id = f"l5p_stats_{answer_index}"
                    assignment_id = f"l5asn_stats_{item_index}_{answer_index}"
                    answer_id = f"l5ans_stats_{item_index}_{answer_index}"
                    rating_id = f"l5rt_stats_{item_index}_{answer_index}"
                    is_correct = 1 if answer_index <= correct_counts[item_index] else 0
                    issue_flags = '["source_insufficient"]' if answer_index == 1 else "[]"
                    comment = "来源可以更具体。" if answer_index == 1 else ""
                    connection.execute(
                        """
                        INSERT INTO module4_lesson5_assignments (
                          assignment_id, session_id, participant_id, respondent_seat_code,
                          session_pool_item_id, item_id, item_version_id, order_index,
                          assignment_reason, is_required, status, created_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'stats_test', 1, 'rated', ?)
                        """,
                        (
                            assignment_id,
                            session_id,
                            participant_id,
                            f"09{answer_index:02d}",
                            pool_row["session_pool_item_id"],
                            pool_row["item_id"],
                            pool_row["item_version_id"],
                            item_index + 1,
                            now,
                        ),
                    )
                    connection.execute(
                        """
                        INSERT INTO module4_lesson5_answers (
                          answer_id, session_id, assignment_id, participant_id, item_id, item_version_id,
                          respondent_seat_code, selected_option_key, correct_option_key, is_correct,
                          is_first_valid_attempt, excluded_from_stats, excluded_reason, idempotency_key, answered_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'A', 'A', ?, 1, 0, NULL, NULL, ?)
                        """,
                        (
                            answer_id,
                            session_id,
                            assignment_id,
                            participant_id,
                            pool_row["item_id"],
                            pool_row["item_version_id"],
                            f"09{answer_index:02d}",
                            is_correct,
                            now,
                        ),
                    )
                    connection.execute(
                        """
                        INSERT INTO module4_lesson5_ratings (
                          rating_id, session_id, answer_id, assignment_id, participant_id, item_id, item_version_id,
                          respondent_seat_code, clarity, thinking_value, explanation_helpfulness,
                          issue_flags_json, comment, is_first_valid_rating, excluded_from_stats, rated_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 3, 2, 3, ?, ?, 1, 0, ?)
                        """,
                        (
                            rating_id,
                            session_id,
                            answer_id,
                            assignment_id,
                            participant_id,
                            pool_row["item_id"],
                            pool_row["item_version_id"],
                            f"09{answer_index:02d}",
                            issue_flags,
                            comment,
                            now,
                        ),
                    )
            connection.commit()
        finally:
            connection.close()

    def _item_stats_count(self, session_id: str) -> int:
        """直接统计 item_stats 行数。"""
        connection = sqlite3.connect(self.database_path)
        try:
            row = connection.execute(
                "SELECT COUNT(*) FROM module4_lesson5_item_stats WHERE session_id = ?",
                (session_id,),
            ).fetchone()
        finally:
            connection.close()
        self.assertIsNotNone(row)
        return int(row[0])

    def test_compute_rejects_before_trial_locked(self) -> None:
        """trial_locked 前 compute-stats 被拒。"""
        self._submit_many(4)
        session_id, token = self._create_locked_session()

        response = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/compute-stats",
            headers=self._headers(token),
        )
        self.assertEqual(response.status_code, 409)

    def test_compute_writes_item_stats_and_status_boundaries(self) -> None:
        """compute 写入正确率、三维均值、issue 率，并覆盖三档 stats_status。"""
        self._submit_many(8)
        session_id, token = self._create_locked_session()
        self._lock_trial(session_id, token)
        pool_rows = self._pool_rows(session_id)
        self._insert_stats_sources(session_id, pool_rows)

        body = self._compute_stats(session_id, token)
        self.assertEqual(body["computedItemCount"], len(pool_rows))
        self.assertEqual(body["statsStatusBreakdown"], {"insufficient": len(pool_rows) - 2, "preliminary": 1, "stable": 1})

        analytics = self.client.get(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/analytics",
            headers=self._headers(token),
        )
        self.assertEqual(analytics.status_code, 200, analytics.text)
        items_by_version = {item["itemVersionId"]: item for item in analytics.json()["items"]}
        insufficient = items_by_version[pool_rows[0]["item_version_id"]]
        preliminary = items_by_version[pool_rows[1]["item_version_id"]]
        stable = items_by_version[pool_rows[2]["item_version_id"]]
        self.assertEqual(insufficient["statsStatus"], "insufficient")
        self.assertEqual(preliminary["statsStatus"], "preliminary")
        self.assertEqual(stable["statsStatus"], "stable")
        self.assertEqual(preliminary["validAnswerCount"], 3)
        self.assertAlmostEqual(preliminary["correctRate"], 0.6667)
        self.assertEqual(preliminary["avgClarity"], 3.0)
        self.assertEqual(preliminary["avgThinkingValue"], 2.0)
        self.assertEqual(preliminary["avgExplanationHelpfulness"], 3.0)
        self.assertEqual(preliminary["issueFlagCount"], 1)
        self.assertAlmostEqual(preliminary["issueFlagRate"], 0.3333)
        self.assertEqual(preliminary["issueFlags"], ["source_insufficient"])
        self.assertEqual(preliminary["sampleComments"], ["来源可以更具体。"])

    def test_compute_is_idempotent_and_overwrites_existing_rows(self) -> None:
        """重复 compute 覆盖重算，不产生重复 item_stats 行。"""
        self._submit_many(8)
        session_id, token = self._create_locked_session()
        self._lock_trial(session_id, token)
        pool_rows = self._pool_rows(session_id)
        self._insert_stats_sources(session_id, pool_rows)
        self._compute_stats(session_id, token)
        first_count = self._item_stats_count(session_id)

        connection = sqlite3.connect(self.database_path)
        try:
            connection.execute(
                """
                UPDATE module4_lesson5_answers
                SET is_correct = 1
                WHERE session_id = ? AND item_version_id = ?
                """,
                (session_id, pool_rows[1]["item_version_id"]),
            )
            connection.commit()
        finally:
            connection.close()

        self._compute_stats(session_id, token)
        self.assertEqual(self._item_stats_count(session_id), first_count)
        analytics = self.client.get(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/analytics",
            headers=self._headers(token),
        ).json()
        item = next(item for item in analytics["items"] if item["itemVersionId"] == pool_rows[1]["item_version_id"])
        self.assertEqual(item["correctRate"], 1.0)

    def test_open_analytics_requires_computed_stats(self) -> None:
        """未 compute 直接开放 analytics_open 被拒 409。"""
        self._submit_many(4)
        session_id, token = self._create_locked_session()
        self._lock_trial(session_id, token)

        response = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/phase",
            headers=self._headers(token),
            json={"targetPhase": "analytics_open"},
        )
        self.assertEqual(response.status_code, 409)

    def test_analytics_teacher_and_demo_readonly(self) -> None:
        """教师可读 analytics，demo 可读但不能 compute。"""
        self._submit_many(4)
        session_id, token = self._create_locked_session()
        self._lock_trial(session_id, token)
        self._compute_stats(session_id, token)

        teacher = self.client.get(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/analytics",
            headers=self._headers(token),
        )
        self.assertEqual(teacher.status_code, 200, teacher.text)
        self.assertNotIn("authorSeatCode", teacher.json()["items"][0])

        demo_token = self._login("xnwy-demo", password="")
        demo = self.client.get(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/analytics",
            headers=self._headers(demo_token),
        )
        self.assertEqual(demo.status_code, 200, demo.text)
        demo_write = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/compute-stats",
            headers=self._headers(demo_token),
        )
        self.assertEqual(demo_write.status_code, 403)

    def test_my_report_only_returns_own_items_and_rejects_impersonation(self) -> None:
        """my-report 仅返回本人作者题卡，participant/client 越权被拒。"""
        self._submit_many(4)
        session_id, token = self._create_locked_session()
        self._lock_trial(session_id, token)
        self._compute_stats(session_id, token)
        self.assertEqual(self._advance_phase(session_id, token, "analytics_open"), 200)
        mine = self._attach(session_id, "0301", "测试学生1")
        other = self._attach(session_id, "0302", "测试学生2")

        report = self.client.get(
            f"/api/v1/module4/lesson5/sessions/{session_id}/my-report",
            params={"participantId": mine["participantId"], "lesson5ClientId": "l5c_test_0301"},
        )
        self.assertEqual(report.status_code, 200, report.text)
        self.assertEqual(len(report.json()["items"]), 2)
        self.assertTrue(all("diagnosisHints" in item for item in report.json()["items"]))

        impersonation = self.client.get(
            f"/api/v1/module4/lesson5/sessions/{session_id}/my-report",
            params={"participantId": other["participantId"], "lesson5ClientId": "l5c_test_0301"},
        )
        self.assertEqual(impersonation.status_code, 403)

    def test_my_report_rejects_before_analytics_open(self) -> None:
        """phase 未到 analytics_open 时学生 my-report 被拒。"""
        self._submit_many(4)
        session_id, token = self._create_locked_session()
        self._lock_trial(session_id, token)
        self._compute_stats(session_id, token)
        mine = self._attach(session_id, "0301", "测试学生1")

        response = self.client.get(
            f"/api/v1/module4/lesson5/sessions/{session_id}/my-report",
            params={"participantId": mine["participantId"], "lesson5ClientId": "l5c_test_0301"},
        )
        self.assertEqual(response.status_code, 409)

    def test_stats_status_boundaries(self) -> None:
        """stats_status 三档阈值保持固定。"""
        self.assertEqual(resolve_stats_status(0).value, "insufficient")
        self.assertEqual(resolve_stats_status(2).value, "insufficient")
        self.assertEqual(resolve_stats_status(3).value, "preliminary")
        self.assertEqual(resolve_stats_status(7).value, "preliminary")
        self.assertEqual(resolve_stats_status(8).value, "stable")


if __name__ == "__main__":
    unittest.main()
