"""
文件说明：模块 4 学生侧聚合路由。
职责：汇总挂载模块 4 学生侧端点；当前接入课时 5 /lesson5 命名空间下的 V2 题池提交流。
更新触发：新增/移动模块 4 学生端点、调整路由前缀或新增学生侧认证策略时，需要同步更新本文件。
"""

from fastapi import APIRouter

from .lesson5.routes_student import router as lesson5_student_router

router = APIRouter()

router.include_router(lesson5_student_router, prefix="/lesson5")
