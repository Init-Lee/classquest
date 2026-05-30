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
│   └── progress-ui/
│       └── InnerStepProgress.tsx
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
│   └── lesson-4/
│       ├── README.md
│       ├── FILE-STRUCTURE.md
│       ├── components/
│       ├── data/
│       ├── steps/
│       ├── utils/
│       ├── config.ts
│       ├── guards.ts
│       └── routes.tsx
└── pages/
    └── Module4HomePage.tsx
```

## 档案与学生字段

- `domains/portfolio/types.ts` 中 `Module4StudentProfile`：`studentName`、`clazz`、`classSeatCode`（存档仍为四位数字；首页建档为左侧班级序号 + 右侧学号后两位合成）。
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
- `pages/`：路由级页面。
- `features/`：与模块可视规范对齐的可复用 UI（如课内步骤进度条）；不反向依赖 `lessons/` 内部页面。
- `lessons/`：六个课时的本地学习挑战；当前课时 1-3 已合入，课时 4 第 1 关 Step1 全链路已合入，课时 4 Step2-4 与课时 5-6 后续按独立分支/阶段推进。
- `domains/`：题卡、提交包、试答轮次、评分、统计等纯领域类型。
- `api/`：mock/fixture adapter 与 HTTP adapter；课时 3 题卡自检助手通过 `lesson3-ai-review.adapter.ts` 默认 mock，并可用 `VITE_MODULE4_LESSON3_AI_REVIEW_MODE=http` 切到后端；课时 4 同伴互审通过 `lesson4-peer-review.adapter.ts` 默认 fixture，并可用 `VITE_MODULE4_LESSON4_PEER_REVIEW_MODE=http` 切到后端 B1~B7 全端点（教师模式 `isModule4TeacherModeActive()` 强制 fixture）；`lesson4-review-moderation.adapter.ts` 负责分卡/整体提交前文字审核，默认本地规则 mock，可设 `VITE_MODULE4_LESSON4_REVIEW_MODERATION_MODE=http` 或随 peer review HTTP 自动启用；`coerce-lesson4-review-request-json.ts` 规范化 claim 写入 portfolio 的题卡 JSON；`derive-lesson4-class-id.ts` 统一 create 与 inbox 的 `classId`；作者侧输入只收集目标同伴学号后两位；OSS 方案 B 另需 `VITE_API_BASE_URL`。
- `components/`：模块 4 私有 UI 组件。
- `infra/`：模块 4 本地持久化与序列化；`serializers/continue-package.ts` 负责继续学习包 JSON（文件名为 `模块4_姓名_当前进度_日期.json`，课时 2 中会显示 `课时2第N关` 或 `课时2已完成`，课时 3 中会显示 `课时3第N步` 或 `课时3已完成`，课时 4 中会显示 `课时4第N关` 或 `课时4第1关已完成`），`serializers/snapshot-html.ts` 负责 `lesson1-full`、`lesson2-full` 与 `lesson3-full` 阶段快照 HTML；课时 3 快照下载文件名为 `模块4_姓名_课时3题卡V1快照_日期.html`，每张题卡下方追加“AI 自检助手记录”段（整体结果、成功调用次数、最近自检时间、是否过期、必填缺失、四板块 ✅/❌ 表、前 3 条建议与最近 5 次成功调用轨迹简表）。课时 3 题卡 `aiReview` 现包含 `history: Module4Lesson3AiReviewHistoryEntry[]`（上限 `LESSON3_AI_REVIEW_HISTORY_LIMIT=5`，仅存 `requestId / reviewedAt / status / tier / 四板块 level / 建议条数` 的简化项）；`metrics.aiReviewRequestCount` 仅在“成功完成且 `requestId` 与上次不同”时 +1，失败请求不写入计数与 history。后端不持久化任何 AI 调用记录。
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
- `lessons/lesson-4/`：课时 4「题目卡互审与 V2 入库准备」；当前只开放第 1 关同伴互审中转站（B1~B7 HTTP 联调 + IndexedDB 双存储），Step2-4 由 `routes.tsx` 渲染锁定占位；作者侧送审只输入同班目标学号后两位并派生完整 4 位码；内部结构详见 `lessons/lesson-4/FILE-STRUCTURE.md`。
- `lessons/lesson-4/utils/evaluate-lesson4-gate.ts`：按 `outbound.completed && inbound.completed` 计算双条件 gate，不要求互审双方成对。

## 依赖方向

```text
app      → pages / lessons / domains / infra / constants / features / shared
features → shared（工具类样式组件）
pages    → app / domains / shared
lessons  → app / domains / infra / features / shared
infra    → domains
domains  → 不依赖 React
shared   → 不依赖模块 4
```

禁止模块 4 直接 import 模块 3 业务代码。

## API 规则

页面和组件不直接调用 `fetch`。真实接入前，优先使用模块 4 自己的 API adapter。

课时 1 当前不接 API，不创建 `api/` 目录。

## 更新规则

新增课时、feature、domain 文件、API adapter 或主要组件组时，必须更新本文件。

