<!--
文件说明：ClassQuest 仓库内「目录结构 + 分层边界」真相源。
职责：记录 `src/` 下真实路径、依赖方向、命名与新增流程；补充各课时领域摘要与跨课数据包。
更新触发：新增/移动目录或文件、增减课时与步骤、调整 `ModulePortfolio`/序列化/路由/注册表时，必须同步修订本文。
-->

# FILE-STRUCTURE — 目录结构与分层规范

本文件是 **classquest** 仓库内的结构真相源。开发时须遵守下文分层与依赖方向，**禁止越层或反向依赖**。

> 产品规格类 Markdown 若放在 monorepo 上级目录（如 `AI-Class/build_Plan/`），不在本仓库树内，此处不列举。

---

## 1. 仓库顶层（classquest/）

```
classquest/
├── public/                 # 静态资源（favicon、icons）
├── src/                    # 应用源代码（见第 2 节）
├── eslint.config.js
├── index.html
├── package.json / package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts
├── README.md / README_EN.md
├── FILE-STRUCTURE.md       # 本文件
├── CONTRIBUTING.md
└── LICENSE
```

---

## 2. `src/` 总览与依赖方向

### 2.1 依赖方向（简图）

```
app/          → lessons / features / domains / infra / shared
lessons/      → features / domains / infra / shared
features/     → domains / shared（避免依赖 lessons，除非确有跨课复用且单向）
domains/      → shared（仅类型/纯函数层面；不依赖 infra）
infra/        → domains（类型）/ shared；禁止依赖 app、lessons
shared/       → 不依赖上述任何业务层
```

**禁止**：`infra` 依赖 `lessons`；`domains` 依赖 `app`/`lessons`；`shared` 依赖业务层。

### 2.2 目录树（与磁盘一致）

下列树为 **`find src -type f` 归纳**，按路径排序；注释为职责摘要。

