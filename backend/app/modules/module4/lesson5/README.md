<!--
文件说明：模块 4 课时 5 后端服务目录说明。
职责：记录 lesson5 后端目录的当前边界——Phase 0 地基、C1a 账号/认证能力、C2a 题池提交/overview 能力、C3a session 生命周期/锁池、C4a 学生 attach/assignment、C5a answer/rating/progress、C6a compute-stats/analytics/my-report 与 C7a V3 revision/completion 后端停点。
更新触发：课时 5 新增 route、service、repository、schema、状态机或 fixture seed 流程变化时，需要同步更新本文件。
-->

# Module 4 Lesson 5 Backend

本目录是模块 4 课时 5「网页试答与反馈优化 / 云端 Live Lesson Session」后端服务包。

当前已落地六层：

- **Phase 0 地基**：数据库 schema、fixture 检视、SQLite 快照导出和题池 seed 管线（不提供正式运行时 API）。
- **C1a 账号/认证**：teacher-console 所需的登录认证、admin 班级/授权管理、teacher 可见班级查询能力。
- **C2a 题池提交**：学生 `lesson4-ready-for-lesson5-v1` 包提交、题池 v2 幂等/升版写入、教师班级题池只读 overview。
- **C3a session 后端停点**：教师建会话、列会话、draft 设置更新、锁池冻结当前 V2、phase 顺序推进与 session overview。
- **C4a 学生 attach/assignment 后端停点**：学生可查 active session、绑定 participant、轮询 session state，并从冻结池生成/读取稳定 assignments。
- **C5a answer/rating/progress 后端停点**：学生在 `trial_open` 下提交 answer 并获得正解/解析/来源揭示，随后提交三维快评；教师可读取 session progress 聚合。
- **C6a stats/report 后端停点**：教师在 `trial_locked` 及之后触发 compute-stats，写入题卡级 `item_stats`；教师/demo 可读 analytics，学生在 `analytics_open` 后可读本人 my-report。
- **C7a V3 revision/completion 后端停点**：`analytics_open` 表示统计反馈开放并完成同步课堂收口；学生在 `analytics_open` 后即可提交本人题卡 V3，服务端写入长期题库 `version_label='v3'`、`revision_plans`，并进入 Lesson6 教师发布确认队列；学生可读 completion-summary，教师/demo 可读 revision-plans 只读观察。`revision_open/closed` 仅作为底层保留阶段存在，不再进入教师或学生产品流程。

## C1a 已落地能力

- **auth**（`routes_auth.py` → `auth.py`）：`POST /api/v1/module4/auth/login`、`GET /api/v1/module4/auth/me`、`POST /api/v1/module4/auth/logout`。`xnwy-demo` 可免密码登录，其它账号使用后端环境变量 `CLASSQUEST_TEACHER_PASSWORD` 统一口令登录；真实口令不写入前端。
- **admin**（`routes_admin.py` → `service.py`）：`GET /api/v1/admin/module4/classes`、`GET .../users`、`GET .../class-assignments`、`PUT .../teachers/{user_id}/classes`（全量覆盖：单事务先删该 user 行再批量插，className 以服务端 `cq_classes` 回填，不信任前端）。
- **teacher**（`routes_teacher.py` → `service.py`）：`GET /api/v1/teacher/module4/classes`，teacher 仅见被分配班级，demo 返回全部班级且权限统一为 `view`，admin 返回空数组。
- **权限闸门**（`dependencies.py`）：`get_current_session`（Bearer token → 有效会话）、`require_admin`、`require_teacher`、`require_class_manage`、`forbid_demo`（demo 只读基线）。无/失效 token → 401，权限不足 → 403。

> 注意：C1a 的 auth/admin/teacher 账号端点【不带 `/lesson5` 前缀】；C2a 学生提交与教师题池 overview 已使用 `/lesson5` 前缀，后续 C3 session 控制端点也继续放在该命名空间下。

## C2a 已落地能力

- **学生提交**（`routes_student.py` → `pool_service.py`）：`POST /api/v1/module4/lesson5/v2-submissions`。请求体包含 `classId/studentName/classSeatCode/lesson5ClientId/readyPackage`，其中 `readyPackage.packageVersion` 必须是 `lesson4-ready-for-lesson5-v1`，且 `cards.news` / `cards.image` 都需含 `task.correctOptionKey`。
- **题池写入**（`pool_service.py` → `repository.py`）：按 `classId + classSeatCode + cardKind` upsert `module4_question_items`，按完整 `card_json` 稳定 JSON 的 sha256 计算 `content_hash`；同 hash 返回 `deduped=true` 并复用版本，内容变化写入新 `module4_question_item_versions`，再切换 `current_v2_version_id`。
- **教师 overview**（`routes_teacher.py` → `pool_service.py`）：`GET /api/v1/teacher/module4/lesson5/classes/{class_id}/pool-overview`。teacher 需对班级有任意授权，demo 可全班只读查看；无 token 返回 401，未授权 teacher 返回 403。
- **教师题卡详情预览**（`routes_teacher.py` → `pool_service.py`）：`GET /api/v1/teacher/module4/lesson5/classes/{class_id}/pool-items/{item_id}` 按班级权限读取长期题池 item 的当前 V2 版本，返回素材、题干、选项、正解与完整 `cardJson` 供教师端只读弹窗预览；跨班 item 返回 404，未授权仍返回 403。

