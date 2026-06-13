<!--
文件说明：backend/app/modules/module4/ 目录结构真相源。
职责：记录模块 4 后端域内部 router、schema、model、service 与 SQL 的边界。
更新触发：新增服务、路由、SQL 文件、状态流或模块 4 后端内部目录时，需要同步更新本文件。
-->

# FILE-STRUCTURE — backend/app/modules/module4

## 结构

```text
backend/app/modules/module4/
├── README.md
├── FILE-STRUCTURE.md
├── router_student.py
├── router_teacher.py
├── router_admin.py
├── schemas.py
├── models.py
├── shared/
│   ├── __init__.py
│   └── qwen_http.py
├── lesson3/
│   ├── README.md
│   ├── __init__.py
│   ├── routes.py
│   ├── schemas.py
│   ├── prompt.py
│   └── qwen_client.py
├── lesson4/
│   ├── README.md
│   ├── FILE-STRUCTURE.md
│   ├── __init__.py
│   ├── routes.py
│   ├── schemas.py
│   ├── service.py
│   └── repository.py
├── lesson5/
│   ├── README.md
│   ├── FILE-STRUCTURE.md
│   ├── __init__.py
│   ├── auth.py
│   ├── dependencies.py
│   ├── errors.py
│   ├── repository.py
│   ├── pool_service.py
│   ├── session_service.py
│   ├── participant_service.py
│   ├── assignment_sampler.py
│   ├── answer_service.py
│   ├── rating_service.py
│   ├── stats_service.py
│   ├── report_service.py
│   ├── revision_service.py
│   ├── completion_service.py
│   ├── routes_student.py
│   ├── routes_admin.py
│   ├── routes_auth.py
│   ├── routes_teacher.py
│   ├── schemas.py
│   └── service.py
├── lesson6/
│   ├── README.md
│   ├── FILE-STRUCTURE.md
│   ├── __init__.py
│   ├── schemas.py
│   ├── routes_teacher.py
│   ├── routes_student.py
│   ├── repository.py
│   ├── publication_service.py
│   ├── challenge_service.py
│   ├── stats_service.py
│   └── routes_public.py
├── services/
└── sql/
    ├── schema.sql
    ├── lesson4_review_requests.sql
    ├── auth_and_classes.sql
    ├── question_bank.sql
    ├── lesson5_runtime.sql
    └── lesson6_public_challenge.sql
```

## 依赖方向

```text
routers → services → database/file layer
schemas → routers/services
services 不依赖 routers
lesson3/routes → lesson3/qwen_client → lesson3/schemas
lesson3/qwen_client → shared/qwen_http
lesson4/moderation → shared/qwen_http
lesson5/routes_* → lesson5/service / lesson5/pool_service / lesson5/session_service / lesson5/participant_service / lesson5/assignment_sampler / lesson5/answer_service / lesson5/rating_service / lesson5/stats_service / lesson5/report_service / lesson5/revision_service / lesson5/completion_service → lesson5/repository → core/database
lesson6/routes_teacher|routes_student → lesson6/publication_service → lesson6/repository → core/database
lesson6/routes_public → lesson6/challenge_service → lesson6/stats_service / lesson6/repository → core/database
lesson5/revision_service → lesson6/publication_service → lesson6/repository → core/database
```

## 状态

当前为 V1.5 架构逐步落地阶段。课时 3 题卡自检助手后端壳已提供（默认 mock provider，可切换 Qwen）；课时 4 B0 已完成 SQLite 基座，B1~B7 已实现送审/状态/撤回/inbox/claim/submit/pull 与 `moderate-text` 文字审核。课时 5 已完成 Phase 0 schema/fixture 管线、C1a 账号认证与班级授权 API（`/api/v1/module4/auth/*`、`/api/v1/admin/module4/*`、`/api/v1/teacher/module4/classes`）、C2a 学生 V2 提交和教师题池 overview（`/api/v1/module4/lesson5/v2-submissions`、`/api/v1/teacher/module4/lesson5/classes/{class_id}/pool-overview`）、C3a 教师 session 后端控制（`/api/v1/teacher/module4/lesson5/sessions*`，建会话、列会话、设置、锁池、phase、overview）、C4a 学生 active-session / participants attach / state / assignments API、C5a 学生 answer/rating 与教师 progress API、C6a compute-stats/analytics/my-report API，以及 C7a 学生 V3 修订、my-completion-summary 与教师 revision-plans API。课时 6 C0-C1b 已新增发布审核/公共挑战 SQL、`lesson6/` schemas/repository/service 与 teacher/student/public routes：V3 提交后创建 pending 发布审核记录，教师可 list/detail/publish/overview，学生可按本人本地 item/version 键查询发布状态，公共端可创建匿名挑战 run、读取 current、提交 answer 并读取 summary，stats 按 `lesson6_class` / `public_showcase` 增量隔离。后续 Live Session 前端统计/报告 UI、V3 工作台/快照和课时 6 前端页面实现时必须校验完整 4 位班学号、同班约束和 session 状态机，不能只依赖前端派生规则。

