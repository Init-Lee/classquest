<!--
文件说明：模块 1 目录结构真相源。
职责：记录模块内分层、文件职责、依赖方向、持久化边界和新增课时规则。
更新触发：模块 1 新增目录、移动文件、调整分层、依赖方向或新增功能步骤时，需要同步更新本文件。
-->

# FILE-STRUCTURE — Module 1

```text
module-1-ai-story/
├── app/
│   ├── layout/
│   │   ├── Module1Shell.tsx
│   │   ├── Module1TopProgress.tsx
│   │   └── module1-top-progress-state.ts
│   ├── providers/
│   │   ├── Module1Provider.tsx
│   │   ├── module1-save-coordinator.ts
│   │   ├── module1-save-coordinator.regression.test.ts
│   │   ├── module1-teacher-mode.ts
│   │   └── module1-teacher-mode.regression.test.ts
│   └── lesson-registry.ts
├── constants/
│   ├── class-options.ts
│   ├── demo-portfolio.ts
│   ├── demo-portfolio.regression.test.ts
│   ├── sdgs.ts
│   ├── sdgs.regression.test.ts
│   ├── teacher-passphrase.ts
│   └── teacher-passphrase.regression.test.ts
├── domains/portfolio/types.ts
├── features/
│   ├── global-actions/
│   │   ├── Module1GlobalActions.tsx
│   │   ├── module1-global-actions-state.ts
│   │   └── module1-global-actions-state.regression.test.ts
│   └── progress-ui/
│       ├── InnerStepProgress.tsx
│       ├── inner-step-progress-state.ts
│       └── progress-ui.regression.test.ts
├── infra/persistence/
│   ├── indexeddb/connection.ts
│   ├── repositories/portfolio.repository.ts
│   └── serializers/
│       ├── continue-package.ts
│       ├── snapshot-html.ts
│       └── snapshot-html.regression.test.ts
├── lessons/lesson-1/
│   ├── components/Lesson1ThemeOutline.tsx
│   ├── config.ts
│   ├── guards.ts
│   ├── routes.tsx
│   ├── steps/
│   └── utils/
│       ├── build-lesson1-theme-outline.ts
│       └── build-lesson1-theme-outline.regression.test.ts
├── pages/Module1HomePage.tsx
├── module.config.ts
├── routes.tsx
├── module1.regression.test.ts
└── README.md
```

## 依赖方向

`app / pages / lessons → domains + features + infra`，`infra → domains`，`domains` 不依赖 React、DOM 或持久化。模块 1 只可复用 `src/shared` 的业务中立能力，不得 import 模块 3 或模块 4 业务代码。教师讲解模式与阶段快照均在本模块内独立实现。

## 数据与路由边界

- `Module1Provider` 是页面唯一状态入口；保存协调器负责乐观更新、串行写入、flush 与代次失效，只有 repository 可直接访问 IndexedDB。
- 教师讲解模式使用独立内存 coordinator：`effectivePortfolio` 为演示档案，update/flush/import/clear 不写真实仓库；导入与重置对真实档案 no-op。不使用 URL flag，也不把讲解状态写入 localStorage。
- `constants/demo-portfolio.ts` 提供课堂演示档案；`constants/teacher-passphrase.ts` 只做授课入口校验。
- `Module1TopProgress` 负责六课时模块级导航；无档案时课时 1 只回模块首页，状态计算留在纯函数文件中。
- `features/progress-ui` 是模块 1 内部可复用的课时 Step 进度能力；各课时传入 Guard 派生的完成、可访问与锁定集合，不得跨模块引用。
- `features/global-actions` 在模块 1 内复刻模块 3/4 顶栏视觉与文案；学生模式为保存进度 / 导入进度 / 重置，课时 1 页另加阶段快照；教师模式只保留阶段快照。可用性规则放在纯函数中。
- `infra/persistence/serializers/snapshot-html.ts` 生成不可导入的课时 1 主题设定 HTML；导入器必须拒绝 HTML/非继续学习包。
- 课时 1 的 `utils/build-lesson1-theme-outline.ts` 是五字段到结构化大纲、主题核心和 Step 4 复制 payload 的唯一派生入口；主复制文本是 `themeCore` 完整句子。组件只负责展示和复制反馈，大纲不进入档案。
- 聚合根固定显式包含 `lesson1` 至 `lesson6`，不持久化完整小说副本。
- 学习包先校验、归一化和修复指针，再经确认原子替换。
- 新增课时应自带 `config.ts`、`guards.ts`、`routes.tsx` 和 `steps/`，并同步注册表与本文。
- `/module/1/story` 属于模块结果视图，不进入课时注册表。
- 课时 1 第 2 关左侧填写区提供「查看 SDG 介绍资料」入口，用新窗口打开仓库根 `public/module-1/sdg-intro.html`（站点路径 `/module-1/sdg-intro.html`）；该页是自有支架资料，不 iframe 嵌进课时，也不把 `同主题不同风格写作模板.html` 挂入课时 1。
