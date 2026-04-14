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
│   │   └── types.ts              # ModulePortfolio、createNewPortfolio、normalizeModulePortfolio（lesson3 缺字段合并）
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
    └── lesson-3/        #   课时3：素材整理与证据加工（共 5 关；全部已实现）
    ├── config.ts             # 课时配置（步骤名称；5关：继承成果/方法工具箱/筛选材料/加工工坊/预览导出）
    ├── guards.ts             # 课时3步骤间 Guard（全5关守卫均已定义）
    ├── routes.tsx            # 课时3路由定义（step/1~step/5；全部渲染实际组件）
    ├── assets/               # 本课静态插图：根目录四格 jpg/jpeg（由 useComicPanelUrls 取前 4 张）
    ├── lib/                  # 课时3 专用小模块（无 UI）
    │   ├── unified-logic-content.ts  # 统一逻辑四步文案 + 课堂讲稿（金句/解析/避坑等）
    │   └── useComicPanelUrls.ts      # assets 配图 URL 列表（Vite glob）
    ├── components/
    │   ├── PosterSketchPreview.tsx   # 海报草图预览（Cormorant + Noto；四块状态区）；支持 embedded / spotlightCard=why + whyBodyOverride（第2关弹窗压暗非「为何关注」区）
    │   └── UnifiedLogicPresentation.tsx # 统一逻辑全屏翻页演示（键盘/侧缘翻页；配图+讲稿）
    └── steps/
        ├── Step1InheritAnchor.tsx    # 第1关：左右栏（左：已带来材料+本课说明；右：PosterSketchPreview）；确认后写入 missionAcknowledged
        ├── Step2Toolbox.tsx          # 第2关：顶栏统一逻辑；左右栏（左：来源+填写+确认表述+海报弹窗；右：材料参考仅文字Tab）；toolboxWhyPreviewLocked 后过关
        ├── Step3SelectMaterials.tsx  # 第3关：筛选材料（资料池增强卡片；勾选+现象说明句；已入选清单汇总；保存写入 selectedMaterials[]）
        ├── Step4EvidenceWorkshop.tsx # 第4关：证据加工工坊（目标带+左右双栏；逐条加工为证据卡；右侧全Tab解锁+卡片预览；写入 evidenceCards[]）
        └── Step5PreviewExport.tsx    # 第5关：个人预览与导出（为何关注+证据卡总览；检查清单+可能原因锁定；导出JSON个人整理包+完成课时3）
    │
    └── lesson-4/        #   课时4：结论形成与网页传播（共 5 关；全部实现）
        ├── config.ts             # 课时配置（步骤名称；5关：小组合并/个人草稿/制作方案/协商生成/升级提交）
        ├── guards.ts             # 课时4步骤间 Guard（全5关守卫；含组长/组员角色差异判定）
        ├── routes.tsx            # 课时4路由定义（step/1~step/5）
        ├── components/           # 预留组件目录
        └── steps/
            ├── Step1GroupMerge.tsx    # 第1关：组长双栏（左：说明+标题副标题+可能原因+导出骨架包；右：成员整理包导入+合并预览）；组员导入骨架包v1（支持重新导入）+预览含来源资料
            ├── Step2PersonalDraft.tsx # 第2关：双栏（左：骨架包内容参考+AI提示词+HTML模板；右：sticky编辑/预览Tab）
            ├── Step3PlanRecord.tsx    # 第3关：组长填写制作方案单+导出JSON供组员分发；组员导入方案单+告知书查看+已知悉勾选
            ├── Step4CollabBuild.tsx   # 第4关：组长双栏（左：说明+AI原则+协作流程勾选；右：sticky编辑/预览Tab）；组员查看协作步骤（无预览）+已知悉勾选
            └── Step5UpgradeVerify.tsx # 第5关：组长双栏（左：说明+校验清单+导出完成；右：sticky编辑/预览Tab）；组员查看校验要点（无预览）+已知悉勾选

