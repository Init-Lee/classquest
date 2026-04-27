<!--
文件说明：模块 4 SQLite 数据库草案。
职责：记录早期需要稳定的领域概念和 schema 冻结门槛，不作为最终数据库实现。
更新触发：模块 4 题卡、提交包、审核、试答、评分或画廊模型稳定后，需要同步更新本文件。
-->

# SQLite 数据库草案

本文件是草案。模块 4 前端 mock 流程稳定前，不冻结最终 schema。

## 推荐顺序

1. 构建模块 4 前端本地流程。
2. 使用 mock API 跑通提交、审核、试答、评分、画廊。
3. 稳定题卡、提交包、试答轮次和统计模型。
4. 评审 API 草案。
5. 冻结 SQLite schema。
6. 接入真实 FastAPI。

## 早期稳定概念

- `submission_pack`：一次学生提交包。
- `submission_pack_revision`：提交包版本。
- `question_card`：一张题卡。
- `review`：教师审核记录。
- `quiz_round`：试答轮次。
- `quiz_attempt`：匿名答题事件。
- `question_rating`：快速评分事件。
- `question_stats`：统计结果。
- `publish_bundle`：画廊或题库导出包。

## 冻结门槛

题卡编辑字段、mock 提交、mock 教师审核、mock 试答、评分量规、画廊输出格式和 API 草案全部确认后，才能落最终 schema。

