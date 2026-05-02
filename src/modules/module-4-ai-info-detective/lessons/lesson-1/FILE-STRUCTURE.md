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
│   ├── step1-pic1.jpg
│   └── step1-pic2.jpg
├── data/
│   ├── final-samples.ts
│   ├── anatomy-cards.ts
│   ├── source-types.ts
│   └── checklist.ts
├── components/
│   ├── FinalSampleCard.tsx
│   ├── FourPartCardDiagram.tsx
│   ├── BeforeAfterQuizDemo.tsx
│   ├── MissionChecklist.tsx
│   └── Lesson1StepLayout.tsx
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
- `data/final-samples.ts`：新闻类与图片类题卡样例。
- `data/anatomy-cards.ts`：四部分题目卡定义与 Step 3 结构拆解题。
- `data/source-types.ts`：四类来源要求。
- `data/checklist.ts`：Step 5 个人任务清单。
- `components/*.tsx`：课时 1 私有业务组件。
- `steps/*.tsx`：五个关卡页面。

## 更新规则

新增或修改 Step 时，必须同步更新 `config.ts`、`guards.ts`、`routes.tsx`、本文件和 `README.md`。
