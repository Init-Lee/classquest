<!--
文件说明：模块 4 AI 信息辨识员目录结构真相源。
职责：记录模块 4 前端真实结构、目录职责、依赖方向和后续新增规则。
更新触发：模块 4 新增课时、页面、领域类型、API adapter、feature、infra 或组件时，需要同步更新本文件。
-->

# FILE-STRUCTURE — Module 4 AI Information Detective

## 当前结构

```text
src/modules/module-4-ai-info-detective/
├── README.md
├── FILE-STRUCTURE.md
├── module.config.ts
├── routes.tsx
├── app/
│   ├── layout/
│   │   ├── Module4Shell.tsx
│   │   ├── Module4GlobalActions.tsx
│   │   └── Module4TopProgress.tsx
│   ├── providers/
│   │   └── Module4Provider.tsx
│   ├── lesson4-teacher-demo-presets.ts
│   └── lesson-registry.ts
├── constants/
│   └── demo-portfolio.ts
├── utils/
│   └── module4-teacher-mode-flag.ts
├── api/
│   ├── lesson3-ai-review.adapter.ts
│   ├── lesson4-peer-review.adapter.ts
│   ├── lesson4-review-moderation.adapter.ts
│   ├── lesson5-student.adapter.ts
│   ├── lesson5-types.ts
│   ├── lesson6-student.adapter.ts
│   ├── lesson6-public-challenge.adapter.ts
│   ├── lesson6-types.ts
│   ├── coerce-lesson4-review-request-json.ts
│   └── types.ts
├── domains/
│   ├── portfolio/
│   │   └── types.ts
│   └── question-card/
│       └── types.ts
├── infra/
│   └── persistence/
│       ├── indexeddb/
│       ├── repositories/
│       └── serializers/
├── features/
│   ├── progress-ui/
│   │   └── InnerStepProgress.tsx
│   └── public-challenge/
│       ├── README.md
│       ├── PublicChallengeShell.tsx
│       ├── PublicChallengeQuestionCard.tsx
│       ├── PublicChallengeResultPanel.tsx
│       ├── PublicChallengeProgress.tsx
│       ├── PublicChallengeNotReadyState.tsx
│       ├── PublicChallengeCompletePanel.tsx
│       └── public-challenge-storage.ts
├── lessons/
│   ├── lesson-1/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Lesson1ScreenLayout.tsx
│   │   │   ├── Lesson1StepLayout.tsx
│   │   │   ├── QuestionCardShell.tsx
│   │   │   ├── SampleAnswerReveal.tsx
│   │   │   ├── SampleMaterialImage.tsx
│   │   │   ├── Step2SampleStages.tsx
│   │   │   ├── Step2IntroPanel.tsx
│   │   │   └── StructureLabelingTask.tsx
│   │   ├── data/
│   │   ├── steps/
│   │   ├── config.ts
│   │   ├── guards.ts
│   │   ├── routes.tsx
│   │   └── types.ts
│   ├── lesson-2/
│   │   ├── README.md
│   │   ├── FILE-STRUCTURE.md
│   │   ├── components/
│   │   ├── data/
│   │   ├── steps/
│   │   ├── utils/
│   │   ├── config.ts
│   │   ├── guards.ts
│   │   └── routes.tsx
│   ├── lesson-3/
│   │   ├── README.md
│   │   ├── FILE-STRUCTURE.md
│   │   ├── components/
│   │   ├── data/
│   │   ├── steps/
│   │   ├── utils/
│   │   ├── config.ts
│   │   ├── guards.ts
│   │   └── routes.tsx
│   ├── lesson-4/
│       ├── README.md
│       ├── FILE-STRUCTURE.md
│       ├── components/
│       ├── data/
│       ├── steps/
│       ├── utils/
│       ├── config.ts
│       ├── guards.ts
│       └── routes.tsx
│   ├── lesson-5/
│   │   ├── README.md
│   │   ├── FILE-STRUCTURE.md
│   │   ├── components/
│   │   ├── steps/
│   │   ├── utils/
│   │   ├── config.ts
│   │   ├── guards.ts
│   │   ├── routes.tsx
│   │   └── types.ts
│   └── lesson-6/
│       ├── README.md
│       ├── FILE-STRUCTURE.md
│       ├── components/
│       ├── steps/
│       ├── utils/
│       ├── config.ts
│       ├── guards.ts
│       └── routes.tsx
└── pages/
    ├── Module4HomePage.tsx
    └── Module4PublicChallengePage.tsx
```

