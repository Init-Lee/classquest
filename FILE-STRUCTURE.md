# FILE-STRUCTURE — 目录结构与分层规范

本文件是 ClassQuest 项目的**结构真相源**，定义目录职责、分层边界、依赖方向、命名规范与新增功能步骤。

> 开发时必须先遵循本文档规定的分层与依赖方向。禁止越层或反向依赖。

---

## 顶层目录

```
classquest/
├── build_Plan/          # 产品设计规格文档（只读参考，不含业务代码）
├── src/                 # 应用源代码（主战场）
├── public/              # 静态资源
├── index.html           # 应用入口 HTML
├── vite.config.ts       # Vite 构建配置
├── tailwind.config.js   # Tailwind CSS 配置
├── tsconfig.app.json    # TypeScript 配置
├── package.json         # 依赖声明
├── README.md            # 项目对外入口文档
├── FILE-STRUCTURE.md    # 本文件（结构真相源）
├── CONTRIBUTING.md      # 贡献指南
└── LICENSE              # 开源许可（MIT）
```

---

## src/ 分层结构

```
src/
├── app/                 # App 层：路由、布局、Provider、课时注册
│   ├── layout/          #   全局布局组件
│   │   ├── AppShell.tsx          # 顶层外壳，包裹所有页面
│   │   ├── TopLessonProgress.tsx # 顶部课时进度条（课时1~6）
│   │   └── GlobalActions.tsx     # 右上角全局动作区（保存/导入/快照）
│   ├── router/          #   路由定义与 Guard
│   │   ├── index.tsx             # 路由表定义
│   │   └── guards.ts             # 全局路由守卫
│   ├── providers/       #   全局 Context Provider
│   │   └── AppProvider.tsx
│   └── lesson-registry.ts        # 课时注册表（统一管理课时配置）
│
├── domains/             # Domain 层：领域模型与业务服务（纯逻辑，无 UI）
│   ├── student/         #   学生身份模型
│   │   ├── types.ts              # StudentProfile, StudentRole
│   │   └── service.ts            # 身份相关业务逻辑
│   ├── progress/        #   进度指针
│   │   ├── types.ts              # ProgressPointer
│   │   └── service.ts
│   ├── portfolio/       #   模块档案（核心聚合根）
│   │   ├── types.ts              # ModulePortfolio（含 lesson1/2 state）
│   │   └── service.ts
│   ├── group-plan/      #   小组计划与讨论
│   │   ├── types.ts              # GroupConsensus, GroupEvidencePlanRow 等
│   │   └── service.ts
│   ├── evidence/        #   证据记录
│   │   ├── types.ts              # PublicEvidenceRecord, FieldEvidenceTask 等
│   │   └── service.ts
│   ├── prompts/         #   AI 助手提示词模板
│   │   ├── types.ts              # AIAssistLog, AIAssistKind
│   │   └── templates.ts          # R2/R3 提示词模板文本
│   └── snapshot/        #   快照生成
│       ├── types.ts              # SnapshotMeta, SnapshotInput
│       └── service.ts            # buildLessonSnapshotHTML()
│
├── lessons/             # Lesson 层：课时页面、步骤组件、课时级 Guard
│   ├── lesson-1/        #   课时1：项目启动与定题
│   │   ├── config.ts             # 课时配置（标题、步骤名称、AI助手开关等）
│   │   ├── guards.ts             # 课时1步骤间 Guard 规则
│   │   ├── routes.tsx            # 课时1路由定义
│   │   ├── steps/               # 6个步骤组件
│   │   │   ├── Step1Intro.tsx    # 步骤1：任务启动
│   │   │   ├── Step2Profile.tsx  # 步骤2：我的信息
│   │   │   ├── Step3R1.tsx       # 步骤3：个人R1
│   │   │   ├── Step4Discussion.tsx # 步骤4：小组讨论留痕
│   │   │   ├── Step5Checklist.tsx  # 步骤5：证据清单Wizard
│   │   │   └── Step6Review.tsx   # 步骤6：回顾与导出
│   │   └── components/          # 课时1专属UI组件
│   │       ├── R1ResultCard.tsx
│   │       ├── DiscussionTable.tsx
│   │       ├── ConsensusCard.tsx
│   │       ├── ChecklistWizard.tsx
│   │       └── AIHelperDrawer.tsx
│   │
│   └── lesson-2/        #   课时2：证据采集与规范记录
│       ├── config.ts
│       ├── guards.ts
│       ├── routes.tsx
│       ├── steps/
│       │   ├── Step1Resume.tsx   # 步骤1：恢复进度
│       │   ├── Step2Sync.tsx     # 步骤2：同步小组任务
│       │   ├── Step3MyTasks.tsx  # 步骤3：查看我的任务
│       │   ├── Step4Evidence.tsx # 步骤4：公开资源入库
│       │   ├── Step5Quality.tsx  # 步骤5：质检与课后采集
│       │   └── Step6Review.tsx   # 步骤6：回顾与导出
│       └── components/
│           ├── LeaderFileImport.tsx
│           ├── TaskAssignmentPanel.tsx
│           ├── PublicEvidenceForm.tsx
│           ├── QualityCheckPanel.tsx
│           └── FieldTaskPanel.tsx
│
├── features/            # Feature 层：跨课时功能模块
│   ├── save-resume/     #   保存与恢复进度（继续学习包）
│   ├── snapshot-export/ #   阶段快照导出
│   ├── role-branch/     #   组长/组员角色分支逻辑
│   ├── progress-ui/     #   进度条 UI 相关
│   └── ai-helper/       #   AI助手抽屉（提示词模板+外部跳转）
│
├── infra/               # Infra 层：基础设施，禁止在此层外直接访问
│   └── persistence/
│       ├── indexeddb/
│       │   ├── db.ts             # DB 连接、版本管理（DB_NAME, DB_VERSION）
│       │   ├── schema.ts         # Object store 定义
│       │   └── migrations.ts     # 版本迁移（当前 v1）
│       ├── repositories/
│       │   ├── portfolio.repository.ts      # PortfolioRepository 接口
│       │   └── portfolio.repository.idb.ts  # IndexedDB 实现
│       └── serializers/
│           ├── continue-package.ts  # 继续学习包序列化/反序列化
│           └── snapshot-html.ts     # 阶段快照 HTML 生成
│
└── shared/              # Shared 层：共享 UI、工具，无业务逻辑
    ├── ui/              #   通用 UI 组件（shadcn/ui 包装）
    ├── hooks/           #   通用 hooks
    ├── utils/           #   工具函数（cn、日期格式化等）
    ├── constants/       #   全局常量
    └── types/           #   跨层共享的基础类型
```

