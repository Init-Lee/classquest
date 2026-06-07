"""
文件说明：模块 4 课时 5 C3a 教师 session 生命周期与锁池 API 回归测试。
职责：使用临时 SQLite 覆盖建会话、鉴权、设置校验、锁池冻结、phase 顺序状态机、overview 与锁池隔离。
更新触发：课时 5 session API 契约、状态机、锁池来源、权限边界或 lesson5 runtime schema 变化时，需要同步更新本文件。
"""

from __future__ import annotations

import copy
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
            "title": f"{kind} 材料",
            "asset": {"dataUrl": f"data:text/plain;base64,{card_id}", "width": 100, "height": 60},
        },
        "task": {
            "question": f"{kind} 判断题",
            "options": [
                {"key": "A", "text": "选项 A"},
                {"key": "B", "text": "选项 B"},
                {"key": "C", "text": "选项 C"},
            ],
            "correctOptionKey": correct_option_key,
        },
    }


def _submission_payload(
    *,
    seat_code: str = "0307",
    student_name: str = "测试学生",
    news_answer: str = "B",
    image_answer: str = "A",
) -> dict[str, object]:
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
                "news": _card(f"news-card-{seat_code}-{news_answer}", "news", news_answer),
                "image": _card(f"image-card-{seat_code}-{image_answer}", "image", image_answer),
            },
        },
    }


