"""
文件说明：模块 4 课时 5 FastAPI 鉴权依赖。
职责：从 Authorization: Bearer <token> 解析有效会话，并提供 require_admin / require_teacher /
require_class_manage / forbid_demo 等权限闸门，统一约束「无效令牌→401、权限不足→403、demo 任意写→403」。
更新触发：令牌解析方式、会话有效性判定、角色/班级权限闸门或 demo 只读基线变化时，需要同步更新本文件。
"""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status

from app.core.database import database_transaction

from . import repository
from .auth import server_now, to_iso8601


@dataclass(frozen=True)
class SessionContext:
    """当前请求的有效会话身份，供路由与 service 读取。"""

    user_id: str
    role: str
    account: str
    display_name: str
    token: str


def _extract_bearer_token(authorization: str | None) -> str | None:
    """从 Authorization 头解析 Bearer 令牌；缺失或格式不符返回 None。"""
    if not authorization:
        return None
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    token = parts[1].strip()
    return token or None


def get_current_session(authorization: str | None = Header(default=None)) -> SessionContext:
    """解析并校验当前会话；无令牌或会话失效（撤销/过期/用户停用）一律 401。"""
    token = _extract_bearer_token(authorization)
    if token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="缺少有效的登录令牌。")

    now = to_iso8601(server_now())
    with database_transaction() as connection:
        row = repository.get_valid_session(connection, token, now)

    if row is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录状态已失效，请重新登录。")

    return SessionContext(
        user_id=row["user_id"],
        role=row["role"],
        account=row["account"],
        display_name=row["display_name"],
        token=token,
    )


def require_admin(session: SessionContext = Depends(get_current_session)) -> SessionContext:
    """要求当前会话为 admin，否则 403。"""
    if session.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="需要管理员权限。")
    return session


def require_teacher(session: SessionContext = Depends(get_current_session)) -> SessionContext:
    """要求当前会话为 teacher，显式排除 demo/admin，否则 403（用于课时 5 教师写端点）。"""
    if session.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="需要教师权限。")
    return session


def forbid_demo(session: SessionContext = Depends(get_current_session)) -> SessionContext:
    """demo 只读基线：演示账号执行任意写操作一律 403。"""
    if session.role == "demo":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="演示账户为只读模式，无法执行写操作。")
    return session


def require_class_manage(
    class_id: str,
    session: SessionContext = Depends(get_current_session),
) -> SessionContext:
    """要求当前 teacher 对目标班级具备 manage 授权，否则 403（供课时 5 班级写端点复用）。"""
    if session.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="需要教师权限。")
    with database_transaction() as connection:
        permission = repository.get_teacher_class_permission(connection, session.user_id, class_id)
    if permission != "manage":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="你没有该班级的管理权限。")
    return session
