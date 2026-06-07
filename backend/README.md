<!--
文件说明：ClassQuest V1.5 后端说明。
职责：说明 backend/ 的定位、技术栈、运行时数据目录和实现顺序。
更新触发：后端职责、技术栈、运行时目录或模块 4 接入策略变化时，需要同步更新本文件。
-->

# Backend — ClassQuest V1.5

后端提供 ClassQuest V1.5 的轻量运行时支持，主要服务模块 4。

## 职责

- 学生题卡提交
- 教师审核
- 试答轮次控制
- 匿名答题记录
- 快速评分记录
- 统计重算
- V3 修订入库
- 画廊/题库导出

后端不替代 Moodle，也不管理完整学生学习进度。

## 技术栈

```text
FastAPI
SQLite
本地文件存储
Nginx 反向代理
HTTPS
```

## 运行时数据

使用服务器本地持久目录：

```text
/var/lib/classquest/
├── db/
├── uploads/
├── exports/
└── backups/
```

不要把运行时文件写入仓库源码目录。

## 本地环境变量

后端启动时会自动读取 `backend/.env`。真实 key 只放在本地或服务器环境中，不提交到仓库；可从 `backend/.env.example` 复制一份后填写：

```bash
cp backend/.env.example backend/.env
```

`.env.example` 随 git/rsync 更新；真实 `backend/.env` **不会**自动同步。拉代码或改 example 后，请把**新增变量行**合并进自己的 `.env`（保留已有 `DASHSCOPE_API_KEY`），不要只改 example 不改 `.env`。

OSS 静态前端直连后端（方案 B）时，生产 `.env` 需含 `CORS_ALLOWED_ORIGINS`（逗号分隔，含 `https://` 协议）。课时 4 互审可选 `LESSON4_REVIEW_MODERATION_*`；留空时一般有 key 则走 Qwen。课时 5 C1a 教师控制台账号登录中，`xnwy-demo` 免密码，其它账号需配置 `CLASSQUEST_TEACHER_PASSWORD`；真实口令只放本地或服务器环境，禁止写入前端或提交仓库。

本地联调 SQLite：`CLASSQUEST_DATABASE_PATH=runtime/db/classquest.sqlite`（相对 `backend/`）；留空时默认 `/var/lib/classquest/db/classquest.sqlite`。生产服务器路径见 `BACKUP-RULES.md` §8。

## 本地启动

建议使用后端独立虚拟环境，避免系统 Python、conda 或其它项目依赖影响联调。

**必须在 `backend/` 目录下操作**，并设置本地 SQLite 路径（相对 `backend/`）：

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt

export CLASSQUEST_DATABASE_PATH=runtime/db/classquest.sqlite
export PYTHONPATH=.
```

模块 4 课时 4 互审 API 的服务端时间口径为 **Asia/Shanghai（UTC+8）**；响应中的 `serverNow` 等字段为带 `+08:00` 的 ISO8601。

首次启动或 schema 变更后，初始化 SQLite：

```bash
python scripts/init_db.py
```

预期输出：`数据库已初始化：runtime/db/classquest.sqlite`（或绝对路径）。脚本会启用 `core/database.py` 中的 SQLite 连接约定，并按依赖顺序加载课时 4 同伴互审请求表、课时 5 班级/账号、长期题池与 lesson5 runtime schema。`init_db.py` 已自动将 `backend/` 加入 `sys.path`，但 **uvicorn 与其它 `app.*` 导入仍建议保留 `export PYTHONPATH=.`**，避免 `ModuleNotFoundError: No module named 'app'`。

## 模块 4 课时 5 Phase 0/C1/C2/C3a/C4a/C5a/C6a/C7a 管线

课时 5 已完成后端地基、账号权限、学生 V2 题池提交、C3a 教师 session 后端控制、C4a 学生 attach/assignment 后端能力、C5a answer/rating/progress 后端闭环、C6a compute-stats/analytics/my-report 后端端点，以及 C7a V3 修订提交、my-completion-summary 与教师 revision-plans 后端端点；C7a 范围停在后端端点和测试，不包含学生 Step4 UI、本地快照/HTML 或教师修订面板前端。真实学生 JSON 与 SQLite 备份不得提交；本地调试数据写入 `runtime/fixtures/module4/lesson5/` 时会被 `.gitignore` 忽略，仅 README 占位入库。

从课时 4 SQLite 备份导出 cloud 对照源：

```bash
python scripts/export_module4_lesson5_cloud_fixture_from_lesson4_db.py \
  --database-path /path/to/classquest.sqlite.bak \
  --class-id class-03
