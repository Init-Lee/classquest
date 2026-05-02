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
│   ├── lesson-registry.ts
│   └── teacher-demo-presets.ts
├── constants/
│   └── demo-portfolio.ts
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
│   └── lesson-1/
│       ├── assets/
│       ├── components/
│       │   ├── Lesson1ScreenLayout.tsx
│       │   ├── Lesson1StepLayout.tsx
│       │   ├── QuestionCardShell.tsx
│       │   ├── SampleAnswerReveal.tsx
│       │   ├── SampleMaterialImage.tsx
│       │   ├── Step2SampleStages.tsx
│       │   ├── Step2IntroPanel.tsx
│       │   └── StructureLabelingTask.tsx
│       ├── data/
│       ├── steps/
│       ├── config.ts
│       ├── guards.ts
│       ├── routes.tsx
│       └── types.ts
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

- `app/`：模块 4 应用壳、Provider、教师演示预设和课时注册表。
- `pages/`：路由级页面。
- `features/`：与模块可视规范对齐的可复用 UI（如课内步骤进度条）；不反向依赖 `lessons/` 内部页面。
- `lessons/`：六个课时的本地学习挑战。
- `domains/`：题卡、提交包、试答轮次、评分、统计等纯领域类型。
- `api/`：mock adapter 与 HTTP adapter。
- `components/`：模块 4 私有 UI 组件。
- `infra/`：模块 4 本地持久化与序列化；`serializers/continue-package.ts` 负责继续学习包 JSON（文件名为 `模块4_姓名_当前进度_日期.json`），`serializers/snapshot-html.ts` 负责阶段快照 HTML（按第 1～5 关顺序组织并内置提交用样式）。
- `constants/`：演示档案等模块级常量。
- `lessons/lesson-1/components/Lesson1ScreenLayout.tsx`：课时 1 已验证的全屏滚动布局约定，负责 `scroll-snap`、固定关卡栏下方内容高度和每屏基础排版；当前用于第 1、2 关，后续若提升到模块级再迁入 `components/` 或 `features/`。
- `lessons/lesson-1/components/Lesson1StepLayout.tsx`：第 3～5 关等标准 Step 布局；支持 `titleClassName` 以便关卡标题使用与全屏首屏一致的 primary 强调与字距（如第 3 关）。
- `lessons/lesson-1/components/Step2SampleStages.tsx`：第 2 关新闻类/图片类样例的分阶段组件；第 2 关只负责观察判断与解析核验，第 3 关复用其中的 `Step2SampleStructureStage` 完成田字型四部分结构配对；`hideStageHeader` 可避免与外层层级标题重复；田字格侧栏不含「进入下一关」按钮，继续操作由各 Step 页面的 `Lesson1StepLayout` footer 承担；题目界面素材可放大，解析页缩略图不可放大；来源核验入口使用题卡数据里的公开原网页链接。
- `lessons/lesson-1/components/QuestionCardShell.tsx` 等旧 Step 2 组件：保留为 HTML 题卡结构参考；当前分阶段流程优先使用 `Step2SampleStages.tsx`。
- `lessons/lesson-1/components/Step2IntroPanel.tsx`：第 2 关首屏；顶栏蓝色关卡句与第 1 关首屏同为 `text-3xl/md:text-4xl`；左右两栏任务说明分行（列表）；无入口按钮；`introViewed` 由 `Step2SampleObservation` 在 `#step2-news` 进入视口时写入。
- `lessons/lesson-1/data/step2-sample-cards.ts`：Step 2 新闻类/图片类标准样例数据；素材从 `lessons/lesson-1/assets/step2-news.png` 与 `lessons/lesson-1/assets/step2-pic.jpg` 本地 import。
- `lessons/lesson-1/steps/Step3CardAnatomy.tsx`：第 3 关“四部分结构拆解”；承接第 2 关样例观察结果，用田字型结构配对确认四部分；页面主标题字号与 `Lesson1StepLayout` 默认一致（`text-2xl`），另加 `text-primary`、`tracking-[0.06em]`、`text-balance`；`·` 分隔。
- `lessons/lesson-1/steps/Step4QuizFlowDemo.tsx`：第 4 关“完整题卡长什么样？”；作为题卡说明书而非正式填写页，左侧为四模块顺序导航/状态卡，右侧展示当前模块的“作用、字段、要求、示例”，四模块看完后显示总检查清单（四项仅作回顾），在清单底部单次勾选总确认后写入 `fullCardTemplateConfirmed`。
- `lessons/lesson-1/steps/Step5TaskChecklist.tsx`：第 5 关“领取素材准备任务”；作为课时 1 出口任务单，要求学生填写新闻/图片候选素材包寻找方向、分别选择可能来源类型、阅读来源类型说明；底部以「避免使用素材 | 出口确认」左右分栏展示说明，**单次总勾选** `exitAndAvoidAcknowledged` 覆盖两栏；存档时仍将 `confirmed` 四项写为 true 以兼容旧逻辑；兼容旧 `newsSourcePlan` / `imageSourcePlan` 字段。
- `lessons/lesson-1/types.ts`：课时 1 尚在验证阶段的局部交互类型；稳定并跨课时复用后再上移到 `domains/`。Step 2/3 过程性记录字段（选择时间、提交时间、解析查看、素材放大次数、结构操作次数）和 Step 5 出口任务单结构化状态定义在 `domains/portfolio/types.ts`。
- `lessons/lesson-1/routes.tsx`：统一渲染课时标题 + 关卡进度条 sticky chrome，并写入 `--module4-lesson1-chrome-h` / `--module4-lesson1-content-h`，子页面不得重复测量这层高度。

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

