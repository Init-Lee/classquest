<!--
文件说明：模块 4 课时 5 前端目录结构真相源。
职责：记录 lesson-5 目录职责、Step1 提交流、Step2 试答/揭示/快评、Step3 本人报告、Step4 V3 学习任务/快照文件分层、依赖方向和新增步骤规则。
更新触发：课时 5 新增/移动组件、步骤、工具、adapter 契约或依赖方向变化时，需要同步更新本文件。
-->

# FILE-STRUCTURE — lesson-5

## 当前结构

```text
lesson-5/
├── README.md
├── FILE-STRUCTURE.md
├── config.ts
├── guards.ts
├── routes.tsx
├── types.ts
├── components/
│   ├── Lesson5StepLayout.tsx
│   ├── V2SubmissionPanel.tsx
│   ├── SessionWaitingPanel.tsx
│   ├── AssignmentList.tsx
│   ├── TrialQuestionCard.tsx
│   ├── AnswerRevealPanel.tsx
│   ├── RatingPanel.tsx
│   ├── MyItemStatsCard.tsx
│   └── DiagnosisHintPanel.tsx
├── steps/
│   ├── Step1SubmitV2AndConnect.tsx
│   ├── Step2TrialAndRating.tsx
│   ├── Step3MyItemReport.tsx
│   └── Step4V3RevisionAndSnapshot.tsx
└── utils/
    ├── build-lesson5-stage-snapshot.ts
    ├── build-lesson5-v2-submission-payload.ts
    ├── build-lesson5-v3-submission-payload.ts
    ├── evaluate-lesson5-quick-check.ts
    ├── get-lesson5-current-step.ts
    ├── lesson5-client-id.ts
    └── validate-lesson5-v3-submission.ts
```

## 职责

- `routes.tsx`：课时 5 子路由、Guard、课内进度条。
- `guards.ts`：Step1/Step2 进入条件要求课时 4 ready 包存在；Step3 与 Step4 额外要求本地 `connectedSession.phase=analytics_open`；Step1 完成状态由 `submissionSummary` 判定，Step4 完成证据来自 `revision`/`stageSnapshot`。
- `steps/Step1SubmitV2AndConnect.tsx`：读取 ready 包、触发 V2 提交、查询 active session、attach participant，并保存 `portfolio.lesson5` 的提交摘要与轻量 session 状态。
- `steps/Step2TrialAndRating.tsx`：读取或恢复 `connectedSession`，刷新 session state，读取 assignment list；课堂标题框内展示 session title、进度条、状态 badge、刷新按钮、短错误/恢复提示与紧凑题序 grid，主内容区只保留等待/答题/完成互斥状态；在 `trial_open` 下按服务端 state 顺序提交 answer、展示 reveal、提交 rating，`pool_locked` 维持等待，`trial_locked` 只读提示，`analytics_open` 引导进入 Step3。
- `steps/Step3MyItemReport.tsx`：在 `analytics_open` 后读取 my-report，展示本人 news/image 题卡统计与诊断提示，并保存 `portfolio.lesson5.myReport`；如果尚未保存 connectedSession，会基于 Step1 submissionSummary 重新查询 active session 并 attach。
- `steps/Step4V3RevisionAndSnapshot.tsx`：在 `analytics_open` 后复用课时 4 `V2RevisionSectionEditor` 做 V3 学习任务工作台，按 news/image 填写 `revisionPlan`、提交 V3、读取 completion-summary，并保存 `portfolio.lesson5.revision`、`quickCheck`、`stageSnapshot` 与 `myReport`。
- `components/`：Step 页面布局、V2 提交流 UI、session 等待面板、assignment 紧凑题序 grid、试答题卡、答案揭示面板、三维快评面板、本人题卡统计卡片与诊断提示面板；`AssignmentList` 不自带 Card/标题，嵌入 Step2 课堂标题框；`TrialQuestionCard` 负责渲染 `material.asset.dataUrl` 图片素材、点击放大 Dialog 与缺图占位；`AnswerRevealPanel` 只消费 answer 响应中的正解、解析、摘要、逐选项解答和来源，并把字符串或结构化来源对象统一转成中文来源信息块；`MyItemStatsCard` 使用零依赖 CSS 条形展示 C6 指标。
- `utils/`：`g7cXX` classId 派生、V2/V3 提交 payload 构建、V3 提交校验、completion-summary QuickCheck 评估、lesson5 stageSnapshot 构建、lesson5ClientId 生成。
- `types.ts`：页面层窄化类型，不承载后端响应类型；学生端后端契约在 `api/lesson5-types.ts`。

## 依赖方向

```text
routes → guards / steps / components / features / app provider
steps  → components / utils / api / domains / app provider
utils  → domains / api types
components → shared ui / lesson-5 types
```

`lesson-5/` 不直接 import 后端代码，不反向依赖 `teacher-console`。answer/rating/my-report/V3/completion-summary 必须继续通过 `api/lesson5-student.adapter.ts` 扩展 endpoint；刷新恢复以服务端 state、assignment list、my-report 与 completion-summary 为准，若后端不返回已答详情，前端不得伪造 answer/reveal。fixture 报告和 V3 学习任务可使用本地 runtime / fixture-v3 聚合与最小可信 mock，但需明确它只服务本地演示，不替代 HTTP 统计真相。
