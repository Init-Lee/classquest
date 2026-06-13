<!--
文件说明：模块 4 课时 6 公共挑战 feature 说明。
职责：说明匿名公共挑战前端组件的边界、context 口径、隐私规则和后续更新触发条件。
更新触发：公共挑战路由、组件分层、context 语义、答前/答后字段展示规则或课时 6 嵌入方式变化时，需要同步更新本文件。
-->

# Public Challenge Feature

`features/public-challenge/` 承载模块 4 课时 6 匿名公共挑战的前端 UI 与轻量本地匿名标识工具。它服务顶层公开路由 `/m4/challenge`，不依赖 `Module4Shell`、`Module4Provider`、学生档案或课时 guard。

## Feature 边界

- `PublicChallengeShell.tsx` 只编排公共挑战 run 状态机：创建 run、读取 current、提交答案、读取 summary、处理题库不足/限流与完成摘要。
- `PublicChallengeQuestionCard.tsx` 只展示未作答题卡素材、题干和选项，不展示答案、解析、来源或作者。
- `PublicChallengeResultPanel.tsx` 只在提交后展示正解、解析和来源摘要，并继续隐藏作者身份。
- `PublicChallengeNotReadyState.tsx` 负责 `public_bank_not_ready` 与 429 限流空态。
- `PublicChallengeCompletePanel.tsx` 负责 summary 摘要与「再来一局」入口。
- `public-challenge-storage.ts` 只保存匿名 session id 与当前 runId，不写入学生档案。

## Context 口径

- `public_showcase`：公开展示挑战，`/m4/challenge` 默认使用。
- `lesson6_class`：课时 6 课堂挑战 context，当前仅允许 query 透传；嵌入学生端课时 6 的接线留给后续阶段。

模块 4 首页只负责可发现入口：无档案状态用说明文案提示公共挑战适合已完成课时五或有同等基础的学生；有进度状态只有课时五完成后才在当前进度行动区展示入口。公共挑战不替代课时 1-5 主线闯关。

## 隐私边界

答题前只消费 `GET current` 返回的题卡展示字段，不能在 UI 中渲染答案、解析、来源摘要、作者或任何能反推出作者身份的信息。答题后只展示 `POST answers` 返回的正解、解析和来源摘要；作者身份仍不展示。

公共挑战的匿名 session 仅用于后端限流与 run 关联，前端不得把学生姓名、班级、班学号或本地档案信息写入公共挑战请求。
