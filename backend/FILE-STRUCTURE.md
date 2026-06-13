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
│   │       ├── lesson5/
│   │       ├── lesson6/
│   │       └── sql/
│   └── shared/
├── runtime/
│   └── fixtures/
│       └── module4/
│           └── lesson5/
│               ├── cloud_lesson4_question_bank/
│               ├── student_portfolio_json/
│               └── generated/
├── scripts/
│   ├── rsync-exclude.txt
│   ├── init_db.py
│   ├── inspect_module4_lesson5_fixture_sources.py
│   ├── export_module4_lesson5_cloud_fixture_from_lesson4_db.py
│   ├── seed_module4_lesson5_fixtures.py
│   ├── seed_module4_accounts.py
│   ├── seed_module4_lesson6_dev_demo.py
│   ├── backup_daily.sh
│   └── recompute_stats.py
└── tests/
    ├── __init__.py
    ├── test_module4_accounts.py
    ├── test_module4_lesson5_pool.py
    ├── test_module4_lesson5_session.py
    ├── test_module4_lesson5_participants_assignments.py
    ├── test_module4_lesson5_answers_ratings.py
    ├── test_module4_lesson5_stats_reports.py
    ├── test_module4_lesson5_v3_revision.py
    ├── test_module4_lesson6_publication.py
    ├── test_module4_lesson6_public_challenge.py
    └── test_module4_lesson6_stats.py
```

## 职责

- `.env.example`：后端环境变量示例，不包含真实密钥；本地真实 `backend/.env` 被仓库忽略。
- `app/main.py`：FastAPI 应用入口，启动时加载 `backend/.env`，注册健康检查、模块 4 学生/教师/admin 聚合 router，以及课时 3/4/5/6 已接入的业务端点入口。
- `app/core/`：配置、安全、数据库连接等项目级基础能力；`config.py` 负责 `.env` 加载、运行时路径、`CLASSQUEST_DATABASE_PATH`、`CLASSQUEST_TEACHER_PASSWORD` 与 `CORS_ALLOWED_ORIGINS` 解析；`security.py` 提供课时 5 会话 token 与共享口令常量时间比较；`database.py` 负责 SQLite 连接、WAL、短事务和 schema 初始化。
- `app/modules/`：后端模块域，目前只有模块 4；模块 4 下的 `lesson3/` 提供题卡自检助手后端壳，`lesson4/` 提供同伴互审 SQLite API 与 relay 端点（B1~B7、recovery、`moderate-text`），`lesson5/` 提供课时 5 C1a 账号认证、admin 授权管理、teacher 班级查询、C2a 题池提交/overview、C3a session 生命周期/锁池、C4a 学生 attach/assignment、C5a answer/rating/progress、C6a compute-stats/analytics/my-report 与 C7a V3 revision/completion 后端服务，`lesson6/` 提供 V3 发布审核创建、教师 list/detail/publish、public-bank overview/item-stats、学生本人状态查询、匿名公共挑战 runtime 与分 context 统计，`sql/` 存放课时 4 同伴互审请求表、课时 5 班级/账号、长期题池、lesson5 runtime 与 lesson6 发布审核/公共挑战 schema。
- `app/shared/`：后端业务无关工具。
- `BACKUP-RULES.md`：生产停机维护前的备份/回滚规则（deploy 批次、MANIFEST、INDEX）；仅运维使用，日常开发用 git。
- `runtime/fixtures/module4/lesson5/`：课时 5 本地 fixture 工作区；真实学生 JSON、SQLite 导出物、报告与归一化输出均被 `.gitignore` 忽略，仅 README 占位入库。
- `scripts/`：运维与本地调试脚本。`init_db.py` 初始化 SQLite；课时 5 Phase 0 提供 inspect、SQLite cloud 导出与 pool-only seed 脚本；C1a 提供 `seed_module4_accounts.py` 幂等写入班级、xnwy 账号与默认授权；Lesson6 提供 `seed_module4_lesson6_dev_demo.py` 为本地教师端与公共挑战 HTTP 联调写入 g7c02 发布审核、6 条 active public 公共题库与基础统计演示数据；`rsync-exclude.txt` 为 Mac→服务器发布排除清单；`backup_daily.sh` / `recompute_stats.py` 为占位或统计脚本。
- `tests/`：后端标准库 unittest 回归测试；当前覆盖模块 4 课时 5 C1a 账号认证与班级授权 API、C2a 题池提交/overview API、C3a session 生命周期/锁池 API、C4a participant attach/assignment API、C5a answer/rating/progress API、C6a stats/report API、C7a V3 revision/completion API，以及课时 6 C0-C1b V3 发布审核、匿名公共挑战、隐私边界与分 context 统计契约。

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

本地开发可临时使用 `backend/runtime/fixtures/module4/lesson5/` 生成课时 5 fixture 数据；该路径不属于生产运行时目录，不得提交真实数据文件。

