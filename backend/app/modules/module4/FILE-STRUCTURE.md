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
├── services/
└── sql/
    ├── schema.sql
    └── lesson4_review_requests.sql
```

## 依赖方向

```text
routers → services → database/file layer
schemas → routers/services
services 不依赖 routers
lesson3/routes → lesson3/qwen_client → lesson3/schemas
lesson3/qwen_client → shared/qwen_http
lesson4/moderation → shared/qwen_http
```

## 状态

当前为 V1.5 架构逐步落地阶段。课时 3 题卡自检助手后端壳已提供（默认 mock provider，可切换 Qwen）；课时 4 B0 已完成 SQLite 基座，B1~B7 已实现送审/状态/撤回/inbox/claim/submit/pull 与 `moderate-text` 文字审核。端点实现时必须校验完整 4 位班学号、同班约束和自送拦截，不能只依赖前端派生规则。

