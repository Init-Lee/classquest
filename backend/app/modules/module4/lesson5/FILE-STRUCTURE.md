<!--
文件说明：模块 4 课时 5 后端目录结构真相源。
职责：记录 lesson5 后端目录职责、C1a 账号/认证、C2a 题池提交/overview、C3a session 生命周期/锁池、C4a 学生 attach/assignment、C5a answer/rating/progress、C6a stats/report、C7a V3 revision/completion 后端停点与依赖方向。
更新触发：lesson5 新增或移动 route/service/repository/schema、改变依赖方向或扩展 fixture seed 流程时，需要同步更新本文件。
-->

# FILE-STRUCTURE — backend/app/modules/module4/lesson5

## 当前结构

```text
lesson5/
├── README.md
├── FILE-STRUCTURE.md
├── __init__.py
├── errors.py            # AccountAuthError / Lesson5PoolError / Lesson5SessionError / Lesson5ParticipantError / Lesson5AssignmentError / Lesson5AnswerError / Lesson5RatingError / Lesson5StatsError / Lesson5ReportError / Lesson5RevisionError / Lesson5CompletionError
├── schemas.py           # 登录/Me/Admin/Teacher/V2/V3/题池/session/participant/assignment/answer/rating/progress/stats/report/revision/completion 的 Pydantic 模型（字段 camelCase）
├── repository.py        # cq_*、module4_question_* 与 module4_lesson5_* 表读写
├── auth.py              # login/me/logout 认证核心 + 共享上海时区时钟与 DTO 装配 helper
├── service.py           # admin 班级/账号/授权 + teacher 可见班级业务
├── pool_service.py      # 学生 V2 提交、content_hash 幂等/升版、pool-overview 与 pool-item 详情业务
├── session_service.py   # 教师 session 生命周期、锁池冻结、phase 状态机与 overview 业务
├── participant_service.py # 学生 active-session、attach、state 与 participant 事件
├── assignment_sampler.py # 从冻结池生成/读取稳定 assignments，排除自作题并按 coverage-first 采样
├── answer_service.py    # 学生 answer 校验、判分、幂等写入、reveal 与 answer_submitted 事件
├── rating_service.py    # 学生 rating 校验、幂等写入、assignment rated 状态与 rating_submitted 事件
├── stats_service.py     # 教师 compute-stats 聚合、stats_status 判定、item_stats 幂等覆盖与 stats_computed 事件
├── report_service.py    # 教师 analytics 与学生 my-report 只读装配、权限/phase/participant 校验
├── revision_service.py  # 学生 V3 提交、长期题库 v3 指针、revision_plan upsert 与教师 revision-plans 总览
├── completion_service.py # 学生 my-completion-summary 聚合、QuickCheck 证据与 participant/client 校验
├── dependencies.py      # FastAPI 鉴权依赖（会话解析、require_admin/teacher/class_manage、forbid_demo）
├── routes_auth.py       # /auth：login/me/logout（在 main.py 以 /api/v1/module4 挂载）
├── routes_admin.py      # classes/users/class-assignments/teachers/{user_id}/classes（最终 /api/v1/admin/module4/...）
├── routes_student.py    # v2-submissions/v3-submissions + active-session/participants/state/assignments/answer/rating/my-report/my-completion-summary（最终 /api/v1/module4/lesson5/...）
└── routes_teacher.py    # classes + /lesson5/classes/{class_id}/pool-overview/pool-items + /lesson5/sessions* + compute-stats/analytics/revision-plans
```

## 当前职责

C1a 落地 teacher-console 所需的 **auth / admin / teacher 账号能力**；C2a 落地学生 V2 提交、班级题池 overview 与当前 V2 题卡详情预览；C3a 落地教师 session 生命周期、锁池冻结当前 V2、phase 顺序推进与 session overview；C4a 落地学生 active-session、participant attach、session state 与 assignment 生成/读取；C5a 落地学生 answer/rating 写入与教师 progress 聚合；C6a 落地 compute-stats、教师 analytics、学生 my-report 与 `trial_locked→analytics_open` 统计前置 gate；C7a 落地 `analytics_open` 后学生 V3 提交、长期题库 v3 指针、completion-summary 与教师 revision-plans 只读观察。`revision_open/closed` 仅作为底层保留阶段存在，不再进入教师或学生产品流程。

