<!--
文件说明：ClassQuest 仓库对外入口说明。
职责：介绍项目定位、可用功能、本地运行、生产构建、部署入口与文档索引。
更新触发：项目定位、功能范围、运行方式、技术栈、部署模型、发布版本或文档入口变化时，需要同步更新本文件。
-->

# ClassQuest — 程序化教学平台

> 面向中学课堂的程序化教学平台。学生按「模块 → 课时 → 关卡」逐步完成学习任务；教师可在指定课时使用独立控制台组织同步课堂。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TypeScript-61DAFB)](https://vitejs.dev)
[![Release](https://img.shields.io/badge/release-module4--lesson5--v0.7.5-emerald)](https://github.com/Init-Lee/classquest/releases)

## 项目简介

ClassQuest 采用 **平台门户 + 独立课程模块 + 轻量后端** 结构：

```text
Platform Portal → Module → Lesson → Step
```

- **学生端**：浏览器访问平台首页，选择课程模块，按课时与关卡学习；支持本地档案、继续学习包与阶段快照。
- **教师端**：模块 4 课时 5 提供独立 [教师控制台](src/teacher-console/README.md)（`/teacher/*`），用于组织试答、统计反馈等同步课堂环节。
- **后端**：FastAPI + SQLite，主要服务模块 4 的题卡提交、互审、Live Lesson Session 与统计（详见 [backend/README.md](backend/README.md)）。

## 功能概览

### 模块 3 · AI 科学传播站

已完成 6 个课时、24 个关卡。本地优先的学习进度、继续学习包、阶段快照与教师演示模式。详见 [模块 3 README](src/modules/module-3-ai-science-station/README.md)。

### 模块 4 · AI 信息辨识员

七年级收束模块，围绕新闻与图片中的 AI 痕迹判断，完成题卡创作、互审、试答与修订。

| 课时 | 主题 | 状态 |
|------|------|------|
| 1 | 框架发布与样例拆解 | 已开放 |
| 2 | 素材搜集与合规初筛 | 已开放 |
| 3 | 题目卡 V1 制作与解析填写 | 已开放 |
| 4 | 题目卡互审与 V2 入库准备 | 已开放（可联调后端互审） |
| 5 | 网页试答与反馈优化 | 已开放（学生四步流程 + 教师控制台） |

**课时 5 学生流程（简要）**

1. 提交 V2 题卡到班级题池，连接课堂会话  
2. 等待试答 → 匿名作答、揭示与快评  
3. 查看本人题卡统计报告  
4. 完成 V3 修订，生成本地完成摘要与 HTML 快照（异步个人任务，不依赖教师「开放修订」）

**课时 5 教师流程（简要）**

登录教师控制台 → 创建会话 → 锁定题池 → 开放/锁定试答 → 计算并开放统计反馈（同步课堂收口）→ 可只读查看学生修订计划。

**老师上线使用**请优先阅读：[模块 4 课时 5 教师使用说明](docs/TEACHER-GUIDE-MODULE4-LESSON5.md)

模块细节见 [模块 4 README](src/modules/module-4-ai-info-detective/README.md)。

## 快速开始

**环境要求**：Node.js ≥ 18。

### 仅前端（本地演示 / fixture 模式）

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。首页可进入各课程模块；教师控制台入口为 `/teacher/login`。

### 前端 + 后端联调（模块 4）

1. **后端**（在 `backend/` 目录，详见 [backend/README.md](backend/README.md)）：

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env   # 按需填写，勿提交真实密钥

export CLASSQUEST_DATABASE_PATH=runtime/db/classquest.sqlite
export PYTHONPATH=.

python scripts/init_db.py
python scripts/seed_module4_accounts.py   # 课时 5 账号
uvicorn app.main:app --reload
```

2. **前端**：复制并配置环境变量（参考 [.env.production.example](.env.production.example) 中的 `VITE_*` 键名，本地可写入 `.env.local`）：

| 场景 | 关键变量 |
|------|----------|
| 课时 4 互审 | `VITE_MODULE4_LESSON4_PEER_REVIEW_MODE=http` |
| 课时 5 学生端 | `VITE_MODULE4_LESSON5_MODE=http` |
| 教师控制台 | `VITE_TEACHER_CONSOLE_MODE=http` |
| API 地址 | `VITE_API_BASE_URL=http://127.0.0.1:8000` |

各模块/课时的完整联调说明见对应目录下的 `README.md`，不要在本文件重复 API 清单。

## 生产构建与部署

```text
前端：Vite build → OSS 静态托管
后端：轻量服务器 → Nginx → FastAPI → SQLite / 本地运行时文件
```

**OSS 直连后端（推荐）** — 先配置 `.env.production`（从 [.env.production.example](.env.production.example) 复制），再执行防呆构建：

```bash
npm run build:oss
```

将生成的 `dist/` 上传 OSS。服务器端 `backend/.env` 需配置 `CORS_ALLOWED_ORIGINS` 允许 OSS 域名。

| 文档 | 用途 |
|------|------|
| [docs/DEPLOYMENT-V1_5.md](docs/DEPLOYMENT-V1_5.md) | V1.5 部署模型总览 |
| [backend/OPS-PRODUCTION-UPDATE.md](backend/OPS-PRODUCTION-UPDATE.md) | 生产环境后端更新步骤 |
| [docs/TEACHER-GUIDE-MODULE4-LESSON5.md](docs/TEACHER-GUIDE-MODULE4-LESSON5.md) | 教师上课说明 |

## 技术栈

- **前端**：React、TypeScript、Vite、React Router v6、Tailwind CSS
- **本地数据**：浏览器存储 + 继续学习包导出/导入（模块 3 / 4）
- **后端**：FastAPI、SQLite、本地文件存储；生产经 Nginx + HTTPS 对外

## 仓库结构（摘要）

```text
src/
├── platform/              # 平台门户、全局路由、模块注册
├── teacher-console/       # 模块 4 课时 5 教师控制台
├── modules/               # 独立课程模块（module-3、module-4）
└── shared/                # 业务无关 UI 与工具

backend/                   # FastAPI 后端
docs/                      # 架构、部署、教师指南
```

完整边界与依赖规则见 [FILE-STRUCTURE.md](FILE-STRUCTURE.md)。

## 版本与分支

| 标签 | 说明 |
|------|------|
| `module4-lesson5-v0.7.5` | 模块 4 课时 5 Live Lesson Session 联调闭环 |
| `module4-lesson4-v0.7.4` | 模块 4 课时 4 补丁 |
| `v0.7.2` | 模块 4 课时 2 |
| `v0.6.0` | 模块 3 六课时完成（单应用形态） |

模块 4 按课时独立分支推进；学生学习包内的 `appVersion` 表示数据包格式口径，与上述发布标签独立维护。

## 文档入口

- [FILE-STRUCTURE.md](FILE-STRUCTURE.md) — 仓库结构真相源
- [docs/DOCS-INDEX.md](docs/DOCS-INDEX.md) — 架构与开发文档索引
- [docs/TEACHER-GUIDE-MODULE4-LESSON5.md](docs/TEACHER-GUIDE-MODULE4-LESSON5.md) — **教师上课说明（优先）**
- [docs/CURSOR-START-HERE.md](docs/CURSOR-START-HERE.md) — 开发前阅读入口
- [docs/ARCHITECTURE-V1_5.md](docs/ARCHITECTURE-V1_5.md) — V1.5 总体架构

## 开源许可

[MIT License](LICENSE) © 2026 ClassQuest Contributors
