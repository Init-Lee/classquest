<!--
文件说明：模块 4 课时 6 学生端说明。
职责：说明课时 6 学生端三步流、隐私边界、运行模式、QuickCheck 与阶段快照。
更新触发：课时 6 学生端步骤、发布状态查询、公共挑战嵌入、阶段快照或完成判定变化时，需要同步更新本文件。
-->

# Lesson 6 — 题库发布与可信反思

课时 6 承接课时 5 Step4 的 V3 提交结果，学生端完整三步流为：

```text
1. 查看自己的 V3 发布状态
2. 完成一轮 lesson6_class 公共题库 6 题挑战
3. 可信复盘与 lesson6-stage-v1 快照
```

## 已实现流程

- `Step1PublicationStatus.tsx` 从 `portfolio.lesson5.revision.cards` 提取已提交 V3 的 `itemId + v3VersionId`，调用 `my-v3-publication-status` 查询发布状态。
- `Step2PublicChallengeEmbedded.tsx` 嵌入 `PublicChallengeShell context="lesson6_class"`，完成后只保存公共挑战摘要。
- `Step3ReflectionAndSnapshot.tsx` 要求填写 3 条「原则 / 理由 / 场景 / 操作」与发布责任说明，提交后写入 `portfolio.lesson6.completed=true`、`completedAt`、QuickCheck 和 `lesson6-stage-v1`。
- `utils/build-lesson6-stage-snapshot.ts` 集中生成 QuickCheck 与阶段快照，避免 UI 内联拼装隐私敏感字段。
- `lesson6-student.adapter.ts` 使用 `VITE_MODULE4_LESSON6_MODE=fixture|http`，HTTP 模式调用 `/api/v1/module4/lesson6/my-v3-publication-status`。
- `portfolio.lesson6` 记录 Step1 确认、发布状态摘要、公共挑战完成摘要、可信复盘、QuickCheck、阶段快照与完成态。

## 隐私边界

`portfolio.lesson6.publicChallenge` 只保存：

```text
context
questionCount
answeredCount
completedAt
completed
```

`lesson6-stage-v1` 只保存发布状态摘要、挑战完成证明（`context/questionCount/answeredCount/completedAt`）、可信复盘文本、QuickCheck 与完成时间。

不得保存公共挑战 `runId`、学生答案、正确答案、得分、正确率、排名、完整题卡 JSON、匿名 session id、访客数据、教师私密备注或他人题卡详情。

## 完成与导出

- Guard：课时 6 仍要求先完成 `portfolio.lesson5.completed`；Step2 依赖 `step1AckAt`，Step3 依赖公共挑战完成。
- 完成判定：`portfolio.lesson6.completed` 是课时注册表、首页课时卡和续学指针的唯一完成口径。
- 导出：全局「阶段快照」在课时 6 页面生成 `lesson6-full` HTML；继续学习包文件名可识别课时 6 第 N 关或已完成。
