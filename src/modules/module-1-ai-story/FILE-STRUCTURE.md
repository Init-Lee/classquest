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
│   ├── literary-cases.ts
│   ├── lesson2-copy.ts
│   ├── lesson3-copy.ts
│   ├── story-options.ts
│   ├── story-options.regression.test.ts
│   ├── teacher-passphrase.ts
│   └── teacher-passphrase.regression.test.ts
├── domains/portfolio/
│   ├── types.ts
│   ├── lesson2-update.ts
│   ├── lesson3-update.ts
│   └── lesson3-update.regression.test.ts
├── features/
│   ├── global-actions/
│   │   ├── Module1GlobalActions.tsx
│   │   ├── Module1LessonSnapshotDownloadButton.tsx
│   │   ├── module1-global-actions-state.ts
│   │   ├── module1-global-actions-state.regression.test.ts
│   │   ├── module1-lesson-snapshot-entry.ts
│   │   └── module1-lesson-snapshot-entry.regression.test.ts
│   ├── progress-ui/
│   │   ├── InnerStepProgress.tsx
│   │   ├── inner-step-progress-state.ts
│   │   └── progress-ui.regression.test.ts
│   ├── lesson2-support/
│   │   ├── ClassroomExampleDialog.tsx
│   │   ├── CopyPromptControl.tsx
│   │   └── copy-text.ts
│   └── lesson3-support/
│       └── EditableCopyPromptControl.tsx
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
├── lessons/lesson-3/
│   ├── components/
│   │   ├── Lesson3AiReplyField.tsx
│   │   ├── Lesson3OptionalImage.tsx
│   │   ├── Lesson3ReviewBanner.tsx
│   │   └── Lesson3WritingSummary.tsx
│   ├── config.ts
│   ├── guards.ts
│   ├── routes.tsx
│   ├── steps/
│   └── utils/
│       ├── build-lesson3-prompts.ts
│       ├── build-lesson3-prompts.regression.test.ts
│       └── build-lesson3-writing-summary.ts
├── lessons/lesson-2/
│   ├── components/
│   │   ├── Lesson2LegacyNotice.tsx
│   │   ├── Lesson2ReviewBanner.tsx
│   │   ├── Lesson2WritingDrawer.tsx
│   │   ├── Lesson2WritingSummary.tsx
│   │   ├── LiteraryCaseDetailDialog.tsx
│   │   ├── LiteraryCasePanel.tsx
│   │   └── LiteraryCasePreviewCard.tsx
│   ├── config.ts
│   ├── guards.ts
│   ├── routes.tsx
│   ├── steps/
│   └── utils/
│       ├── build-lesson2-prompts.ts
│       ├── build-lesson2-writing-summary.ts
│       └── step2-round.ts
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
- `constants/demo-portfolio.ts` 提供课堂演示档案，预填课时 1、课时 2 与课时 3；`constants/teacher-passphrase.ts` 只做授课入口校验。
- `Module1TopProgress` 负责六课时模块级导航；无档案时课时 1 只回模块首页，状态计算留在纯函数文件中。课时 1 完成后课时 2 可点，课时 2 完成后课时 3 可点，课时 4—6 仍锁定。
- `features/progress-ui` 是模块 1 内部可复用的课时 Step 进度能力；各课时传入 Guard 派生的完成、可访问与锁定集合，不得跨模块引用。
- `features/lesson2-support` 提供课堂虚构示例弹层与外部 AI 提示词复制控件；只生成并复制提示词，不得暗示站内调用模型。
- `features/lesson3-support` 提供课时 3 可编辑提示词复制控件；复制成功后记录基础过程，不暗示站内调用模型。
- `features/global-actions` 在模块 1 内复刻模块 3/4 顶栏视觉与文案；学生模式为保存进度 / 导入进度 / 重置，顶栏不再提供阶段快照。教师模式仅在课时 1/2/3 页保留当前课快照，供投影使用。首页已开放课卡提供「下载本课阶段快照（交作业用）」；该课 `completed` 才可点，未完成已解锁则禁用并旁注「完成本课后可下载」，待开发/未解锁不出现按钮。身份卡不再提供「只下最新已完成课」的快照。课时 1/2/3 完成弹窗再提供一次本课快照。可用性规则放在纯函数中，导出统一走 `downloadModule1SnapshotByLessonId`。
- `infra/persistence/serializers/snapshot-html.ts` 按课时号生成不可导入的课时 1 主题设定、课时 2 风格与人物或课时 3 开头 HTML；课时 3 快照转义展示外部 AI 过程。首页课卡、完成弹窗和教师顶栏共用 `downloadModule1SnapshotByLessonId`。导入器必须拒绝 HTML/非继续学习包。
- 课时 1 的 `utils/build-lesson1-theme-outline.ts` 是五字段到结构化大纲、主题核心和 Step 4 复制 payload 的唯一派生入口；主复制文本是 `themeCore` 完整句子。组件只负责展示和复制反馈，大纲不进入档案。
- 课时 2 的 `utils/build-lesson2-writing-summary.ts` 是已确认写作设定汇总的唯一派生入口；`utils/build-lesson2-prompts.ts` 拼装 P1—P4 外部提示词。汇总与提示词都不进入档案。
- 课时 2 第 2 关路由仍是 `/module/1/lesson/2/step/2`，关内用 `?round=1|2` 分成两步：第一步选参照（课堂案例或自己的作品，选定后桌面左 1/3 为课堂选用或第一轮找参照、右 2/3 为填写框，课堂选用与第一轮找候选都留在第一步），第二步只做拆解写法与第二轮提示词。左右箭头贴主内容区两侧，只在本关两步间翻页；第一步左箭头禁用、右箭头进入第二轮，第二步不渲染右箭头，改用右下角「下一关」并按整关必填校验后进入课时 2 第 3 关。`utils/step2-round.ts` 负责子页解析、第一步门禁与整关缺项提示。未选定参照时直连 `?round=2` 拦回。`round1PromptCopied` / `round2PromptCopied` 与第 1 关 `study.aiAssistUsed` 分开，旧包缺字段视为 false。课堂案例与自选作品分槽存放（`classroomDraft` / `foundDraft`），切换来源只改 `origin`、不互相覆盖；完成判定、第二步摘要、阶段快照和写作设定抽屉只读当前 origin 槽。
- 第 2 关右侧写作设定改为 `Lesson2WritingDrawer`：默认收起，点右侧标签滑出只读汇总，开合不落盘。第 3/4 关桌面左主区 2/3、右栏固定写作设定 1/3（不是抽屉），窄屏上下堆叠。
- 聚合根固定显式包含 `lesson1` 至 `lesson6`，不持久化完整小说副本。课时 2 使用 `Module1Lesson2State`：新字段承载文学参照与人物五项，旧风格卡字段保留兼容；旧学习包归档到 `legacyLesson2`，缺新字段时安全空态，不丢课时 1 数据。课时 3 使用 `Module1Lesson3State`：初稿与确认稿分存，`draftFrozenText` 冻结首次确认初稿；`aiProcess` 记录各条提示词的基础过程，不复用课时 2 的 `reasonAiAssistUsed` 等字段。旧包缺课时 3 新字段时补空，不丢课时 1/2。
- 学习包先校验、归一化和修复指针，再经确认原子替换。课时 1 完成后指针停在课时 2 对应关；课时 2 完成后指针指向课时 3；课时 3 完成后指针指向课时 4，但课时 4 路由仍未开放。
- 课时 3 的 `utils/build-lesson3-prompts.ts` 拼装 P1—P5；`utils/build-lesson3-writing-summary.ts` 派生右栏摘要。提示词可编辑后复制；无 AI 可通关，一旦复制成功则须贴回回复。题目必填；字数 200—300 只作引导。案例配图若存在则挂 `public/module-1/lesson-3/`，缺图不阻塞通关。
- 新增课时应自带 `config.ts`、`guards.ts`、`routes.tsx` 和 `steps/`，并同步注册表与本文。
- `/module/1/story` 属于模块结果视图，不进入课时注册表。
- 课时 1 第 2 关左侧填写区提供「查看 SDG 介绍资料」入口，用新窗口打开仓库根 `public/module-1/sdg-intro.html`（站点路径 `/module-1/sdg-intro.html`）；该页是自有支架资料，不 iframe 嵌进课时。
- 课时 2 第 1 关默认用三张预览卡展示课堂文学案例，点击卡片打开 Dialog 阅读全文；只有「选择这个片段」写入 `study.caseId`。详情 Dialog 为横向图文：左栏页签切换原文 / 讲解 / 出处，右栏窄配图，窄屏改为上下堆叠。插图位于 `public/module-1/literary-cases/`（站点路径 `/module-1/literary-cases/*.jpg`），不 iframe 嵌进课时。旧风格写作模板页已删除。`study.aiAssistUsed` 仅在成功复制第 1 关外部提示词后为 true，打开案例 Dialog 不算选用 AI；旧包缺字段视为 false。点过复制后 `study.aiReply` 才必填，未点复制仍可只交观察完成第 1 关与课时 2。
- 课时 2 第 3 关拆成「先自己写选择理由」与「需要时再用外部 AI」两卡。`reasonAiAssistUsed` 仅在成功复制第 3 关提示词后为 true，与 `study.aiAssistUsed` / `round1PromptCopied` / `round2PromptCopied` 分开；旧包缺字段视为 false。点过复制后 `reasonAiReply` 才必填，未点复制仍可只交自己的理由完成第 3 关与课时 2。
- 课时 2 第 4 关拆成「先自己写人物设定」与「需要时再用外部 AI」两卡，桌面右栏 1/3 固定写作设定。`characterAiAssistUsed` 仅在成功复制第 4 关提示词后为 true，与 `study.aiAssistUsed` / `round1PromptCopied` / `round2PromptCopied` / `reasonAiAssistUsed` 分开；旧包缺字段视为 false。点过复制后 `characterAiReply` 才必填，未点复制仍可只交人物五项完成第 4 关与课时 2。
