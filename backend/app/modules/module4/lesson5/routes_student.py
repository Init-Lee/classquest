"""
文件说明：模块 4 课时 5 学生侧 FastAPI 路由。
职责：暴露 V2/V3 题池提交、active-session、participants attach、session state、assignments 读取/生成、answer 提交、rating 提交、my-report 与 my-completion-summary 读取端点；学生身份来自请求体或 participantId + lesson5ClientId，不使用教师 token。
更新触发：学生 V2/V3 提交流程、participant 绑定、assignment 生成、answer/rating 提交、my-report/completion-summary 契约、路由路径、请求/响应模型或业务错误映射变化时，需要同步更新本文件。
"""

from fastapi import APIRouter, HTTPException, Query

from . import answer_service
from . import assignment_sampler
from . import completion_service
from . import participant_service
from . import pool_service
from . import rating_service
from . import report_service
from . import revision_service
from .errors import (
    Lesson5AnswerError,
    Lesson5AssignmentError,
    Lesson5CompletionError,
    Lesson5ParticipantError,
    Lesson5PoolError,
    Lesson5RatingError,
    Lesson5ReportError,
    Lesson5RevisionError,
)
from .schemas import (
    ActiveSessionResponse,
    AnswerSubmitRequest,
    AnswerSubmitResponse,
    AssignmentListResponse,
    AttachParticipantRequest,
    AttachParticipantResponse,
    MyCompletionSummaryResponse,
    MyReportResponse,
    RatingSubmitRequest,
    RatingSubmitResponse,
    SessionStateResponse,
    V2SubmissionRequest,
    V2SubmissionResponse,
    V3SubmissionRequest,
    V3SubmissionResponse,
)

router = APIRouter(tags=["module4-lesson5-student"])


@router.post("/v2-submissions", response_model=V2SubmissionResponse)
def post_v2_submission(payload: V2SubmissionRequest) -> V2SubmissionResponse:
    """学生提交课时 4 ready 包中的两张 V2 卡进入班级题池。"""
    try:
        return pool_service.submit_v2(payload)
    except Lesson5PoolError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/v3-submissions", response_model=V3SubmissionResponse)
def post_v3_submission(payload: V3SubmissionRequest) -> V3SubmissionResponse:
    """学生在 analytics_open 后提交本人题卡 V3，写入长期题库。"""
    try:
        return revision_service.submit_v3(payload)
    except Lesson5RevisionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/active-session", response_model=ActiveSessionResponse)
def get_active_session(classId: str = Query(..., min_length=1)) -> ActiveSessionResponse:
    """按班级查询最新可连接 lesson5 session；无可连接 session 返回 404。"""
    try:
        return participant_service.get_active_session(classId)
    except Lesson5ParticipantError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/participants/attach", response_model=AttachParticipantResponse)
def post_participant_attach(payload: AttachParticipantRequest) -> AttachParticipantResponse:
    """把学生绑定到指定 session；重复 attach 按同身份幂等返回。"""
    try:
        return participant_service.attach_participant(payload)
    except Lesson5ParticipantError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/sessions/{session_id}/state", response_model=SessionStateResponse)
def get_session_state(
    session_id: str,
    participantId: str = Query(..., min_length=1),
) -> SessionStateResponse:
    """读取学生侧 session 状态与当前 participant 进度。"""
    try:
        return participant_service.get_session_state(session_id, participantId)
    except Lesson5ParticipantError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/sessions/{session_id}/assignments", response_model=AssignmentListResponse)
def get_assignments(
    session_id: str,
    participantId: str = Query(..., min_length=1),
) -> AssignmentListResponse:
    """读取或首次生成当前 participant 的稳定 assignment 列表。"""
    try:
        return assignment_sampler.get_or_create_assignments(session_id, participantId)
    except Lesson5AssignmentError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/assignments/{assignment_id}/answer", response_model=AnswerSubmitResponse)
def post_assignment_answer(assignment_id: str, payload: AnswerSubmitRequest) -> AnswerSubmitResponse:
    """提交 assignment answer；仅 trial_open 阶段允许，重复提交幂等返回既有 answer。"""
    try:
        return answer_service.submit_answer(assignment_id, payload)
    except Lesson5AnswerError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/answers/{answer_id}/rating", response_model=RatingSubmitResponse)
def post_answer_rating(answer_id: str, payload: RatingSubmitRequest) -> RatingSubmitResponse:
    """提交 answer rating；必须先有 answer，重复评分幂等返回既有 rating。"""
    try:
        return rating_service.submit_rating(answer_id, payload)
    except Lesson5RatingError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/sessions/{session_id}/my-report", response_model=MyReportResponse)
def get_my_report(
    session_id: str,
    participantId: str = Query(..., min_length=1),
    lesson5ClientId: str = Query(..., min_length=1),
) -> MyReportResponse:
    """读取学生本人作者题卡的统计报告；要求 analytics_open 且 participant/client 匹配。"""
    try:
        return report_service.get_my_report(session_id, participantId, lesson5ClientId)
    except Lesson5ReportError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/sessions/{session_id}/my-completion-summary", response_model=MyCompletionSummaryResponse)
def get_my_completion_summary(
    session_id: str,
    participantId: str = Query(..., min_length=1),
    lesson5ClientId: str = Query(..., min_length=1),
) -> MyCompletionSummaryResponse:
    """读取学生本人课时 5 完成摘要；用于 Step4 本地快照与 HTML 导出。"""
    try:
        return completion_service.get_my_completion_summary(session_id, participantId, lesson5ClientId)
    except Lesson5CompletionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
