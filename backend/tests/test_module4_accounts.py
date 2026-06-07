"""
文件说明：模块 4 课时 5 C1a 账号认证 API 回归测试。
职责：使用临时 SQLite 覆盖登录、当前用户、登出、教师班级查询和 admin 授权覆盖的核心权限边界。
更新触发：C1a auth/admin/teacher API 契约、seed 账号清单、权限状态码或响应字段变化时，需要同步更新本文件。
"""

from __future__ import annotations

import os
from pathlib import Path
import tempfile
import unittest

from fastapi.testclient import TestClient

from app.main import app
from scripts.seed_module4_accounts import seed_module4_accounts


class Module4AccountsApiTest(unittest.TestCase):
    """模块 4 课时 5 C1a 账号 API 黑盒测试。"""

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

    def test_login_me_teacher_classes_and_logout(self) -> None:
        """教师登录后可读取 me 与已授权班级，登出后 token 失效。"""
        bad_password = self.client.post(
            "/api/v1/module4/auth/login",
            json={"account": "xnwy-li", "password": "wrong"},
        )
        self.assertEqual(bad_password.status_code, 401)

        token = self._login("xnwy-li")
        self.assertTrue(token.startswith("cq_session_"))

        headers = {"Authorization": f"Bearer {token}"}
        me = self.client.get("/api/v1/module4/auth/me", headers=headers)
        self.assertEqual(me.status_code, 200, me.text)
        self.assertEqual(me.json()["user"]["role"], "teacher")
        permission_by_class = {item["classId"]: item for item in me.json()["classPermissions"]}
        self.assertEqual(permission_by_class["g7c03"]["permission"], "manage")

        classes = self.client.get("/api/v1/teacher/module4/classes", headers=headers)
        self.assertEqual(classes.status_code, 200, classes.text)
        class_by_id = {item["classId"]: item for item in classes.json()["classes"]}
        self.assertEqual(class_by_id["g7c03"]["className"], "初一（3）班")

        logout = self.client.post("/api/v1/module4/auth/logout", headers=headers)
        self.assertEqual(logout.status_code, 200, logout.text)
        expired_me = self.client.get("/api/v1/module4/auth/me", headers=headers)
        self.assertEqual(expired_me.status_code, 401)

    def test_login_password_rules_keep_demo_readonly(self) -> None:
        """demo 空口令或省略口令可登录；普通 teacher/admin 仍必须通过统一口令校验。"""
        demo_empty_password = self.client.post(
            "/api/v1/module4/auth/login",
            json={"account": "xnwy-demo", "password": ""},
        )
        self.assertEqual(demo_empty_password.status_code, 200, demo_empty_password.text)
        self.assertEqual(demo_empty_password.json()["user"]["role"], "demo")

        demo_missing_password = self.client.post(
            "/api/v1/module4/auth/login",
            json={"account": "xnwy-demo"},
        )
        self.assertEqual(demo_missing_password.status_code, 200, demo_missing_password.text)

        for account, password in (
            ("xnwy-li", ""),
            ("xnwy-li", "wrong"),
            ("xnwy-admin", ""),
            ("xnwy-admin", "wrong"),
        ):
            response = self.client.post(
                "/api/v1/module4/auth/login",
                json={"account": account, "password": password},
            )
            self.assertEqual(response.status_code, 401)

    def test_admin_replaces_teacher_assignments_and_forbids_non_admin(self) -> None:
        """admin 可全量覆盖教师授权，demo 与普通 teacher 不可调用 admin 写端点。"""
        admin_token = self._login("xnwy-admin")
        teacher_token = self._login("xnwy-li")
        demo_token = self._login("xnwy-demo", password="")

        payload = {
            "assignments": [
                {"classId": "g7c04", "className": "前端传入会被忽略", "permission": "view"},
                {"classId": "g7c05", "permission": "manage"},
            ]
        }
        response = self.client.put(
            "/api/v1/admin/module4/teachers/user_xnwy_li/classes",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=payload,
        )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["updatedCount"], 2)

        assignments = self.client.get(
            "/api/v1/admin/module4/class-assignments",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(assignments.status_code, 200, assignments.text)
        li_assignments = [
            item for item in assignments.json()["assignments"] if item["userId"] == "user_xnwy_li"
        ]
        self.assertEqual([item["classId"] for item in li_assignments], ["g7c04", "g7c05"])
        self.assertEqual(li_assignments[0]["className"], "初一（4）班")

        for token in (teacher_token, demo_token):
            forbidden = self.client.put(
                "/api/v1/admin/module4/teachers/user_xnwy_li/classes",
                headers={"Authorization": f"Bearer {token}"},
                json=payload,
            )
            self.assertEqual(forbidden.status_code, 403)

    def test_invalid_token_and_bad_assignment_payload(self) -> None:
        """无效 token 返回 401，非法授权目标或班级返回清晰错误。"""
        missing_token = self.client.get("/api/v1/module4/auth/me")
        self.assertEqual(missing_token.status_code, 401)

        admin_token = self._login("xnwy-admin")
        headers = {"Authorization": f"Bearer {admin_token}"}

        not_teacher = self.client.put(
            "/api/v1/admin/module4/teachers/user_xnwy_demo/classes",
            headers=headers,
            json={"assignments": []},
        )
        self.assertEqual(not_teacher.status_code, 400)

        missing_class = self.client.put(
            "/api/v1/admin/module4/teachers/user_xnwy_li/classes",
            headers=headers,
            json={"assignments": [{"classId": "missing", "permission": "manage"}]},
        )
        self.assertEqual(missing_class.status_code, 400)

    def test_demo_teacher_classes_are_all_readonly(self) -> None:
        """demo 可进入教师控制台只读视角，并以 view 权限看到全部班级。"""
        demo_token = self._login("xnwy-demo", password="")
        response = self.client.get(
            "/api/v1/teacher/module4/classes",
            headers={"Authorization": f"Bearer {demo_token}"},
        )
        self.assertEqual(response.status_code, 200, response.text)
        classes = response.json()["classes"]
        self.assertEqual([item["classId"] for item in classes], [f"g7c{index:02d}" for index in range(1, 13)])
        self.assertTrue(all(item["permission"] == "view" for item in classes))

        forbidden = self.client.put(
            "/api/v1/admin/module4/teachers/user_xnwy_li/classes",
            headers={"Authorization": f"Bearer {demo_token}"},
            json={"assignments": [{"classId": "g7c01", "permission": "view"}]},
        )
        self.assertEqual(forbidden.status_code, 403)


if __name__ == "__main__":
    unittest.main()
