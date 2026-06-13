<!--
文件说明：ClassQuest 后端生产环境停机更新操作说明（交给运维/后端执行）。
职责：在 rsync 代码同步之后，完成 .env.example/.env 对齐、SQLite 初始化、服务重启与验收；不替代 BACKUP-RULES.md 的备份流程。
更新触发：部署步骤、环境变量口径、数据库路径或验收接口变化时，需要同步更新本文件。
-->

# 生产后端更新操作说明（步骤 3）

> **适用**：`/srv/classquest/app/backend/` 已完成步骤 1 备份、步骤 2 rsync（或等价代码已到位）。  
> **参考**：详细备份/回滚见同目录 `BACKUP-RULES.md`；Mac 侧 rsync 见 `scripts/rsync-exclude.txt`（已修复，`.env.example` 会正常上传）。
> **最近更新**：2026-06-13，补充 Lesson6 生产 HTTP 开关与 `item-stats` 冒烟验收点。

---

## 0. 执行前确认

| 项 | 要求 |
|----|------|
| 工作目录 | `cd /srv/classquest/app/backend` |
| 备份 | 已有 `backups/deploy/YYYYMMDD-<标签>/`，含 `env`、`backend-code.tar.gz` |
| `DEPLOYMENT.md` | 若被 `--delete` 删掉，先从备份恢复（见 BACKUP-RULES / 交接记录） |
| 服务 | 允许短暂停机或维护窗口内操作 |

---

## 1. 对齐 `.env.example`（若步骤 2 时 example 仍是旧版）

rsync 曾因 exclude 误伤 `.env.example`；若服务器 example 缺少 `LESSON4_*`、`CLASSQUEST_DATABASE_PATH`、`CLASSQUEST_TEACHER_PASSWORD`，任选一种补齐：

**方式 A（推荐）**：维护同事 Mac 上从仓库 `classquest/backend/.env.example` 执行：

```bash
scp backend/.env.example root@<SERVER_HOST>:/srv/classquest/app/backend/.env.example
```

**方式 B**：SSH 上对照仓库最新 `.env.example` 手工编辑。

**验收**：

```bash
cd /srv/classquest/app/backend
grep -E 'LESSON4|CLASSQUEST_DATABASE_PATH|CLASSQUEST_TEACHER_PASSWORD|CORS_ALLOWED_ORIGINS' .env.example
```

应能看到上述键名（值可为示例或空）。

---

## 2. 合并生产 `.env`（必做）

**rsync 不会改 `.env`**。必须把 `.env.example` 里**新增键**并入生产 `.env`，**禁止覆盖**已有 `DASHSCOPE_API_KEY`。

```bash
cd /srv/classquest/app/backend
grep -E '^[A-Z][A-Z0-9_]*=' .env.example | cut -d= -f1 | while read -r k; do
  grep -q "^${k}=" .env 2>/dev/null || echo "缺失: ${k}"
done
```

按 `缺失:` 列表编辑 `.env`，至少确认生产具备：

| 变量 | 生产建议 |
|------|----------|
| `DASHSCOPE_API_KEY` | 保持原有真实 key，勿改坏 |
| `CORS_ALLOWED_ORIGINS` | `https://tool.xnwyedu.com`（OSS 前端） |
| `LESSON3_*` / `QWEN_*` | 与更新前一致或按 example |
| `LESSON4_REVIEW_MODERATION_TIMEOUT_SECONDS` | 如 `25` |
| `LESSON4_REVIEW_MODERATION_MAX_TOKENS` | 如 `400` |
| `CLASSQUEST_DATABASE_PATH` | **留空**（使用默认 `/var/lib/classquest/db/classquest.sqlite`） |
| `CLASSQUEST_TEACHER_PASSWORD` | 教师/管理员账号统一登录口令；真实值只放服务器 `.env` |

```bash
chmod 600 .env
```

---

## 3. 初始化 SQLite 与账号 seed（首次或 schema 变更后必做）

**无需安装 MySQL/PostgreSQL**。SQLite 由 Python 自带；初始化脚本会按当前 schema 执行 `CREATE TABLE IF NOT EXISTS`，创建或补齐表结构，不会 `DROP` 表或清空真实业务数据。

```bash
cd /srv/classquest/app/backend
source .venv/bin/activate
python scripts/init_db.py
```

**预期输出**：

```text
数据库已初始化：/var/lib/classquest/db/classquest.sqlite
```

**可选确认**：

```bash
ls -la /var/lib/classquest/db/classquest.sqlite
sqlite3 /var/lib/classquest/db/classquest.sqlite ".tables"
```

应能看到课时 4 互审表、课时 5 账号/班级、题池与 session runtime 表（如 `module4_lesson4_review_requests`、`cq_classes`、`module4_lesson5_sessions`，以实际 schema 为准）。

课时 5 教师控制台需要基础班级、账号与默认授权时，继续执行：

```bash
python scripts/seed_module4_accounts.py
```

脚本会幂等写入 `g7c01`~`g7c12`、`xnwy-admin` / `xnwy-li` / `xnwy-zhang` / `xnwy-tang` / `xnwy-demo` 以及默认授权；它会按代码里的 seed 口径刷新这些账号/授权行，但不会覆盖学生题卡、session、作答、评分或 V3 修订数据。

---

## 4. 依赖与服务（按变更选择）

