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
├── modules/
│   ├── module-3-ai-science-station/   # 已完成的模块 3：AI 科学传播站
│   └── module-4-ai-info-detective/    # 模块 4：AI 信息辨识员，课时 1-4 已开放（课时 4 Step1-Step4 已完成）
└── shared/                            # 业务无关 UI 与纯工具

backend/                              # V1.5 FastAPI 轻量后端，已接入模块 4 课时 3/4 API
```

## 模块状态

- **模块 3 · AI 科学传播站**：已完成 6 个课时、24 个关卡；保留本地优先学习进度、继续学习包、跨角色文件链路、阶段快照和教师演示模式。详见 `src/modules/module-3-ai-science-station/README.md`。
- **模块 4 · AI 信息辨识员**：课时 1「框架发布与样例拆解」、课时 2「素材搜集与合规初筛」、课时 3「题目卡 V1 制作与解析填写」和课时 4「题目卡互审与 V2 入库准备」已开放，提供独立本地档案、继续学习包、阶段快照和教师演示模式；课时 3 含 V1 题卡编辑、Qwen 题卡自检助手（可 mock/HTTP）、课时 2 素材手动同步与 `lesson3-full` 快照；课时 4 已完成 Step1-Step4：同伴互审、反馈处理、V2 修改台、V2 就绪报告与 `ready_for_lesson5` 入库准备包，并写入 QuickCheck / `stageSnapshot`。课时 5 将进入「云端 Live Lesson Session」规划/开发阶段，当前只作为下一阶段入口。详见 `src/modules/module-4-ai-info-detective/README.md`。
- **V1.5 后端**：已提供健康检查、模块 4 课时 3 题卡自检助手 API（mock / Qwen）、课时 4 同伴互审 SQLite 基座，以及课时 4 互审端点 B1~B7（送审、状态、撤回、收件箱、领取、提交、拉取）与 `moderate-text` 文字审核。详见 `backend/README.md`。

## 运行方式

环境要求：Node.js >= 18。

```bash
npm install
npm run dev
```

打开浏览器访问 `http://localhost:5173`。

模块 4 课时 4 Step1 后端联调需在 `backend/` 目录设置 `CLASSQUEST_DATABASE_PATH=runtime/db/classquest.sqlite` 与 `PYTHONPATH=.`，先 `python scripts/init_db.py` 再 `uvicorn app.main:app --reload`；前端 `.env.local` 设置 `VITE_MODULE4_LESSON4_PEER_REVIEW_MODE=http`（可选 `VITE_MODULE4_LESSON4_REVIEW_MODERATION_MODE=http` 走后端文字审核）。详见 [`backend/README.md`](backend/README.md) 与 [`src/modules/module-4-ai-info-detective/lessons/lesson-4/README.md`](src/modules/module-4-ai-info-detective/lessons/lesson-4/README.md)。

生产构建：

```bash
npm run build
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

OSS 直连后端（方案 B）生产构建前复制 `.env.production.example` 为 `.env.production`，设置 `VITE_API_BASE_URL`；服务器 `backend/.env` 需配置 `CORS_ALLOWED_ORIGINS` 允许 OSS 域名。详见 `docs/DEPLOYMENT-V1_5.md`。

## 分支与版本策略

- 当前主线发布：`v0.7.3`，对应模块 4 课时 3 本地前端流程合并；主线文档已同步课时 4 Step1-Step4、V2 入库准备包与 lesson4 后端 routes 的实际边界。
- 上一稳定里程碑：`v0.7.2`，模块 4 课时 2「素材搜集与合规初筛」。
- 更早里程碑：`v0.6.0`，模块 3 六课时全部完成时的单应用形态。
- 模块 4 后续开发：每个课时独立分支推进；课时 5 将进入「云端 Live Lesson Session」规划/开发阶段，admin / Live Session 角色能力处于开始接入与规划中，不写作已完成。
- 模块 4 全部课时 mock 流程稳定后：进入 `v0.8.0`。
- 模块 4 全部课时接入真实后端后：进入 `v0.9.0`。

说明：学生学习包内的 `appVersion` 表示数据包格式口径，与产品发布号独立维护。

## 文档入口

- `FILE-STRUCTURE.md`：仓库结构真相源，只描述平台/模块级边界。
- `docs/CURSOR-START-HERE.md`：开发前阅读入口。
- `docs/MIGRATION-PLAN.md`：平台化迁移计划。
- `docs/ARCHITECTURE-V1_5.md`：V1.5 总体架构。
- `.cursor/rules/classquest-platform.mdc`：Cursor 开发规则。

## 开源许可

[MIT License](LICENSE) © 2026 ClassQuest Contributors