├── pages/               # 页面层：顶级路由页面组件
│   ├── HomePage.tsx              # 首页（无档案时引导注册/导入；有档案时展示进度）
│   ├── LegacyImportPage.tsx      # 【临时功能】旧版数据导入独立页（路由 /legacy-import）
│   └── NotFoundPage.tsx          # 404 页
│
├── features/            # Feature 层：跨课时功能模块
│   ├── progress-ui/     #   进度条 UI 相关
│   │   └── InnerStepProgress.tsx # 课时内步骤进度条
│   ├── material-processing-reference/ # 材料处理参考（跨课时复用：四类 Tab + 加工说明文案；不含个人填写区）
│   │   ├── materialTypes.ts              # 四类材料结构化配置（零浪费示例）
│   │   ├── MaterialProcessingReferencePanel.tsx # 仅 Tab + 加工说明；确认表述由 Step2 左侧负责
│   │   └── index.ts
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
│           ├── continue-package.ts  # 继续学习包序列化/反序列化；导入时 lesson3/lesson4 缺字段补齐；downloadLeaderFile（组长文件）；PersonalPackage/SkeletonPackageV1 序列化（课时4数据传递）
│           └── snapshot-html.ts     # 阶段快照 HTML 生成（含 lesson4-full 类型；课时4快照包含骨架包合并数据节）
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
  → L2第4~5关 → 完成后跳 /lesson/3/step/1（课时3已开放）
  → L3第1关：继承前序成果，确认本课任务边界（missionAcknowledged）
  → L3第2关：统一逻辑 + 双栏（左：R1 来源 + 两句持久化 + 确认表述 + 海报聚光灯弹窗；右：材料参考）；toolboxWhyPreviewLocked 且点过关后 toolboxCompleted
  → L3第3关：筛选个人材料，填写现象说明句（selectedMaterials[]）
  → L3第4关：逐条加工证据卡（evidenceCards[]；左：加工区；右：全Tab解锁参考）
  → L3第5关：总览+检查清单+导出个人整理包（personalPackageExported+completed）
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

## 课时3 · 结构摘要（除 UI 布局外的实现汇总）

本节汇总**数据模型、兼容策略、分层职责与关卡语义**，便于评审与后续关扩展；具体控件样式见各步骤组件。

### 1. 领域状态 `Lesson3State`（`domains/portfolio/types.ts`）

| 字段 | 语义 | 主要写入步骤 |
|------|------|----------------|
| `missionAcknowledged` | 已确认本课任务边界 | L3 Step1 |
| `toolboxCompleted` | 已完成第2关（可进第3关） | L3 Step2 底部过关按钮 |
| `toolboxNoticeWhat` | 「这条材料让我注意到什么」 | L3 Step2，防抖持久化 |
| `toolboxWhyOnPoster` | 海报「为何关注」表述草稿 | L3 Step2，防抖持久化 |
| `toolboxWhyPreviewLocked` | 是否已确认表述（锁定左侧输入直至解锁） | L3 Step2 左侧「确认本条表述」/「解锁修改」 |
| `selectedMaterials[]` | 入选材料 + 现象说明句 | L3 Step3 |
| `evidenceCards` | 第4关证据卡列表 | L3 Step4 |
| `originExpression` | 关注缘起表达文本（预留，暂未使用） | — |
| `personalPackageExported` / `completed` | 课时3个人导出与完成标记 | L3 Step5 |

`createEmptyLesson3State()` 为上述字段提供默认值；新建档案与缺字段合并均依赖此函数。

### 2. 档案兼容与合并（非 UI）

| 机制 | 位置 | 行为 |
|------|------|------|
| `normalizeModulePortfolio` | `domains/portfolio/types.ts` | `lesson3` 与 `createEmptyLesson3State()` 浅合并，补齐 IndexedDB 旧记录缺失字段 |
| 应用入口 | `app/providers/AppProvider.tsx` | `getCurrent` / `importPortfolio` 后对档案做一次规范化再写入 React 状态 |
| 继续学习包导入 | `infra/persistence/serializers/continue-package.ts` | 若 JSON 中已有 `lesson3`，仍与默认状态合并，避免旧包缺键 |

### 3. 跨课时 Feature：`material-processing-reference`

- **职责**：四类材料（图/文/表/视频）的**静态**加工说明（目标、动作、示例、常见错误）；`unlockedTabIds` prop 控制解锁范围（第2关仅开放「文字」Tab，第4关全部解锁）；`defaultTab` prop 支持外部指定初始激活 Tab（第4关根据当前材料类型自动切换）。
- **不负责**：学生个人文案、确认锁定、海报预览（均在 `Step2Toolbox` 与 `PosterSketchPreview`）。
- **依赖方向**：Lesson 层引用 Feature；Feature 仅依赖 `shared/ui` 与本地 `materialTypes.ts`。

### 4. 课时3 组件（语义能力）

| 组件 | 路径 | 结构向能力 |
|------|------|------------|
| `PosterSketchPreview` | `lesson-3/components/` | `researchQuestion` / `evidenceEntryCount` 驱动分区文案；`embedded` 去 sticky；`spotlightCard="why"` + `whyBodyOverride` 用于第2关弹窗聚光灯与草稿注入 |
| `UnifiedLogicPresentation` | 同上 | 全屏翻页讲稿 + 四格配图，与 `unified-logic-content.ts` / `useComicPanelUrls` 配套 |

### 5. 第2关持久化与竞态注意（Step2Toolbox）

