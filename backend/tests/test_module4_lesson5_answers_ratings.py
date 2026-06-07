"""
文件说明：模块 4 课时 5 C5a 学生 answer、rating 与教师 progress API 回归测试。
职责：使用临时 SQLite 覆盖 trial_open 作答 gate、服务端判分与 reveal、answer/rating 幂等、评分校验、assignment 状态推进、学生 state 计数和教师 progress 只读视图。
更新触发：C5a answer/rating/progress API 契约、phase gate、issueFlags 枚举、assignment 状态或 lesson5 runtime schema 变化时，需要同步更新本文件。
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
    """构造带解析与来源的最小可提交 V2 题卡。"""
    return {
        "id": card_id,
        "kind": kind,
        "material": {
            "title": f"{kind} 材料 {card_id}",
            "asset": {"dataUrl": f"data:text/plain;base64,{card_id}", "width": 100, "height": 60},
        },
        "explanation": {"text": f"{kind} 题解析"},
        "revision": {"summary": f"{kind} 摘要"},
        "source": {"label": f"{kind} 来源", "url": "https://example.test/source"},
        "task": {
            "question": f"{kind} 判断题 {card_id}",
            "options": [
                {"key": "A", "text": "选项 A", "rationale": f"{kind} 选项 A 解答"},
                {"key": "B", "text": "选项 B", "rationale": f"{kind} 选项 B 解答"},
                {"key": "C", "text": "选项 C", "rationale": f"{kind} 选项 C 解答"},
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


class Module4Lesson5AnswersRatingsApiTest(unittest.TestCase):
    """模块 4 课时 5 C5a answer/rating/progress API 黑盒测试。"""

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
                "title": f"C5a 测试会话 {question_count}",
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

    def _open_trial(self, session_id: str, token: str) -> None:
        """把已锁池 session 推进到 trial_open。"""
        response = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/phase",
            headers=self._headers(token),
            json={"targetPhase": "trial_open"},
        )
        self.assertEqual(response.status_code, 200, response.text)

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

    def _assignments(self, session_id: str, participant_id: str) -> list[dict[str, object]]:
        """读取或生成 participant assignments。"""
        response = self.client.get(
            f"/api/v1/module4/lesson5/sessions/{session_id}/assignments",
            params={"participantId": participant_id},
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["assignments"]

    def _answer_payload(self, participant_id: str, seat_code: str, selected_option_key: str) -> dict[str, object]:
        """构造 answer 请求体。"""
        return {
            "participantId": participant_id,
            "lesson5ClientId": f"l5c_test_{seat_code}",
            "selectedOptionKey": selected_option_key,
        }

    def _rating_payload(self, participant_id: str, seat_code: str) -> dict[str, object]:
        """构造合法 rating 请求体。"""
        return {
            "participantId": participant_id,
            "lesson5ClientId": f"l5c_test_{seat_code}",
            "clarity": 3,
            "thinkingValue": 2,
            "explanationHelpfulness": 3,
            "issueFlags": ["source_insufficient"],
            "comment": "解析清楚，来源还可以更具体。",
        }

    def _correct_option_for_assignment(self, assignment: dict[str, object]) -> str:
        """根据测试 fixture 的题卡类型返回正确选项。"""
        return "B" if assignment["cardKind"] == "news" else "A"

    def _assignment_status(self, assignment_id: str) -> str:
        """直接读取 assignment 状态，用于确认写入副作用。"""
        connection = sqlite3.connect(self.database_path)
        try:
            row = connection.execute(
                "SELECT status FROM module4_lesson5_assignments WHERE assignment_id = ?",
                (assignment_id,),
            ).fetchone()
        finally:
            connection.close()
        self.assertIsNotNone(row)
        return str(row[0])

    def test_answer_rejects_before_trial_open(self) -> None:
        """pool_locked 下 assignment 可预览，但 answer 被拒绝。"""
        self._submit_many(4)
        session_id, _token = self._create_locked_session()
        attached = self._attach(session_id)
        assignments = self._assignments(session_id, attached["participantId"])

        response = self.client.post(
            f"/api/v1/module4/lesson5/assignments/{assignments[0]['assignmentId']}/answer",
            json=self._answer_payload(attached["participantId"], "0301", "B"),
        )
        self.assertEqual(response.status_code, 409)

    def test_answer_reveal_assignment_hiding_and_idempotency(self) -> None:
        """trial_open 下 answer 服务端判分并揭示解析；列表仍隐藏答案；重复 answer 不重复计数。"""
        self._submit_many(4)
        session_id, token = self._create_locked_session()
        self._open_trial(session_id, token)
        attached = self._attach(session_id)
        participant_id = attached["participantId"]
        assignments = self._assignments(session_id, participant_id)
        first_assignment = assignments[0]

        answer = self.client.post(
            f"/api/v1/module4/lesson5/assignments/{first_assignment['assignmentId']}/answer",
            json=self._answer_payload(
                participant_id,
                "0301",
                self._correct_option_for_assignment(first_assignment),
            ),
        )
        self.assertEqual(answer.status_code, 200, answer.text)
        body = answer.json()
        self.assertTrue(body["isCorrect"])
        self.assertEqual(body["correctOptionKey"], self._correct_option_for_assignment(first_assignment))
        self.assertIn("解析", body["reveal"]["explanation"])
        self.assertIn("摘要", body["reveal"]["summary"])
        self.assertEqual(body["reveal"]["options"][0]["key"], "A")
        self.assertIn("选项 A 解答", body["reveal"]["options"][0]["rationale"])
        self.assertEqual(body["reveal"]["source"]["url"], "https://example.test/source")
        self.assertEqual(self._assignment_status(first_assignment["assignmentId"]), "answered")

        listed_again = self._assignments(session_id, participant_id)
        self.assertTrue(all("correctOptionKey" not in item["task"] for item in listed_again))
        self.assertTrue(all("explanation" not in item["task"] for item in listed_again))
        self.assertTrue(all("source" not in item["task"] for item in listed_again))
        self.assertTrue(all("rationale" not in option for item in listed_again for option in item["options"]))

        duplicate = self.client.post(
            f"/api/v1/module4/lesson5/assignments/{first_assignment['assignmentId']}/answer",
            json=self._answer_payload(participant_id, "0301", "C"),
        )
        self.assertEqual(duplicate.status_code, 200, duplicate.text)
        self.assertEqual(duplicate.json()["answerId"], body["answerId"])

        state = self.client.get(
            f"/api/v1/module4/lesson5/sessions/{session_id}/state",
            params={"participantId": participant_id},
        )
        self.assertEqual(state.status_code, 200, state.text)
        self.assertEqual(state.json()["participant"]["answeredCount"], 1)
        self.assertEqual(state.json()["participant"]["ratedCount"], 0)
        self.assertFalse(state.json()["participant"]["completed"])

    def test_rating_requires_answer_validates_payload_and_is_idempotent(self) -> None:
        """未 answer 无法 rating；评分维度和 issueFlag 校验；成功后状态 rated，重复 rating 幂等。"""
        self._submit_many(4)
        session_id, token = self._create_locked_session()
        self._open_trial(session_id, token)
        attached = self._attach(session_id)
        participant_id = attached["participantId"]
        first_assignment = self._assignments(session_id, participant_id)[0]

        missing_answer = self.client.post(
            "/api/v1/module4/lesson5/answers/l5ans_missing/rating",
            json=self._rating_payload(participant_id, "0301"),
        )
        self.assertEqual(missing_answer.status_code, 404)

        answer = self.client.post(
            f"/api/v1/module4/lesson5/assignments/{first_assignment['assignmentId']}/answer",
            json=self._answer_payload(
                participant_id,
                "0301",
                self._correct_option_for_assignment(first_assignment),
            ),
        )
        self.assertEqual(answer.status_code, 200, answer.text)
        answer_id = answer.json()["answerId"]

        bad_dimension = self.client.post(
            f"/api/v1/module4/lesson5/answers/{answer_id}/rating",
            json={**self._rating_payload(participant_id, "0301"), "clarity": 4},
        )
        self.assertEqual(bad_dimension.status_code, 400)

        bad_flag = self.client.post(
            f"/api/v1/module4/lesson5/answers/{answer_id}/rating",
            json={**self._rating_payload(participant_id, "0301"), "issueFlags": ["unknown_flag"]},
        )
        self.assertEqual(bad_flag.status_code, 400)

        rating = self.client.post(
            f"/api/v1/module4/lesson5/answers/{answer_id}/rating",
            json=self._rating_payload(participant_id, "0301"),
        )
        self.assertEqual(rating.status_code, 200, rating.text)
        self.assertEqual(self._assignment_status(first_assignment["assignmentId"]), "rated")

        duplicate = self.client.post(
            f"/api/v1/module4/lesson5/answers/{answer_id}/rating",
            json={**self._rating_payload(participant_id, "0301"), "clarity": 1},
        )
        self.assertEqual(duplicate.status_code, 200, duplicate.text)
        self.assertEqual(duplicate.json()["ratingId"], rating.json()["ratingId"])

    def test_state_completion_and_teacher_progress_include_demo_readonly(self) -> None:
        """全部题完成后 state completed，教师 progress 返回全班聚合且 demo 可读不可写。"""
        self._submit_many(5)
        session_id, token = self._create_locked_session()
        self._open_trial(session_id, token)
        attached = self._attach(session_id)
        participant_id = attached["participantId"]
        second = self._attach(session_id, seat_code="0302", student_name="测试学生2")

        assignments = self._assignments(session_id, participant_id)
        for assignment in assignments:
            answer = self.client.post(
                f"/api/v1/module4/lesson5/assignments/{assignment['assignmentId']}/answer",
                json=self._answer_payload(
                    participant_id,
                    "0301",
                    self._correct_option_for_assignment(assignment),
                ),
            )
            self.assertEqual(answer.status_code, 200, answer.text)
            rating = self.client.post(
                f"/api/v1/module4/lesson5/answers/{answer.json()['answerId']}/rating",
                json=self._rating_payload(participant_id, "0301"),
            )
            self.assertEqual(rating.status_code, 200, rating.text)

        state = self.client.get(
            f"/api/v1/module4/lesson5/sessions/{session_id}/state",
            params={"participantId": participant_id},
        )
        self.assertEqual(state.status_code, 200, state.text)
        self.assertEqual(state.json()["participant"]["answeredCount"], 6)
        self.assertEqual(state.json()["participant"]["ratedCount"], 6)
        self.assertTrue(state.json()["participant"]["completed"])

        progress = self.client.get(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/progress",
            headers=self._headers(token),
        )
        self.assertEqual(progress.status_code, 200, progress.text)
        body = progress.json()
        self.assertEqual(body["summary"]["attachedCount"], 2)
        self.assertEqual(body["summary"]["answeredCount"], 6)
        self.assertEqual(body["summary"]["ratedCount"], 6)
        self.assertEqual(body["summary"]["completedCount"], 1)
        progress_by_id = {item["participantId"]: item for item in body["participants"]}
        self.assertTrue(progress_by_id[participant_id]["completed"])
        self.assertFalse(progress_by_id[second["participantId"]]["completed"])
        self.assertNotIn("correctOptionKey", body["participants"][0])
        self.assertNotIn("explanation", body["participants"][0])

        demo_token = self._login("xnwy-demo", password="")
        demo_progress = self.client.get(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/progress",
            headers=self._headers(demo_token),
        )
        self.assertEqual(demo_progress.status_code, 200, demo_progress.text)
        demo_write = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/phase",
            headers=self._headers(demo_token),
            json={"targetPhase": "trial_locked"},
        )
        self.assertEqual(demo_write.status_code, 403)


if __name__ == "__main__":
    unittest.main()
