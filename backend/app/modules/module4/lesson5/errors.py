"""
文件说明：模块 4 课时 5 账号/认证、题池、session、answer、rating、stats、report、revision 与 completion 业务异常。
职责：定义携带 HTTP 状态码的账号认证、权限、题池提交、session 生命周期、学生作答、快评、统计计算、报告读取、V3 修订与完成摘要业务异常，供服务层抛出、路由层映射为 HTTPException。
更新触发：课时 5 账号、认证、班级授权、会话、学生提交流、锁池、题池 overview、answer、rating、stats、report、revision 或 completion 相关业务错误类型、状态码约定变化时，需要同步更新本文件。
"""

from __future__ import annotations


class AccountAuthError(Exception):
    """课时 5 账号/认证业务错误，携带建议的 HTTP 状态码。"""

    def __init__(self, message: str, status_code: int) -> None:
        super().__init__(message)
        self.status_code = status_code


class Lesson5PoolError(Exception):
    """课时 5 题池业务错误，携带建议的 HTTP 状态码。"""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


class Lesson5SessionError(Exception):
    """课时 5 session 生命周期业务错误，携带建议的 HTTP 状态码。"""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


class Lesson5ParticipantError(Exception):
    """课时 5 学生 participant 绑定业务错误，携带建议的 HTTP 状态码。"""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


class Lesson5AssignmentError(Exception):
    """课时 5 assignment 生成/读取业务错误，携带建议的 HTTP 状态码。"""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


class Lesson5AnswerError(Exception):
    """课时 5 学生作答业务错误，携带建议的 HTTP 状态码。"""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


class Lesson5RatingError(Exception):
    """课时 5 学生快评业务错误，携带建议的 HTTP 状态码。"""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


class Lesson5StatsError(Exception):
    """课时 5 统计计算业务错误，携带建议的 HTTP 状态码。"""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


class Lesson5ReportError(Exception):
    """课时 5 analytics/my-report 读取业务错误，携带建议的 HTTP 状态码。"""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


class Lesson5RevisionError(Exception):
    """课时 5 V3 修订提交与教师修订总览业务错误，携带建议的 HTTP 状态码。"""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


class Lesson5CompletionError(Exception):
    """课时 5 学生完成摘要业务错误，携带建议的 HTTP 状态码。"""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code