- 两句文案以**本地 state + 防抖**写入 `savePortfolio`，避免每次键入全量写盘过频。
- **仅从 `portfolio.id` 变化**时把 `toolboxNoticeWhat` / `toolboxWhyOnPoster` 从档案同步回本地，避免与「确认表述」等保存竞态把输入冲掉。
- `patchLesson3`、过关保存时通过 **ref** 携带当前草稿，避免锁状态保存覆盖未落盘的输入。

### 6. Guard 与进度判定（`lesson-3/guards.ts`）

- 进入 Step3：`lesson3.toolboxCompleted === true`。
- Step2 过关前：需 `toolboxWhyPreviewLocked === true`（由 UI 按钮写入，与 `toolboxCompleted` 分步）。

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

## 产品发布版本号（SemVer）

- **发布号**：以 `package.json` 的 `version` 为准（如 `0.4.0`），与 Git 标签 `v0.4.0` 一一对应；`0.x` 表示快速迭代期。
- **发版流程摘要**：在 `main` 上 bump `package.json` 与 `package-lock.json` 根 `version` → 提交 → `git tag vX.Y.Z` → `git push origin main` 与 `git push origin vX.Y.Z` → 可选在 GitHub **Releases** 写说明。
- **与档案字段区分**：`ModulePortfolio.appVersion` 表示**继续学习包等数据格式口径**，与 npm 发布号独立维护。

## 重要约束

- 页面组件禁止直接操作 IndexedDB，必须通过 `PortfolioRepository` 接口
- 学生端 UI 禁止出现以下词汇：JSON、schema、IndexedDB、migration、repository、database
- 课时业务逻辑禁止写入 `shared/ui` 或 `app/layout`
- `lesson-1` 的记录字段保持粗粒度，不得引入课时2的严格字段约束
- 教师模式下所有写操作（savePortfolio、importPortfolio）均为 no-op，不得持久化演示数据

---

---

## 课时4 · 结构摘要

### 1. 领域状态 `Lesson4State`（`domains/portfolio/types.ts`）

| 字段 | 语义 | 主要写入步骤 |
|------|------|-------------|
| `memberPackagesImported` | 已导入成员整理包数量 | L4 Step1 |
| `groupMergeCompleted` | 小组合并是否完成 | L4 Step1 |
| `possibleCauses` | 可能的原因（谨慎表述） | L4 Step1 |
| `posterTitle` | 组长填写的海报标题 | L4 Step1 |
| `posterSubtitle` | 组长填写的海报副标题 | L4 Step1 |
| `skeletonExported` | 是否已导出骨架包 v1 | L4 Step1 |
| `skeletonImported` | 组员是否已导入骨架包 v1 | L4 Step1（组员） |
| `skeletonPackageJson` | 骨架包 JSON 字符串（组长导出时写入 / 组员导入时写入），第2关统一从此字段读取合并内容 | L4 Step1 |
| `importedPackagesJson` | 组长已导入的成员整理包 JSON 数组字符串，刷新后恢复导入状态 | L4 Step1（组长） |
| `personalDraftHtml` | 个人网页草稿 HTML 内容（v0） | L4 Step2 |
| `personalDraftCompleted` | 个人草稿是否已完成 | L4 Step2 |
| `productionPlan` | 小组制作方案单（含底稿选择/分工/AI边界/人工核查要点） | L4 Step3 |
| `planCompleted` | 方案单是否已完成 | L4 Step3 |
| `groupWebpageV1` | 小组网页 v1 HTML 内容 | L4 Step4 |
| `collabCompleted` | 协作生成是否完成 | L4 Step4 |
| `finalHtml` | 最终版 HTML 内容 | L4 Step5 |
| `verificationPassed` | 可信发布校验是否通过 | L4 Step5 |
| `finalExported` | 是否已导出最终版 | L4 Step5 |
| `completed` | 课时4是否已完成 | L4 Step5 |

### 2. 跨角色数据包类型（`infra/persistence/serializers/continue-package.ts`）

| 类型 | 产生 | 消费 | 说明 |
|------|------|------|------|
| `PersonalPackage` | L3 Step5「导出个人整理包」（仅组员） | L4 Step1 组长导入 | 含学生身份、lesson2 完整资料条目（`citationFull`）、lesson3 加工结果 |
| `SkeletonPackageV1` | L4 Step1 组长「导出骨架包 v1」 | L4 Step1 组员导入（支持重新导入） | 含 posterTitle/posterSubtitle、mergedWhyCare、mergedWhatWeSee[]、mergedSources[]（完整 citationFull）、possibleCauses、memberPackages[] |
| `production-plan-v1` | L4 Step3 组长「导出方案单」 | L4 Step3 组员导入 | 含 ProductionPlan 完整字段 + groupName/leaderName/exportedAt |

### 3. 角色分离与 UI 布局