class Module4Lesson5SessionApiTest(unittest.TestCase):
    """模块 4 课时 5 C3a session API 黑盒测试。"""

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

    def _login(self, account: str, password: str = "test-shared-password") -> str:
        """使用指定账号与口令登录并返回 token；demo 可传空口令。"""
        response = self.client.post(
            "/api/v1/module4/auth/login",
            json={"account": account, "password": password},
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["token"]

    def _headers(self, token: str) -> dict[str, str]:
        """生成 Bearer token 请求头。"""
        return {"Authorization": f"Bearer {token}"}

    def _submit_pool_item(self, **kwargs: object) -> dict[str, object]:
        """提交一名学生的 news/image V2 到长期题池。"""
        response = self.client.post("/api/v1/module4/lesson5/v2-submissions", json=_submission_payload(**kwargs))
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def _create_session(self, token: str, question_count: int = 8):
        """创建 g7c03 正常 session。"""
        return self.client.post(
            "/api/v1/teacher/module4/lesson5/sessions",
            headers=self._headers(token),
            json={
                "classId": "g7c03",
                "runType": "normal",
                "title": "C3a 测试会话",
                "settings": {"questionCount": question_count},
            },
        )

    def test_create_list_and_update_settings_in_draft(self) -> None:
        """manage 教师可建会话、列会话，并在 draft 阶段修改题量设置。"""
        token = self._login("xnwy-li")
        created = self._create_session(token)
        self.assertEqual(created.status_code, 200, created.text)
        body = created.json()
        self.assertTrue(body["sessionId"].startswith("l5s_"))
        self.assertEqual(body["phase"], "draft")
        self.assertEqual(body["settings"], {"questionCount": 8, "newsCount": 4, "imageCount": 4})

        listed = self.client.get(
            "/api/v1/teacher/module4/lesson5/sessions?classId=g7c03",
            headers=self._headers(token),
        )
        self.assertEqual(listed.status_code, 200, listed.text)
        self.assertEqual(len(listed.json()["sessions"]), 1)

        updated = self.client.patch(
            f"/api/v1/teacher/module4/lesson5/sessions/{body['sessionId']}/settings",
            headers=self._headers(token),
            json={"settings": {"questionCount": 10}},
        )
        self.assertEqual(updated.status_code, 200, updated.text)
        self.assertEqual(updated.json()["settings"], {"questionCount": 10, "newsCount": 5, "imageCount": 5})

    def test_create_session_auth_and_validation_boundaries(self) -> None:
        """建会话要求 manage 教师；demo、view-only、非授权班级与非法字段被拒。"""
        manage_token = self._login("xnwy-li")
        view_only_token = manage_token
        other_teacher_token = self._login("xnwy-zhang")
        demo_token = self._login("xnwy-demo", password="")

        demo = self.client.post(
            "/api/v1/teacher/module4/lesson5/sessions",
            headers=self._headers(demo_token),
            json={"classId": "g7c03", "runType": "normal", "title": "演示", "settings": {"questionCount": 8}},
        )
        self.assertEqual(demo.status_code, 403)

        view_only = self.client.post(
            "/api/v1/teacher/module4/lesson5/sessions",
            headers=self._headers(view_only_token),
            json={"classId": "g7c04", "runType": "normal", "title": "只读", "settings": {"questionCount": 8}},
        )
        self.assertEqual(view_only.status_code, 403)

        forbidden = self.client.post(
            "/api/v1/teacher/module4/lesson5/sessions",
            headers=self._headers(other_teacher_token),
            json={"classId": "g7c03", "runType": "normal", "title": "未授权", "settings": {"questionCount": 8}},
        )
        self.assertEqual(forbidden.status_code, 403)

        bad_run_type = self.client.post(
            "/api/v1/teacher/module4/lesson5/sessions",
            headers=self._headers(manage_token),
            json={"classId": "g7c03", "runType": "bad", "title": "坏类型", "settings": {"questionCount": 8}},
        )
        self.assertEqual(bad_run_type.status_code, 400)

        bad_question_count = self.client.post(
            "/api/v1/teacher/module4/lesson5/sessions",
            headers=self._headers(manage_token),
            json={"classId": "g7c03", "runType": "normal", "title": "坏题量", "settings": {"questionCount": 7}},
        )
        self.assertEqual(bad_question_count.status_code, 400)

    def test_lock_pool_freezes_current_v2_and_rejects_second_lock_or_settings_change(self) -> None:
        """lock-pool 冻结当前 V2，锁后重复锁池与改设置都返回 409。"""
        self._submit_pool_item(seat_code="0307", student_name="测试学生甲")
        self._submit_pool_item(seat_code="0308", student_name="测试学生乙")
        token = self._login("xnwy-li")
        created = self._create_session(token, question_count=8)
        self.assertEqual(created.status_code, 200, created.text)
        session_id = created.json()["sessionId"]

        locked = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/lock-pool",
            headers=self._headers(token),
        )
        self.assertEqual(locked.status_code, 200, locked.text)
        self.assertEqual(locked.json()["phase"], "pool_locked")
        self.assertEqual(locked.json()["frozen"], {"news": 2, "image": 2, "total": 4})

        second_lock = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/lock-pool",
            headers=self._headers(token),
        )
        self.assertEqual(second_lock.status_code, 409)

        settings_after_lock = self.client.patch(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/settings",
            headers=self._headers(token),
            json={"settings": {"questionCount": 6}},
        )
        self.assertEqual(settings_after_lock.status_code, 409)

    def test_phase_order_and_pool_locked_entrypoint(self) -> None:
        """phase 只能顺序推进，draft 不能越级，pool_locked 只能从 lock-pool 进入。"""
        self._submit_pool_item()
        token = self._login("xnwy-li")
        created = self._create_session(token, question_count=6)
        session_id = created.json()["sessionId"]

        direct_pool_locked = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/phase",
            headers=self._headers(token),
            json={"targetPhase": "pool_locked"},
        )
        self.assertEqual(direct_pool_locked.status_code, 409)

        skip = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/phase",
            headers=self._headers(token),
            json={"targetPhase": "trial_open"},
        )
        self.assertEqual(skip.status_code, 409)

        locked = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/lock-pool",
            headers=self._headers(token),
        )
        self.assertEqual(locked.status_code, 200, locked.text)

        trial_open = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/phase",
            headers=self._headers(token),
            json={"targetPhase": "trial_open"},
        )
        self.assertEqual(trial_open.status_code, 200, trial_open.text)
        self.assertEqual(trial_open.json()["phase"], "trial_open")

        rollback = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/phase",
            headers=self._headers(token),
            json={"targetPhase": "draft"},
        )
        self.assertEqual(rollback.status_code, 409)

    def test_overview_and_frozen_pool_isolated_from_later_v2_submissions(self) -> None:
        """锁池后学生再提交新 V2 不会改变已冻结 session pool。"""
        first = self._submit_pool_item(seat_code="0307", student_name="测试学生甲")
        token = self._login("xnwy-li")
        session_id = self._create_session(token, question_count=6).json()["sessionId"]
        locked = self.client.post(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/lock-pool",
            headers=self._headers(token),
        )
        self.assertEqual(locked.status_code, 200, locked.text)

        overview = self.client.get(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/overview",
            headers=self._headers(token),
        )
        self.assertEqual(overview.status_code, 200, overview.text)
        self.assertEqual(overview.json()["frozen"], {"news": 1, "image": 1, "total": 2})
        self.assertEqual(overview.json()["classPoolAuthorsSubmitted"], 1)
        self.assertEqual(overview.json()["classPoolAuthorsMissing"], 2)

        changed = copy.deepcopy(_submission_payload(seat_code="0307", student_name="测试学生甲"))
        changed["readyPackage"]["cards"]["news"]["task"]["correctOptionKey"] = "C"  # type: ignore[index]
        changed_response = self.client.post("/api/v1/module4/lesson5/v2-submissions", json=changed)
        self.assertEqual(changed_response.status_code, 200, changed_response.text)
        self.assertNotEqual(
            first["items"]["news"]["v2VersionId"],  # type: ignore[index]
            changed_response.json()["items"]["news"]["v2VersionId"],
        )

        overview_after_change = self.client.get(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/overview",
            headers=self._headers(token),
        )
        self.assertEqual(overview_after_change.status_code, 200, overview_after_change.text)
        self.assertEqual(overview_after_change.json()["frozen"], {"news": 1, "image": 1, "total": 2})

        demo_token = self._login("xnwy-demo", password="")
        demo_overview = self.client.get(
            f"/api/v1/teacher/module4/lesson5/sessions/{session_id}/overview",
            headers=self._headers(demo_token),
        )
        self.assertEqual(demo_overview.status_code, 200, demo_overview.text)


if __name__ == "__main__":
    unittest.main()
