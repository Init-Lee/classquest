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
├── lesson3/
│   ├── README.md
│   ├── __init__.py
│   ├── routes.py
│   ├── schemas.py
│   ├── prompt.py
│   └── qwen_client.py
├── services/
└── sql/
    └── schema.sql
```

## 依赖方向

```text
routers → services → database/file layer
schemas → routers/services
services 不依赖 routers
lesson3/routes → lesson3/qwen_client → lesson3/schemas
```

## 状态

当前为 V1.5 架构占位。课时 3 在 dev 分支新增题卡自检助手后端壳，默认 mock provider；数据库 schema 待模块 4 前端 mock 流程稳定后冻结。

