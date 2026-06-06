<!--
文件说明：ClassQuest backend/ 目录结构真相源。
职责：记录后端顶层目录职责、依赖方向和运行时路径，不穿透到模块 4 内部业务细节。
更新触发：后端目录、core/shared/modules/scripts 分层、运维脚本（rsync-exclude、BACKUP-RULES）或运行时路径变化时，需要同步更新本文件。
-->

# FILE-STRUCTURE — backend

## 结构

```text
backend/
├── README.md
├── FILE-STRUCTURE.md
├── BACKUP-RULES.md
├── .env.example
├── requirements.txt
├── .gitignore
├── app/
│   ├── main.py
│   ├── core/
│   ├── modules/
│   │   └── module4/
│   │       ├── lesson3/
│   │       ├── lesson4/
│   │       └── sql/
│   └── shared/
└── scripts/
    ├── rsync-exclude.txt
    ├── init_db.py
    ├── backup_daily.sh
    └── recompute_stats.py
```

## 职责

- `.env.example`：后端环境变量示例，不包含真实密钥；本地真实 `backend/.env` 被仓库忽略。
- `app/main.py`：FastAPI 应用入口，启动时加载 `backend/.env`，注册健康检查、模块 4 课时 3 题卡自检 router 与课时 4 peer-review / moderation routes。
- `app/core/`：配置、安全、数据库连接等项目级基础能力；`config.py` 负责 `.env` 加载、运行时路径、`CLASSQUEST_DATABASE_PATH` 与 `CORS_ALLOWED_ORIGINS` 解析；`database.py` 负责 SQLite 连接、WAL、短事务和 schema 初始化。
- `app/modules/`：后端模块域，目前只有模块 4；模块 4 下的 `lesson3/` 提供题卡自检助手后端壳，`lesson4/` 提供同伴互审 SQLite API 与 relay 端点（B1~B7、recovery、`moderate-text`），`sql/` 存放课时 4 同伴互审请求表 schema。
- `app/shared/`：后端业务无关工具。
- `BACKUP-RULES.md`：生产停机维护前的备份/回滚规则（deploy 批次、MANIFEST、INDEX）；仅运维使用，日常开发用 git。
- `scripts/`：运维脚本。`init_db.py` 初始化 SQLite；`rsync-exclude.txt` 为 Mac→服务器发布排除清单；`backup_daily.sh` / `recompute_stats.py` 为占位或统计脚本。

## 依赖方向

```text
main → core / modules / shared
routers → services → database/file layer
shared → 不依赖模块业务
```

## 运行时路径

```text
/var/lib/classquest/db/classquest.sqlite
/var/lib/classquest/uploads/
/var/lib/classquest/exports/
/var/lib/classquest/backups/
```