## 档案与学生字段

- `domains/portfolio/types.ts` 中 `Module4StudentProfile`：`studentName`、`clazz`、`classSeatCode`（存档仍为四位数字；首页建档为左侧班级序号 + 右侧学号后两位合成）。
- `domains/portfolio/types.ts` 中 `Module4Lesson6State`：保存 Step1 发布状态确认、Step2 公共挑战完成摘要、Step3 可信复盘、QuickCheck、`lesson6-stage-v1` 与完成态；`publicChallenge` 和快照不得保存 runId、答案、得分、正确率、排名、完整题卡 JSON、匿名 session id、访客数据或教师私密备注。
- `constants/class-options.ts`：班级下拉（初一（1）班～初一（12）班）。
- `utils/class-seat-code.ts`：`validateModule4SeatOnly` / `composeModule4ClassSeatFromSeat`（登记表单：左侧前缀 + 两位学号）；`validateModule4ClassSeatCode` 仍可用于完整四位字符串校验（导入包等）。
- 无档案且非教师模式：`lessons/lesson-1/routes.tsx` 将课时 1 重定向至 `/module/4`。

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

## 目录职责

- `app/`：模块 4 应用壳、Provider、教师讲解状态和课时注册表。
- `pages/`：路由级页面；`Module4HomePage.tsx` 承担建档、当前进度行动区与公共挑战可发现入口，无档案状态可提示有基础学生进入公共挑战，有进度状态只有课时五完成后才展示公共挑战入口；`Module4PublicChallengePage.tsx` 是 `/m4/challenge` 顶层匿名页，仅读取 query context 并渲染公共挑战 feature。
- `features/`：与模块可视规范对齐的可复用 UI（如课内步骤进度条、匿名公共挑战）；不反向依赖 `lessons/` 内部页面。`features/public-challenge/` 只负责公共挑战 UI 与匿名 run 本地缓存，不读写学生 portfolio。
- `lessons/`：六个课时的本地学习挑战；当前课时 1-4 已合入，课时 4 已覆盖 Step1 同伴互审、Step2 反馈收件箱、Step3 V2 修改台、Step4 V2 就绪报告与 ready 包；课时 5 已开放 Step1「提交 V2 到班级题池」、Step2「等待试答 + 紧凑题序 + 单题作答/揭示/快评」、Step3「本人题卡统计报告」与 Step4「V3 学习任务工作台 + completion-summary + 本地快照」；课时 6 已开放 Step1「我的 V3 发布状态」、Step2「公共题库 6 题挑战」与 Step3「可信复盘与项目结营」，提交后生成 `lesson6-stage-v1` 并写入完成态。
- `domains/`：题卡、提交包、试答轮次、评分、统计等纯领域类型。
- `api/`：mock/fixture adapter 与 HTTP adapter；课时 3 题卡自检助手通过 `lesson3-ai-review.adapter.ts` 默认 mock，并可用 `VITE_MODULE4_LESSON3_AI_REVIEW_MODE=http` 切到后端；课时 4 同伴互审通过 `lesson4-peer-review.adapter.ts` 默认 fixture，并可用 `VITE_MODULE4_LESSON4_PEER_REVIEW_MODE=http` 切到后端 B1~B7 全端点、recovery 与 SQLite relay（教师模式 `isModule4TeacherModeActive()` 强制 fixture）；课时 5 学生端通过 `lesson5-student.adapter.ts` 默认 fixture，可用 `VITE_MODULE4_LESSON5_MODE=http` 调用 `/api/v1/module4/lesson5/v2-submissions`、`active-session`、`participants/attach`、`sessions/{session_id}/state`、`assignments`、`assignments/{assignment_id}/answer`、`answers/{answer_id}/rating`、`sessions/{session_id}/my-report`、`v3-submissions` 与 `sessions/{session_id}/my-completion-summary`（教师模式强制 fixture，fixture 试答演示需 `VITE_MODULE4_LESSON5_FIXTURE_PHASE=trial_open`，报告与 V3 学习任务演示需 `analytics_open`）；课时 6 学生发布状态通过 `lesson6-student.adapter.ts` 默认 fixture，可用 `VITE_MODULE4_LESSON6_MODE=http` 调用 `/api/v1/module4/lesson6/my-v3-publication-status`；课时 6 公共挑战通过 `lesson6-public-challenge.adapter.ts` 默认 fixture，可用同一模式变量调用 `/api/v1/module4/public-challenge/runs`、`current`、`answers` 与 `summary`，并用匿名 session header 做 run 关联与限流；`lesson6-types.ts` 定义发布状态与公共挑战 DTO 子集；`lesson4-review-moderation.adapter.ts` 负责分卡/整体提交前文字审核，默认本地规则 mock，可设 `VITE_MODULE4_LESSON4_REVIEW_MODERATION_MODE=http` 或随 peer review HTTP 自动启用；`coerce-lesson4-review-request-json.ts` 规范化 claim 写入 portfolio 的题卡 JSON；`derive-lesson4-class-id.ts` 统一 create 与 inbox 的 `classId`；作者侧输入只收集目标同伴学号后两位；OSS 方案 B 另需 `VITE_API_BASE_URL`。
- `components/`：模块 4 私有 UI 组件。
- `infra/`：模块 4 本地持久化与序列化；`serializers/continue-package.ts` 负责继续学习包 JSON（课时 4/5/6 完成时进度段分别为 `课时4已完成`、`课时5已完成`、`课时6已完成`）；`serializers/snapshot-html.ts` 负责 `lesson1-full`～`lesson6-full` HTML 快照（课时 4 为 V2 入库准备摘要，文件名 `模块4_姓名_课时4V2入库准备快照_日期.html`；课时 5 为 V3 学习任务摘要，文件名 `模块4_姓名_课时5V3学习任务快照_日期.html`；课时 6 为可信复盘摘要，文件名 `模块4_姓名_课时6可信复盘快照_日期.html`）；课时 4 Step4 保存入库包时写入 `lesson4.stageSnapshot` JSON，课时 5 Step4 保存 `lesson5.stageSnapshot` JSON，课时 6 Step3 保存 `lesson6.stageSnapshot` JSON。课时 3 快照仍含 AI 自检助手记录段与 `aiReview.history`（上限 5 条简化轨迹）。
- `constants/`：教师讲解档案、班级选项等模块级常量。
- `lessons/lesson-3/utils/lesson2-snapshot-sync.ts`：课时 3 手动同步课时 2 最新素材快照的边界工具；只检测并同步素材/来源相关字段（素材图、素材指纹、素材短名、来源类型、来源记录、课时 2 疑点提示快照），不得覆盖题干、选项、参考答案、核心解析和核验观察指引；编辑器提示必须告知替换材料会让 AI 自检、自测试答与最终保存重新确认，并允许学生点击“不采纳”或关闭按钮忽略本次提醒；同步后必须让 AI 自检过期，并触发自测试答/最终确认重新完成。
- `lessons/lesson-1/components/Lesson1ScreenLayout.tsx`：课时 1 已验证的全屏滚动布局约定，负责 `scroll-snap`、固定关卡栏下方内容高度和每屏基础排版；当前用于第 1、2 关，后续若提升到模块级再迁入 `components/` 或 `features/`。
- `lessons/lesson-1/components/Lesson1StepLayout.tsx`：第 3～5 关等标准 Step 布局；支持 `titleClassName` 以便关卡标题使用与全屏首屏一致的 primary 强调与字距（如第 3 关）。
- `lessons/lesson-1/components/Step2SampleStages.tsx`：第 2 关新闻类/图片类样例的分阶段组件；第 2 关只负责观察判断与解析核验，第 3 关复用其中的 `Step2SampleStructureStage` 完成田字型四部分结构配对；教师讲解模式可允许未选答案时显示参考解析；`hideStageHeader` 可避免与外层层级标题重复；田字格侧栏不含「进入下一关」按钮，继续操作由各 Step 页面的 `Lesson1StepLayout` footer 承担；题目界面素材可放大，解析页缩略图不可放大；来源核验入口使用题卡数据里的公开原网页链接。
- `lessons/lesson-1/components/QuestionCardShell.tsx` 等旧 Step 2 组件：保留为 HTML 题卡结构参考；当前分阶段流程优先使用 `Step2SampleStages.tsx`。
- `lessons/lesson-1/components/Step2IntroPanel.tsx`：第 2 关首屏；顶栏蓝色关卡句与第 1 关首屏同为 `text-3xl/md:text-4xl`；左右两栏任务说明分行（列表）；无入口按钮；`introViewed` 由 `Step2SampleObservation` 在 `#step2-news` 进入视口时写入。
- `lessons/lesson-1/data/step2-sample-cards.ts`：Step 2 新闻类/图片类标准样例数据；素材从 `lessons/lesson-1/assets/step2-news.png` 与 `lessons/lesson-1/assets/step2-pic.jpg` 本地 import。
- `lessons/lesson-1/steps/Step3CardAnatomy.tsx`：第 3 关“四部分结构拆解”；承接第 2 关样例观察结果，用田字型结构配对确认四部分；教师讲解模式默认隐藏参考配对，可由教师按钮显示；页面主标题字号与 `Lesson1StepLayout` 默认一致（`text-2xl`），另加 `text-primary`、`tracking-[0.06em]`、`text-balance`；`·` 分隔。
- `lessons/lesson-1/steps/Step4QuizFlowDemo.tsx`：第 4 关“完整题卡长什么样？”；作为题卡说明书而非正式填写页，左侧为四模块顺序导航/状态卡，右侧展示当前模块的“作用、字段、要求、示例”，四模块看完后显示总检查清单（四项仅作回顾），在清单底部单次勾选总确认后写入 `fullCardTemplateConfirmed`。
- `lessons/lesson-1/steps/Step5TaskChecklist.tsx`：第 5 关“领取素材准备任务”；作为课时 1 出口任务单，要求学生填写新闻/图片候选素材包寻找方向、分别选择可能来源类型、阅读来源类型说明；底部以「避免使用素材 | 出口确认」左右分栏展示说明，**单次总勾选** `exitAndAvoidAcknowledged` 覆盖两栏；存档时仍将 `confirmed` 四项写为 true 以兼容旧逻辑；兼容旧 `newsSourcePlan` / `imageSourcePlan` 字段。
- `lessons/lesson-1/types.ts`：课时 1 尚在验证阶段的局部交互类型；稳定并跨课时复用后再上移到 `domains/`。Step 2/3 过程性记录字段（选择时间、提交时间、解析查看、素材放大次数、结构操作次数）和 Step 5 出口任务单结构化状态定义在 `domains/portfolio/types.ts`。
- `lessons/lesson-1/routes.tsx`：统一渲染课时标题 + 关卡进度条 sticky chrome，并写入 `--module4-lesson1-chrome-h` / `--module4-lesson1-content-h`，子页面不得重复测量这层高度。
- `lessons/lesson-2/`：课时 2「素材搜集与合规初筛」本地前端流程；内部结构详见 `lessons/lesson-2/FILE-STRUCTURE.md`。
- `lessons/lesson-2/components/CompressedMaterialUploader.tsx`：新闻截图和图片素材共用上传组件；上传后压缩为 DataURL 与元数据，不保留原始图片。
- `lessons/lesson-2/components/MaterialCriteriaRecheckCard.tsx`：第 3/4 关开头的四关标准个人素材复判卡片。
- `lessons/lesson-2/components/MaterialWorkbenchForm.tsx`：第 3/4 关共用素材工作台；包含来源记录格式检查、三项自检、初步疑点和交流记录。
- `lessons/lesson-2/utils/source-record-check.ts`：来源记录格式检查工具，只输出「来源记录格式通过」，不判断真实可信。
- `lessons/lesson-2/utils/evaluate-lesson2-quickcheck.ts`：根据素材完成情况和过程计数生成 T1/T2/T3。
- `lessons/lesson-3/`：课时 3「题目卡 V1 制作与解析填写」本地前端流程；从课时 2 新闻/图片素材复制快照，制作两张 V1 题卡，不反向修改课时 2。
- `lessons/lesson-3/components/QuestionCardEditorWorkbench.tsx`：**模块 4 私有**单屏编辑驾驶舱；左右各 50%（四 Tab 编辑 | 两行预览含结构完成度与 AI 自检）；第 2、3 步共用；禁止迁入 `shared/` 或跨模块 export。
- `lessons/lesson-3/components/QuestionCardLivePreview.tsx`：题卡完整实时预览（素材、任务、解析、来源核验）。
- `lessons/lesson-3/components/AiReviewPanel.tsx`：题卡自检助手面板；自检失败不阻断保存 V1。
- `lessons/lesson-3/utils/build-lesson3-draft.ts`：从课时 2 素材生成课时 3 快照草稿，增加 `assetFingerprint`，不比较整段 base64。
- `lessons/lesson-3/utils/lesson2-snapshot-sync.ts`：检测课时 2 与课时 3 快照差异，并在学生确认后手动同步素材/来源字段（见上文 `infra/` 同级条目说明）。
- `lessons/lesson-3/utils/evaluate-lesson3-quickcheck.ts`：根据两张 V1 题卡生成课时 3 QuickCheck。
- `lessons/lesson-4/`：课时 4「题目卡互审与 V2 入库准备」；Step1 同伴互审、Step2 反馈收件箱、Step3 V2 修改台、Step4 就绪报告已按课时内组件/工具拆分。Step4 的 QuickCheck 评分在 `utils/evaluate-lesson4-quick-check.ts`，阶段快照在 `utils/build-lesson4-stage-snapshot.ts`，第 5 课入库包在 `utils/build-lesson4-ready-package.ts`，UI 不内联评分/快照/包字段拼装；内部结构详见 `lessons/lesson-4/FILE-STRUCTURE.md`。
- `lessons/lesson-4/utils/evaluate-lesson4-gate.ts`：按 `outbound.completed && inbound.completed` 计算双条件 gate，不要求互审双方成对。
- `lessons/lesson-5/`：课时 5「网页试答与反馈优化」当前开放 Step1 提交 V2 到班级题池、Step2 等待/紧凑题序、单题作答、图片素材渲染、答案揭示和三维快评、Step3 本人题卡统计报告，以及 Step4 V3 学习任务工作台、本地 QuickCheck、`lesson5-stage-v1` 和 HTML 快照；路由 Guard 要求 `lesson4.readiness.exportedPackageJson` 存在且课时 4 已完成，Step3 与 Step4 都要求 `connectedSession.phase=analytics_open`；提交成功写入 `portfolio.lesson5.submissionSummary`，连接成功写入轻量 `connectedSession` 以便刷新后继续读取同一 assignments、my-report 和 completion-summary，作答/评分进度以服务端 state 为准。内部结构详见 `lessons/lesson-5/FILE-STRUCTURE.md`。
- `lessons/lesson-6/`：课时 6「题库发布与可信反思」学生端；路由 Guard 要求 `portfolio.lesson5.completed`，DEV/教师模式可跳过；Step1 从课时 5 revision 读取已提交 V3 的 `itemId + v3VersionId` 并保存发布状态确认，Step2 嵌入 `PublicChallengeShell context="lesson6_class"` 并只保存允许字段的完成摘要，Step3 填写可信复盘并通过 `utils/build-lesson6-stage-snapshot.ts` 生成 QuickCheck、`lesson6-stage-v1` 和完成态。内部结构详见 `lessons/lesson-6/FILE-STRUCTURE.md`。

