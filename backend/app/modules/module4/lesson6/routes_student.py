"""
文件说明：模块 4 课时 6 学生侧发布状态 FastAPI 路由。
职责：暴露 /lesson6/my-v3-publication-status，让学生端本地档案按 itemId + itemVersionId 查询本人 V3 发布状态；不提供班级、座位或作者枚举入口。
更新触发：Lesson6 学生端状态查询路径、请求/响应字段或隐私边界变化时，需要同步更新本文件。
"""

from __future__ import annotations

from fastapi import APIRouter

from . import publication_service
from .schemas import StudentPublicationStatusRequest, StudentPublicationStatusResponse

router = APIRouter(tags=["module4-lesson6-student"])


@router.post("/my-v3-publication-status", response_model=StudentPublicationStatusResponse)
def post_my_v3_publication_status(
    payload: StudentPublicationStatusRequest,
) -> StudentPublicationStatusResponse:
    """按请求中的 item/version 键返回发布状态，不支持按班级或座位查询。"""
    return publication_service.get_my_publication_status(payload)