## C3a 已落地能力

- **session 生命周期**（`routes_teacher.py` → `session_service.py`）：`POST /api/v1/teacher/module4/lesson5/sessions` 创建 `draft` 会话；`GET .../sessions?classId=` 列出班级会话；`PATCH .../sessions/{session_id}/settings` 仅允许 `draft` 改题量设置。
- **锁池冻结**：`POST .../sessions/{session_id}/lock-pool` 从 `module4_question_items.current_v2_version_id` 读取当前 V2，写入 `module4_lesson5_session_pool_items` 后把 phase 推进到 `pool_locked`。冻结后题池以 session pool 为真相，不随后续学生 V2 提交变化。
- **phase 状态机**：教师产品流程到 `analytics_open` 即完成统计反馈开放与同步课堂收口；底层状态机仍保留 `revision_open/closed` 用于已有测试数据或迁移场景。`pool_locked` 入口只能通过 `lock-pool`，避免出现「已锁状态但未冻结题池」。
- **session overview**：`GET .../sessions/{session_id}/overview` 返回会话元信息、冻结 news/image/total、班级当前 V2 提交人数与缺口、readiness 提示。demo 与 view 授权可只读查看，写端点要求 teacher manage。

## C4a 已落地能力

- **active session**（`routes_student.py` → `participant_service.py`）：`GET /api/v1/module4/lesson5/active-session?classId=...` 返回该班最新可连接 session（从 `pool_locked` 起）；无可连接 session 返回 404。
- **participant attach**（`POST /api/v1/module4/lesson5/participants/attach`）：学生以 `sessionId/classId/studentName/classSeatCode/lesson5ClientId` 绑定 session。同一身份重复 attach 返回同一 `participantId`；seat/client/name/class 冲突返回 409。
- **session state**（`GET /api/v1/module4/lesson5/sessions/{session_id}/state?participantId=...`）：校验 participant 属于 session 后返回 phase、settings 与 answered/rated 进度摘要。
- **assignment 生成/读取**（`assignment_sampler.py`）：`GET /api/v1/module4/lesson5/sessions/{session_id}/assignments?participantId=...` 首次从 `module4_lesson5_session_pool_items` 冻结池生成，排除自作题，按 6/8/10 派生 news/image 各半，按有效作答数 coverage-first 排序并稳定 tie-break；候选不足返回 409，不静默降题量。后续重复读取同一持久化列表。

## C5a 已落地能力

- **answer 提交**（`routes_student.py` → `answer_service.py`）：`POST /api/v1/module4/lesson5/assignments/{assignment_id}/answer`。学生请求体使用 `participantId/lesson5ClientId/selectedOptionKey/idempotencyKey?`，服务端校验 participant/client、assignment 归属与 session `phase=trial_open`，按冻结版本 `correct_option_key` 判分，写 `module4_lesson5_answers`，把 assignment 推进到 `answered`，并返回 `correctOptionKey/isCorrect/reveal{explanation,summary,options,source}`；其中 `summary` 优先取 `task.summary`，回退 `card.revision.summary`，逐选项解答来自 `task.options[].rationale/explanation`。重复提交同一 assignment 幂等返回既有官方 answer，不重复计数。
- **rating 提交**（`routes_student.py` → `rating_service.py`）：`POST /api/v1/module4/lesson5/answers/{answer_id}/rating`。必须先存在属于该 participant 的 answer；三维 `clarity/thinkingValue/explanationHelpfulness` 只接受 1-3，`issueFlags` 只接受固定枚举（含 `source_insufficient`），评论限制 500 字；成功写 `module4_lesson5_ratings` 并把 assignment 推进到 `rated`。重复评分同一 answer 幂等返回既有 rating。
- **教师 progress**（`routes_teacher.py` → `session_service.py`）：`GET /api/v1/teacher/module4/lesson5/sessions/{session_id}/progress` 返回全班 `answeredCount/ratedCount/completed` 与 summary 聚合；teacher 任意授权和 demo 只读可见，不暴露正确答案、解析、来源或题目作者。