```
src/
├── main.tsx                      # React 入口
├── index.css                     # 全局样式（Tailwind 入口）
├── assets/                       # 全局静态图（如 hero；与课时内 assets 区分）
│   ├── hero.png
│   ├── react.svg
│   └── vite.svg
│
├── app/                          # 应用壳：路由、布局、注册表、全局状态
│   ├── lesson-registry.ts        # LESSON_REGISTRY：课时标题、enabled、totalSteps；resolvePortfolioPointer
│   ├── teacher-demo-presets.ts   # 教师模式：`applyTeacherDemoPreset` 恢复演示；`applyTeacherMemberImportDrill` 组员导入前/后（保指针）
│   ├── layout/
│   │   ├── AppShell.tsx          # 子路由出口、顶栏；教师横幅含视角切换与组员演练下拉
│   │   ├── TopLessonProgress.tsx # 课时级进度
│   │   └── GlobalActions.tsx     # 保存 / 导入 / 快照 / 重置
│   ├── providers/
│   │   └── AppProvider.tsx       # Portfolio + 教师模式；规范化档案；对接 Repository
│   └── router/
│       └── index.tsx             # createBrowserRouter；课时 1~5 + 首页 + 旧版导入 + 404，皆懒加载
│
├── pages/                        # 与路由 path 直接对应的页面（非课时内步骤）
│   ├── HomePage.tsx
│   ├── LegacyImportPage.tsx      # /legacy-import
│   └── NotFoundPage.tsx
│
├── domains/                      # 领域类型与聚合（无 UI）
│   ├── student/types.ts
│   ├── progress/types.ts         # ProgressPointer
│   ├── portfolio/types.ts        # ModulePortfolio、Lesson1~6State、normalize/create
│   ├── group-plan/types.ts
│   ├── evidence/types.ts
│   ├── prompts/types.ts
│   └── snapshot/types.ts
│
├── lessons/                      # 按课时隔离：config / guards / routes / steps /（可选）components、lib、assets
│   ├── lesson-1/
│   │   ├── config.ts / guards.ts / routes.tsx
│   │   ├── components/AIHelperDrawer.tsx
│   │   └── steps/
│   │       ├── Step1Intro.tsx
│   │       ├── Step3R1.tsx           # 第 2 关（个人 R1）
│   │       ├── Step4Discussion.tsx   # 第 3 关
│   │       ├── Step5Checklist.tsx    # 第 4 关
│   │       └── Step6Review.tsx       # 第 5 关
│   ├── lesson-2/
│   │   ├── config.ts / guards.ts / routes.tsx
│   │   └── steps/
│   │       ├── Step1Combined.tsx
│   │       ├── Step2MyTasks.tsx
│   │       ├── Step3Evidence.tsx
│   │       ├── Step4Quality.tsx
│   │       └── Step5Review.tsx
│   ├── lesson-3/
│   │   ├── config.ts / guards.ts / routes.tsx
│   │   ├── lib/
│   │   │   ├── unified-logic-content.ts
│   │   │   └── useComicPanelUrls.ts  # glob: lesson-3/assets/*.{jpg,jpeg}（目录可空，构建时无图则列表为空）
│   │   ├── components/
│   │   │   ├── PosterSketchPreview.tsx
│   │   │   └── UnifiedLogicPresentation.tsx
│   │   └── steps/
│   │       ├── Step1InheritAnchor.tsx
│   │       ├── Step2Toolbox.tsx
│   │       ├── Step3SelectMaterials.tsx
│   │       ├── Step4EvidenceWorkshop.tsx
│   │       └── Step5PreviewExport.tsx
│   ├── lesson-4/
│   │   ├── config.ts / guards.ts / routes.tsx
│   │   └── steps/
│   │       ├── Step1GroupMerge.tsx
│   │       ├── Step2PersonalDraft.tsx
│   │       ├── Step3PlanRecord.tsx
│   │       ├── Step4CollabBuild.tsx
│   │       └── Step5UpgradeVerify.tsx
│   └── lesson-5/
│       ├── config.ts / guards.ts / routes.tsx
│       └── steps/
│           ├── Step1PeerFeedback.tsx
│           └── Step2VersionChange.tsx
│
├── features/
│   ├── progress-ui/
│   │   └── InnerStepProgress.tsx
│   ├── material-processing-reference/
│   │   ├── materialTypes.ts
│   │   ├── MaterialProcessingReferencePanel.tsx
│   │   └── index.ts
│   └── legacy-import/
│       ├── legacy-import.ts
│       ├── LegacyImportSection.tsx
│       └── index.ts
│
├── infra/persistence/
│   ├── indexeddb/db.ts
│   ├── repositories/
│   │   ├── portfolio.repository.ts
│   │   └── portfolio.repository.idb.ts
│   └── serializers/
│       ├── continue-package.ts     # 继续学习包、组长文件、L3 个人包、L4 骨架包/方案单、L5 意见包/改动汇总包
│       └── snapshot-html.ts        # 阶段快照 HTML（含 lesson4-full、lesson5-full 等）
│
└── shared/
    ├── ui/                         # shadcn 风格封装
    │   ├── button.tsx / card.tsx / badge.tsx
    │   ├── input.tsx / textarea.tsx / progress.tsx
    │   └── dialog.tsx / sheet.tsx
    ├── utils/
    │   ├── cn.ts
    │   ├── format.ts               # 含 buildLeaderFilename 等
    │   ├── group-display.ts        # getPortfolioGroupDisplayLabel（顶栏/首页「小组」展示）
    │   └── pointer.ts              # advancePointer、resolvePointerFromState
    └── constants/
        └── demo-portfolio.ts       # 教师演示用内存档案
```

---

## 3. 路由与懒加载（`app/router/index.tsx`）

| Path | 组件来源 |
|------|-----------|
| `/` | `pages/HomePage` |
| `/legacy-import` | `pages/LegacyImportPage` |
| `/lesson/1/*` … `/lesson/5/*` | `lessons/lesson-N/routes` |
| `*` | `pages/NotFoundPage` |

课时 6 未注册路由；`LESSON_REGISTRY` 中 `id: 6, enabled: false`。

---

## 4. 跨角色数据包（`infra/.../continue-package.ts`）

| 类型 / packageType | 产出 | 消费 |
|--------------------|------|------|
| 继续学习包（整份 Portfolio） | 全局「保存进度」 | 全局「导入」 |
| 组长文件（课时1） | L1 Step6 | 组员导入 → 讨论等 |
| PersonalPackage（JSON） | L3 Step5 | L4 Step1 组长导入 |
| SkeletonPackageV1 | L4 Step1 组长导出 | L4 Step1 组员导入 |
| production-plan-v1 | L4 Step3 组长 | L4 Step3 组员 |
| peer-feedback-opinion-v1 | L5 Step1 组员导出意见包 | L5 Step1 组长导入 → `peerFeedbackImportedPackagesJson` |
| lesson5-version-change-leader-v1 | L5 Step2 组长导出 | L5 Step2 组员导入 → `importedVersionChangePackageJson` |

