"""
文件说明：模块 4 课时 5 C4a 学生 participant attach 与 assignment 生成 API 回归测试。
职责：使用临时 SQLite 覆盖 active-session、attach 幂等、session/participant 归属校验、冻结池分配、排除自作题、题量均衡、重复读取稳定与候选不足错误。
更新触发：C4a 学生端 API 契约、participant 身份规则、assignment 采样策略、lesson5 runtime schema 或测试 fixture 口径变化时，需要同步更新本文件。
"""

from __future__ import annotations

import os
from pathlib import Path
import tempfile
import unittest

from fastapi.testclient import TestClient

from app.main import app
from scripts.seed_module4_accounts import seed_module4_accounts


def _card(card_id: str, kind: str, correct_option_key: str) -> dict[str, object]:
    """构造最小可提交 V2 题卡。"""
    return {
        "id": card_id,
        "kind": kind,
        "material": {
            "title": f"{kind} 材料 {card_id}",
            "asset": {"dataUrl": f"data:text/plain;base64,{card_id}", "width": 100, "height": 60},
        },
        "task": {
            "question": f"{kind} 判断题 {card_id}",
            "options": [
                {"key": "A", "text": "选项 A"},
                {"key": "B", "text": "选项 B"},
                {"key": "C", "text": "选项 C"},
            ],
            "correctOptionKey": correct_option_key,
            "explanation": "测试解析不应在 C4a assignment 中暴露。",
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


class Module4Lesson5ParticipantsAssignmentsApiTest(unittest.TestCase):
    """模块 4 课时 5 C4a 学生 attach 与 assignment API 黑盒测试。"""

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

    def _login(self) -> str:
        """使用 manage 教师账号登录并返回 token。"""
        response = self.client.post(
            "/api/v1/module4/auth/login",
            json={"account": "xnwy-li", "password": "test-shared-password"},
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

    def _create_locked_session(self, question_count: int) -> str:
        """创建并锁定 g7c03 session，返回 session_id。"""
        token = self._login()
        created = self.client.post(
            "/api/v1/teacher/module4/lesson5/sessions",
            headers=self._headers(token),
            json={
                "classId": "g7c03",
                "runType": "normal",
                "title": f"C4a 测试会话 {question_count}",
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
        return session_id

    def _attach(self, session_id: str, seat_code: str = "0301", student_name: str = "测试学生1"):
        """按指定学生身份 attach participant。"""
        return self.client.post(
            "/api/v1/module4/lesson5/participants/attach",
            json={
                "sessionId": session_id,
                "classId": "g7c03",
                "studentName": student_name,
                "classSeatCode": seat_code,
                "lesson5ClientId": f"l5c_test_{seat_code}",
            },
        )

    def test_active_session_attach_idempotent_and_state(self) -> None:
        """locked session 可被 active-session 找到，重复 attach 返回同一 participant，并可读取 state。"""
        self._submit_many(5)
        session_id = self._create_locked_session(8)

        active = self.client.get("/api/v1/module4/lesson5/active-session?classId=g7c03")
        self.assertEqual(active.status_code, 200, active.text)
        self.assertEqual(active.json()["sessionId"], session_id)
        self.assertEqual(active.json()["phase"], "pool_locked")

        first = self._attach(session_id)
        self.assertEqual(first.status_code, 200, first.text)
        second = self._attach(session_id)
        self.assertEqual(second.status_code, 200, second.text)
        self.assertEqual(first.json()["participantId"], second.json()["participantId"])

        state = self.client.get(
            f"/api/v1/module4/lesson5/sessions/{session_id}/state",
            params={"participantId": first.json()["participantId"]},
        )
        self.assertEqual(state.status_code, 200, state.text)
        self.assertEqual(state.json()["settings"], {"questionCount": 8, "newsCount": 4, "imageCount": 4})
        self.assertEqual(state.json()["participant"]["answeredCount"], 0)
        self.assertFalse(state.json()["participant"]["completed"])

    def test_attach_and_participant_mismatch_errors_are_clear(self) -> None:
        """class/session、seat/client/name 与 participant/session 不匹配时返回可定位错误。"""
        self._submit_many(5)
        session_id = self._create_locked_session(8)
        bad_class = self.client.post(
            "/api/v1/module4/lesson5/participants/attach",
            json={
                "sessionId": session_id,
                "classId": "g7c04",
                "studentName": "测试学生1",
                "classSeatCode": "0301",
                "lesson5ClientId": "l5c_test_0301",
            },
        )
        self.assertEqual(bad_class.status_code, 409)

        first = self._attach(session_id)
        self.assertEqual(first.status_code, 200, first.text)
        conflict_name = self.client.post(
            "/api/v1/module4/lesson5/participants/attach",
            json={
                "sessionId": session_id,
                "classId": "g7c03",
                "studentName": "另一个姓名",
                "classSeatCode": "0301",
                "lesson5ClientId": "l5c_test_0301",
            },
        )
        self.assertEqual(conflict_name.status_code, 409)

        other_session_id = self._create_locked_session(6)
        mismatch = self.client.get(
            f"/api/v1/module4/lesson5/sessions/{other_session_id}/assignments",
            params={"participantId": first.json()["participantId"]},
        )
        self.assertEqual(mismatch.status_code, 409)

    def test_assignments_exclude_self_balance_counts_and_repeat_stable(self) -> None:
        """6/8/10 题量按 news/image 各半，排除自作题，重复读取 ids 与顺序稳定。"""
        self._submit_many(6)
        for question_count, expected_each in ((6, 3), (8, 4), (10, 5)):
            with self.subTest(question_count=question_count):
                session_id = self._create_locked_session(question_count)
                attached = self._attach(session_id)
                self.assertEqual(attached.status_code, 200, attached.text)
                participant_id = attached.json()["participantId"]

                first = self.client.get(
                    f"/api/v1/module4/lesson5/sessions/{session_id}/assignments",
                    params={"participantId": participant_id},
                )
                self.assertEqual(first.status_code, 200, first.text)
                assignments = first.json()["assignments"]
                self.assertEqual(len(assignments), question_count)
                self.assertEqual(sum(1 for item in assignments if item["cardKind"] == "news"), expected_each)
                self.assertEqual(sum(1 for item in assignments if item["cardKind"] == "image"), expected_each)
                self.assertTrue(all("0301" not in item["itemId"] for item in assignments))
                self.assertTrue(all("correctOptionKey" not in item["task"] for item in assignments))
                self.assertTrue(all("explanation" not in item["task"] for item in assignments))

                second = self.client.get(
                    f"/api/v1/module4/lesson5/sessions/{session_id}/assignments",
                    params={"participantId": participant_id},
                )
                self.assertEqual(second.status_code, 200, second.text)
                first_ids = [(item["assignmentId"], item["itemId"], item["orderIndex"]) for item in assignments]
                second_ids = [
                    (item["assignmentId"], item["itemId"], item["orderIndex"])
                    for item in second.json()["assignments"]
                ]
                self.assertEqual(first_ids, second_ids)

    def test_assignment_candidate_shortage_returns_409_with_detail(self) -> None:
        """冻结池某类候选不足时返回 409，不静默降级题量。"""
        self._submit_many(3)
        session_id = self._create_locked_session(8)
        attached = self._attach(session_id)
        self.assertEqual(attached.status_code, 200, attached.text)

        response = self.client.get(
            f"/api/v1/module4/lesson5/sessions/{session_id}/assignments",
            params={"participantId": attached.json()["participantId"]},
        )
        self.assertEqual(response.status_code, 409)
        self.assertIn("候选不足", response.json()["detail"])
        self.assertIn("required=4", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
