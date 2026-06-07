"""
文件说明：模块 4 课时 5 admin 账号/班级管理 FastAPI 路由。
职责：暴露班级列表、账号列表、班级授权明细查询与教师授权全量覆盖写入端点，全部要求 admin 会话，委托 service 层并映射业务错误。
更新触发：admin 端点、路由路径、请求/响应模型、权限闸门或错误映射变化时，需要同步更新本文件。
注意：本 router 不带前缀，被 module4/router_admin.py include 后由 main.py 挂在 /api/v1/admin/module4，故最终为 /api/v1/admin/module4/classes 等，不带 /lesson5。
"""

from fastapi import APIRouter, Depends, HTTPException

from . import service
from .dependencies import SessionContext, require_admin
from .errors import AccountAuthError
from .schemas import (
    AssignmentsResponse,
    ClassListResponse,
    PutTeacherClassesRequest,
    PutTeacherClassesResponse,
    UserListResponse,
)

router = APIRouter(tags=["module4-lesson5-admin"])


@router.get("/classes", response_model=ClassListResponse)
def get_classes(_session: SessionContext = Depends(require_admin)) -> ClassListResponse:
    """admin：返回全部班级。"""
    return service.list_classes()


@router.get("/users", response_model=UserListResponse)
def get_users(_session: SessionContext = Depends(require_admin)) -> UserListResponse:
    """admin：返回 admin/teacher/demo 账号用户。"""
    return service.list_users()


@router.get("/class-assignments", response_model=AssignmentsResponse)
def get_class_assignments(_session: SessionContext = Depends(require_admin)) -> AssignmentsResponse:
    """admin：返回所有教师班级授权明细。"""
    return service.list_class_assignments()


@router.put("/teachers/{user_id}/classes", response_model=PutTeacherClassesResponse)
def put_teacher_classes(
    user_id: str,
    payload: PutTeacherClassesRequest,
    _session: SessionContext = Depends(require_admin),
) -> PutTeacherClassesResponse:
    """admin：以全量覆盖方式重写指定教师的班级授权。"""
    try:
        return service.put_teacher_classes(user_id, payload)
    except AccountAuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