---

## 5. 课时领域摘要（字段级见 `domains/portfolio/types.ts`）

### 5.1 课时 3 · `Lesson3State`

| 字段 | 语义要点 |
|------|-----------|
| `missionAcknowledged` / `toolboxCompleted` / `toolboxWhyPreviewLocked` | 第 1~2 关边界与表述锁定 |
| `toolboxNoticeWhat` / `toolboxWhyOnPoster` | 第 2 关两句草稿（防抖写回） |
| `selectedMaterials` / `evidenceCards` | 第 3~4 关产出 |
| `personalPackageExported` / `completed` | 第 5 关导出与课时完成 |

兼容：`normalizeModulePortfolio`、`continue-package` 导入时对 `lesson3` 做缺字段合并。

### 5.2 课时 4 · `Lesson4State`（字段以 `domains/portfolio/types.ts` 为准）

| 字段 | 语义 | 主要写入步骤 |
|------|------|----------------|
| `memberPackagesImported` | 组长已导入成员整理包数量 | L4 Step1 |
| `groupMergeCompleted` | 小组合并完成 | L4 Step1 |
| `possibleCauses` | 可能的原因（谨慎表述） | L4 Step1 |
| `posterTitle` / `posterSubtitle` | 海报标题与副标题 | L4 Step1 |
| `skeletonExported` | 是否已导出骨架包 v1 | L4 Step1 |
| `skeletonImported` | 组员是否已导入骨架包 | L4 Step1 |
| `skeletonPackageJson` | 骨架包 JSON（组长导出/组员导入时写入） | L4 Step1 |
| `importedPackagesJson` | 组长侧已导入成员包数组 JSON，用于刷新恢复 | L4 Step1 |
| `personalDraftHtml` / `personalDraftCompleted` | 个人 HTML 草稿 | L4 Step2 |
| `productionPlan` / `planCompleted` | 制作方案单 | L4 Step3 |
| `groupWebpageV1` / `collabCompleted` | 小组网页 v1 与协作完成 | L4 Step4 |
| `finalHtml` / `verificationPassed` / `finalExported` | 最终 HTML 与校验导出 | L4 Step5 |
| `completed` | 课时 4 完成 | L4 Step5 |

**阶段快照**：`snapshot-html.ts` 中 `lesson4-full`；`GlobalActions` 在 `currentLessonId === 4` 时调用。

### 5.3 课时 5 · `Lesson5State`

| 字段 | 语义 | 主要写入步骤 |
|------|------|----------------|
| `feedbackDimensions` | 四维度判断 + 建议 | L5 Step1 |
| `priorityChange` | 本轮优先修改（单条） | L5 Step1 |
| `peerFeedbackImportedPackagesJson` | 组长已导入的组员意见包 JSON 数组字符串 | L5 Step1 |
| `feedbackExported` | 组员是否已导出意见包 | L5 Step1 |
| `feedbackCompleted` | 第 1 关完成 | L5 Step1 |
| `changeRecords` | 改动行；`item` 为海报五部分之一（枚举见 `lesson-5/config.ts`；旧存盘「可能的线索」会归一为「可能的原因」）；`reason` 为第 1 关闭环下拉值 | L5 Step2 |
| `versionChangeLeaderPackageExported` | 组长是否已导出改动汇总包；与 `completed` 实现「首次完成前须导出一次」 | L5 Step2 |
| `importedVersionChangePackageJson` | 组员已导入的组长汇总包全文 | L5 Step2 |
| `versionChangeMemberAcknowledged` | 组员已勾选核对 | L5 Step2 |
| `completed` | 课时 5 完成 | L5 Step2 |

**角色**：`student.role === "leader"|"member"`；第 1 关仅组员导出意见包；顶栏「小组」用 `getPortfolioGroupDisplayLabel`（`shared/utils/group-display.ts`）。

**Guard**（`lesson-5/guards.ts`）：Step1 需 `lesson4.completed`；Step2 需 `lesson5.feedbackCompleted`。

**跳转**：`lesson-4/steps/Step5UpgradeVerify.tsx` 完成后若课时 5 `enabled` → `/lesson/5/step/1`。

**快照**：`lesson5-full`；`GlobalActions` 中 `currentLessonId === 5`。