## C6a 已落地能力

- **统计计算**（`routes_teacher.py` → `stats_service.py`）：`POST /api/v1/teacher/module4/lesson5/sessions/{session_id}/compute-stats` 仅允许具备班级 `manage` 权限的 teacher 调用；要求 session 已到 `trial_locked`，按冻结题池逐 `item_version_id` 聚合 `answers/ratings`，口径为 `excluded_from_stats=0` 且首次有效作答/评分，写入 `module4_lesson5_item_stats`，重复调用覆盖重算并记录 `stats_computed` 事件，不推进 phase。
- **开放统计 gate**（`session_service.py`）：`trial_locked→analytics_open` 前必须已有 `item_stats`，否则返回 409 提示先计算统计；其它 phase 顺序规则不变。
- **教师 analytics**（`routes_teacher.py` → `report_service.py`）：`GET /api/v1/teacher/module4/lesson5/sessions/{session_id}/analytics` 要求已 compute；teacher 任意授权和 demo 只读可见，返回题卡级正确率、三维均值、issueFlag 率、样例评论、`statsStatus` 与班级汇总，默认不暴露作者座位。
- **学生 my-report**（`routes_student.py` → `report_service.py`）：`GET /api/v1/module4/lesson5/sessions/{session_id}/my-report?participantId=...&lesson5ClientId=...` 要求 `analytics_open`、统计已计算且 participant/client 匹配；仅返回该 participant 座位作为作者的题卡统计与 `diagnosisHints`。

## C7a 已落地能力

- **学生 V3 提交**（`routes_student.py` → `revision_service.py`）：`POST /api/v1/module4/lesson5/v3-submissions` 要求 session `phase >= analytics_open`，并校验 `participantId + lesson5ClientId` 与本人题卡归属；按完整 `v3CardJson` 计算 content_hash，命中同 item/v3/hash 时返回 `deduped=true`，否则写入 `module4_question_item_versions(version_label='v3', status='ready_for_lesson6')`，回填 `module4_question_items.current_v3_version_id` 与 `status=ready_for_lesson6`。V3 ready 只表示进入 Lesson6 教师发布确认队列；教师确认前不会进入公共题库。
- **revision plan 入库**：同一次 V3 提交会 upsert `module4_lesson5_revision_plans`，唯一键为 `session_id + participant_id + item_id`；`revisionAction` 固定为 `keep / minor_fix / major_fix / hold`，重复提交覆盖计划并保留单行。
- **学生 completion-summary**（`routes_student.py` → `completion_service.py`）：`GET /api/v1/module4/lesson5/sessions/{session_id}/my-completion-summary?participantId=...&lesson5ClientId=...` 要求至少 `analytics_open` 且已 compute；返回本人 V2/试答进度/my-report/V3 修订状态与 QuickCheck 证据，用于 C7b 本地快照。
- **教师 revision-plans**（`routes_teacher.py` → `revision_service.py`）：`GET /api/v1/teacher/module4/lesson5/sessions/{session_id}/revision-plans` 要求 `phase >= analytics_open`；teacher 任意授权与 demo 只读可见，按冻结题池 item 返回提交状态与聚合计数，仅作为观察面板。
- **底层保留 phase**：`revision_open/closed` 继续保留在 schema、状态机与 DTO 中，便于已有测试数据或迁移场景读取；学生 V3 与教师端流程均不依赖这些阶段。

## 当前边界

- 账号/班级 schema：`backend/app/modules/module4/sql/auth_and_classes.sql`。
- 长期题池 schema：`backend/app/modules/module4/sql/question_bank.sql`。
- 课时 5 session runtime schema：`backend/app/modules/module4/sql/lesson5_runtime.sql`。
- 账号/班级 seed：`backend/scripts/seed_module4_accounts.py`（幂等，可重复跑）。
- fixture 检视与题池 seed：`backend/scripts/`。
- 真实学生 JSON 和 SQLite 导出物只允许写入 `backend/runtime/fixtures/module4/lesson5/` 下的被忽略路径，不得提交。
- C7a 已开放后端 V3 提交、completion-summary 与教师 revision-plans；assignment 只从 session 冻结池读取，不回读长期题池可变指针。学生 Step4 UI、本地快照/HTML 与教师观察面板前端仍留后续阶段。课时 6 C0 已接入 V3 提交后的 `pending_teacher_check` 发布审核记录，正式发布确认与公共挑战路由留到后续阶段。

## 后续更新触发

进入 C7b（学生 Step4 V3 工作台、本地快照/HTML 与教师修订总览前端）及后续课时 6 发布运行时时，新增 route/service/repository/schema 或前后端字段契约变化需要同步更新本文件与相邻 `FILE-STRUCTURE.md`。