```

检视学生 portfolio JSON 与 cloud 对照源，并生成报告和归一化 seed 输入：

```bash
python scripts/inspect_module4_lesson5_fixture_sources.py \
  --portfolio-files /path/to/student-a.json /path/to/student-b.json
```

写入 `g7c03` 开发样本长期题池：

```bash
python scripts/seed_module4_lesson5_fixtures.py --class-id g7c03 --mode pool-only
```

`full-test-session` 模拟尚未实现；Phase 0 只支持 `pool-only`，写入 `cq_classes`、`cq_users`、`cq_teacher_class_assignments`、`module4_question_items` 与 `module4_question_item_versions`。

写入 C1a 班级、xnwy 账号与默认教师授权（幂等；包含 `xnwy-li` 对 `g7c03` 的 `manage` 授权）：

```bash
python scripts/seed_module4_accounts.py
```

C1a/C2a/C3a/C4a/C5a/C6a/C7a 已提供账号认证、班级授权、学生 V2/V3 提交、教师题池 overview、session 后端控制、学生 attach/assignment、answer/rating/progress、统计计算、报告与修订总览端点：

```text
POST /api/v1/module4/auth/login
GET  /api/v1/module4/auth/me
POST /api/v1/module4/auth/logout
GET  /api/v1/admin/module4/classes
GET  /api/v1/admin/module4/users
GET  /api/v1/admin/module4/class-assignments
PUT  /api/v1/admin/module4/teachers/{user_id}/classes
GET  /api/v1/teacher/module4/classes
POST /api/v1/module4/lesson5/v2-submissions
GET  /api/v1/teacher/module4/lesson5/classes/{class_id}/pool-overview
GET  /api/v1/teacher/module4/lesson5/classes/{class_id}/pool-items/{item_id}
POST /api/v1/teacher/module4/lesson5/sessions
GET  /api/v1/teacher/module4/lesson5/sessions?classId={class_id}
PATCH /api/v1/teacher/module4/lesson5/sessions/{session_id}/settings
POST /api/v1/teacher/module4/lesson5/sessions/{session_id}/lock-pool
POST /api/v1/teacher/module4/lesson5/sessions/{session_id}/phase
GET  /api/v1/teacher/module4/lesson5/sessions/{session_id}/overview
GET  /api/v1/module4/lesson5/active-session?classId={class_id}
POST /api/v1/module4/lesson5/participants/attach
GET  /api/v1/module4/lesson5/sessions/{session_id}/state?participantId={participant_id}
GET  /api/v1/module4/lesson5/sessions/{session_id}/assignments?participantId={participant_id}
POST /api/v1/module4/lesson5/assignments/{assignment_id}/answer
POST /api/v1/module4/lesson5/answers/{answer_id}/rating
GET  /api/v1/teacher/module4/lesson5/sessions/{session_id}/progress
POST /api/v1/teacher/module4/lesson5/sessions/{session_id}/compute-stats
GET  /api/v1/teacher/module4/lesson5/sessions/{session_id}/analytics
GET  /api/v1/module4/lesson5/sessions/{session_id}/my-report?participantId={participant_id}&lesson5ClientId={client_id}
POST /api/v1/module4/lesson5/v3-submissions
GET  /api/v1/module4/lesson5/sessions/{session_id}/my-completion-summary?participantId={participant_id}&lesson5ClientId={client_id}
GET  /api/v1/teacher/module4/lesson5/sessions/{session_id}/revision-plans
```

其中 `xnwy-demo` 可免密码登录；调用 `GET /api/v1/teacher/module4/classes` 会返回当前数据库中的全部模块 4 班级，权限统一为 `view` 只读；demo 可只读访问 pool-overview、pool-item 详情、session overview、progress、analytics 与 revision-plans，不能调用 admin、session 写端点或 compute-stats。学生 `v2-submissions` 接收课时 4 Step4 生成的 `lesson4-ready-for-lesson5-v1` 包，按完整 `card_json` 计算 `content_hash`，重复同内容提交会幂等复用同一 v2 版本，内容变化会升出新版本并切换 `current_v2_version_id`；教师可通过 pool-item 详情端点按班级权限只读预览当前 V2 题卡。教师 session 写端点要求 teacher 对目标班级具备 `manage` 权限；`lock-pool` 冻结当前 V2 到 `module4_lesson5_session_pool_items`，冻结后不随后续 V2 提交改变。学生 assignment 只从该冻结池生成，排除自作题，按 6/8/10 派生 news/image 各半；候选不足返回 409，重复读取返回同一持久化列表。answer 仅允许 `trial_open`，服务端判分后揭示正解/解析/来源并更新 assignment 为 `answered`；rating 必须基于已有 answer，三维评分为 1-3，`issueFlags` 使用固定枚举（含 `source_insufficient`），成功后 assignment 为 `rated`；answer/rating 重复提交均返回既有官方记录，不重复计数。compute-stats 仅允许 `trial_locked` 及之后由 manage 教师触发，按冻结题卡写入 `module4_lesson5_item_stats`，重复调用覆盖重算且不推进 phase；`trial_locked→analytics_open` 前必须已有统计，否则返回 409；analytics 不暴露作者座位，my-report 需要 `participantId + lesson5ClientId` 且只返回本人作者题卡；V3 提交允许 `phase >= analytics_open`，写入长期题库 `version_label='v3'` 并 upsert revision plan，提交 1 张返回 `readyForLesson6=partial`，提交 2 张返回 `full`；底层保留的 `revision_open/closed` 不作为教师端产品流程，也不控制学生 V3。

启动 API：

```bash
uvicorn app.main:app --reload
```

启动后访问 `GET /api/v1/health`，预期返回 `{"status":"ok"}`。

## 当前状态

当前已提供 `GET /api/v1/health` 健康检查、模块 4 基础 router、课时 3 题卡自检助手 `POST /api/v1/module4/lesson3/ai-review`，以及课时 4 同伴互审 SQLite 基座与业务端点 B1~B7（送审、状态、撤回、收件箱、领取、提交、拉取）、`GET /api/v1/module4/lesson4/review-requests/recovery` 进页恢复与 `POST /api/v1/module4/lesson4/review-requests/moderate-text` 文字审核。课时 5 已接入 Phase 0 schema、fixture inspect/export 与 pool-only seed 管线，提供 C1a auth/admin/teacher 账号权限 API、C2a 学生 V2 提交/教师班级题池 overview API、C3a 教师 session 生命周期/锁池/phase API、C4a 学生 active-session、participant attach、session state 与 assignment 生成/读取 API、C5a 学生 answer/rating 写入和教师 progress API、C6a compute-stats/analytics/my-report 后端 API，以及 C7a V3 修订、completion-summary 与 revision-plans 后端 API。课时 3 自检与课时 4 互审审核共用 `DASHSCOPE_API_KEY` / `QWEN_*`（见 `module4/shared/qwen_http.py`）；课时 4 未设 `LESSON4_REVIEW_MODERATION_PROVIDER` 时有 key 自动走 Qwen。后续 Live Session 前端统计/报告 UI、V3 工作台/快照与课时 6 发布仍需校验完整 4 位班学号、同班约束和 session 状态机。

