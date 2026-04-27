<!--
文件说明：ClassQuest 仓库对外入口说明。
职责：介绍项目定位、平台化架构、模块清单、运行方式、技术栈、版本策略和文档入口。
更新触发：项目定位、功能范围、运行方式、技术栈、部署模型、模块状态或发布版本变化时，需要同步更新本文件。
-->

# ClassQuest — 程序化教学平台

> 一个面向中学课堂的程序化教学平台。当前正在从「单一模块应用」升级为「平台门户 + 独立课程模块 + V1.5 轻量后端」结构。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TypeScript-61DAFB)](https://vitejs.dev)
[![Release](https://img.shields.io/badge/release-v0.7.0-emerald)](https://github.com/Init-Lee/classquest/releases)

## 当前架构目标

```text
Platform Portal → Module → Lesson → Step
```

```text
src/
├── platform/                         # 平台门户、全局路由、模块注册表
├── modules/
│   ├── module-3-ai-science-station/   # 已完成的模块 3：AI 科学传播站
│   └── module-4-ai-info-detective/    # 模块 4：AI 信息侦探，占位待逐课开发
└── shared/                            # 业务无关 UI 与纯工具

backend/                              # V1.5 FastAPI 轻量后端骨架
```

## 模块状态

- **模块 3 · AI 科学传播站**：已完成 6 个课时、24 个关卡；保留本地优先学习进度、继续学习包、跨角色文件链路、阶段快照和教师演示模式。详见 `src/modules/module-3-ai-science-station/README.md`。
- **模块 4 · AI 信息侦探**：当前仅架构占位；后续每个课时使用独立分支开发。详见 `src/modules/module-4-ai-info-detective/README.md`。
- **V1.5 后端**：当前仅骨架和健康检查；真实提交、审核、试答、统计和画廊导出在模块 4 mock 流程稳定后实现。详见 `backend/README.md`。

## 运行方式

环境要求：Node.js >= 18。

```bash
npm install
npm run dev
```

打开浏览器访问 `http://localhost:5173`。

生产构建：

```bash
npm run build
```

## 技术栈

- 前端：React + TypeScript + Vite
- 路由：React Router v6
- UI：Tailwind CSS + shadcn 风格封装
- 模块 3 本地数据：浏览器本地存储 + 继续学习包导出/导入
- V1.5 后端目标：FastAPI + SQLite + 本地运行时文件 + Nginx + HTTPS

## 部署模型（V1.5）

```text
前端：Vite build output → OSS 静态托管
后端：轻量服务器 → Nginx → FastAPI → SQLite / 本地运行时文件
```

模块 4 真实后端联调前，前端应先使用本地状态和 mock API 完成流程验证。

## 分支与版本策略

- 当前主线发布：`v0.7.0`，对应平台化架构合并（模块 3 行为保留 + 模块 4 占位 + backend 骨架）。
- 上一稳定里程碑：`v0.6.0`，模块 3 六课时全部完成时的单应用形态。
- 模块 4 后续开发：每个课时独立分支，例如 `module-4-lesson-1-dev`。
- 模块 4 mock 流程稳定后：进入 `v0.8.0`。
- 模块 4 接入真实后端后：进入 `v0.9.0`。

说明：学生学习包内的 `appVersion` 表示数据包格式口径，与产品发布号独立维护。

## 文档入口

- `FILE-STRUCTURE.md`：仓库结构真相源，只描述平台/模块级边界。
- `docs/CURSOR-START-HERE.md`：开发前阅读入口。
- `docs/MIGRATION-PLAN.md`：平台化迁移计划。
- `docs/ARCHITECTURE-V1_5.md`：V1.5 总体架构。
- `.cursor/rules/classquest-platform.mdc`：Cursor 开发规则。

## 开源许可

[MIT License](LICENSE) © 2026 ClassQuest Contributors

