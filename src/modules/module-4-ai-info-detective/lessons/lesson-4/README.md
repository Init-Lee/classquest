<!--
文件说明：模块 4 课时 4 对外说明。
职责：说明课时 4 的课程目标、本阶段交付范围、运行方式、adapter 切换方式和后续后端联调边界。
更新触发：课时 4 功能范围、步骤开放策略、API 契约、运行环境变量或后端联调计划变化时，需要同步更新本文件。
-->

# Lesson 4 — 题目卡互审与 V2 入库准备

课时 4 承接课时 3 的新闻/图片 V1 题卡，目标是通过同伴互审拿到 V2 修改前的反馈。本阶段只交付第 1 关「同伴互审中转站」；Step2-4 为锁定占位。

## 当前范围

- Step1：同伴互审中转站，包含作者送审、审查者领取任务、**两阶段审查工作台**（左栏题卡试答与作者解析、右栏各维度档位+原因/分卡总体建议/分卡违规判定；试答提交前不展示解析）、**分卡提交审查 + 双卡通过后整体提交**与双条件 gate；claimed 时题卡 JSON 写入 `inbound.claimedRequestJson` 并由 `api/coerce-lesson4-review-request-json.ts` 规范化；审查进行中表单草稿写入 `inbound.reviewDraftJson`（防抖落 IndexedDB，含 `cards[].approved`），提交成功或 inbound 重置后清除。
- Step2-4：仅显示锁定占位页，不实现反馈收件箱、V2 修改台和 V2 就绪报告业务逻辑。
- 前端 adapter：`api/lesson4-peer-review.adapter.ts` 已定义 7 个端点契约；`.env.local` 设置 `VITE_MODULE4_LESSON4_PEER_REVIEW_MODE=http` 后，**送审**、**作者状态轮询**、**撤回**、**收件箱**、**领取**、**整体提交**、**拉取反馈** 均走真实 HTTP（教师模式 `isModule4TeacherModeActive()` 强制 fixture，零 lesson4 请求）。
- 阶段 B1~B7：送审、status、撤回、inbox、claim、submit、pull 均已后端落地并联调。
- **分卡提交 + 整体提交**：工作台「提交本卡审查」仅校验/AI 审核当前 Tab 题卡（`validateLesson4ReviewCardFeedback` + `moderateLesson4ReviewCard`），通过后标记 `reviewJson.cards[kind].approved`；新闻与图片均通过后，「我要审查别人」面板出现「整体提交」调用 `submitReviewFeedback`（B6）。默认本地规则 mock；`VITE_MODULE4_LESSON4_REVIEW_MODERATION_MODE=http` 走后端 `POST .../moderate-text`。
- **fieldKey 约定**：送审与回传均按 `{kind}.{dimension}.reason`（如 `news.source.reason`）、`{kind}.overallComment`、`{kind}.contentViolationNote` 定位字段；红色 Badge 贴在对应输入框下方。
- **字段级红色提示**：校验与 AI 不通过原因以红色 `Badge` 贴在对应输入框下方（各维度原因、总体建议、违规说明）；旧版全局 `overallComment`/`contentViolation` 在 normalize 时迁移到 news 卡。
- **HTTP 进页同步（hydrate）**：`VITE_MODULE4_LESSON4_PEER_REVIEW_MODE=http` 时，进入 Step1 不与 IndexedDB 快照 alone 对齐——作者若有 `outbound.requestId` 且状态为 pending/claimed/submitted，立即 `GET status`；审查者立即 `GET inbox` 刷新待审任务；inbound 已 claimed 时再 `GET status` 补齐 `reviewExpiresAt`，完整题卡自 portfolio `inbound.claimedRequestJson` 恢复（B5 claim 时写入）。
- **倒计时到期立即刷新**：pending/claimed 倒计时归零后马上触发 status（作者）或 inbox（审查者 pending 任务），不等待 20s 轮询。
- **20s 轻量轮询**：作者 outbound 处于 pending/claimed 时每 20s 拉 status；审查者 inbox 展示 pending 任务时每 20s 拉 inbox；进页 hydrate 各执行一次。

## 教师演示模式（课时 4）

与学生 Step1 **同一套 UI**；教师模式 **强制 fixture**（`isModule4TeacherModeActive()` + adapter `shouldUseHttp()` 短路），零 `/api/v1/module4/lesson4` 请求，不写学生 IndexedDB。

