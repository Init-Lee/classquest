<!--
文件说明：模块 4 API 草案。
职责：为模块 4 前端 mock adapter 和后续 FastAPI 实现提供接口方向，不冻结最终合同。
更新触发：模块 4 提交、审核、试答、评分、反馈修订或画廊流程字段变化时，需要同步更新本文件。
-->

# 模块 4 API 草案

本文件是草案，不是最终合同。前端应先使用 mock adapter，流程稳定后再切换 HTTP adapter。

## 学生/公开 API

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api/v1/modules` | 获取模块列表 |
| GET | `/api/v1/module4/config` | 获取模块 4 运行配置 |
| POST | `/api/v1/module4/files` | 上传图片或来源证明 |
| POST | `/api/v1/module4/submission-packs` | 首次提交题卡包 |
| PUT | `/api/v1/module4/submission-packs/{pack_id}` | 更新提交包 |
| GET | `/api/v1/module4/submission-packs/{pack_id}/status` | 查询审核状态 |
| GET | `/api/v1/module4/quiz/current` | 获取当前开放试答轮次 |
| GET | `/api/v1/module4/quiz/{round_id}/set` | 获取随机题组 |
| POST | `/api/v1/module4/quiz/{round_id}/attempts` | 提交答案 |
| POST | `/api/v1/module4/quiz/{round_id}/ratings` | 提交快速评分 |
| POST | `/api/v1/module4/lesson5/assignments/{assignment_id}/answer` | 课时 5 C5a 提交 assignment answer |
| POST | `/api/v1/module4/lesson5/answers/{answer_id}/rating` | 课时 5 C5a 提交 answer rating |
| GET | `/api/v1/module4/lesson5/sessions/{session_id}/my-report?participantId={participant_id}&lesson5ClientId={client_id}` | 课时 5 C6a 读取本人题卡统计报告 |
| POST | `/api/v1/module4/lesson5/v3-submissions` | 课时 5 C7a 提交本人题卡 V3 修订 |
| GET | `/api/v1/module4/lesson5/sessions/{session_id}/my-completion-summary?participantId={participant_id}&lesson5ClientId={client_id}` | 课时 5 C7a 读取本人完成摘要与 QuickCheck 证据 |
| GET | `/api/v1/module4/gallery` | 读取发布画廊 |

## 教师 API

| 方法 | 路径 | 用途 |
|---|---|---|
| POST | `/api/v1/auth/teacher/login` | 教师登录 |
| POST | `/api/v1/auth/teacher/logout` | 教师退出 |
| GET | `/api/v1/teacher/me` | 当前教师 |
| GET | `/api/v1/teacher/module4/submission-packs` | 提交列表 |
| POST | `/api/v1/teacher/module4/reviews` | 审核题卡 |
| POST | `/api/v1/teacher/module4/rounds` | 创建试答轮次 |
| PATCH | `/api/v1/teacher/module4/rounds/{round_id}` | 开启/关闭试答 |
| GET | `/api/v1/teacher/module4/lesson5/sessions/{session_id}/progress` | 课时 5 C5a 查看全班 answer/rating 进度 |
| POST | `/api/v1/teacher/module4/lesson5/sessions/{session_id}/compute-stats` | 课时 5 C6a 计算/重算 session 题卡统计 |
| GET | `/api/v1/teacher/module4/lesson5/sessions/{session_id}/analytics` | 课时 5 C6a 查看班级题卡级 analytics |
| GET | `/api/v1/teacher/module4/lesson5/sessions/{session_id}/revision-plans` | 课时 5 C7a 查看班级 V3 修订总览 |
| POST | `/api/v1/teacher/module4/stats/recompute` | 旧草案路径，课时 5 C6a 起已过时，请使用 session 级 compute-stats |
| POST | `/api/v1/teacher/module4/publish-bundles` | 导出画廊/题库 |

## 课时 5 C5a 后端契约补充

`POST /api/v1/module4/lesson5/assignments/{assignment_id}/answer`

- 请求体：`participantId`、`lesson5ClientId`、`selectedOptionKey`、可选 `idempotencyKey`。
- 仅允许 session `phase=trial_open`；服务端以冻结题卡版本 `correct_option_key` 判分。
- 响应：`answerId`、`assignmentId`、`itemId`、`itemVersionId`、`selectedOptionKey`、`correctOptionKey`、`isCorrect`、`reveal{explanation,summary,options,source}`、`answeredAt`。
- 同一 assignment 重复提交幂等返回既有官方 answer，不重复计数。

`POST /api/v1/module4/lesson5/answers/{answer_id}/rating`

- 请求体：`participantId`、`lesson5ClientId`、`clarity`、`thinkingValue`、`explanationHelpfulness`、`issueFlags[]`、`comment?`。
- 三维评分只接受 1-3；`issueFlags` 固定集合为 `source_insufficient`、`explanation_unclear`、`option_confusing`、`material_mismatch`、`other`；`comment` 上限 500 字。
- 响应：`ratingId`、`answerId`、`assignmentId`、`ratedAt`。
- 同一 answer 重复评分幂等返回既有官方 rating，不重复计数。

`GET /api/v1/teacher/module4/lesson5/sessions/{session_id}/progress`

- teacher 任意授权和 demo 只读可见；无授权返回 403。
- 响应：`sessionId`、`phase`、`settings`、`participants[]{participantId,studentName,classSeatCode,answeredCount,ratedCount,completed}`、`summary{attachedCount,answeredCount,ratedCount,completedCount,questionCount}`、`generatedAt`。
- 不返回正确答案、解析、来源或题目作者信息。

## 课时 5 C6a 后端契约补充

`POST /api/v1/teacher/module4/lesson5/sessions/{session_id}/compute-stats`

- teacher 写端点；要求当前账号对 session 班级具备 `manage` 权限，demo 不可写。
- 要求 session `phase >= trial_locked`；compute 本身不推进 phase，可重复调用并覆盖重算 `module4_lesson5_item_stats`。
- 统计口径：按冻结池 `item_version_id` 聚合，answer/rating 均要求 `excluded_from_stats=0` 且首次有效记录；`statsStatus` 阈值为 `<3 insufficient`、`3-7 preliminary`、`>=8 stable`。
- 响应：`sessionId`、`computedItemCount`、`statsStatusBreakdown{insufficient,preliminary,stable}`、`computedAt`。

`GET /api/v1/teacher/module4/lesson5/sessions/{session_id}/analytics`

- teacher 任意授权和 demo 只读可见；要求已 compute。
- 响应：`sessionId`、`phase`、`settings`、`items[]`、`summary`、`generatedAt`。
- `items[]` 字段：`itemId`、`itemVersionId`、`kind`、`validAnswerCount`、`correctCount`、`correctRate`、`avgClarity`、`avgThinkingValue`、`avgExplanationHelpfulness`、`issueFlagCount`、`issueFlagRate`、`issueFlags[]`、`sampleComments[]`、`statsStatus`、`computedAt`；默认不返回作者座位或姓名。

`GET /api/v1/module4/lesson5/sessions/{session_id}/my-report?participantId=...&lesson5ClientId=...`

- 学生公开端点；要求 `analytics_open`、已 compute，且 `participantId + lesson5ClientId` 与 session 绑定记录匹配。
- 仅返回该 participant 座位作为作者的题卡统计；他人 participant 或 client 不匹配返回 403。
- 响应：`sessionId`、`participantId`、`items[]`、`generatedAt`；`items[]` 继承 `ItemStatsDto` 并追加 `diagnosisHints[]`。

`POST /api/v1/teacher/module4/lesson5/sessions/{session_id}/phase`

- `trial_locked -> analytics_open` 前必须已存在 item_stats，否则返回 409 提示先 compute-stats；其它 phase 顺序推进规则不变。

## 课时 5 C7a 后端契约补充

`POST /api/v1/module4/lesson5/v3-submissions`

- 学生公开端点；允许 session `phase >= analytics_open`，V3 是学生学习任务，不再由教师后续 phase 控制。
- 请求体：`sessionId`、`participantId`、`lesson5ClientId`、`itemId`、`baseV2VersionId`、`revisionPlan{revisionAction,diagnosis{selectedProblems[],evidence},revisionReason,expectedEffect}`、`v3CardJson`。
- `revisionAction` 固定集合：`keep`、`minor_fix`、`major_fix`、`hold`。
- 服务端校验 `participantId + lesson5ClientId`、session 归属、题卡作者必须为本人、`baseV2VersionId` 必须属于该 item 的 v2 版本。
- 成功后写入 `module4_question_item_versions(version_label='v3', status='ready_for_lesson6')`，回填 `module4_question_items.current_v3_version_id` 与 `status=ready_for_lesson6`，并 upsert `module4_lesson5_revision_plans`。
- 同一 item/v3/content_hash 重复提交返回 `deduped=true`，不会生成重复 V3 版本；revision plan 按 `sessionId + participantId + itemId` 覆盖。
- 响应：`ok`、`itemId`、`v3VersionId`、`status`、`readyForLesson6`、`deduped`；`readyForLesson6` 口径为 0 张 `none`、1 张 `partial`、2 张及以上 `full`。

`GET /api/v1/module4/lesson5/sessions/{session_id}/my-completion-summary?participantId=...&lesson5ClientId=...`

- 学生公开端点；要求 `phase >= analytics_open`、已 compute，且 `participantId + lesson5ClientId` 与 session 绑定记录匹配。
- 响应：`sessionId`、`participantId`、`v2Submit`、`trial`、`myItemStats[]`、`revision{readyForLesson6,submittedCount,submittedItems[]}`、`quickCheck{t1HasV2Submission,t2HasTrialStats,t3HasV3Submission}`、`generatedAt`。
- 仅返回本人座位相关的统计与修订状态；他人 participant 或 client 不匹配返回 403。

`GET /api/v1/teacher/module4/lesson5/sessions/{session_id}/revision-plans`

- teacher 任意授权和 demo 只读可见；要求 `phase >= analytics_open`，仅作为学生 V3 计划与准备度观察面板。
- 响应：`sessionId`、`phase`、`items[]`、`summary`、`generatedAt`。
- `items[]` 字段：`studentSeatCode`、`studentName`、`participantId?`、`itemId`、`cardKind`、`baseV2VersionId`、`v3VersionId?`、`revisionAction?`、`diagnosis`、`revisionReason`、`expectedEffect`、`status`、`submittedAt?`、`updatedAt?`。
- `summary` 字段：`totalItems`、`submittedItems`、`readyFullStudents`、`readyPartialStudents`、`readyNoneStudents`。

`POST /api/v1/teacher/module4/lesson5/sessions/{session_id}/phase`

- `analytics_open` 表示统计反馈开放与同步课堂收口；底层保留的 `revision_open/closed` 不作为教师端产品流程，也不控制学生能否提交 V3。

## Mock adapter 要求

模块 4 前端开发初期使用 `src/modules/module-4-ai-info-detective/api/module4-api.mock.ts`。

真实后端稳定后切换到 `src/modules/module-4-ai-info-detective/api/module4-api.http.ts`。