| 关卡 | 组长视图 | 组员视图 |
|------|---------|---------|
| 第1关 | 双栏：左（说明+标题副标题+可能原因+导出骨架包）/右（成员导入+合并预览 sticky） | 导入骨架包（支持重新导入）→ 预览含来源资料 → 进入第2关 |
| 第2关 | 双栏：左（骨架包内容参考+AI提示词+HTML模板）/右（编辑/预览Tab sticky）| 同组长（均从 skeletonPackageJson 读取） |
| 第3关 | 单栏表单 + 保存 + 导出方案单按钮 | 导入方案单 → 告知书查看 → 已知悉勾选 |
| 第4关 | 双栏：左（说明+AI原则+协作流程勾选+完成）/右（编辑/预览Tab sticky）| 协作步骤只读列表（无网页预览）→ 已知悉勾选 |
| 第5关 | 双栏：左（说明+校验清单+导出完成）/右（编辑/预览Tab sticky）| 校验要点只读列表（无网页预览）→ 已知悉勾选 |

判断依据：`portfolio.student.role === "leader"` vs `"member"`

### 4. 阶段快照（`snapshot-html.ts`）

`"lesson4-full"` 类型 → `buildLesson4Snapshot()` 函数：
- 覆盖课时4各关产出（进度、可能原因、制作方案单、个人草稿代码、最终网页 iframe）
- 新增**骨架包合并数据节**：解析 `lesson4.skeletonPackageJson`，展示标题/副标题/为何关注/我们看见了什么/可能线索/来源资料（完整 citationFull）
- `GlobalActions.tsx` 的 `handleSnapshot` 含 `currentLessonId === 4` 分支

### 5. 教师演示数据（`demo-portfolio.ts`）

- `lesson4` 字段已与 `Lesson4State` 完整对齐（含 `posterTitle`/`posterSubtitle`/`importedPackagesJson`）
- `skeletonPackageJson` 使用 `JSON.stringify(...)` 预填完整骨架包（含 mergedSources 的 citationFull），确保组长和组员视图均可显示

---

## 课时5 · 结构摘要

### 1. 领域状态 `Lesson5State`（`domains/portfolio/types.ts`）

| 字段 | 语义 | 主要写入步骤 |
|------|------|-------------|
| `feedbackDimensions` | 四维度反馈判断（讲解逻辑/证据支撑/结论合理性/建议可行性），各含 status + suggestion | L5 Step1 |
| `priorityChanges` | 优先修改点列表（前2条必填，第3条选填） | L5 Step1 |
| `overallSuggestion` | 总体建议（选填） | L5 Step1 |
| `feedbackExported` | 第1关文本是否已导出到剪贴板 | L5 Step1 |
| `feedbackCompleted` | 第1关是否已完成（满足至少2条优先修改点） | L5 Step1 |
| `changeRecords` | 改动说明记录行（至少2行四列完整才可过关） | L5 Step2 |
| `completed` | 课时5是否已完成 | L5 Step2 |

辅助类型：
- `FeedbackDimension`：`{ name, status: "clear" | "needs-change" | "", suggestion }`
- `ChangeRecord`：`{ item, before, after, reason }`

### 2. 目录结构

```
src/lessons/lesson-5/
├── config.ts                    # 课时配置（2关：意见入池/改动落地）
├── guards.ts                    # Guard：Step1 需 lesson4.completed；Step2 需 feedbackCompleted
├── routes.tsx                   # 路由（step/1 → step/2），含课时5绿色标签
└── steps/
    ├── Step1PeerFeedback.tsx    # 第1关：四维度卡片 + 优先修改清单 + 文本导出
    └── Step2VersionChange.tsx   # 第2关：改动说明表格 + 文本/JSON 导出
```

### 3. 课时4 → 课时5 跳转

`lesson-4/steps/Step5UpgradeVerify.tsx` 完成后检查 `LESSON_REGISTRY.find(l => l.id === 5)?.enabled`：
- `true` → `navigate("/lesson/5/step/1")`
- `false` → `navigate("/")`（与课时2→3 模式一致）

### 4. 阶段快照

`"lesson5-full"` 类型 → `buildLesson5Snapshot()` 函数：
- 展示四维度判断表格、优先修改清单、改动说明表格
- `GlobalActions.tsx` 的 `handleSnapshot` 含 `currentLessonId === 5` 分支

### 5. 课时6 预埋

- `Lesson6State` / `RoadshowStep` 类型已定义在 `domains/portfolio/types.ts`
- `createEmptyLesson6State()` 已实现，`normalizeModulePortfolio` / `createNewPortfolio` 已包含 `lesson6` 字段
- `lesson-registry.ts` 课时6 `enabled: false`（待 lesson-6-dev 分支开启）

---

*最后更新：2026-04-14（产品发布号 v0.5.0 / lesson-5-dev 分支；课时5全2关完整实现；课时6类型预埋；课时4→5智能跳转）*
