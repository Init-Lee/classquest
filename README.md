<!--
文件说明：ClassQuest 仓库对外入口说明。
职责：介绍项目定位、平台化架构、模块清单、运行方式、技术栈、版本策略和文档入口。
更新触发：项目定位、功能范围、运行方式、技术栈、部署模型、模块状态或发布版本变化时，需要同步更新本文件。
-->

# ClassQuest — 程序化教学平台

> 一个面向中学课堂的程序化教学平台。当前正在从「单一模块应用」升级为「平台门户 + 独立课程模块 + V1.5 轻量后端」结构。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TypeScript-61DAFB)](https://vitejs.dev)
[![Release](https://img.shields.io/badge/release-v0.7.3-emerald)](https://github.com/Init-Lee/classquest/releases)

## 当前架构目标

```text
Platform Portal → Module → Lesson → Step
```

```text
src/
├── platform/                         # 平台门户、全局路由、模块注册表
├── teacher-console/                  # 模块 4 课时 5 教师控制台，独立挂载 /teacher/*
├── modules/
│   ├── module-3-ai-science-station/   # 已完成的模块 3：AI 科学传播站
│   └── module-4-ai-info-detective/    # 模块 4：AI 信息辨识员，课时 1-5 已开放到课时 5 Step4 V3 修订
└── shared/                            # 业务无关 UI 与纯工具

backend/                              # V1.5 FastAPI 轻量后端，已接入模块 4 课时 3/4 API 与课时 5 Phase 0 + C1a-C7a API
```

## 模块状态

- **模块 3 · AI 科学传播站**：已完成 6 个课时、24 个关卡；保留本地优先学习进度、继续学习包、跨角色文件链路、阶段快照和教师演示模式。详见 `src/modules/module-3-ai-science-station/README.md`。
- **模块 4 · AI 信息辨识员**：课时 1「框架发布与样例拆解」、课时 2「素材搜集与合规初筛」、课时 3「题目卡 V1 制作与解析填写」、课时 4「题目卡互审与 V2 入库准备」已开放；课时 5 已开放 Step1「提交 V2 到班级题池」、Step2「等待试答 + 单题作答/揭示/快评」、Step3「本人题卡统计报告」与 Step4「V3 学习任务工作台 + 本地快照」。模块 4 提供独立本地档案、继续学习包、阶段快照和教师演示模式；课时 4 已生成 `ready_for_lesson5` 入库准备包，课时 5 学生端可在 fixture/http 双模式下提交 V2、连接 active session、attach participant、读取紧凑题序、渲染 `material.asset.dataUrl` 图片素材、提交 answer/rating，在 `analytics_open` 后查看本人 news/image 题卡报告，并可提交 V3、保存 completion-summary 与 `lesson5-full` HTML 快照；教师控制台 HTTP 模式可只读查看班级题池 overview 与当前 V2 题卡详情预览，并支持建会话、改 draft 设置、锁池冻结、开放试答、锁定试答、计算/重算统计、开放统计反馈即同步课堂收口、session overview、phase 展示、C5 progress 表、C6 analytics 面板与 C7 revision-plans 只读观察面板。详见 `src/modules/module-4-ai-info-detective/README.md` 与 `src/teacher-console/README.md`。
- **V1.5 后端**：已提供健康检查、模块 4 课时 3 题卡自检助手 API（mock / Qwen）、课时 4 同伴互审 SQLite 基座，以及课时 4 互审端点 B1~B7（送审、状态、撤回、收件箱、领取、提交、拉取）与 `moderate-text` 文字审核；课时 5 已新增 Phase 0 schema、fixture inspect/export、pool-only seed 地基、C1a auth/admin/teacher 账号权限 API、C2a 学生 V2 提交与教师 pool-overview / pool-item 详情 API、C3a 教师 session 生命周期/锁池/phase 后端 API、C4a 学生 active-session、participant attach、session state 与 assignment list API、C5a 学生 answer/rating 与教师 progress API、C6a compute-stats/analytics/my-report API，以及 C7a V3 修订、completion-summary 与 revision-plans API。详见 `backend/README.md`。

## 运行方式

环境要求：Node.js >= 18。

```bash
npm install
npm run dev
```

打开浏览器访问 `http://localhost:5173`。首页提供课程模块入口，并提供教师控制台入口跳转到 `/teacher/login`。

模块 4 课时 4 Step1 后端联调需在 `backend/` 目录设置 `CLASSQUEST_DATABASE_PATH=runtime/db/classquest.sqlite` 与 `PYTHONPATH=.`，先 `python scripts/init_db.py` 再 `uvicorn app.main:app --reload`；前端 `.env.local` 设置 `VITE_MODULE4_LESSON4_PEER_REVIEW_MODE=http`（可选 `VITE_MODULE4_LESSON4_REVIEW_MODERATION_MODE=http` 走后端文字审核）。课时 5 联调中，`xnwy-demo` 免密码，其它账号需设置 `CLASSQUEST_TEACHER_PASSWORD`，并运行 `python scripts/seed_module4_accounts.py`；前端 teacher-console 默认 fixture，可设置 `VITE_TEACHER_CONSOLE_MODE=http VITE_MODULE4_LESSON5_MODE=http` 对接 auth/admin/teacher 账号权限 API、题池 overview/detail、C3a session API、C4a 学生 session/assignment API、C5a answer/rating/progress API、C6a compute-stats/analytics/my-report API 与 C7a V3 修订/completion-summary/revision-plans API。教师控制台访问 `/teacher/module/4/lesson/5`，支持 `POST /api/v1/teacher/module4/lesson5/sessions`、`POST .../{session_id}/lock-pool`、`POST .../{session_id}/phase` 开放/锁定试答/开放统计反馈、`POST .../{session_id}/compute-stats`、`GET .../{session_id}/analytics`、`GET .../{session_id}/revision-plans`、`GET .../{session_id}/overview`、`GET .../{session_id}/progress` 与 phase 状态展示；开放到 `analytics_open` 即同步课堂收口，revision-plans 只读观察学生异步 V3。学生端访问 `/module/4/lesson/5/step/1` 提交 V2 后进入 `/step/2` 查看等待状态、紧凑题序，并在 `trial_open` 下进入单题作答、揭示和快评，`analytics_open` 后进入 `/step/3` 查看本人题卡报告并可进入 `/step/4` 提交 V3、生成本地快照。详见 [`backend/README.md`](backend/README.md)、[`src/teacher-console/README.md`](src/teacher-console/README.md) 与 [`src/modules/module-4-ai-info-detective/lessons/lesson-5/README.md`](src/modules/module-4-ai-info-detective/lessons/lesson-5/README.md)。

生产构建：

```bash
npm run build
```

OSS 直连后端（方案 B）推荐使用防呆构建命令，它会先检查 `.env.production` 中的生产前端 `VITE_*` 配置，再生成可上传的 `dist/`：

```bash
npm run build:oss
```

## 技术栈

- 前端：React + TypeScript + Vite
- 路由：React Router v6
- UI：Tailwind CSS + shadcn 风格封装
- 模块 3 / 模块 4 本地数据：浏览器本地存储 + 继续学习包导出/导入
- V1.5 后端目标：FastAPI + SQLite + 本地运行时文件 + Nginx + HTTPS

## 部署模型（V1.5）

```text
前端：Vite build output → OSS 静态托管
后端：轻量服务器 → Nginx → FastAPI → SQLite / 本地运行时文件
```

OSS 直连后端（方案 B）生产构建前复制 `.env.production.example` 为 `.env.production`，设置 `VITE_API_BASE_URL`，并运行 `npm run build:oss`；服务器 `backend/.env` 需配置 `CORS_ALLOWED_ORIGINS` 允许 OSS 域名。详见 `docs/DEPLOYMENT-V1_5.md`。

## 分支与版本策略

- 当前主线发布：`v0.7.3`，对应模块 4 课时 3 本地前端流程合并；主线文档已同步课时 4 Step1-Step4、V2 入库准备包与 lesson4 后端 routes 的实际边界。
- 上一稳定里程碑：`v0.7.2`，模块 4 课时 2「素材搜集与合规初筛」。
- 更早里程碑：`v0.6.0`，模块 3 六课时全部完成时的单应用形态。
- 模块 4 后续开发：每个课时独立分支推进；课时 5 已进入「云端 Live Lesson Session」开发阶段，当前完成 Phase 0 后端地基、C1a auth/admin/teacher 账号权限 API、C1b 前端 teacher-console、C2a 学生 V2 提交/题池 overview 与详情预览 API、C2b 学生 Step1 提交流、C3a 教师 session 后端控制、C3b 前端教师控制台、C4a 学生 session/assignment 后端、C4b 学生 Step1 连接 + Step2 分配列表、C5a 后端 answer/rating/progress、C5b 学生作答评分 UI 与教师 progress 表、C6a 后端 compute-stats/analytics/my-report、C6b 学生 Step3 报告与教师 analytics 面板、C7a 后端 V3 修订/completion-summary/revision-plans，以及 C7b 学生 Step4 修订快照与教师 revision-plans 面板。
- 模块 4 全部课时 mock 流程稳定后：进入 `v0.8.0`。
- 模块 4 全部课时接入真实后端后：进入 `v0.9.0`。

说明：学生学习包内的 `appVersion` 表示数据包格式口径，与产品发布号独立维护。

## 文档入口

- `FILE-STRUCTURE.md`：仓库结构真相源，只描述平台/模块级边界。
- `docs/TEACHER-GUIDE-MODULE4-LESSON5.md`：模块 4 课时 5 上线后的教师使用说明。
- `docs/CURSOR-START-HERE.md`：开发前阅读入口。
- `docs/MIGRATION-PLAN.md`：平台化迁移计划。
- `docs/ARCHITECTURE-V1_5.md`：V1.5 总体架构。
- `.cursor/rules/classquest-platform.mdc`：Cursor 开发规则。

## 开源许可

[MIT License](LICENSE) © 2026 ClassQuest Contributors

