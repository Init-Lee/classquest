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
│   │   ├── AppShell.tsx          # 顶层外壳，包裹所有页面；含教师模式金色横幅
│   │   ├── TopLessonProgress.tsx # 顶部课时进度条（课时1~6）
│   │   └── GlobalActions.tsx     # 右上角全局动作区（保存/导入/快照/重置）
│   ├── router/          #   路由定义
│   │   └── index.tsx             # 路由表定义（懒加载，含 v7_startTransition future flag）
│   ├── providers/       #   全局 Context Provider
│   │   └── AppProvider.tsx       # PortfolioContext（含教师模式 isTeacherMode 状态）
│   └── lesson-registry.ts        # 课时注册表（统一管理课时配置，enabled 控制开放状态）
│
├── domains/             # Domain 层：领域模型与业务服务（纯逻辑，无 UI）
│   ├── student/         #   学生身份模型
│   │   └── types.ts              # StudentProfile, StudentRole
│   ├── progress/        #   进度指针
│   │   └── types.ts              # ProgressPointer
│   ├── portfolio/       #   模块档案（核心聚合根）
│   │   └── types.ts              # ModulePortfolio（Lesson1State含groupMembers:string[]）、createNewPortfolio
│   ├── group-plan/      #   小组计划与讨论
│   │   └── types.ts              # GroupConsensus, GroupEvidencePlanRow(owners:string[]), R1Record(含sourceRows)
│   ├── evidence/        #   证据记录
│   │   └── types.ts              # PublicEvidenceRecord, FieldEvidenceTask, Lesson2Assignment(owners:string[]), QualityCheckResult
│   ├── prompts/         #   AI 助手提示词模板
│   │   └── types.ts              # AIAssistLog, AIAssistKind
│   └── snapshot/        #   快照生成
│       └── types.ts              # SnapshotMeta
│
├── lessons/             # Lesson 层：课时页面、步骤组件、课时级 Guard
│   ├── lesson-1/        #   课时1：项目启动与定题（共 5 关）
│   │   ├── config.ts             # 课时配置（步骤名称、AI助手开关；5关）
│   │   ├── guards.ts             # 课时1步骤间 Guard（步骤1~5，步骤2身份登记已合并到首页）
│   │   ├── routes.tsx            # 课时1路由定义（step/1~step/5）
│   │   ├── steps/
│   │   │   ├── Step1Intro.tsx      # 第1关：任务启动（勾选知晓后进入第2关）
│   │   │   ├── Step3R1.tsx         # 第2关：个人 R1（主题包+研究问题+证据构想；含个人辅助材料来源 sourceRows）
│   │   │   ├── Step4Discussion.tsx # 第3关：小组讨论留痕（组长录入；组员导入组长文件同步groupMembers，后续无需再次导入）
│   │   │   ├── Step5Checklist.tsx  # 第4关：证据清单 Wizard（sub0:组员登记→sub1:执行表multi-select owners→sub2-3；组员只读前3子步）
│   │   │   └── Step6Review.tsx     # 第5关：回顾导出（含组员名单汇总；组长导出组长文件；一键完成并跳转课时2）
│   │   └── components/
│   │       └── AIHelperDrawer.tsx  # AI 助手内嵌右侧面板（R2/R3 提示词模板+豆包跳转）
│   │
│   └── lesson-2/        #   课时2：证据采集与规范记录（共 5 关；原第1+2关已合并）
│       ├── config.ts
│       ├── guards.ts
│       ├── routes.tsx
│       ├── steps/
│       │   ├── Step1Combined.tsx  # 第1关：进度确认与任务领取（身份卡+课时1摘要+角色任务确认；一次写入 resumeDone+leaderSyncDone+assignments）
│       │   ├── Step2MyTasks.tsx   # 第2关：我的任务（高亮本人任务+全组规划始终展开的表格；含 evidenceRow 计划字段）
│       │   ├── Step3Evidence.tsx  # 第3关：证据入库（公开资源/现场采集双模板；卡顶展示课时1执行表参考；自动生成引用条目）
│       │   ├── Step4Quality.tsx   # 第4关：质检（3项硬检查；纯现场采集直接放行；有上一步回退）
│       │   └── Step5Review.tsx    # 第5关：回顾（提示使用右上角保存；课后任务显示来自 lesson2.fieldTasks；完成后智能跳转）
│       └── components/            # （预留，当前步骤逻辑直接写在 steps/ 内）
│
├── pages/               # 页面层：顶级路由页面组件
│   ├── HomePage.tsx              # 首页（无档案时引导注册/导入；有档案时展示进度）
│   ├── LegacyImportPage.tsx      # 【临时功能】旧版数据导入独立页（路由 /legacy-import）
│   └── NotFoundPage.tsx          # 404 页
│
├── features/            # Feature 层：跨课时功能模块
│   ├── progress-ui/     #   进度条 UI 相关
│   │   └── InnerStepProgress.tsx # 课时内步骤进度条
│   └── legacy-import/   #   【临时功能 · 全班迁移完成后整目录+LegacyImportPage.tsx一并删除】
│       ├── legacy-import.ts      # LegacyL1/LegacyL2 输入类型定义 + buildPortfolioFromLegacy 映射函数
│       ├── LegacyImportSection.tsx # 4步向导核心组件（导出 LegacyImportWizard）
│       └── index.ts              # re-export 入口（外部只需 @/features/legacy-import）
│
├── infra/               # Infra 层：基础设施，禁止在此层外直接访问
│   └── persistence/
│       ├── indexeddb/
│       │   └── db.ts             # DB 连接、版本管理（DB_NAME, DB_VERSION, object stores）
│       ├── repositories/
│       │   ├── portfolio.repository.ts      # PortfolioRepository 接口
│       │   └── portfolio.repository.idb.ts  # IndexedDB 实现（含 clear() 清空全部）
│       └── serializers/
│           ├── continue-package.ts  # 继续学习包序列化/反序列化；downloadLeaderFile（组长文件）
│           └── snapshot-html.ts     # 阶段快照 HTML 生成
│
└── shared/              # Shared 层：共享 UI、工具，无业务逻辑
    ├── ui/              #   通用 UI 组件（shadcn/ui 包装）
    │   ├── button.tsx, card.tsx, badge.tsx
    │   ├── input.tsx, textarea.tsx, progress.tsx
    │   ├── dialog.tsx, sheet.tsx
    │   └── ...
    ├── utils/           #   工具函数
    │   ├── cn.ts                 # clsx + tailwind-merge
    │   ├── format.ts             # 日期格式化、文件名生成（含 buildLeaderFilename）
    │   └── pointer.ts            # 进度指针工具：advancePointer（只前进不后退）、resolvePointerFromState（导入修正）
    └── constants/
        └── demo-portfolio.ts     # 教师演示模式预填档案（不持久化，仅内存使用）
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

