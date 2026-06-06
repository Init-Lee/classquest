<!--
文件说明：模块 4 课时 4 后端说明。
职责：说明同伴互审临时 JSON 中转站、状态机、TTL 和接口边界。
更新触发：课时 4 API、状态流、SQLite 表结构、TTL 策略或 relay 逻辑变化时，需要同步更新本文件。
-->

# Backend Module4 Lesson4 — Peer Review Relay

本目录实现模块 4 课时 4 的学生侧同伴互审中转后台。

## 定位

这是课堂内临时 JSON 中转站，不是教师后台、正式题库后台或完整学习管理系统。

它负责：

1. 保存学生 A 发出的两张 V1 题卡送审 JSON。
2. 生成 4 位审查码。
3. 让目标学生 B 用自己的班学号刷新任务，并输入审查码领取。
4. 保存 B 提交的 review JSON。
5. 让 A 轮询并拉取反馈。
6. Step1 进页时按当前学生身份恢复服务器互审状态，补齐本地 IndexedDB 丢失的互审进度。
7. 自动处理 pending / claimed 超时。

## 状态机

```text
pending → claimed → submitted → pulled
   ↓         ↓
expired   expired

pending → cancelled
```


## 开发环境时间与数据库

- 互审相关时间字段（`created_at`、`serverNow`、`pendingExpiresAt` 等）统一使用 **Asia/Shanghai（UTC+8）** ISO8601 字符串（含 `+08:00`）。
- 本地联调前若数据脏或重复送审，可重置 SQLite：`CLASSQUEST_DATABASE_PATH=runtime/db/classquest.sqlite PYTHONPATH=. python scripts/init_db.py`（会重建表；**2026-05-30** 已按此方式清空 `module4_lesson4_review_requests` 供重新联调）。

## TTL

- pending：6 分钟，作者可手动撤回。
- claimed：默认 20 分钟，作者不可手动撤回。
- submitted：不短时间删除，保留到作者拉取或课后清理。

## API prefix

```text
/api/v1/module4/lesson4
```

## 当前已实现（B1–B7 + moderate-text）

```text
POST /review-requests
GET  /review-requests/{request_id}/status
POST /review-requests/{request_id}/cancel
GET  /review-requests/inbox
POST /review-requests/{request_id}/claim
POST /review-requests/{request_id}/submit
POST /review-requests/{request_id}/pull
GET  /review-requests/recovery
POST /review-requests/moderate-text
```

### 进页恢复（recovery）

`GET /review-requests/recovery?classId=...&authorSeatCode=...&reviewerSeatCode=...` 只返回当前班级与当前学生座位相关的最近状态：作者侧 active/submitted/pulled 请求，以及审查者侧 claimed/submitted/pulled 任务。Step1 用它在本地 IndexedDB 缺少 `requestId` 时恢复送审状态、可拉取反馈、已领取题卡或已提交审查；不会清空或迁移旧本地数据。

### 文字审核（moderate-text）

- 请求体：`{ texts: [{ fieldKey, card: "news"|"image", label, content }] }`（fieldKey 如 `news.source.reason`、`news.overallComment`）
- 响应：`{ pass, byField: { "news.source.reason": { pass, reasons[] }, ... }, byCard: { news: { pass, reasons[] } } }`
- 环境变量：与 lesson3 共用 `DASHSCOPE_API_KEY`、`QWEN_BASE_URL`、`QWEN_TEXT_MODEL` 等；`LESSON4_REVIEW_MODERATION_PROVIDER` 留空时**自动**：有 key 用 qwen，否则 mock（仅规则预审）；显式 `qwen` 但未配置 key 时 **503**「AI 审核暂不可用」。
- 联调强制失败：`LESSON4_REVIEW_MODERATION_MOCK_OUTCOME=fail`

### 互审 AI 审核提示词（moderation.py）

- **文件路径**：`backend/app/modules/module4/lesson4/moderation.py`
  - 常量 `LESSON4_MODERATION_SYSTEM_PROMPT`：Qwen system 提示词
  - 函数 `_build_user_prompt()`：按字段拼接 user 提示词
  - `_rule_check_text()` / `_sanitize_ai_field_result()`：本地规则与 AI 理由净化（防复述评语、防把「请作者改题卡」判成不通过）
