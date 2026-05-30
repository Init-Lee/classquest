"""
文件说明：后端 SQLite 数据库初始化脚本。
职责：调用 core/database.py 创建运行时数据库，并执行已登记的 schema 初始化。
更新触发：数据库初始化入口、schema 列表、运行时路径、sys.path 引导或部署脚本变化时，需要同步更新本文件。
"""

import sys
from pathlib import Path

# 将 backend 根目录加入 sys.path，使 `python scripts/init_db.py` 在无 PYTHONPATH 时也能导入 app 包
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from app.core.config import load_backend_env
from app.core.database import initialize_database


if __name__ == "__main__":
    load_backend_env()
    database_path = initialize_database()
    print(f"数据库已初始化：{database_path}")