## 依赖方向

```text
app      → pages / lessons / domains / infra / constants / features / shared
features → api / shared（公共挑战 UI 通过 adapter 访问后端，不直接 fetch）
pages    → app / domains / features / api / shared
lessons  → app / domains / infra / features / shared
infra    → domains
domains  → 不依赖 React
shared   → 不依赖模块 4
```

禁止模块 4 直接 import 模块 3 业务代码。

## API 规则

页面和组件不直接调用 `fetch`。真实接入前，优先使用模块 4 自己的 API adapter。

课时 1 当前不接 API，不创建 `api/` 目录。

公共挑战 adapter 统一读取 `VITE_MODULE4_LESSON6_MODE`：默认 `fixture`，设置为 `http` 时请求 `VITE_API_BASE_URL + /api/v1/module4/public-challenge`；同一开关也会让 `/teacher/*` 教师控制台进入 HTTP 模式，便于课时 6 发布审核验收读取真实登录、班级权限、审核队列与 overview。`features/public-challenge/public-challenge-storage.ts` 只保存匿名 session id 与当前 runId，adapter 可读取它生成匿名请求头；不得把学生姓名、班级、班学号或 portfolio 字段写入公共挑战请求。

课时 6 学生发布状态 adapter 同样读取 `VITE_MODULE4_LESSON6_MODE`：默认 `fixture`，设置为 `http` 时请求 `VITE_API_BASE_URL + /api/v1/module4/lesson6/my-v3-publication-status`；请求体只允许来自本地课时 5 V3 提交记录的 `kind/itemId/itemVersionId`。

## 更新规则

新增课时、feature、domain 文件、API adapter 或主要组件组时，必须更新本文件。

新增公共挑战相关 UI 时放入 `features/public-challenge/`，新增 endpoint 字段先更新 `api/lesson6-types.ts` 与 adapter，再同步 feature README；如果新增公开顶层路由，必须同时更新 `src/platform/README.md` 与 `src/platform/FILE-STRUCTURE.md`。

