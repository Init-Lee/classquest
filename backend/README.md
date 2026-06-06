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

OSS 静态前端直连后端（方案 B）时，生产 `.env` 需含 `CORS_ALLOWED_ORIGINS`（逗号分隔，含 `https://` 协议）。课时 4 互审可选 `LESSON4_REVIEW_MODERATION_*`；留空时一般有 key 则走 Qwen。

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

预期输出：`数据库已初始化：runtime/db/classquest.sqlite`（或绝对路径）。脚本会启用 `core/database.py` 中的 SQLite 连接约定，并加载课时 4 同伴互审请求表 schema。`init_db.py` 已自动将 `backend/` 加入 `sys.path`，但 **uvicorn 与其它 `app.*` 导入仍建议保留 `export PYTHONPATH=.`**，避免 `ModuleNotFoundError: No module named 'app'`。

启动 API：

```bash
uvicorn app.main:app --reload
```

启动后访问 `GET /api/v1/health`，预期返回 `{"status":"ok"}`。

## 当前状态

当前已提供 `GET /api/v1/health` 健康检查、模块 4 基础 router、课时 3 题卡自检助手 `POST /api/v1/module4/lesson3/ai-review`，以及课时 4 同伴互审 SQLite 基座与业务端点 B1~B7（送审、状态、撤回、收件箱、领取、提交、拉取）、`GET /api/v1/module4/lesson4/review-requests/recovery` 进页恢复与 `POST /api/v1/module4/lesson4/review-requests/moderate-text` 文字审核。课时 3 自检与课时 4 互审审核共用 `DASHSCOPE_API_KEY` / `QWEN_*`（见 `module4/shared/qwen_http.py`）；课时 4 未设 `LESSON4_REVIEW_MODERATION_PROVIDER` 时有 key 自动走 Qwen。后端仍需校验完整 4 位班学号、同班约束与自送拦截。

