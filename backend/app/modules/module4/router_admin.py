"""
文件说明：模块 4 管理员侧聚合路由。
职责：汇总挂载模块 4 管理员侧端点；当前接入课时 5 C1a 账号与班级授权管理 API。
更新触发：新增/移动模块 4 管理员端点、调整路由前缀或新增认证策略时，需要同步更新本文件。
"""

from fastapi import APIRouter

from .lesson5.routes_admin import router as lesson5_admin_router

router = APIRouter()

router.include_router(lesson5_admin_router)
