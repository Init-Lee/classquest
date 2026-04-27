"""
文件说明：ClassQuest V1.5 后端应用入口。
职责：创建 FastAPI 实例，注册健康检查和模块 4 空路由。
更新触发：新增后端模块、全局中间件、异常处理或健康检查策略变化时，需要同步更新本文件。
"""

from fastapi import FastAPI

from app.modules.module4.router_admin import router as module4_admin_router
from app.modules.module4.router_student import router as module4_student_router
from app.modules.module4.router_teacher import router as module4_teacher_router

app = FastAPI(title="ClassQuest V1.5 API")


@app.get("/api/v1/health")
def health_check() -> dict[str, str]:
    """返回后端骨架健康状态。"""
    return {"status": "ok"}


app.include_router(module4_student_router, prefix="/api/v1/module4", tags=["module4-student"])
app.include_router(module4_teacher_router, prefix="/api/v1/teacher/module4", tags=["module4-teacher"])
app.include_router(module4_admin_router, prefix="/api/v1/admin/module4", tags=["module4-admin"])