---

## 分层依赖方向

```
App 层
  ↓ 依赖
Lesson 层  ←→  Feature 层
  ↓ 依赖           ↓ 依赖
Domain 层
  ↓ 依赖
Infra 层

所有层均可依赖 Shared 层
```

**禁止方向：**
- Infra 层不得依赖 Domain/Lesson/App 层
- Domain 层不得依赖 Lesson/App 层
- Shared 层不得依赖任何业务层

---

## 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `AppShell.tsx`, `R1ResultCard.tsx` |
| 非组件文件 | kebab-case | `portfolio.repository.ts`, `continue-package.ts` |
| 目录 | kebab-case | `lesson-1/`, `group-plan/`, `save-resume/` |
| 类型/接口 | PascalCase | `ModulePortfolio`, `StudentProfile` |
| 常量 | UPPER_SNAKE_CASE | `DB_NAME`, `DB_VERSION` |
| hooks | camelCase 以 `use` 开头 | `usePortfolio`, `useProgress` |

---

## 新增功能步骤

### 新增一个课时步骤

1. 在对应 `lessons/lesson-N/steps/` 下新建 `StepNXxx.tsx`
2. 更新 `lessons/lesson-N/config.ts` 中的步骤配置
3. 更新 `lessons/lesson-N/guards.ts` 中的 Guard 规则
4. 更新 `lessons/lesson-N/routes.tsx` 中的路由
5. 如有新域类型，在 `domains/` 对应模块的 `types.ts` 中添加
6. 更新本文件（FILE-STRUCTURE.md）

### 新增一个 Domain

1. 在 `domains/` 下新建目录（kebab-case）
2. 创建 `types.ts`（领域类型）和 `service.ts`（业务逻辑）
3. 如需持久化，在 `infra/persistence/repositories/` 下新建 repository 接口和实现
4. 更新本文件

### 新增一个共享 UI 组件

1. 在 `shared/ui/` 下新建组件文件
2. 组件只能依赖 Shared 层，不得引入业务逻辑
3. 更新本文件（如目录结构有变化）

---

## 重要约束

- 页面组件禁止直接操作 IndexedDB，必须通过 `PortfolioRepository` 接口
- 学生端 UI 禁止出现以下词汇：JSON、schema、IndexedDB、migration、repository、database
- 课时业务逻辑禁止写入 `shared/ui` 或 `app/layout`
- `lesson-1` 的记录字段保持粗粒度，不得引入课时 2 的严格字段约束

---

*最后更新：2026-03-19*
