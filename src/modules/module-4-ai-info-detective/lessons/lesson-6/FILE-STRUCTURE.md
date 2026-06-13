<!--
文件说明：模块 4 课时 6 学生端目录结构真相源。
职责：记录课时 6 学生端目录职责、依赖方向、隐私边界和新增规则。
更新触发：课时 6 新增步骤、组件、utils、阶段快照、完成判定或文件移动时，需要同步更新本文件。
-->

# FILE-STRUCTURE — Lesson 6

## 当前结构

```text
lessons/lesson-6/
├── README.md
├── FILE-STRUCTURE.md
├── config.ts
├── guards.ts
├── routes.tsx
├── components/
│   └── Lesson6StepLayout.tsx
├── steps/
│   ├── Step1PublicationStatus.tsx
│   ├── Step2PublicChallengeEmbedded.tsx
│   └── Step3ReflectionAndSnapshot.tsx
└── utils/
    └── build-lesson6-stage-snapshot.ts
```

## 目录职责

- `config.ts`：定义课时 6 三步静态配置。
- `guards.ts`：要求先完成 `portfolio.lesson5.completed`；Step2 依赖 `step1AckAt`，Step3 依赖公共挑战完成摘要；完成步骤按 `portfolio.lesson6.completed`、Step2 证据和 Step1 确认计算。
- `routes.tsx`：挂载 `step/1`、`step/2`、`step/3`，统一渲染课时标题与进度条。
- `components/Lesson6StepLayout.tsx`：课时内标准页面容器与锁定提示。
- `steps/Step1PublicationStatus.tsx`：读取课时 5 本地 V3 item/version，查询并保存发布状态。
- `steps/Step2PublicChallengeEmbedded.tsx`：嵌入公共挑战并保存允许字段的完成摘要。
- `steps/Step3ReflectionAndSnapshot.tsx`：填写 3 条可信发布原则与发布责任说明，生成 QuickCheck、`lesson6-stage-v1` 和课时 6 完成态。
- `utils/build-lesson6-stage-snapshot.ts`：纯函数构建 QuickCheck 与阶段快照；快照只输出白名单字段。

## 依赖方向

```text
routes/steps -> app / api / domains / features / shared
components -> shared
utils -> domains
guards -> domains
```

`features/public-challenge/` 不反向依赖 `lessons/lesson-6/`，公共挑战 UI 不直接读写 portfolio。

## 隐私与新增规则

- `portfolio.lesson6.publicChallenge` 与 `lesson6-stage-v1` 不得保存 runId、答案、正确答案、得分、正确率、排名、完整题卡 JSON、匿名 session id、访客数据或教师私密备注。
- `build-lesson6-stage-snapshot.ts` 是阶段快照白名单入口；新增导出字段必须先更新 `domains/portfolio/types.ts`，再同步本文件、课时 README、模块 README/FILE-STRUCTURE。
- standalone `/m4/challenge` 保持匿名公共页，不依赖课时 6 Step3 或 portfolio。
