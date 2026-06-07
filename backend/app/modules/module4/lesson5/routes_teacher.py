"""
文件说明：模块 4 课时 5 teacher 班级查询、题池 overview、session 控制、analytics 与 revision-plans FastAPI 路由。
职责：暴露当前登录账号可见的班级列表端点，以及 /lesson5 命名空间下的班级题池只读 overview、教师 session 创建/列表/设置/锁池/phase/overview 控制、progress 聚合、compute-stats、analytics 与 revision-plans 读取；teacher 按授权班级可见，demo 返回/读取全部班级只读视图。
更新触发：teacher 端点、路由路径、请求/响应模型、可见班级口径、题池 overview、session 生命周期、progress、compute-stats、analytics 或 revision-plans 契约变化时，需要同步更新本文件。
注意：router 不带前缀，用于 /api/v1/teacher/module4/classes；lesson5_router 由聚合路由以 prefix="/lesson5" 挂载，最终为 /api/v1/teacher/module4/lesson5/classes/{class_id}/pool-overview。
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from . import pool_service, repository, report_service, revision_service, service, session_service, stats_service
from .dependencies import SessionContext, get_current_session, require_teacher
from app.core.database import database_transaction
from .errors import Lesson5PoolError, Lesson5ReportError, Lesson5RevisionError, Lesson5SessionError, Lesson5StatsError
from .schemas import (
    ClassPoolItemDetailResponse,
    ClassPoolOverviewResponse,
    ComputeStatsResponse,
    CreateSessionRequest,
    LockPoolResponse,
    PhaseChangeRequest,
    PhaseChangeResponse,
    RevisionPlansResponse,
    SessionAnalyticsResponse,
    SessionDto,
    SessionListResponse,
    SessionOverviewResponse,
    SessionProgressResponse,
    TeacherClassesResponse,
    UpdateSettingsRequest,
)

router = APIRouter(tags=["module4-lesson5-teacher"])
lesson5_router = APIRouter(tags=["module4-lesson5-teacher"])


@router.get("/classes", response_model=TeacherClassesResponse)
def get_classes(session: SessionContext = Depends(get_current_session)) -> TeacherClassesResponse:
    """返回当前账号可见的班级；teacher 为被分配班级，demo 为全班 view 只读。"""
    return service.list_my_classes(session.role, session.user_id)


def _ensure_can_view_class(session: SessionContext, class_id: str) -> None:
    """校验题池 overview 只读权限；demo 全班可看，teacher 需有任意授权。"""
    if session.role == "demo":
        return
    if session.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="需要教师权限。")
    with database_transaction() as connection:
        permission = repository.get_teacher_class_permission(connection, session.user_id, class_id)
    if permission is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="你没有该班级的查看权限。")


@lesson5_router.get("/classes/{class_id}/pool-overview", response_model=ClassPoolOverviewResponse)
def get_pool_overview(
    class_id: str,
    session: SessionContext = Depends(get_current_session),
) -> ClassPoolOverviewResponse:
    """返回指定班级当前题池 overview；仅用于教师/演示只读查看。"""
    _ensure_can_view_class(session, class_id)
    try:
        return pool_service.get_class_pool_overview(class_id)
    except Lesson5PoolError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@lesson5_router.get("/classes/{class_id}/pool-items/{item_id}", response_model=ClassPoolItemDetailResponse)
def get_pool_item_detail(
    class_id: str,
    item_id: str,
    session: SessionContext = Depends(get_current_session),
) -> ClassPoolItemDetailResponse:
    """返回班级题池当前 V2 题卡详情；仅用于教师/演示只读预览。"""
    _ensure_can_view_class(session, class_id)
    try:
        return pool_service.get_class_pool_item_detail(class_id, item_id)
    except Lesson5PoolError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@lesson5_router.post("/sessions", response_model=SessionDto)
def post_session(
    payload: CreateSessionRequest,
    session: SessionContext = Depends(require_teacher),
) -> SessionDto:
    """创建课时 5 teacher session；service 内再次校验班级 manage 权限。"""
    try:
        return session_service.create_session(payload, session)
    except Lesson5SessionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@lesson5_router.get("/sessions", response_model=SessionListResponse)
def get_sessions(
    class_id: str = Query(..., alias="classId"),
    session: SessionContext = Depends(get_current_session),
) -> SessionListResponse:
    """列出指定班级的课时 5 sessions；teacher 需有任意授权，demo 全班只读。"""
    try:
        return session_service.list_sessions(class_id, session)
    except Lesson5SessionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@lesson5_router.patch("/sessions/{session_id}/settings", response_model=SessionDto)
def patch_session_settings(
    session_id: str,
    payload: UpdateSettingsRequest,
    session: SessionContext = Depends(require_teacher),
) -> SessionDto:
    """更新 draft session 设置；锁池后返回 409。"""
    try:
        return session_service.update_settings(session_id, payload, session)
    except Lesson5SessionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@lesson5_router.post("/sessions/{session_id}/lock-pool", response_model=LockPoolResponse)
def post_lock_pool(
    session_id: str,
    session: SessionContext = Depends(require_teacher),
) -> LockPoolResponse:
    """冻结当前 V2 题池并推进到 pool_locked。"""
    try:
        return session_service.lock_pool(session_id, session)
    except Lesson5SessionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@lesson5_router.post("/sessions/{session_id}/phase", response_model=PhaseChangeResponse)
def post_phase(
    session_id: str,
    payload: PhaseChangeRequest,
    session: SessionContext = Depends(require_teacher),
) -> PhaseChangeResponse:
    """按状态机顺序推进 session phase；pool_locked 入口必须使用 lock-pool。"""
    try:
        return session_service.advance_phase(session_id, payload, session)
    except Lesson5SessionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@lesson5_router.post("/sessions/{session_id}/compute-stats", response_model=ComputeStatsResponse)
def post_compute_stats(
    session_id: str,
    session: SessionContext = Depends(require_teacher),
) -> ComputeStatsResponse:
    """计算并覆盖写入当前 session 的题卡统计；仅 teacher manage 可写。"""
    try:
        return stats_service.compute_stats(session_id, session)
    except Lesson5StatsError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@lesson5_router.get("/sessions/{session_id}/analytics", response_model=SessionAnalyticsResponse)
def get_session_analytics(
    session_id: str,
    session: SessionContext = Depends(get_current_session),
) -> SessionAnalyticsResponse:
    """读取当前 session 的班级题卡级 analytics；teacher 可见授权或 demo 可读。"""
    try:
        return report_service.get_session_analytics(session_id, session)
    except Lesson5ReportError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@lesson5_router.get("/sessions/{session_id}/revision-plans", response_model=RevisionPlansResponse)
def get_revision_plans(
    session_id: str,
    session: SessionContext = Depends(get_current_session),
) -> RevisionPlansResponse:
    """读取当前 session 的班级 V3 修订总览；teacher 可见授权或 demo 可读。"""
    try:
        return revision_service.list_revision_plans(session_id, session)
    except Lesson5RevisionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@lesson5_router.get("/sessions/{session_id}/overview", response_model=SessionOverviewResponse)
def get_session_overview(
    session_id: str,
    session: SessionContext = Depends(get_current_session),
) -> SessionOverviewResponse:
    """读取 session overview；teacher 任意授权或 demo 只读可见。"""
    try:
        return session_service.get_session_overview(session_id, session)
    except Lesson5SessionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@lesson5_router.get("/sessions/{session_id}/progress", response_model=SessionProgressResponse)
def get_session_progress(
    session_id: str,
    session: SessionContext = Depends(get_current_session),
) -> SessionProgressResponse:
    """读取 session 全班试答进度；teacher 任意授权或 demo 只读可见。"""
    try:
        return session_service.get_session_progress(session_id, session)
    except Lesson5SessionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