- 入口：`/module/4` 首页教师口令 → 进入讲解模式 → 课时 4 Step1。
- 讲解档案：`constants/demo-portfolio.ts` 预填 `lesson3.completed=true`，指针在课时 4 第 1 关。
- Step1 顶部「演示状态」按钮（`app/lesson4-teacher-demo-presets.ts`）：初始态 / 出站 pending / 审查 claimed / 双条件通关。
- 审查码 fixture：`4829`；教师模式下 inbox 返回一条待领任务，pull 返回 fixture `reviewJson`。
- 顶栏横幅：进入 `/module/4/lesson/4/*` 时显示「演示 · 不写入学生数据；互审走 fixture」。

## 后端 expire 机制（FAQ）

互审请求的过期**不是**注册到某个会话或定时器，而是**机会式扫描**：

- 每次调用任意 lesson4 API（create / status / cancel / inbox / claim 等）时，后端会先执行 `expire_stale_requests`，对**整张** `module4_lesson4_review_requests` 表扫描并更新符合 WHERE 的行：
  - `status = pending` 且 `pending_expires_at <= now` → 标为 `expired`
  - `status = claimed` 且 `review_expires_at <= now` → 标为 `expired`
- **无后台 cron**：若只改 SQLite、无人打 lesson4 API，状态不会自动变化。
- **手动改库**：
  - 若仍是 `pending` 且过期时间已过，下次任何人调用 lesson4 API 会被标 `expired`；
  - 若手动改成 `cancelled`，则不会被动 expire（WHERE 不匹配 pending/claimed 过期条件）。

## 通关条件

第 1 关只看两个独立条件：

```text
outbound.completed && inbound.completed
```

不要求互审双方成对，三人环形互审可以通关。

## 运行验证

```bash
npm run build
```

手动验证（Step1 HTTP 全链路）：

1. 后端（须在 `backend/` 目录）：
   ```bash
   cd backend
   source .venv/bin/activate
   export CLASSQUEST_DATABASE_PATH=runtime/db/classquest.sqlite
   export PYTHONPATH=.
   python scripts/init_db.py
   uvicorn app.main:app --reload
   ```
2. 前端：`npm run dev`（`.env.local` 已含 `VITE_MODULE4_LESSON4_PEER_REVIEW_MODE=http`）
3. 进入 `/module/4/lesson/4/step/1`，填写同伴后两位送审，成功后 outbound 应显示真实 `requestId` 与 4 位审查码。

非 HTTP 模式下仍可用 fixture 审查码 `4829` 打开互审工作台（静态演示）。

### 联调验证记录（2026-05-30）

| 步骤 | 结果 |
|------|------|
| `init_db` | 成功，输出 `数据库已初始化：runtime/db/classquest.sqlite` |
| uvicorn 启动 | 成功 |
| `POST /api/v1/module4/lesson4/review-requests` | **200 OK**，B1 送审写入 DB |
| `GET .../review-requests/{id}/status?authorSeatCode=0222` | **200 OK**（B2：含 serverNow +08:00、pendingExpiresAt；404/403 边界已验） |
| `POST .../review-requests/{id}/cancel` body `{ authorSeatCode }` | **200 OK**（B3：pending → cancelled；403/404/409 边界已验） |
| `GET .../review-requests/inbox?classId=class-02&reviewerSeatCode=0233` | **200 OK**（B4：`tasks[]` 摘要，无 `requestJson`；无匹配任务时 `tasks: []`） |
| `POST .../review-requests/{id}/claim` body `{ reviewerSeatCode, inviteCode }` | **200 OK**（B5：`status=claimed`、`requestJson` 完整题卡；错码 400、竞态 409） |
| `POST .../review-requests/{id}/submit` body `{ reviewerSeatCode, reviewJson }` | **200 OK**（B6：`status=submitted`、`submittedAt` +08:00；403/404/409 边界已验） |
| `POST .../review-requests/{id}/pull` body `{ authorSeatCode }` | **200 OK**（B7：`status=pulled`、`pulledAt` +08:00、`reviewJson`；403/404/409 边界已验） |

下一步：Step2-4 业务开发 / 课时 4 patch 发布准备。
