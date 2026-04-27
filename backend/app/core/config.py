"""
文件说明：后端配置模块占位。
职责：后续集中读取运行时目录、数据库路径、CORS 白名单等配置。
更新触发：接入真实后端配置、环境变量或部署参数时，需要同步更新本文件。
"""

from pathlib import Path

RUNTIME_ROOT = Path("/var/lib/classquest")
DATABASE_PATH = RUNTIME_ROOT / "db" / "classquest.sqlite"

