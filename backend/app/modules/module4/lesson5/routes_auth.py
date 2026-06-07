"""
文件说明：模块 4 课时 5 登录认证 FastAPI 路由。
职责：暴露 /auth 下的 login/me/logout 端点，委托 auth 层并把 AccountAuthError 映射为 HTTPException。
更新触发：auth 端点、路由前缀、请求/响应模型或错误映射变化时，需要同步更新本文件。
注意：本 router 自带 prefix="/auth"，在 main.py 以 prefix="/api/v1/module4" 挂载，最终前缀为 /api/v1/module4/auth，不带 /lesson5。
"""

from fastapi import APIRouter, Depends, HTTPException

from . import auth
from .dependencies import SessionContext, get_current_session
from .errors import AccountAuthError
from .schemas import LoginRequest, LoginResponse, LogoutResponse, MeResponse

router = APIRouter(prefix="/auth", tags=["module4-lesson5-auth"])


@router.post("/login", response_model=LoginResponse)
def post_login(payload: LoginRequest) -> LoginResponse:
    """账号登录；demo 免密码，其它账号校验统一口令。"""
    try:
        return auth.login(payload)
    except AccountAuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/me", response_model=MeResponse)
def get_me(session: SessionContext = Depends(get_current_session)) -> MeResponse:
    """按当前有效会话返回用户身份与班级授权。"""
    try:
        return auth.get_me(session.user_id)
    except AccountAuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/logout", response_model=LogoutResponse)
def post_logout(session: SessionContext = Depends(get_current_session)) -> LogoutResponse:
    """撤销当前会话 token（幂等）。"""
    return auth.logout(session.token)