### 5.4 课时 6 · 预埋

- `domains/portfolio/types.ts`：`Lesson6State`、`RoadshowStep`、`createEmptyLesson6State()`，`ModulePortfolio.lesson6` 与 `normalize` / 新建档案已接入。
- `LESSON_REGISTRY`：`id: 6`，`enabled: false`，`totalSteps: 2`。
- 尚无 `src/lessons/lesson-6/` 与路由注册。

---

## 6. 教师演示模式与持久化约束

- **入口**：`HomePage.tsx` 底部「教师入口」；口令常量 `TEACHER_PASSWORD`（与 `enterTeacherMode()` 联动，实现以代码为准）。
- **行为**：`AppProvider` 中 `isTeacherMode === true` 时使用 `createDemoPortfolio()` 作为有效档案；Guard 在各路 `routes.tsx` 中与 `isTeacherMode` 组合判断；`savePortfolio` 在教师模式下仅更新内存中的演示档案；`importPortfolio` 在教师模式下仍为 no-op。
- **横幅工具**：`AppShell` 内 **组长|组员** 滑动样式切换（写回 `student.role` 后回首页）；**恢复演示数据** 调用 `applyTeacherDemoPreset("reset_full")` 并回首页；组员在 **课时4第1关**、**课时5第2关** 才显示 **导入前|导入后** 滑动条（`applyTeacherMemberImportDrill`，不跳转指针）。
- **进入教师模式**：`HomePage` 口令成功后 **`navigate("/")`** 留在首页。
- **首页课时卡片**：教师模式下已开放课时主按钮统一为 **「浏览本课」**（`HomePage.tsx`）。
- **持久化**：业务代码不直接访问 IndexedDB，统一经 `PortfolioRepository`（`portfolio.repository.idb.ts`）。

学生可见文案避免技术词：JSON、schema、IndexedDB、repository 等（见第 10 节）。

---

## 7. 命名规范

| 类别 | 规范 | 示例 |
|------|------|------|
| React 组件文件 | PascalCase | `AppShell.tsx` |
| 工具、仓库、序列化 | kebab-case | `continue-package.ts` |
| 目录 | kebab-case | `lesson-5/`、`material-processing-reference/` |
| 类型/接口 | PascalCase | `ModulePortfolio` |
| 常量 | UPPER_SNAKE_CASE | `LESSON_REGISTRY`（导出常量对象名可 PascalCase 与项目一致） |

---

## 8. 新增功能时的操作清单

### 8.1 新增某课时的某一关

1. `lessons/lesson-N/steps/StepX....tsx`
2. 更新 `lesson-N/config.ts`、`guards.ts`、`routes.tsx`
3. 若持久化字段变化：改 `domains/portfolio/types.ts` 及 `normalize` / `createEmpty`；必要时改 `continue-package.ts`
4. 更新 `app/lesson-registry.ts` 的 `totalSteps`（须与该课 `config` 步骤数一致）
5. 更新本文档

### 8.2 新增整课时

1. `lessons/lesson-N/` 目录（config / guards / routes / steps）
2. `app/router/index.tsx` 懒加载路由
3. `app/lesson-registry.ts`：`enabled`、`totalSteps`、标题
4. `domains/portfolio/types.ts`：`LessonNState` 与 `ModulePortfolio`
5. `continue-package.ts` / `snapshot-html.ts` 按需扩展
6. 更新本文档

### 8.3 新增 `shared/ui` 组件

仅依赖 Radix/Tailwind 与 `shared` 内工具；不得 import `domains` / `lessons`。

---

## 9. 产品发布号（SemVer）

- 以 **`package.json` 的 `version`** 为准（当前 **0.5.0**），与 Git 标签 `v0.5.0` 对应。
- **`ModulePortfolio.appVersion`** 表示数据包格式口径，与 npm 版本独立。

---

## 10. 重要约束（摘录）

- 页面与步骤组件不直接读写 IndexedDB。
- 课时业务逻辑不塞进 `shared/ui` 或 `app/layout` 的纯展示层（布局内可组合子组件并传参）。
- 教师模式下不得把演示档案写入 IndexedDB。

---

*最后更新：2026-04-15 — 教师模式：AppShell 组长/组员切换与组员演练预设（`teacher-demo-presets.ts`）；首页教师模式「浏览本课」；演示档案 `lesson2.completed` 与指针一致。*
