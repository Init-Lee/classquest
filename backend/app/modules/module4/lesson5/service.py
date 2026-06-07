"""
文件说明：模块 4 课时 5 admin 与 teacher 的账号/班级业务服务层。
职责：实现 admin 的班级列表、账号列表、班级授权明细与教师授权全量覆盖写入，以及 teacher 的可见班级查询；认证与会话核心见 auth.py。
更新触发：admin 授权写入规则（角色/permission/班级存在性校验、className 回填、全量覆盖）、班级或账号查询口径、teacher 可见班级口径变化时，需要同步更新本文件。
"""

from __future__ import annotations

import secrets

from app.core.database import database_transaction

from . import repository
from .auth import build_user_dto, server_now, to_iso8601
from .errors import AccountAuthError
from .schemas import (
    AssignmentsResponse,
    ClassAssignmentDTO,
    ClassDTO,
    ClassListResponse,
    PutTeacherClassesRequest,
    PutTeacherClassesResponse,
    TeacherClassDTO,
    TeacherClassesResponse,
    UserListResponse,
)


def _generate_assignment_id() -> str:
    """生成班级授权主键 ID。"""
    return f"asg_{secrets.token_hex(8)}"


def list_classes() -> ClassListResponse:
    """admin：返回全部班级。"""
    with database_transaction() as connection:
        rows = repository.list_classes(connection)
    classes = [
        ClassDTO(
            classId=row["class_id"],
            className=row["class_name"],
            gradeLabel=row["grade_label"],
            active=bool(row["active"]),
        )
        for row in rows
    ]
    return ClassListResponse(classes=classes)


def list_users() -> UserListResponse:
    """admin：返回 admin/teacher/demo 账号用户（非学生）。"""
    with database_transaction() as connection:
        rows = repository.list_account_users(connection)
    return UserListResponse(users=[build_user_dto(row) for row in rows])


def list_class_assignments() -> AssignmentsResponse:
    """admin：返回所有教师班级授权明细（className 以服务端为准）。"""
    with database_transaction() as connection:
        rows = repository.list_all_teacher_assignments(connection)
    assignments = [
        ClassAssignmentDTO(
            userId=row["user_id"],
            account=row["account"],
            displayName=row["display_name"],
            classId=row["class_id"],
            className=row["class_name"],
            permission=row["permission"],
        )
        for row in rows
    ]
    return AssignmentsResponse(assignments=assignments)


def put_teacher_classes(user_id: str, payload: PutTeacherClassesRequest) -> PutTeacherClassesResponse:
    """admin：以全量覆盖方式重写某教师的班级授权（单事务先删后批量插）。

    校验：目标用户存在且 role=teacher；同一请求内 classId 不可重复；每个 classId 必须存在于
    cq_classes；className 一律以服务端 cq_classes 回填，不信任前端传值。
    """
    seen_class_ids: set[str] = set()
    for item in payload.assignments:
        if item.classId in seen_class_ids:
            raise AccountAuthError(f"授权列表中存在重复班级：{item.classId}。", 400)
        seen_class_ids.add(item.classId)

    now = to_iso8601(server_now())

    with database_transaction() as connection:
        target = repository.get_user_by_id(connection, user_id)
        if target is None:
            raise AccountAuthError("目标用户不存在。", 404)
        if target["role"] != "teacher":
            raise AccountAuthError("只能为教师账号分配班级授权。", 400)

        resolved: list[tuple[str, str, str]] = []
        for item in payload.assignments:
            class_row = repository.get_class_by_id(connection, item.classId)
            if class_row is None:
                raise AccountAuthError(f"班级不存在：{item.classId}。", 400)
            resolved.append((item.classId, class_row["class_name"], item.permission))

        repository.delete_teacher_assignments(connection, user_id)
        for class_id, class_name, permission in resolved:
            repository.insert_teacher_assignment(
                connection,
                assignment_id=_generate_assignment_id(),
                user_id=user_id,
                class_id=class_id,
                class_name=class_name,
                permission=permission,
                created_at=now,
                updated_at=now,
            )

    return PutTeacherClassesResponse(ok=True, userId=user_id, updatedCount=len(resolved))


def list_my_classes(role: str, user_id: str) -> TeacherClassesResponse:
    """teacher 返回被分配班级；demo 返回全部班级的 view 只读授权。"""
    if role == "demo":
        with database_transaction() as connection:
            rows = repository.list_classes(connection)
        classes = [
            TeacherClassDTO(
                classId=row["class_id"],
                className=row["class_name"],
                gradeLabel=row["grade_label"],
                permission="view",
            )
            for row in rows
        ]
        return TeacherClassesResponse(classes=classes)

    if role != "teacher":
        return TeacherClassesResponse(classes=[])

    with database_transaction() as connection:
        rows = repository.list_class_permissions_for_user(connection, user_id)
    classes = [
        TeacherClassDTO(
            classId=row["class_id"],
            className=row["class_name"],
            gradeLabel=row["grade_label"],
            permission=row["permission"],
        )
        for row in rows
    ]
    return TeacherClassesResponse(classes=classes)
