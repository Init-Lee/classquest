"""
文件说明：模块 4 教师侧聚合路由。
职责：汇总挂载模块 4 教师侧端点；当前接入课时 5 教师班级/题池/session/统计/V3 修订端点，以及课时 6 /lesson6 发布审核与公共题库 overview 端点。
更新触发：新增/移动模块 4 教师端点、调整路由前缀或新增认证策略时，需要同步更新本文件。
"""

from fastapi import APIRouter

from .lesson5.routes_teacher import lesson5_router, router as lesson5_teacher_router
from .lesson6.routes_teacher import router as lesson6_teacher_router

router = APIRouter()

router.include_router(lesson5_teacher_router)
router.include_router(lesson5_router, prefix="/lesson5")
router.include_router(lesson6_teacher_router, prefix="/lesson6")
