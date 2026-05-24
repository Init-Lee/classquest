<!--
文件说明：ClassQuest backend/ 目录结构真相源。
职责：记录后端顶层目录职责、依赖方向和运行时路径，不穿透到模块 4 内部业务细节。
更新触发：后端目录、core/shared/modules/scripts 分层或运行时路径变化时，需要同步更新本文件。
-->

# FILE-STRUCTURE — backend

## 结构

```text
backend/
├── README.md
├── FILE-STRUCTURE.md
├── .env.example
├── requirements.txt
├── .gitignore
├── app/
│   ├── main.py
│   ├── core/
│   ├── modules/
│   │   └── module4/
│   │       └── lesson3/
│   └── shared/
└── scripts/
```

## 职责

- `.env.example`：后端环境变量示例，不包含真实密钥；本地真实 `backend/.env` 被仓库忽略。
- `app/main.py`：FastAPI 应用入口，启动时加载 `backend/.env` 并注册健康检查。
- `app/core/`：配置、安全、数据库连接等项目级基础能力；`config.py` 负责 `.env` 加载、运行时路径与 `CORS_ALLOWED_ORIGINS` 解析。
- `app/modules/`：后端模块域，目前只有模块 4；模块 4 下的 `lesson3/` 提供题卡自检助手后端壳。
- `app/shared/`：后端业务无关工具。
- `scripts/`：初始化、备份、统计重算等运维脚本。

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