## 关键功能说明

### 教师演示模式
- 入口：首页底部「教师入口」区块，口令 `xnwy`
- 进入后：`AppProvider` 中 `isTeacherMode = true`，`portfolio` 切换为 `createDemoPortfolio()` 内存对象
- 效果：所有 Guard 绕过，`savePortfolio` 为 no-op，顶部显示金色横幅，右上角仅保留「阶段快照」
- 退出：点击横幅「退出演示」或 Logo 跳首页

### 数据流（学生模式）
```
首页登记（createNewPortfolio → profileDone:true）
  → L1第1关：任务启动
  → L1第2关：个人R1（含辅助材料 sourceRows 存入 R1Record）
  → L1第3关：小组讨论；组员导入组长文件（同步 groupConsensus/evidenceRows/groupMembers；确认 confirmedOwnerName）
  → L1第4关：组长录入 groupMembers → 生成执行表（owners:string[]）→ 安全承诺
  → L1第5关：组长导出组长文件（downloadLeaderFile）
  → L2第1关（合并）：确认进度 + 自动/手动认领任务 → 同时写入 resumeDone+leaderSyncDone+assignments
  → L2第2关：查看我的任务（含全组规划表格）
  → L2第3关：证据入库（公开资源 / 现场采集双模板）
  → L2第4~5关 → 完成后跳首页（或课时3，视 lesson-registry 开放状态）
```

### 保存/导出体系
| 操作 | 入口 | 用途 |
|---|---|---|
| 保存进度 | 右上角蓝色按钮 | 下载继续学习包 JSON，换设备后导入恢复 |
| 阶段快照 | 右上角绿色按钮 | 生成 HTML 文件，上传 Moodle 作过程材料 |
| 导入进度 | 右上角 | 恢复继续学习包 |
| 组长文件 | 课时1第5关（仅组长） | 组员导入后可看小组分工 |
| 重置数据 | 右上角红色重置 | 清空 IndexedDB，回到初始状态 |
| 旧版迁移 | 首页「导入旧版数据」按钮 → `/legacy-import` 独立页（临时功能） | 导入旧版工具 JSON，自动跳转对应进度 |

---

## 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `AppShell.tsx`, `Step3R1.tsx` |
| 非组件文件 | kebab-case | `portfolio.repository.ts`, `continue-package.ts` |
| 目录 | kebab-case | `lesson-1/`, `group-plan/`, `progress-ui/` |
| 类型/接口 | PascalCase | `ModulePortfolio`, `StudentProfile` |
| 常量 | UPPER_SNAKE_CASE | `DB_NAME`, `DB_VERSION` |
| hooks | camelCase 以 `use` 开头 | `usePortfolio` |

---

## 新增功能步骤

### 新增一个课时步骤

1. 在对应 `lessons/lesson-N/steps/` 下新建 `StepNXxx.tsx`
2. 更新 `lessons/lesson-N/config.ts` 中的步骤配置
3. 更新 `lessons/lesson-N/guards.ts` 中的 Guard 规则
4. 更新 `lessons/lesson-N/routes.tsx` 中的路由
5. 如有新域类型，在 `domains/` 对应模块的 `types.ts` 中添加
6. 更新本文件（FILE-STRUCTURE.md）

### 新增一个课时（如课时3）

1. 在 `lesson-registry.ts` 中将对应课时 `enabled: true`
2. 在 `lessons/` 下新建 `lesson-3/` 目录（参考 lesson-2 结构）
3. 在 `app/router/index.tsx` 中注册懒加载路由
4. 课时2第6关的完成跳转会自动感知（检查 lesson-registry 的 enabled 状态）
5. 更新本文件

### 新增一个共享 UI 组件

1. 在 `shared/ui/` 下新建组件文件
2. 组件只能依赖 Shared 层，不得引入业务逻辑
3. 更新本文件（如目录结构有变化）

---

## 重要约束

- 页面组件禁止直接操作 IndexedDB，必须通过 `PortfolioRepository` 接口
- 学生端 UI 禁止出现以下词汇：JSON、schema、IndexedDB、migration、repository、database
- 课时业务逻辑禁止写入 `shared/ui` 或 `app/layout`
- `lesson-1` 的记录字段保持粗粒度，不得引入课时2的严格字段约束
- 教师模式下所有写操作（savePortfolio、importPortfolio）均为 no-op，不得持久化演示数据

---

*最后更新：2026-03-26*
