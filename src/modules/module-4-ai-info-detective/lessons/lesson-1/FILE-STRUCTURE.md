<!--
文件说明：模块 4 课时 1 文件结构真相源。
职责：记录 lesson-1 的真实文件结构、职责边界、依赖方向和更新规则。
更新触发：新增、移动、删除 lesson-1 文件，或修改组件职责、data 文件、routes、guards 时，需要同步更新本文件。
-->

# FILE-STRUCTURE — Module 4 Lesson 1

## 当前结构

```text
lesson-1/
├── README.md
├── FILE-STRUCTURE.md
├── config.ts
├── guards.ts
├── routes.tsx
├── assets/
│   ├── image-ai-library-robot.svg
│   ├── news-screenshot-ai-reading.svg
│   ├── step1-pic1.jpg
│   ├── step1-pic2.jpg
│   ├── step2-news.png
│   └── step2-pic.jpg
├── data/
│   ├── anatomy-cards.ts
│   ├── checklist.ts
│   ├── final-samples.ts
│   ├── source-types.ts
│   └── step2-sample-cards.ts
├── components/
│   ├── BeforeAfterQuizDemo.tsx
│   ├── FinalSampleCard.tsx
│   ├── FourPartCardDiagram.tsx
│   ├── Lesson1ScreenLayout.tsx
│   ├── Lesson1StepLayout.tsx
│   ├── MissionChecklist.tsx
│   ├── QuestionCardShell.tsx
│   ├── SampleAnswerReveal.tsx
│   ├── SampleMaterialImage.tsx
│   ├── Step2IntroPanel.tsx
│   ├── Step2SampleStages.tsx
│   └── StructureLabelingTask.tsx
└── steps/
    ├── Step1MissionBrief.tsx
    ├── Step2SampleObservation.tsx
    ├── Step3CardAnatomy.tsx
    ├── Step4QuizFlowDemo.tsx
    └── Step5TaskChecklist.tsx
```

## 依赖方向

```text
steps/      → components / data / guards / domains / app / shared
components/ → data / domains / shared
data/       → domains
guards.ts   → domains
routes.tsx  → steps / guards / app / components / features / config
config.ts   → 无业务依赖
```

禁止：

```text
lesson-1 → module-3
lesson-1 → backend
lesson-1 → API client
shared   → lesson-1
```

## 文件职责

- `config.ts`：课时标题、Step 元数据和总步数。
- `guards.ts`：Step 进入条件、完成条件和当前可学习关卡。
- `routes.tsx`：课时 1 子路由、默认档案创建和非法访问提示。
- `data/final-samples.ts`：早期新闻类与图片类题卡样例数据，保留供旧组件参考。
- `data/anatomy-cards.ts`：四部分题目卡定义与 Step 3 结构拆解题。
- `data/source-types.ts`：四类来源要求。
- `data/checklist.ts`：Step 5 个人任务清单旧数据，当前出口任务以 `Step5TaskChecklist.tsx` 内结构化说明为准。
- `data/step2-sample-cards.ts`：Step 2 新闻类/图片类标准样例数据，包含判断选项、解析、来源核验入口和四部分结构标签。
- `components/QuestionCardShell.tsx` / `FinalSampleCard.tsx` / `FourPartCardDiagram.tsx` / `BeforeAfterQuizDemo.tsx`：早期题卡展示和答题前后演示组件，保留为结构参考；当前 Step 4 不再使用“答题前/答题后流程演示”作为主任务。
- `components/Step2SampleStages.tsx`：Step 2 分阶段样例观察组件，并由 Step 3 复用结构配对舞台。
- `components/Lesson1ScreenLayout.tsx`：第 1～2 关全屏滚动布局。
- `components/Lesson1StepLayout.tsx`：第 3～5 关标准 Step 布局。
- `steps/Step4QuizFlowDemo.tsx`：第 4 关完整题卡模板说明书，左侧四模块顺序导航，右侧展示作用、字段、要求和示例，底部单次总确认写入 `fullCardTemplateConfirmed`。
- `steps/Step5TaskChecklist.tsx`：第 5 关素材准备出口任务，填写候选素材计划、选择来源类型，并以「避免使用素材 | 出口确认」左右分栏 + 底部单次总勾选完成课时。
- `steps/*.tsx`：五个关卡页面。

## 更新规则

新增或修改 Step 时，必须同步更新 `config.ts`、`guards.ts`、`routes.tsx`、本文件和 `README.md`。
