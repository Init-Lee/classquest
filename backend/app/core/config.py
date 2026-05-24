"""
文件说明：后端配置模块。
职责：集中管理运行时目录、数据库路径和本地 .env 环境变量加载。
更新触发：接入新的部署参数、环境变量、数据库路径或运行时目录时，需要同步更新本文件。
"""

import os
from pathlib import Path

RUNTIME_ROOT = Path("/var/lib/classquest")
DATABASE_PATH = RUNTIME_ROOT / "db" / "classquest.sqlite"
BACKEND_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ENV_PATH = BACKEND_ROOT / ".env"


def _strip_env_value(raw_value: str) -> str:
    """去掉 .env 值两侧空白和成对引号，保留中间内容。"""
    value = raw_value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"', "“", "”"}:
        return value[1:-1]
    if len(value) >= 2 and value[0] == "“" and value[-1] == "”":
        return value[1:-1]
    return value


def load_backend_env(env_path: Path = DEFAULT_ENV_PATH) -> None:
    """加载 backend/.env；已有系统环境变量优先，不被文件覆盖。"""
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, raw_value = stripped.split("=", 1)
        env_key = key.strip()
        if not env_key or env_key in os.environ:
            continue
        os.environ[env_key] = _strip_env_value(raw_value)


def get_cors_allowed_origins() -> list[str]:
    """读取 OSS 等前端跨域来源白名单；留空表示不启用 CORS 中间件。"""
    raw = os.getenv("CORS_ALLOWED_ORIGINS", "")
    return [item.strip() for item in raw.split(",") if item.strip()]

