<!--
文件说明：backend/app/modules/module4/lesson4/ 目录结构真相源。
职责：记录课时 4 peer review relay 后端目录职责、依赖方向与状态边界。
更新触发：新增 route、schema、service、repository、SQL 或状态机变化时，需要同步更新本文件。
-->

# FILE-STRUCTURE — backend/app/modules/module4/lesson4

## 结构

```text
backend/app/modules/module4/lesson4/
├── README.md
├── FILE-STRUCTURE.md
├── __init__.py
├── routes.py
├── schemas.py
├── service.py
├── moderation.py
└── repository.py
```

## 职责

- `routes.py`：FastAPI router，暴露学生侧 review request 接口；B1 `POST /review-requests`，B2 `GET /review-requests/{request_id}/status`，B3 `POST /review-requests/{request_id}/cancel`，B4 `GET /review-requests/inbox`，B5 `POST /review-requests/{request_id}/claim`，B6 `POST /review-requests/{request_id}/submit`，B7 `POST /review-requests/{request_id}/pull`，`GET /review-requests/recovery` 供 Step1 进页按当前学生身份恢复服务器互审事实；`POST /review-requests/moderate-text` 提交前文字审核（规则 + mock/Qwen）。
- `moderation.py`：互审文字审核 provider（复用 `shared/qwen_http` 与 lesson3 相同 `DASHSCOPE_API_KEY` / `QWEN_*`），按 **fieldKey** 返回原因列表并聚合 `byCard`；未设 `LESSON4_REVIEW_MODERATION_PROVIDER` 时有 key 自动 qwen。
- `schemas.py`：Pydantic request/response schema 与 status enum。
- `service.py`：状态机、TTL、审查码、业务规则校验（同班/自送/唯一性）；含 `submit_review_request`（claimed→submitted）、`pull_review_request`（submitted→pulled）与 `get_peer_review_recovery_state`（只读恢复）。
- `repository.py`：SQLite 查询与写入，含机会式过期扫描与按 `class_id + seat_code` 过滤的 recovery 查询。

## 依赖方向

```text
routes → service → repository → core/database
schemas → routes/service
repository 不依赖 routes
```

## 状态机

```text
pending → claimed → submitted → pulled
   ↓         ↓
expired   expired

pending → cancelled
```

## 业务边界

- 只做学生互审中转。
- 不做教师后台。
- 不做题库发布。
- 不做统计评分。
- 不做 WebSocket/WebRTC。