- **职责边界**：待审文字 = **审查者写给题卡作者**的评语（可含【来源·小修】等前缀）；AI 只拦不文明、灌水、过短；**不**要求审查者自己去补链接或改题卡。
- **核心原则（摘录，完整以代码为准）**：
  1. 「请作者补充来源/网页出处」类正常互审 → **通过**
  2. 不通过理由只描述评语本身违规（如「属于无意义重复字符」），禁止复述或改写用户评语
  3. 粗俗暴力、纯重复字符（`aaaaaa`）、过短敷衍 → **不通过**
- 前端本地规则对齐：`classquest/src/modules/module-4-ai-info-detective/lessons/lesson-4/utils/lesson4-review-moderation-local.ts`；HTTP 模式在 adapter 中复用 `sanitizeLesson4RemoteModerationReasons`。

## 联调验证记录

- **2026-05-30 · B1**：`init_db` + uvicorn 启动成功；`POST /review-requests` 返回 **200 OK**，送审记录写入 SQLite。
- **2026-05-30 · B2**：`GET /review-requests/{id}/status?authorSeatCode=...` 返回 **200 OK**（含 `serverNow` +08:00、`pendingExpiresAt`）；不存在 **404**；作者不匹配 **403**；机会式 auto-expire 生效（pending 超时 → expired）。
- **2026-05-30 · B3**：`POST /review-requests/{id}/cancel` body `{ authorSeatCode }` 仅 **pending** 可撤回；**403/404/409** 边界；cancelled 后 `repository.CLAIMABLE_STATUSES` 不含 cancelled（B5 claim 将复用）。
- **2026-05-30 · B4**：`GET /review-requests/inbox?classId=...&reviewerSeatCode=...` 返回 **200 OK**（`serverNow` +08:00、`tasks[]` 仅含 `requestId/authorSeatCode/status/pendingExpiresAt`，不含 `requestJson`）；`reviewerSeatCode` 须匹配 `target_reviewer_seat_code`；机会式 auto-expire。
- **2026-05-30 · B5**：`POST /review-requests/{id}/claim` body `{ reviewerSeatCode, inviteCode }` 返回 **200 OK**（`status=claimed`、`reviewExpiresAt` 20min、`requestJson` 完整题卡）；错码 **400**、学号不匹配 **403**、非 pending 或竞态 **409**（detail「这条任务已被撤回或已被领取，请刷新任务列表。」）；方案 A 先到先赢 `UPDATE WHERE status='pending'`。
- **2026-05-30 · B6**：`POST /review-requests/{id}/submit` body `{ reviewerSeatCode, reviewJson }` 返回 **200 OK**（`status=submitted`、`submittedAt` +08:00）；仅 **claimed** 且 `claimed_reviewer_seat_code` 匹配可写；学号不匹配 **403**、不存在 **404**、非 claimed/竞态 **409**；claimed TTL 过期后机会式 expire → 响应 `status=expired` 且不写入。
- **2026-05-30 · B7**：`POST /review-requests/{id}/pull` body `{ authorSeatCode }` 返回 **200 OK**（`status=pulled`、`pulledAt` +08:00、`reviewJson`）；仅 **submitted** 且作者匹配可拉取；学号不匹配 **403**、不存在 **404**、非 submitted/竞态 **409**；已 pulled 幂等返回 pulled + reviewJson。

## 阶段计划（后端）

| 阶段 | 端点 | 状态 |
|------|------|------|
| b4-inbox | `GET /review-requests/inbox` | completed |
| b5-claim | `POST /review-requests/{id}/claim` | completed |
| b6-submit | `POST /review-requests/{id}/submit` | completed |
| b7-pull | `POST /review-requests/{id}/pull` | completed |

## 数据策略

v0.2 使用 SQLite 一张表和 JSON text 字段：

```text
request_json TEXT NOT NULL
review_json TEXT
```

先不要拆成复杂 normalized schema。等课堂流程稳定后再冻结正式数据库。

## 安全边界

后端必须重新校验完整 4 位班学号、同班约束（前两位一致）和自送拦截；前端只输入后两位只是交互约束，不是安全边界。

## 不实现

- 教师 dashboard；
- rescue mode；
- WebSocket/WebRTC；
- 正式题库抽题；
- Q 分数；
- 频率调节。