现阶段底层数据由以下 SQL 提供：

- `backend/app/modules/module4/sql/auth_and_classes.sql`：班级、用户、授权和会话基础表。
- `backend/app/modules/module4/sql/question_bank.sql`：模块 4 长期题池 item/version 表。
- `backend/app/modules/module4/sql/lesson5_runtime.sql`：课时 5 session、冻结题池、作答、评分、统计与修订表。

seed 与 fixture 脚本位于 `backend/scripts/`（账号 seed：`seed_module4_accounts.py`）。

## 依赖方向

```text
routes_auth/_admin/_teacher/_student → auth / service / pool_service / session_service / participant_service / assignment_sampler / answer_service / rating_service / stats_service / report_service / revision_service / completion_service / dependencies / schemas
auth → repository / security / config / database
service → repository / auth(共享时钟与 DTO helper)
pool_service → repository / auth(共享时钟)
session_service → repository / auth(共享时钟) / dependencies(SessionContext)
participant_service → repository / auth(共享时钟)
assignment_sampler → repository / participant_service(共享 phase/settings helper) / auth(共享时钟)
answer_service → repository / auth(共享时钟)
rating_service → repository / auth(共享时钟)
stats_service → repository / auth(共享时钟) / dependencies(SessionContext)
report_service → repository / auth(共享时钟) / dependencies(SessionContext)
revision_service → repository / auth(共享时钟) / dependencies(SessionContext) / pool_service(hash 与短标题 helper)
completion_service → repository / auth(共享时钟) / report_service(统计 DTO 装配) / revision_service(revision DTO 与 readyForLesson6 helper)
dependencies → repository / auth(共享时钟)
repository → core/database（仅数据访问，不依赖上层）
errors / schemas 被各层引用，自身不反向依赖
```

URL 前缀约定：C1a 账号端点【不带 `/lesson5` 前缀】（auth 在 `/api/v1/module4/auth`，admin 在 `/api/v1/admin/module4`，teacher 班级列表在 `/api/v1/teacher/module4/classes`）；C2a 学生提交为 `/api/v1/module4/lesson5/v2-submissions`，教师题池 overview 为 `/api/v1/teacher/module4/lesson5/classes/{class_id}/pool-overview`，题卡详情预览为 `/api/v1/teacher/module4/lesson5/classes/{class_id}/pool-items/{item_id}`；C3a 教师 session 控制为 `/api/v1/teacher/module4/lesson5/sessions*`；C4a 学生 session/assignment 端点为 `/api/v1/module4/lesson5/active-session`、`/participants/attach`、`/sessions/{session_id}/state?participantId=...`、`/sessions/{session_id}/assignments?participantId=...`；C5a 学生写端点为 `/assignments/{assignment_id}/answer`、`/answers/{answer_id}/rating`，教师进度端点为 `/api/v1/teacher/module4/lesson5/sessions/{session_id}/progress`；C6a 教师统计端点为 `/api/v1/teacher/module4/lesson5/sessions/{session_id}/compute-stats` 与 `/analytics`，学生报告端点为 `/api/v1/module4/lesson5/sessions/{session_id}/my-report?participantId=...&lesson5ClientId=...`；C7a 学生 V3 与完成摘要端点为 `/api/v1/module4/lesson5/v3-submissions`、`/api/v1/module4/lesson5/sessions/{session_id}/my-completion-summary?participantId=...&lesson5ClientId=...`，教师修订总览端点为 `/api/v1/teacher/module4/lesson5/sessions/{session_id}/revision-plans`。

新增文件时优先沿用模块 4 课时 4 的后端分层，不从前端直接 import 后端代码。
