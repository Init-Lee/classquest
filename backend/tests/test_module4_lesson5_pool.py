"""
文件说明：模块 4 课时 5 C2a 学生 V2 提交与班级题池 API 回归测试。
职责：使用临时 SQLite 覆盖 v2-submissions 首提、重复幂等、内容升版、业务校验与教师 pool-overview 鉴权边界。
更新触发：课时 5 V2 提交流、题池 schema、overview 响应字段、教师/demo 只读权限或 ready 包契约变化时，需要同步更新本文件。
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


def _submission_payload() -> dict[str, object]:
    """构造 lesson4-ready-for-lesson5-v1 提交包。"""
    return {
        "classId": "g7c03",
        "studentName": "测试学生",
        "classSeatCode": "0307",
        "lesson5ClientId": "l5c_test_0307",
        "readyPackage": {
            "packageVersion": "lesson4-ready-for-lesson5-v1",
            "createdAt": "2026-06-06T20:00:00+08:00",
            "student": {"name": "测试学生", "className": "初一（3）班", "classSeatCode": "0307"},
            "cards": {
                "news": _card("news-card-1", "news", "B"),
                "image": _card("image-card-1", "image", "A"),
            },
        },
    }


class Module4Lesson5PoolApiTest(unittest.TestCase):
    """模块 4 课时 5 C2a 题池 API 黑盒测试。"""

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

    def _overview(self, token: str, class_id: str = "g7c03"):
        """读取教师题池 overview。"""
        return self.client.get(
            f"/api/v1/teacher/module4/lesson5/classes/{class_id}/pool-overview",
            headers={"Authorization": f"Bearer {token}"},
        )

    def _pool_item_detail(self, token: str, item_id: str, class_id: str = "g7c03"):
        """读取教师题池 item 当前 V2 详情。"""
        return self.client.get(
            f"/api/v1/teacher/module4/lesson5/classes/{class_id}/pool-items/{item_id}",
            headers={"Authorization": f"Bearer {token}"},
        )

    def test_first_submission_creates_pool_items_and_overview(self) -> None:
        """空池首次提交后生成 news/image 两条 item 与当前 v2 版本。"""
        teacher_token = self._login("xnwy-li")
        empty_overview = self._overview(teacher_token)
        self.assertEqual(empty_overview.status_code, 200, empty_overview.text)
        self.assertEqual(empty_overview.json()["items"], [])

        response = self.client.post("/api/v1/module4/lesson5/v2-submissions", json=_submission_payload())
        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertTrue(body["ok"])
        self.assertFalse(body["items"]["news"]["deduped"])
        self.assertFalse(body["items"]["image"]["deduped"])
        self.assertEqual(body["items"]["news"]["status"], "submitted_to_trial_pool")

        overview = self._overview(teacher_token)
        self.assertEqual(overview.status_code, 200, overview.text)
        items = overview.json()["items"]
        self.assertEqual(len(items), 2)
        self.assertEqual({item["cardKind"] for item in items}, {"news", "image"})
        self.assertTrue(all(item["currentV2VersionId"] for item in items))

    def test_duplicate_submission_is_idempotent(self) -> None:
        """同包重复提交命中相同 content_hash 与 v2VersionId。"""
        first = self.client.post("/api/v1/module4/lesson5/v2-submissions", json=_submission_payload())
        self.assertEqual(first.status_code, 200, first.text)
        second = self.client.post("/api/v1/module4/lesson5/v2-submissions", json=_submission_payload())
        self.assertEqual(second.status_code, 200, second.text)

        first_body = first.json()
        second_body = second.json()
        for kind in ("news", "image"):
            self.assertTrue(second_body["items"][kind]["deduped"])
            self.assertEqual(
                first_body["items"][kind]["v2VersionId"],
                second_body["items"][kind]["v2VersionId"],
            )

    def test_changed_content_creates_new_version_and_current_pointer(self) -> None:
        """修改卡片内容后生成新版本，并让 overview 指向新的 current_v2。"""
        first = self.client.post("/api/v1/module4/lesson5/v2-submissions", json=_submission_payload())
        self.assertEqual(first.status_code, 200, first.text)
        changed_payload = copy.deepcopy(_submission_payload())
        cards = changed_payload["readyPackage"]["cards"]  # type: ignore[index]
        cards["news"]["task"]["correctOptionKey"] = "C"  # type: ignore[index]

        second = self.client.post("/api/v1/module4/lesson5/v2-submissions", json=changed_payload)
        self.assertEqual(second.status_code, 200, second.text)
        self.assertFalse(second.json()["items"]["news"]["deduped"])
        self.assertNotEqual(
            first.json()["items"]["news"]["v2VersionId"],
            second.json()["items"]["news"]["v2VersionId"],
        )

        teacher_token = self._login("xnwy-li")
        overview = self._overview(teacher_token)
        self.assertEqual(overview.status_code, 200, overview.text)
        news_item = next(item for item in overview.json()["items"] if item["cardKind"] == "news")
        self.assertEqual(news_item["currentV2VersionId"], second.json()["items"]["news"]["v2VersionId"])

    def test_invalid_submission_payload_returns_400(self) -> None:
        """非法班级、缺卡、缺 correctOptionKey 与非法座位码都返回 400。"""
        payloads = []
        missing_class = _submission_payload()
        missing_class["classId"] = "missing"
        payloads.append(missing_class)

        missing_card = copy.deepcopy(_submission_payload())
        del missing_card["readyPackage"]["cards"]["image"]  # type: ignore[index]
        payloads.append(missing_card)

        missing_answer = copy.deepcopy(_submission_payload())
        del missing_answer["readyPackage"]["cards"]["news"]["task"]["correctOptionKey"]  # type: ignore[index]
        payloads.append(missing_answer)

        bad_seat = _submission_payload()
        bad_seat["classSeatCode"] = "307"
        payloads.append(bad_seat)

        for payload in payloads:
            with self.subTest(payload=payload):
                response = self.client.post("/api/v1/module4/lesson5/v2-submissions", json=payload)
                self.assertEqual(response.status_code, 400, response.text)

    def test_pool_overview_auth_boundaries(self) -> None:
        """overview 要求 token；teacher 看授权班级，demo 可全班只读，未授权 teacher 禁止。"""
        response = self.client.post("/api/v1/module4/lesson5/v2-submissions", json=_submission_payload())
        self.assertEqual(response.status_code, 200, response.text)

        missing_token = self.client.get("/api/v1/teacher/module4/lesson5/classes/g7c03/pool-overview")
        self.assertEqual(missing_token.status_code, 401)

        teacher_token = self._login("xnwy-li")
        teacher_overview = self._overview(teacher_token, "g7c03")
        self.assertEqual(teacher_overview.status_code, 200, teacher_overview.text)

        forbidden_teacher = self._login("xnwy-zhang")
        forbidden = self._overview(forbidden_teacher, "g7c03")
        self.assertEqual(forbidden.status_code, 403)

        demo_token = self._login("xnwy-demo", password="")
        demo_overview = self._overview(demo_token, "g7c03")
        self.assertEqual(demo_overview.status_code, 200, demo_overview.text)

    def test_pool_item_detail_returns_current_v2_card_for_authorized_teacher(self) -> None:
        """授权教师可按题池 item 读取当前 V2 题卡详情用于只读预览。"""
        response = self.client.post("/api/v1/module4/lesson5/v2-submissions", json=_submission_payload())
        self.assertEqual(response.status_code, 200, response.text)
        teacher_token = self._login("xnwy-li")
        overview = self._overview(teacher_token)
        self.assertEqual(overview.status_code, 200, overview.text)
        news_item = next(item for item in overview.json()["items"] if item["cardKind"] == "news")

        detail = self._pool_item_detail(teacher_token, news_item["itemId"])
        self.assertEqual(detail.status_code, 200, detail.text)
        body = detail.json()
        self.assertEqual(body["itemId"], news_item["itemId"])
        self.assertEqual(body["itemVersionId"], news_item["currentV2VersionId"])
        self.assertEqual(body["authorName"], "测试学生")
        self.assertEqual(body["cardKind"], "news")
        self.assertEqual(body["material"]["title"], "news 材料")
        self.assertEqual(body["task"]["question"], "news 判断题")
        self.assertEqual(body["correctOptionKey"], "B")
        self.assertEqual(body["cardJson"]["id"], "news-card-1")

    def test_pool_item_detail_auth_and_class_boundaries(self) -> None:
        """题池详情要求 token 与班级授权，并拒绝跨班 item 读取。"""
        response = self.client.post("/api/v1/module4/lesson5/v2-submissions", json=_submission_payload())
        self.assertEqual(response.status_code, 200, response.text)
        teacher_token = self._login("xnwy-li")
        overview = self._overview(teacher_token)
        self.assertEqual(overview.status_code, 200, overview.text)
        item_id = overview.json()["items"][0]["itemId"]

        missing_token = self.client.get(f"/api/v1/teacher/module4/lesson5/classes/g7c03/pool-items/{item_id}")
        self.assertEqual(missing_token.status_code, 401)

        forbidden_teacher = self._login("xnwy-zhang")
        forbidden = self._pool_item_detail(forbidden_teacher, item_id)
        self.assertEqual(forbidden.status_code, 403)

        cross_class = self._pool_item_detail(teacher_token, item_id, class_id="g7c01")
        self.assertEqual(cross_class.status_code, 404)

        demo_token = self._login("xnwy-demo", password="")
        demo_detail = self._pool_item_detail(demo_token, item_id)
        self.assertEqual(demo_detail.status_code, 200, demo_detail.text)


if __name__ == "__main__":
    unittest.main()
