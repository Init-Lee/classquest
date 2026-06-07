"""
文件说明：模块 4 课时 5 登录认证与会话核心。
职责：实现 login（校验账号启用、demo 免密码、非 demo 统一口令、签发并写入会话 token）、me（按有效会话回填身份与授权）、logout（撤销会话），并对外提供本子包共享的上海时区时钟与用户/授权 DTO 装配 helper。
更新触发：登录校验规则、令牌签发/过期策略、me/logout 行为、classPermissions 回填口径或时间格式约定变化时，需要同步更新本文件。
"""

from __future__ import annotations

import sqlite3
from datetime import datetime
from zoneinfo import ZoneInfo

from app.core.config import get_teacher_shared_password
from app.core.database import database_transaction
from app.core.security import generate_session_token, verify_shared_password

from . import repository
from .errors import AccountAuthError
from .schemas import (
    ClassPermissionDTO,
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    MeResponse,
    UserDTO,
)

_SHANGHAI_TZ = ZoneInfo("Asia/Shanghai")
_INVALID_CREDENTIALS_MESSAGE = "账号或口令不正确。"
_DEMO_ACCOUNT = "xnwy-demo"


def server_now() -> datetime:
    """返回当前中国标准时间（Asia/Shanghai，UTC+8）。"""
    return datetime.now(_SHANGHAI_TZ)


def to_iso8601(value: datetime) -> str:
    """格式化为 API/存储使用的 ISO8601 字符串（含 +08:00 偏移，去掉微秒）。"""
    normalized = value.astimezone(_SHANGHAI_TZ).replace(microsecond=0)
    return normalized.isoformat()


def build_user_dto(row: sqlite3.Row) -> UserDTO:
    """把 cq_users 行装配为对外 UserDTO（不含任何口令字段）。"""
    return UserDTO(
        userId=row["user_id"],
        account=row["account"],
        displayName=row["display_name"],
        role=row["role"],
    )


def load_class_permissions(connection: sqlite3.Connection, user_row: sqlite3.Row) -> list[ClassPermissionDTO]:
    """按角色回填登录会话授权快照；demo 的全班只读视图由 teacher/classes 提供。"""
    if user_row["role"] != "teacher":
        return []
    rows = repository.list_class_permissions_for_user(connection, user_row["user_id"])
    return [
        ClassPermissionDTO(
            classId=row["class_id"],
            className=row["class_name"],
            permission=row["permission"],
        )
        for row in rows
    ]


def login(payload: LoginRequest) -> LoginResponse:
    """校验账号与口令策略，签发并持久化会话 token；账号不存在或口令错误统一返回 401。"""
    created_at = to_iso8601(server_now())
    token = generate_session_token()

    with database_transaction() as connection:
        user = repository.get_active_user_by_account(connection, payload.account)
        if user is None:
            raise AccountAuthError(_INVALID_CREDENTIALS_MESSAGE, 401)
        is_demo = payload.account == _DEMO_ACCOUNT and user["role"] == "demo"
        if not is_demo:
            expected_password = get_teacher_shared_password()
            if not expected_password:
                raise AccountAuthError("服务端未配置登录口令，请联系管理员。", 500)
            if not verify_shared_password(payload.password, expected_password):
                raise AccountAuthError(_INVALID_CREDENTIALS_MESSAGE, 401)

        repository.insert_auth_session(
            connection,
            token=token,
            user_id=user["user_id"],
            role=user["role"],
            created_at=created_at,
            expires_at=None,
        )
        permissions = load_class_permissions(connection, user)
        user_dto = build_user_dto(user)

    return LoginResponse(token=token, user=user_dto, classPermissions=permissions)


def get_me(user_id: str) -> MeResponse:
    """按当前有效会话的 user_id 回填用户身份与班级授权。"""
    with database_transaction() as connection:
        user = repository.get_active_user_by_id(connection, user_id)
        if user is None:
            raise AccountAuthError("登录状态已失效，请重新登录。", 401)
        permissions = load_class_permissions(connection, user)
        user_dto = build_user_dto(user)

    return MeResponse(user=user_dto, classPermissions=permissions)


def logout(token: str) -> LogoutResponse:
    """撤销当前会话 token；重复登出保持幂等。"""
    revoked_at = to_iso8601(server_now())
    with database_transaction() as connection:
        repository.revoke_session(connection, token=token, revoked_at=revoked_at)
    return LogoutResponse(ok=True)
