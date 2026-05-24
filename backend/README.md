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

OSS 静态前端直连后端（方案 B）时，还需在服务器 `.env` 填写 `CORS_ALLOWED_ORIGINS`，允许 OSS 访问域名（逗号分隔，含 `https://` 协议）。

## 本地启动

建议使用后端独立虚拟环境，避免系统 Python、conda 或其它项目依赖影响联调：

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

启动后访问 `GET /api/v1/health`，预期返回 `{"status":"ok"}`。

## 当前状态

当前已提供 `GET /api/v1/health` 健康检查、模块 4 基础 router，以及课时 3 题卡自检助手 `POST /api/v1/module4/lesson3/ai-review`。课时 3 自检支持默认 mock provider，并可通过后端环境变量切换到 Qwen OpenAI-compatible Chat Completions；真实提交、审核、试答和统计逻辑在模块 4 mock 流程稳定后再实现。

