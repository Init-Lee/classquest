"""
文件说明：模块 4 学生侧与公共侧聚合路由。
职责：汇总挂载模块 4 学生侧端点；当前接入课时 5 /lesson5、课时 6 /lesson6 本人 V3 发布状态查询，以及无鉴权 /public-challenge 匿名公共挑战端点。
更新触发：新增/移动模块 4 学生或公共端点、调整路由前缀或新增学生侧认证策略时，需要同步更新本文件。
"""

from fastapi import APIRouter

from .lesson5.routes_student import router as lesson5_student_router
from .lesson6.routes_public import router as lesson6_public_router
from .lesson6.routes_student import router as lesson6_student_router

router = APIRouter()

router.include_router(lesson5_student_router, prefix="/lesson5")
router.include_router(lesson6_student_router, prefix="/lesson6")
router.include_router(lesson6_public_router, prefix="/public-challenge")
