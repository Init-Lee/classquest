<!--
文件说明：模块 4 AI 信息侦探目录结构真相源。
职责：记录模块 4 前端目标结构、当前占位文件和后续新增目录的职责边界。
更新触发：模块 4 新增课时、页面、领域类型、API adapter、feature 或组件时，需要同步更新本文件。
-->

# FILE-STRUCTURE — Module 4 AI Information Detective

## 当前结构

```text
src/modules/module-4-ai-info-detective/
├── README.md
├── FILE-STRUCTURE.md
├── module.config.ts
├── routes.tsx
└── pages/
    └── Module4HomePage.tsx
```

## 目标结构

```text
src/modules/module-4-ai-info-detective/
├── README.md
├── FILE-STRUCTURE.md
├── module.config.ts
├── routes.tsx
├── pages/
├── lessons/
├── domains/
├── api/
├── features/
├── components/
├── infra/
└── assets/
```

## 后续职责

- `pages/`：路由级页面。
- `lessons/`：六个课时的本地学习挑战。
- `domains/`：题卡、提交包、试答轮次、评分、统计等纯领域类型。
- `api/`：mock adapter 与 HTTP adapter。
- `features/`：题卡编辑、提交、试答、评分、画廊等功能区。
- `components/`：模块 4 私有 UI 组件。
- `infra/`：模块 4 本地持久化与序列化。

## API 规则

页面和组件不直接调用 `fetch`。真实接入前，优先使用模块 4 自己的 API adapter。

## 更新规则

新增课时、feature、domain 文件、API adapter 或主要组件组时，必须更新本文件。

