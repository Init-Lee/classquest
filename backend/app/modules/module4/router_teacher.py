"""
文件说明：模块 4 教师侧聚合路由。
职责：汇总挂载模块 4 教师侧端点；当前接入课时 5 C1a 教师班级查询 API 与 C2a /lesson5 题池 overview API。
更新触发：新增/移动模块 4 教师端点、调整路由前缀或新增认证策略时，需要同步更新本文件。
"""

from fastapi import APIRouter

from .lesson5.routes_teacher import lesson5_router, router as lesson5_teacher_router

router = APIRouter()

router.include_router(lesson5_teacher_router)
router.include_router(lesson5_router, prefix="/lesson5")
