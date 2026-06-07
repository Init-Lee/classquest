"""
文件说明：后端安全工具模块。
职责：承载模块 4 课时 5 教师/管理员/演示账号登录的会话令牌生成与共享口令常量时间校验。
更新触发：登录令牌格式、口令校验策略、密码哈希或上传安全校验等权限相关安全工具变化时，需要同步更新本文件。
"""

import secrets


def generate_session_token() -> str:
    """生成登录会话令牌，格式为 `cq_session_` 前缀加 32 位十六进制随机串。"""
    return f"cq_session_{secrets.token_hex(16)}"


def verify_shared_password(candidate: str, expected: str) -> bool:
    """常量时间比较候选口令与服务端期望口令，避免计时侧信道；按 UTF-8 字节比较以兼容非 ASCII 输入。"""
    return secrets.compare_digest(candidate.encode("utf-8"), expected.encode("utf-8"))
