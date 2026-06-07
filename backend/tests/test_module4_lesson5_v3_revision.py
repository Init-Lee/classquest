"""
文件说明：模块 4 课时 5 C7a V3 修订、完成摘要与教师 revision-plans API 回归测试。
职责：使用临时 SQLite 覆盖 analytics_open 后学生本人题卡 V3 入库、幂等去重、completion-summary 隐私边界与教师/demo V3 学习任务只读观察。
更新触发：C7a V3 revision API 契约、readyForLesson6 口径、revision_plans 表结构、完成摘要字段或 phase 状态机变化时，需要同步更新本文件。
"""

from __future__ import annotations

import os
from pathlib import Path
import sqlite3
import tempfile
import unittest

from fastapi.testclient import TestClient

from app.main import app
from scripts.seed_module4_accounts import seed_module4_accounts


def _card(card_id: str, kind: str, correct_option_key: str) -> dict[str, object]:
    """构造带标准答案的最小题卡。"""
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


class Module4Lesson5V3RevisionApiTest(unittest.TestCase):
    """模块 4 课时 5 C7a V3 revision API 黑盒测试。"""

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

    def _create_locked_session(self) -> tuple[str, str]:
        """创建并锁定 g7c03 session，返回 session_id 与教师 token。"""
        token = self._login()
        created = self.client.post(
            "/api/v1/teacher/module4/lesson5/sessions",
            headers=self._headers(token),
            json={
                "classId": "g7c03",
                "runType": "normal",
                "title": "C7a V3 测试会话",
                "settings": {"questionCount": 6},
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

    def _open_analytics(self, session_id: str, token: str) -> None:
        """把 session 推进到 analytics_open。"""
        self.assertEqual(self._advance_phase(session_id, token, "trial_open"), 200)
        self.assertEqual(self._advance_phase(session_id, token, "trial_locked"), 200)
        computed = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/compute-stats",
            headers=self._headers(token),
        )
        self.assertEqual(computed.status_code, 200, computed.text)
        self.assertEqual(self._advance_phase(session_id, token, "analytics_open"), 200)

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

    def _pool_item(self, session_id: str, seat_code: str, kind: str) -> sqlite3.Row:
        """读取冻结池中指定学生的题卡 item。"""
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        try:
            row = connection.execute(
                """
                SELECT item_id, item_version_id, card_kind
                FROM module4_lesson5_session_pool_items
                WHERE session_id = ? AND author_seat_code = ? AND card_kind = ?
                """,
                (session_id, seat_code, kind),
            ).fetchone()
        finally:
            connection.close()
        self.assertIsNotNone(row)
        return row

    def _v3_payload(self, session_id: str, participant_id: str, row: sqlite3.Row) -> dict[str, object]:
        """构造 V3 提交请求体。"""
        return {
            "sessionId": session_id,
            "participantId": participant_id,
            "lesson5ClientId": "l5c_test_0301",
            "itemId": row["item_id"],
            "baseV2VersionId": row["item_version_id"],
            "revisionPlan": {
                "revisionAction": "minor_fix",
                "diagnosis": {"selectedProblems": ["low_clarity"], "evidence": "同学反馈说明不够清晰。"},
                "revisionReason": "补充材料说明。",
                "expectedEffect": "降低误解概率。",
            },
            "v3CardJson": _card(f"{row['card_kind']}-card-0301-v3", row["card_kind"], "B"),
        }

    def test_v3_submission_allows_analytics_open_and_requires_own_item(self) -> None:
        """analytics_open 后可提交 V3，提交他人题卡仍会被拒。"""
        self._submit_many(4)
        session_id, token = self._create_locked_session()
        mine = self._attach(session_id, "0301", "测试学生1")
        own_news = self._pool_item(session_id, "0301", "news")

        before_analytics = self.client.post(
            "/api/v1/module4/lesson5/v3-submissions",
            json=self._v3_payload(session_id, mine["participantId"], own_news),
        )
        self.assertEqual(before_analytics.status_code, 409)

        self._open_analytics(session_id, token)
        analytics_submit = self.client.post(
            "/api/v1/module4/lesson5/v3-submissions",
            json=self._v3_payload(session_id, mine["participantId"], own_news),
        )
        self.assertEqual(analytics_submit.status_code, 200, analytics_submit.text)
        self.assertEqual(analytics_submit.json()["readyForLesson6"], "partial")

        other_news = self._pool_item(session_id, "0302", "news")
        forbidden_payload = self._v3_payload(session_id, mine["participantId"], other_news)
        forbidden = self.client.post("/api/v1/module4/lesson5/v3-submissions", json=forbidden_payload)
        self.assertEqual(forbidden.status_code, 403)

    def test_v3_submission_writes_version_pointer_plan_and_dedupes(self) -> None:
        """V3 提交写版本、回填 current_v3、覆盖 revision_plan，并按提交数返回准备度。"""
        self._submit_many(4)
        session_id, token = self._create_locked_session()
        self._open_analytics(session_id, token)
        mine = self._attach(session_id, "0301", "测试学生1")
        news = self._pool_item(session_id, "0301", "news")
        image = self._pool_item(session_id, "0301", "image")

        first = self.client.post(
            "/api/v1/module4/lesson5/v3-submissions",
            json=self._v3_payload(session_id, mine["participantId"], news),
        )
        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(first.json()["readyForLesson6"], "partial")
        self.assertFalse(first.json()["deduped"])

        duplicate = self.client.post(
            "/api/v1/module4/lesson5/v3-submissions",
            json=self._v3_payload(session_id, mine["participantId"], news),
        )
        self.assertEqual(duplicate.status_code, 200, duplicate.text)
        self.assertTrue(duplicate.json()["deduped"])
        self.assertEqual(duplicate.json()["v3VersionId"], first.json()["v3VersionId"])

        second_payload = self._v3_payload(session_id, mine["participantId"], image)
        second_payload["v3CardJson"] = _card("image-card-0301-v3", "image", "A")
        second = self.client.post("/api/v1/module4/lesson5/v3-submissions", json=second_payload)
        self.assertEqual(second.status_code, 200, second.text)
        self.assertEqual(second.json()["readyForLesson6"], "full")

        connection = sqlite3.connect(self.database_path)
        try:
            item_row = connection.execute(
                "SELECT current_v3_version_id, status FROM module4_question_items WHERE item_id = ?",
                (news["item_id"],),
            ).fetchone()
            plan_count = connection.execute(
                """
                SELECT COUNT(*)
                FROM module4_lesson5_revision_plans
                WHERE session_id = ? AND participant_id = ? AND item_id = ?
                """,
                (session_id, mine["participantId"], news["item_id"]),
            ).fetchone()
        finally:
            connection.close()
        self.assertEqual(item_row[0], first.json()["v3VersionId"])
        self.assertEqual(item_row[1], "ready_for_lesson6")
        self.assertEqual(plan_count[0], 1)

    def test_completion_summary_is_private_and_contains_quick_check(self) -> None:
        """completion-summary 仅本人可读，并返回 V2/统计/V3/QuickCheck 摘要。"""
        self._submit_many(4)
        session_id, token = self._create_locked_session()
        self._open_analytics(session_id, token)
        mine = self._attach(session_id, "0301", "测试学生1")
        news = self._pool_item(session_id, "0301", "news")
        submitted = self.client.post(
            "/api/v1/module4/lesson5/v3-submissions",
            json=self._v3_payload(session_id, mine["participantId"], news),
        )
        self.assertEqual(submitted.status_code, 200, submitted.text)

        summary = self.client.get(
            f"/api/v1/module4/lesson5/sessions/{session_id}/my-completion-summary",
            params={"participantId": mine["participantId"], "lesson5ClientId": "l5c_test_0301"},
        )
        self.assertEqual(summary.status_code, 200, summary.text)
        body = summary.json()
        self.assertEqual(body["revision"]["readyForLesson6"], "partial")
        self.assertEqual(body["revision"]["submittedCount"], 1)
        self.assertTrue(body["quickCheck"]["t1HasV2Submission"])
        self.assertTrue(body["quickCheck"]["t2HasTrialStats"])
        self.assertTrue(body["quickCheck"]["t3HasV3Submission"])

        forbidden = self.client.get(
            f"/api/v1/module4/lesson5/sessions/{session_id}/my-completion-summary",
            params={"participantId": mine["participantId"], "lesson5ClientId": "wrong-client"},
        )
        self.assertEqual(forbidden.status_code, 403)

    def test_revision_plans_teacher_demo_readonly_after_analytics_open(self) -> None:
        """教师/demo 在 analytics_open 后可读 revision-plans，学生 V3 不依赖教师后续阶段。"""
        self._submit_many(4)
        session_id, token = self._create_locked_session()
        self._open_analytics(session_id, token)
        mine = self._attach(session_id, "0301", "测试学生1")
        news = self._pool_item(session_id, "0301", "news")
        submitted = self.client.post(
            "/api/v1/module4/lesson5/v3-submissions",
            json=self._v3_payload(session_id, mine["participantId"], news),
        )
        self.assertEqual(submitted.status_code, 200, submitted.text)

        teacher_view = self.client.get(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/revision-plans",
            headers=self._headers(token),
        )
        self.assertEqual(teacher_view.status_code, 200, teacher_view.text)
        self.assertGreaterEqual(teacher_view.json()["summary"]["submittedItems"], 1)

        demo_token = self._login("xnwy-demo", password="")
        demo_view = self.client.get(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/revision-plans",
            headers=self._headers(demo_token),
        )
        self.assertEqual(demo_view.status_code, 200, demo_view.text)
        demo_write = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/phase",
            headers=self._headers(demo_token),
            json={"targetPhase": "trial_open"},
        )
        self.assertEqual(demo_write.status_code, 403)


if __name__ == "__main__":
    unittest.main()
