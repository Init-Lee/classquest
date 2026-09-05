<!--
文件说明：模块 1 目录结构真相源。
职责：记录模块内分层、文件职责、依赖方向、持久化边界和新增课时规则。
更新触发：模块 1 新增目录、移动文件、调整分层、依赖方向或新增功能步骤时，需要同步更新本文件。
-->

# FILE-STRUCTURE — Module 1

```text
module-1-ai-story/
├── app/
│   ├── layout/Module1Shell.tsx
│   ├── providers/Module1Provider.tsx
│   └── lesson-registry.ts
├── constants/
│   ├── class-options.ts
│   └── sdgs.ts
├── domains/portfolio/types.ts
├── features/global-actions/Module1GlobalActions.tsx
├── infra/persistence/
│   ├── indexeddb/connection.ts
│   ├── repositories/portfolio.repository.ts
│   └── serializers/continue-package.ts
├── lessons/lesson-1/
│   ├── config.ts
│   ├── guards.ts
│   ├── routes.tsx
│   └── steps/
├── pages/Module1HomePage.tsx
├── module.config.ts
├── routes.tsx
├── module1.regression.test.ts
└── README.md
```

## 依赖方向

`app / pages / lessons → domains + features + infra`，`infra → domains`，`domains` 不依赖 React、DOM 或持久化。模块 1 只可复用 `src/shared` 的业务中立能力，不得 import 模块 3 或模块 4 业务代码。

## 数据与路由边界

- `Module1Provider` 是页面唯一状态入口；只有 repository 可直接访问 IndexedDB。
- 聚合根固定显式包含 `lesson1` 至 `lesson6`，不持久化完整小说副本。
- 学习包先校验、归一化和修复指针，再经确认原子替换。
- 新增课时应自带 `config.ts`、`guards.ts`、`routes.tsx` 和 `steps/`，并同步注册表与本文。
- `/module/1/story` 属于模块结果视图，不进入课时注册表。
