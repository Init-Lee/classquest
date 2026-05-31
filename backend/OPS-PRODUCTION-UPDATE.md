<!--
文件说明：ClassQuest 后端生产环境停机更新操作说明（交给运维/后端执行）。
职责：在 rsync 代码同步之后，完成 .env.example/.env 对齐、SQLite 初始化、服务重启与验收；不替代 BACKUP-RULES.md 的备份流程。
更新触发：部署步骤、环境变量口径、数据库路径或验收接口变化时，需要同步更新本文件。
-->

# 生产后端更新操作说明（步骤 3）

> **适用**：`/srv/classquest/app/backend/` 已完成步骤 1 备份、步骤 2 rsync（或等价代码已到位）。  
> **参考**：详细备份/回滚见同目录 `BACKUP-RULES.md`；Mac 侧 rsync 见 `scripts/rsync-exclude.txt`（已修复，`.env.example` 会正常上传）。

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

rsync 曾因 exclude 误伤 `.env.example`；若服务器 example 缺少 `LESSON4_*`、`CLASSQUEST_DATABASE_PATH`，任选一种补齐：

**方式 A（推荐）**：维护同事 Mac 上从仓库 `classquest/backend/.env.example` 执行：

```bash
scp backend/.env.example root@<SERVER_HOST>:/srv/classquest/app/backend/.env.example
```

**方式 B**：SSH 上对照仓库最新 `.env.example` 手工编辑。

**验收**：

```bash
cd /srv/classquest/app/backend
grep -E 'LESSON4|CLASSQUEST_DATABASE_PATH|CORS_ALLOWED_ORIGINS' .env.example
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

```bash
chmod 600 .env
```

---

## 3. 初始化 SQLite（首次或 schema 变更后必做）

**无需安装 MySQL/PostgreSQL**。SQLite 由 Python 自带；只需执行初始化脚本建库建表。

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

应能看到课时 4 互审相关表（如 `lesson4_review_requests`，以实际 schema 为准）。

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

## 5. 验收

```bash
curl -sS https://api.xnwyedu.com/api/v1/health
# 预期：{"status":"ok"}

journalctl -u classquest-backend -n 50 --no-pager
```

业务验收（由前端同事配合）：

- 课时 3：`POST .../module4/lesson3/ai-review` → 200，`provider: qwen`
- 课时 4：互审 B1~B7 / `moderate-text` 可写可读 SQLite（无「no such table」类错误）

---

## 6. 常见问题

| 现象 | 处理 |
|------|------|
| `no such table` | 未执行 §3 `init_db.py` 或 `CLASSQUEST_DATABASE_PATH` 指错路径 |
| CORS 报错 | `.env` 补 `CORS_ALLOWED_ORIGINS` 后 restart |
| lesson4 审核 503 | 检查 `DASHSCOPE_API_KEY` 非空 |
| `.env.example` 仍旧 | 重做 §1；下次 rsync 使用最新 `scripts/rsync-exclude.txt` |

---

## 7. 回滚（仅当更新失败）

1. 打开 `/srv/classquest/backups/INDEX.md` 找到批次。  
2. 按该批次 `MANIFEST.txt` 恢复代码与 `env`。  
3. `systemctl restart classquest-backend`。  
4. **不要**用整包 tar 覆盖当前目录而不看 MANIFEST（避免覆盖已更新的文档）。

---

## 8. 与 Mac 仓库的分工

| 内容 | 谁维护 |
|------|--------|
| 业务代码、`BACKUP-RULES.md`、`rsync-exclude.txt` | git + rsync |
| `.env.example` | git + rsync（exclude 已修） |
| 生产 `.env`、SQLite 数据 | **仅服务器**，本说明 §2、§3 |
| `DEPLOYMENT.md` | 仅服务器，exclude 保护，不进 git |

执行完本说明后，在维护计划中将 **步骤 3** 标为完成。
