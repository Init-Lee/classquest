"""
文件说明：模块 4 课时 6 V3 发布审核契约回归测试。
职责：验证 Lesson5 V3 提交会创建 Lesson6 待教师确认记录，并覆盖教师审核列表/发布确认、同 item 唯一 active public、权限拒绝与学生本人发布状态查询。
更新触发：Lesson5 V3 提交契约、Lesson6 发布审核 schema、teacher/student 路由、公共题库 view 入选条件或测试基建变化时，需要同步更新本文件。
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
from tests.test_module4_lesson5_v3_revision import _card, _submission_payload


class Module4Lesson6PublicationTest(unittest.TestCase):
    """模块 4 课时 6 C0 发布审核契约测试。"""

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
                "title": "C0 Lesson6 发布审核测试会话",
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

    def _submit_one_v3(self) -> dict[str, object]:
        """完成一轮最小 V3 提交并返回响应 JSON。"""
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
        return submitted.json()

    def _prepare_one_pending_review(self) -> tuple[dict[str, object], str]:
        """完成一轮 V3 提交并返回提交响应与教师 token。"""
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
        return submitted.json(), token

    def _review_by_version(self, item_version_id: str) -> sqlite3.Row:
        """按 V3 version_id 读取发布审核记录。"""
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        try:
            row = connection.execute(
                """
                SELECT review_id, item_id, item_version_id, check_status, is_active_public
                FROM module4_v3_publication_reviews
                WHERE item_version_id = ?
                """,
                (item_version_id,),
            ).fetchone()
        finally:
            connection.close()
        self.assertIsNotNone(row)
        return row

    def _review_counts(self, item_version_id: str) -> tuple[int, int]:
        """读取指定 V3 的审核记录数与公共题库 view 命中数。"""
        connection = sqlite3.connect(self.database_path)
        try:
            review_count = connection.execute(
                """
                SELECT COUNT(*)
                FROM module4_v3_publication_reviews
                WHERE item_version_id = ?
                """,
                (item_version_id,),
            ).fetchone()[0]
            public_count = connection.execute(
                """
                SELECT COUNT(*)
                FROM module4_public_question_bank
                WHERE item_version_id = ?
                """,
                (item_version_id,),
            ).fetchone()[0]
        finally:
            connection.close()
        return review_count, public_count

    def test_v3_submission_creates_pending_publication_review(self) -> None:
        """V3 提交后创建 pending_teacher_check 审核记录。"""
        body = self._submit_one_v3()

        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        try:
            review = connection.execute(
                """
                SELECT item_version_id, check_status, is_active_public, teacher_note
                FROM module4_v3_publication_reviews
                WHERE item_version_id = ?
                """,
                (body["v3VersionId"],),
            ).fetchone()
        finally:
            connection.close()

        self.assertIsNotNone(review)
        self.assertEqual(review["check_status"], "pending_teacher_check")
        self.assertEqual(review["is_active_public"], 0)
        self.assertEqual(review["teacher_note"], "")

    def test_duplicate_v3_submission_does_not_create_duplicate_review(self) -> None:
        """同 version/hash 重复提交不重复创建发布审核记录。"""
        self._submit_many(4)
        session_id, token = self._create_locked_session()
        self._open_analytics(session_id, token)
        mine = self._attach(session_id, "0301", "测试学生1")
        news = self._pool_item(session_id, "0301", "news")
        payload = self._v3_payload(session_id, mine["participantId"], news)

        first = self.client.post("/api/v1/module4/lesson5/v3-submissions", json=payload)
        self.assertEqual(first.status_code, 200, first.text)
        duplicate = self.client.post("/api/v1/module4/lesson5/v3-submissions", json=payload)
        self.assertEqual(duplicate.status_code, 200, duplicate.text)
        self.assertTrue(duplicate.json()["deduped"])
        self.assertEqual(duplicate.json()["v3VersionId"], first.json()["v3VersionId"])

        review_count, _ = self._review_counts(first.json()["v3VersionId"])
        self.assertEqual(review_count, 1)

    def test_pending_review_is_not_in_public_question_bank_view(self) -> None:
        """pending_teacher_check 记录不会进入公共题库 view。"""
        body = self._submit_one_v3()

        review_count, public_count = self._review_counts(body["v3VersionId"])
        self.assertEqual(review_count, 1)
        self.assertEqual(public_count, 0)

    def test_teacher_list_reviews_includes_pending_and_summary(self) -> None:
        """教师列表能看到 pending 审核记录与 summary 计数。"""
        body, token = self._prepare_one_pending_review()

        response = self.client.get(
            "/api/v1/teacher/module4/lesson6/v3-publication-reviews",
            headers=self._headers(token),
            params={"status": "pending_teacher_check", "classId": "g7c03"},
        )
        self.assertEqual(response.status_code, 200, response.text)
        payload = response.json()

        self.assertEqual(payload["summary"]["pendingCount"], 1)
        self.assertEqual(payload["summary"]["publishableCount"], 0)
        self.assertEqual(len(payload["items"]), 1)
        item = payload["items"][0]
        self.assertEqual(item["itemVersionId"], body["v3VersionId"])
        self.assertEqual(item["checkStatus"], "pending_teacher_check")
        self.assertFalse(item["isActivePublic"])
        self.assertEqual(item["className"], "初一（3）班")
        self.assertEqual(item["studentDisplay"], "03班 01号")
        self.assertIsNotNone(item["lesson5StatsSummary"])

        detail = self.client.get(
            f"/api/v1/teacher/module4/lesson6/v3-publication-reviews/{item['reviewId']}",
            headers=self._headers(token),
        )
        self.assertEqual(detail.status_code, 200, detail.text)
        self.assertEqual(detail.json()["itemVersionId"], body["v3VersionId"])
        self.assertTrue(detail.json()["cardJson"])
        self.assertIsNotNone(detail.json()["lesson5Stats"])
        self.assertEqual(detail.json()["revisionPlan"]["revisionAction"], "minor_fix")

    def test_publish_review_marks_publishable_and_records_teacher_fields(self) -> None:
        """publish 后审核记录进入公共题库并记录教师确认信息。"""
        body, token = self._prepare_one_pending_review()
        review = self._review_by_version(body["v3VersionId"])

        response = self.client.post(
            f"/api/v1/teacher/module4/lesson6/v3-publication-reviews/{review['review_id']}/publish",
            headers=self._headers(token),
            json={"teacherNote": "题目结构完整，解析清楚。"},
        )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["checkStatus"], "publishable")
        self.assertTrue(response.json()["isActivePublic"])
        self.assertTrue(response.json()["checkedAt"])

        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        try:
            saved = connection.execute(
                """
                SELECT check_status, is_active_public, checked_by_user_id, checked_at, teacher_note
                FROM module4_v3_publication_reviews
                WHERE review_id = ?
                """,
                (review["review_id"],),
            ).fetchone()
            public_count = connection.execute(
                "SELECT COUNT(*) FROM module4_public_question_bank WHERE item_version_id = ?",
                (body["v3VersionId"],),
            ).fetchone()[0]
        finally:
            connection.close()

        self.assertEqual(saved["check_status"], "publishable")
        self.assertEqual(saved["is_active_public"], 1)
        self.assertEqual(saved["checked_by_user_id"], "user_xnwy_li")
        self.assertTrue(saved["checked_at"])
        self.assertEqual(saved["teacher_note"], "题目结构完整，解析清楚。")
        self.assertEqual(public_count, 1)

        overview = self.client.get(
            "/api/v1/teacher/module4/lesson6/public-bank/overview",
            headers=self._headers(token),
        )
        self.assertEqual(overview.status_code, 200, overview.text)
        self.assertEqual(overview.json()["publicBank"]["totalPublishable"], 1)
        self.assertEqual(overview.json()["publicBank"]["newsCount"], 1)
        self.assertEqual(overview.json()["pendingReview"]["totalPending"], 0)
        self.assertEqual(overview.json()["challengeStats"]["totalRuns"], 0)

    def test_new_v3_publish_deactivates_old_active_for_same_item(self) -> None:
        """同 item 发布新 V3 后旧 active 置 0，公共题库只保留新版本。"""
        self._submit_many(4)
        session_id, token = self._create_locked_session()
        self._open_analytics(session_id, token)
        mine = self._attach(session_id, "0301", "测试学生1")
        news = self._pool_item(session_id, "0301", "news")

        first = self.client.post(
            "/api/v1/module4/lesson5/v3-submissions",
            json=self._v3_payload(session_id, mine["participantId"], news),
        )
        self.assertEqual(first.status_code, 200, first.text)
        first_review = self._review_by_version(first.json()["v3VersionId"])
        first_publish = self.client.post(
            f"/api/v1/teacher/module4/lesson6/v3-publication-reviews/{first_review['review_id']}/publish",
            headers=self._headers(token),
            json={"teacherNote": "第一版确认。"},
        )
        self.assertEqual(first_publish.status_code, 200, first_publish.text)

        second_payload = self._v3_payload(session_id, mine["participantId"], news)
        second_payload["v3CardJson"] = _card("news-card-0301-v3-revised", "news", "C")
        second = self.client.post("/api/v1/module4/lesson5/v3-submissions", json=second_payload)
        self.assertEqual(second.status_code, 200, second.text)
        self.assertNotEqual(second.json()["v3VersionId"], first.json()["v3VersionId"])
        second_review = self._review_by_version(second.json()["v3VersionId"])
        second_publish = self.client.post(
            f"/api/v1/teacher/module4/lesson6/v3-publication-reviews/{second_review['review_id']}/publish",
            headers=self._headers(token),
            json={"teacherNote": "新版确认。"},
        )
        self.assertEqual(second_publish.status_code, 200, second_publish.text)

        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        try:
            rows = connection.execute(
                """
                SELECT item_version_id, is_active_public
                FROM module4_v3_publication_reviews
                WHERE item_id = ?
                ORDER BY created_at ASC
                """,
                (news["item_id"],),
            ).fetchall()
            active_count = connection.execute(
                """
                SELECT COUNT(*)
                FROM module4_v3_publication_reviews
                WHERE item_id = ? AND is_active_public = 1
                """,
                (news["item_id"],),
            ).fetchone()[0]
            public_versions = connection.execute(
                """
                SELECT item_version_id
                FROM module4_public_question_bank
                WHERE item_id = ?
                """,
                (news["item_id"],),
            ).fetchall()
        finally:
            connection.close()

        self.assertEqual(active_count, 1)
        self.assertEqual(rows[0]["is_active_public"], 0)
        self.assertEqual(rows[1]["is_active_public"], 1)
        self.assertEqual([row["item_version_id"] for row in public_versions], [second.json()["v3VersionId"]])

    def test_publish_rejects_demo_view_and_unauthorized_teacher(self) -> None:
        """demo、view 授权与未授权教师均不能 publish。"""
        body, token = self._prepare_one_pending_review()
        review = self._review_by_version(body["v3VersionId"])

        demo_token = self._login("xnwy-demo", password="")
        demo_response = self.client.post(
            f"/api/v1/teacher/module4/lesson6/v3-publication-reviews/{review['review_id']}/publish",
            headers=self._headers(demo_token),
            json={"teacherNote": "demo 不应写入。"},
        )
        self.assertEqual(demo_response.status_code, 403)

        connection = sqlite3.connect(self.database_path)
        try:
            connection.execute(
                """
                UPDATE cq_teacher_class_assignments
                SET permission = 'view'
                WHERE user_id = 'user_xnwy_li' AND class_id = 'g7c03'
                """
            )
            connection.commit()
        finally:
            connection.close()
        view_response = self.client.post(
            f"/api/v1/teacher/module4/lesson6/v3-publication-reviews/{review['review_id']}/publish",
            headers=self._headers(token),
            json={"teacherNote": "view 不应写入。"},
        )
        self.assertEqual(view_response.status_code, 403)

        unauthorized_token = self._login("xnwy-zhang")
        unauthorized_response = self.client.post(
            f"/api/v1/teacher/module4/lesson6/v3-publication-reviews/{review['review_id']}/publish",
            headers=self._headers(unauthorized_token),
            json={"teacherNote": "未授权不应写入。"},
        )
        self.assertEqual(unauthorized_response.status_code, 403)

    def test_student_status_returns_requested_keys_only_and_unknown(self) -> None:
        """学生状态端点只按请求键返回，未知 version 为 unknown，禁止班级/座位枚举字段。"""
        body, token = self._prepare_one_pending_review()
        review = self._review_by_version(body["v3VersionId"])
        before_publish = self.client.post(
            "/api/v1/module4/lesson6/my-v3-publication-status",
            json={
                "items": [
                    {
                        "kind": "news",
                        "itemId": body["itemId"],
                        "itemVersionId": body["v3VersionId"],
                    },
                    {
                        "kind": "image",
                        "itemId": "unknown-item",
                        "itemVersionId": "unknown-version",
                    },
                ]
            },
        )
        self.assertEqual(before_publish.status_code, 200, before_publish.text)
        self.assertEqual(len(before_publish.json()["items"]), 2)
        self.assertEqual(before_publish.json()["items"][0]["status"], "pending_teacher_check")
        self.assertEqual(before_publish.json()["items"][0]["label"], "等待教师确认")
        self.assertEqual(before_publish.json()["items"][1]["status"], "unknown")
        self.assertEqual(before_publish.json()["items"][1]["label"], "暂未同步")

        publish = self.client.post(
            f"/api/v1/teacher/module4/lesson6/v3-publication-reviews/{review['review_id']}/publish",
            headers=self._headers(token),
            json={"teacherNote": "状态查询测试发布。"},
        )
        self.assertEqual(publish.status_code, 200, publish.text)
        after_publish = self.client.post(
            "/api/v1/module4/lesson6/my-v3-publication-status",
            json={
                "items": [
                    {
                        "kind": "news",
                        "itemId": body["itemId"],
                        "itemVersionId": body["v3VersionId"],
                    }
                ]
            },
        )
        self.assertEqual(after_publish.status_code, 200, after_publish.text)
        self.assertEqual(after_publish.json()["items"][0]["status"], "publishable")
        self.assertEqual(after_publish.json()["items"][0]["label"], "已确认可发布")
        self.assertTrue(after_publish.json()["items"][0]["checkedAt"])

        enumerate_attempt = self.client.post(
            "/api/v1/module4/lesson6/my-v3-publication-status",
            json={
                "classId": "g7c03",
                "items": [
                    {
                        "kind": "news",
                        "itemId": body["itemId"],
                        "itemVersionId": body["v3VersionId"],
                        "classSeatCode": "0301",
                    }
                ],
            },
        )
        self.assertEqual(enumerate_attempt.status_code, 422)


if __name__ == "__main__":
    unittest.main()
