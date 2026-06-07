<!--
文件说明：模块 4 课时 5 前端说明。
职责：记录课时 5 当前 Step1 提交 V2、连接课堂、Step2 试答/揭示/快评、Step3 本人报告、Step4 V3 学习任务与快照的页面、adapter、状态写入和后续边界。
更新触发：课时 5 新增步骤、提交字段、后端接入模式、状态字段或 Live Session 流程变化时，需要同步更新本文件。
-->

# Lesson 5 — 网页试答与反馈优化

当前开放到 C7b 学生端「提交 V2 → 连接课堂 → 查看分配列表 → 试答 → 揭示 → 快评 → 本人题卡报告 → V3 学习任务/快照」：

- 入口：`/module/4/lesson/5/step/1`。
- Guard：要求课时 4 已完成，且 `portfolio.lesson4.readiness.exportedPackageJson` 存在。
- 数据源：直接读取课时 4 Step4 生成的 `lesson4-ready-for-lesson5-v1` ready 包。
- 提交：默认 fixture；设置 `VITE_MODULE4_LESSON5_MODE=http` 后调用 `POST /api/v1/module4/lesson5/v2-submissions`。
- 连接：Step1 提交成功后读取/生成 `lesson5ClientId`，查询 `GET /api/v1/module4/lesson5/active-session?classId=...`；有可连接 session 时调用 `POST /participants/attach` 并保存 `portfolio.lesson5.connectedSession`。
- 试答与快评：`/module/4/lesson/5/step/2` 读取 `GET /sessions/{session_id}/state?participantId=...` 与 `GET /sessions/{session_id}/assignments?participantId=...`，课堂标题框内展示教师设置的 session 标题、右侧紧凑进度条、状态、刷新动作和下方题序卡 grid；刷新错误或恢复提示只在标题框内短提示，不占用主答题区；`trial_open` 时调用 `POST /assignments/{assignment_id}/answer` 揭示正解、总解析、摘要、逐选项解答与来源，再调用 `POST /answers/{answer_id}/rating` 提交三维快评。
- 本人报告：`/module/4/lesson/5/step/3` 在本地保存的 `connectedSession.phase=analytics_open` 后进入，调用 `GET /sessions/{session_id}/my-report?participantId=...&lesson5ClientId=...`，展示本人 news/image 题卡的 `statsStatus`、正确率、三维均值、问题标记、样例评论和诊断提示；报告用于修订指导，不作为分数或排名，并保存到 `portfolio.lesson5.myReport`。
- V3 学习任务：`/module/4/lesson/5/step/4` 在 `analytics_open` 后进入，复用课时 4 V2 单段编辑器作为 V3 工作台，填写 `revisionPlan` 后调用 `POST /api/v1/module4/lesson5/v3-submissions`；提交成功后读取 `GET /sessions/{session_id}/my-completion-summary?participantId=...&lesson5ClientId=...`，保存 `portfolio.lesson5.revision`、`quickCheck`、`stageSnapshot` 与 `myReport`。
- 来源摘要：answer reveal 的 `source` 可能是字符串或结构化对象；前端按课时 3 第 4 步的来源文字块口径展示为“来源类型 / 来源记录 / 核验观察指引”等中文行，不直接输出 JSON。
- 图片渲染：Step2 主答题区会读取 assignment `material.asset.dataUrl` 渲染图片素材，支持点击放大 Dialog 预览，并使用 `asset.alt/title/name/mimeType` 做可访问文本与辅助说明；缺少 dataUrl 时展示明确占位，不伪造图片。
- 保存：Step1 提交成功后写入 `portfolio.lesson5.clientId`、`submissionSummary`、`connectedSession`（若已 attach）与 `completed/completedAt`；Step3 写入 `myReport`；Step4 写入 V3 修订草稿/提交结果、QuickCheck 与 `lesson5-stage-v1` 本地阶段快照。刷新页面后可用已保存的 `participantId` 继续读取同一 assignments、my-report 与 completion-summary。
- 恢复边界：进度以服务端 `state` 为准；如果刷新后后端 assignment list 不返回已答详情，前端不会伪造 answer/reveal，只在 `trial_open` 下允许通过后端幂等 answer 响应恢复揭示后继续评分。

教师端可在 `trial_locked` 先计算统计、再开放到 `analytics_open`；此时同步课堂收口，学生可进入 Step4 提交 V3。底层保留的 `revision_open/closed` 不作为学生入口文案或教师控制流程。

## 本地验证

```bash
npm run build
```

后端联调时需先在 `backend/` 初始化数据库、运行 `seed_module4_accounts.py` 并启动 `uvicorn app.main:app --reload`；前端 `.env.local` 设置：

```bash
VITE_MODULE4_LESSON5_MODE=http
```

fixture 演示试答需额外设置 `VITE_MODULE4_LESSON5_FIXTURE_PHASE=trial_open`；fixture 演示报告与 V3 学习任务需设置 `VITE_MODULE4_LESSON5_FIXTURE_PHASE=analytics_open`。默认 fixture 仍保留 `pool_locked` 等待口径。