**`requirements.txt` 与备份 tar 无差异**：可跳过 `pip install`，仅做 import 冒烟：

```bash
source .venv/bin/activate
python -c "import fastapi; print('venv ok')"
```

**若 requirements 有变**：

```bash
pip install -r requirements.txt
```

**重启后端**：

```bash
systemctl restart classquest-backend
systemctl status classquest-backend --no-pager
```

---

## 5. 前端生产构建配置提醒

若本次同时发布 OSS 静态前端，生产构建前在 `classquest/.env.production` 至少确认（2026-06-13 已补 Lesson6）：

```env
VITE_API_BASE_URL=https://api.xnwyedu.com
VITE_MODULE4_LESSON3_AI_REVIEW_MODE=http
VITE_MODULE4_LESSON4_PEER_REVIEW_MODE=http
VITE_MODULE4_LESSON4_REVIEW_MODERATION_MODE=http
VITE_TEACHER_CONSOLE_MODE=http
VITE_MODULE4_LESSON5_MODE=http
VITE_MODULE4_LESSON6_MODE=http
```

`VITE_API_BASE_URL` 对应的后端域名必须使用 HTTPS；后端生产 `.env` 的 `CORS_ALLOWED_ORIGINS` 必须包含前端生产域名（如 `https://tool.xnwyedu.com`）。教师端流程以 `analytics_open` 作为统计反馈开放与课堂收口点；学生 V3 是学生端学习任务，不需要教师端再开放 `revision_open`。

---

## 6. 验收

```bash
curl -sS https://api.xnwyedu.com/api/v1/health
# 预期：{"status":"ok"}

journalctl -u classquest-backend -n 50 --no-pager
```

业务验收（由前端同事配合）：

- 课时 3：`POST .../module4/lesson3/ai-review` → 200，`provider: qwen`
- 课时 4：互审 B1~B7 / `moderate-text` 可写可读 SQLite（无「no such table」类错误）
- 课时 5：教师端 HTTP 登录、建 session、锁池、开放试答、锁定试答、计算统计、开放到 `analytics_open` 可用；学生端 Step1~Step4 可连接课堂、试答、查看本人报告并提交 V3
- 课时 6（2026-06-13 C5）：教师端 HTTP 可登录并请求 `GET .../teacher/module4/lesson6/public-bank/overview` 与 `GET .../teacher/module4/lesson6/public-bank/item-stats`；生产库已有 Lesson6 schema（含 `module4_public_question_stats`），且已有 publishable/active public V3 题卡时返回逐题统计，未作答题卡计数为 0

---

## 7. rsync exclude 最后检查

Mac 侧上传命令应在 `classquest/` 下使用：

```bash
rsync -avz --delete \
  --exclude-from=./backend/scripts/rsync-exclude.txt \
  ./backend/ \
  root@${SERVER_HOST}:/srv/classquest/app/backend/
```

当前 `backend/scripts/rsync-exclude.txt` 的名称和 `BACKUP-RULES.md` 中的命令一致。最后确认点：

- `.env`、`.env.local`、`.env.production` 不上传；`.env.example` 会上传。
- `.venv/`、`venv/`、`__pycache__/`、`.pytest_cache/` 等本地 Python 产物不上传。
- `runtime/db/`、`runtime/testdata/`、`runtime/fixtures/**` 与 `*.sqlite` / `*.sqlite3` / `*.db` 不上传，因此本地 `backend/runtime/db/classquest.sqlite` 不会同步到服务器。
- `node_modules/`、`dist/`、`build/` 已显式排除；若从仓库根同步前端，请使用前端/根目录自己的发布策略，不复用本后端 exclude 当作完整前端发布清单。
- `DEPLOYMENT.md` 为服务器专有文档，exclude 后 `--delete` 不会删除服务器已有副本。

---

## 8. 常见问题

| 现象 | 处理 |
|------|------|
| `no such table` | 未执行 §3 `init_db.py` 或 `CLASSQUEST_DATABASE_PATH` 指错路径 |
| CORS 报错 | `.env` 补 `CORS_ALLOWED_ORIGINS` 后 restart |
| lesson4 审核 503 | 检查 `DASHSCOPE_API_KEY` 非空 |
| 教师账号登录 500 | 检查 `CLASSQUEST_TEACHER_PASSWORD` 非空，并已执行 `seed_module4_accounts.py` |
| `.env.example` 仍旧 | 重做 §1；下次 rsync 使用最新 `scripts/rsync-exclude.txt` |

---

## 9. 回滚（仅当更新失败）

1. 打开 `/srv/classquest/backups/INDEX.md` 找到批次。  
2. 按该批次 `MANIFEST.txt` 恢复代码与 `env`。  
3. `systemctl restart classquest-backend`。  
4. **不要**用整包 tar 覆盖当前目录而不看 MANIFEST（避免覆盖已更新的文档）。

---

## 10. 与 Mac 仓库的分工

| 内容 | 谁维护 |
|------|--------|
| 业务代码、`BACKUP-RULES.md`、`rsync-exclude.txt` | git + rsync |
| `.env.example` | git + rsync（exclude 已修） |
| 生产 `.env`、SQLite 数据 | **仅服务器**，本说明 §2、§3 |
| `DEPLOYMENT.md` | 仅服务器，exclude 保护，不进 git |

执行完本说明后，在维护计划中将 **步骤 3** 标为完成。
