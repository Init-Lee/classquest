<!--
文件说明：ClassQuest 生产环境备份与回滚规则。
职责：规定停机维护前的 deploy 批次备份、MANIFEST/INDEX 格式、服务器侧回滚流程，以及 Mac rsync 发布时的排除清单引用；供工程师或 Agent 在服务器维护时阅读，日常开发使用 git 版本管理。
更新触发：备份目录约定、回滚流程、rsync 发布路径或验收 URL 变化时，需要同步更新本文件；公网 IP 等敏感连接信息不得写入 git，应使用 SSH 配置或私有运维备忘。
-->

# ClassQuest 备份规则

> **版本口径**：2026-05-31 后端停机更新计划采用本规则。  
> **执行原则**：每次维护前先读本文件 → 在服务器按规则操作 → 追加 `INDEX.md` 一行。  
> **版本控制**：本文件进 git；`INDEX.md` 与备份数据仅留服务器。

---

## 1. 两类备份域分离


| 根目录                            | 用途          | 典型内容                                            | 当前状态                                |
| ------------------------------ | ----------- | ----------------------------------------------- | ----------------------------------- |
| `/srv/classquest/backups/`     | **运维/部署快照** | 代码 tar、`.env` 快照、health、Nginx/systemd 配置备份、验收记录 | **本次启用**                            |
| `/var/lib/classquest/backups/` | **运行时数据**   | SQLite、uploads、exports                          | **未来**（见 `scripts/backup_daily.sh`） |


不要把运行时数据库/上传文件与部署快照混在同一棵树；回滚「一次维护事件」时只查 `deploy/` 批次。

---

## 2. 方案完整目录树

```text
/srv/classquest/backups/
├── INDEX.md                          # 备份索引（每次维护追加一行，仅服务器）
├── _shared/                          # 长期工具/参考文件（非快照）
│   └── rsync-exclude.txt             # 服务器 rsync 排除清单
├── deploy/                           # 按「维护事件」归档（推荐回滚入口）
│   └── YYYYMMDD-<短标签>/
│       ├── MANIFEST.txt              # 本批次说明 + 回滚命令摘要
│       ├── backend-code.tar.gz
│       ├── env                       # .env 快照（chmod 600）
│       ├── health.json
│       └── service-status.txt
└── config/                           # 非更新流程中的单独配置备份
    ├── nginx/
    │   └── YYYYMMDD-<短标签>.<原扩展名>.bak
    └── systemd/
        └── YYYYMMDD-<短标签>.service.bak
```

**命名规则**：

- **事件批次**：`deploy/YYYYMMDD-<短标签>/`（示例：`20260531-update`、`20260801-hotfix`）
- **零散配置**：`config/<类型>/YYYYMMDD-<短标签>.<原扩展名>.bak`（示例：`config/nginx/20260524-initial.conf.bak`）
- **批次内固定文件名**（便于脚本与文档引用）：`backend-code.tar.gz`、`env`、`health.json`、`service-status.txt`、`MANIFEST.txt`

> 历史平铺文件（如根目录 `nginx.conf.bak.20260524`）可在维护时可选迁入 `config/nginx/`，不强制。

---

## 3. MANIFEST.txt 模板

每个 `deploy/YYYYMMDD-<标签>/` 目录在步骤 1 备份结束时写入 `MANIFEST.txt`，内容示例：

```text
事件: 20260531 后端停机更新
范围: backend 代码 + .env + 更新前 health/服务状态
回滚代码: tar xzf /srv/classquest/backups/deploy/20260531-update/backend-code.tar.gz -C /srv/classquest/app
回滚 env:  cp /srv/classquest/backups/deploy/20260531-update/env /srv/classquest/app/backend/.env && chmod 600 /srv/classquest/app/backend/.env
重启:      systemctl restart classquest-backend
验收:      curl https://api.xnwyedu.com/api/v1/health
```

生成时请将路径中的 `DATE`、`TAG` 替换为实际批次目录。

---

## 4. INDEX.md 格式

**位置**：`/srv/classquest/backups/INDEX.md`（仅服务器，不进 git）。

**表头**（文件不存在时先创建）：

```markdown
# ClassQuest 备份索引

| 日期 | 类型 | 路径 | 触发原因 | 回滚入口 |
|------|------|------|----------|----------|
```

**每次备份后追加一行**（Markdown 表格行）：

```markdown
| 2026-05-31 | deploy | deploy/20260531-update/ | 后端停机更新 | /srv/classquest/backups/deploy/20260531-update/MANIFEST.txt |
```


| 列    | 说明                                           |
| ---- | -------------------------------------------- |
| 日期   | 维护日期（`YYYY-MM-DD`）                           |
| 类型   | `deploy` 或 `config/nginx`、`config/systemd` 等 |
| 路径   | 相对 `backups/` 的路径                            |
| 触发原因 | 人工可读说明                                       |
| 回滚入口 | 该批次 `MANIFEST.txt` 绝对路径，或 config 文件的恢复说明     |


---

## 5. 备份命令模板（参数化）

在服务器 SSH 执行；仅在停机、维护、更新等前运行备份操作。

```bash
DATE=20260531          # 改为实际日期 YYYYMMDD
TAG=update             # 短标签，如 update、hotfix
BATCH=/srv/classquest/backups/deploy/${DATE}-${TAG}
mkdir -p "${BATCH}" /srv/classquest/backups/_shared

# 1.0 确保 rsync 排除清单在 _shared（若仍在根目录则移一次）
[ -f /srv/classquest/backups/rsync-exclude.txt ] && \
  mv /srv/classquest/backups/rsync-exclude.txt /srv/classquest/backups/_shared/rsync-exclude.txt

# 1.1 备份 .env（含 API Key，勿外传）
cp /srv/classquest/app/backend/.env "${BATCH}/env"
chmod 600 "${BATCH}/env"

# 1.2 备份当前后端代码
tar czf "${BATCH}/backend-code.tar.gz" -C /srv/classquest/app backend

# 1.3 记录当前服务状态（便于回滚对比）
systemctl status classquest-backend nginx --no-pager > "${BATCH}/service-status.txt"
curl -sS https://api.xnwyedu.com/api/v1/health > "${BATCH}/health.json"

# 1.4 写入本批次 MANIFEST（回滚摘要）
cat > "${BATCH}/MANIFEST.txt" <<EOF
事件: ${DATE} 后端停机更新
范围: backend 代码 + .env + 更新前 health/服务状态
回滚代码: tar xzf ${BATCH}/backend-code.tar.gz -C /srv/classquest/app
回滚 env:  cp ${BATCH}/env /srv/classquest/app/backend/.env && chmod 600 /srv/classquest/app/backend/.env
重启:      systemctl restart classquest-backend
验收:      curl https://api.xnwyedu.com/api/v1/health
EOF

# 1.5 追加 INDEX.md（若不存在则先创建表头）
INDEX=/srv/classquest/backups/INDEX.md
if [ ! -f "${INDEX}" ]; then
  cat > "${INDEX}" <<'HEADER'
# ClassQuest 备份索引

| 日期 | 类型 | 路径 | 触发原因 | 回滚入口 |
|------|------|------|----------|----------|
HEADER
fi
echo "| $(date +%Y-%m-%d) | deploy | deploy/${DATE}-${TAG}/ | 后端停机更新 | ${BATCH}/MANIFEST.txt |" >> "${INDEX}"
```

**步骤 1 手动 check 要点**：批次目录含 5 个文件；`env` 为 `600` 且非空；`health.json` 为 `{"status":"ok"}`；`INDEX.md` 已追加一行；`_shared/rsync-exclude.txt` 可访问。

---

## 6. 回滚流程

**顺序**：先 **INDEX** → 再 **MANIFEST** → 再 **执行**。

1. 打开 `/srv/classquest/backups/INDEX.md`，按日期/类型找到目标批次或 config 路径。
2. 进入对应目录，阅读 `MANIFEST.txt`（deploy 批次）或 config 文件旁的恢复说明。
3. 按 MANIFEST 中的命令恢复代码、`.env` 或配置，然后 `systemctl restart classquest-backend`（及必要时 `nginx -t && systemctl reload nginx`）。
4. 用 `curl https://api.xnwyedu.com/api/v1/health` 与业务接口验收。


| 场景        | 操作摘要                                                                        |
| --------- | --------------------------------------------------------------------------- |
| 新代码无法启动   | 从 MANIFEST「回滚代码」解压 tar → 重启 backend                                         |
| `.env` 改坏 | 从 MANIFEST「回滚 env」复制 env 快照 → `chmod 600` → 重启                              |
| 依赖装坏      | 重建 `.venv` 后 `pip install -r requirements.txt` → 重启                         |
| Nginx 改坏  | 从 `config/nginx/` 对应 `.bak` 复制回 `/etc/nginx/conf.d/` → `nginx -t && reload` |


---

## 7. rsync-exclude 说明


| 环境           | 路径                                                  | 是否进 git             |
| ------------ | --------------------------------------------------- | ------------------- |
| Mac 本地 rsync | `classquest/backend/scripts/rsync-exclude.txt`      | **是**               |
| 服务器          | `/srv/classquest/backups/_shared/rsync-exclude.txt` | 否（服务器副本，与 Mac 保持一致） |


在仓库根目录 `classquest/` 下执行上传（**勿将公网 IP 写入 git**；`SERVER_HOST` 使用 SSH 配置中的 `Host` 别名或私有运维备忘中的主机名）：

```bash
cd classquest   # 或你的 monorepo 中 classquest 所在目录
rsync -avz --delete \
  --exclude-from=./backend/scripts/rsync-exclude.txt \
  ./backend/ \
  root@${SERVER_HOST}:/srv/classquest/app/backend/
```

清单排除 `.env`、`.venv`、`node_modules/`、`logs/`、`DEPLOYMENT.md`（服务器运维手册，不进 git）、`runtime/db/`、真实 fixture/testdata、本地 SQLite、密钥与缓存等；**禁止**用 rsync 覆盖服务器已有 `.env` 或上传本地测试库。`.env.example` **会**上传（exclude 中禁止写 `.env.*`，否则 macOS rsync 会连 example 一并跳过）。

**会随 rsync 更新**：`.env.example`（进 git，是变量口径真相源）。  
**不会随 rsync 更新**：生产 `.env`（含 API Key）。因此代码升级后，若 `.env.example` 新增了课时 4、`CLASSQUEST_DATABASE_PATH` 等项，**生产 `.env` 不会自动跟上**，需人工合并（见下节）。

---

## 8. `.env.example` 与生产 `.env`（rsync 后必核对）

| 文件 | rsync | 说明 |
|------|-------|------|
| `.env.example` | **会更新** | 仓库口径；可与备份 tar 内 `backend/.env.example` 对比，确认本次已上传新版本 |
| `.env` | **不传输** | 生产密钥与开关；mtime 应早于备份里的 `env` 快照，且不被 rsync 刷新 |

**步骤 2 验收**：除确认 `.env` 未被覆盖外，应确认服务器 `.env.example` 已含当前仓库全部键（如 `LESSON4_REVIEW_MODERATION_*`、`CLASSQUEST_DATABASE_PATH`）。若与 Mac 仓库 `diff` 仍有旧版，说明 rsync 未执行或源目录不对。

**步骤 3 停机维护前**（在服务器 `app/backend/`）——把 example 里**新增键**并入生产 `.env`，**勿覆盖**已有 `DASHSCOPE_API_KEY` 等值：

```bash
cd /srv/classquest/app/backend
# 列出 .env 中缺失的键名（仅检查，不打印密钥）
grep -E '^[A-Z][A-Z0-9_]*=' .env.example | cut -d= -f1 | while read -r k; do
  grep -q "^${k}=" .env 2>/dev/null || echo "缺失: ${k}"
done
# 人工编辑 .env 补行（可参考 .env.example 的注释与默认值）
chmod 600 .env
```

本地开发同理：`cp .env.example` 只适用于首次；后续改 example 后应手动把新行合并进 `backend/.env`，再 `init_db` / 重启。

---

## 9. 项目与服务器分工


| 文件                          | 存放                                                                 | 进 git                 |
| --------------------------- | ------------------------------------------------------------------ | --------------------- |
| `BACKUP-RULES.md`           | 仓库 `classquest/backend/BACKUP-RULES.md`；rsync 后 `/srv/classquest/app/backend/BACKUP-RULES.md` | **是**                 |
| `INDEX.md`                  | `/srv/classquest/backups/INDEX.md`                                 | **否**                 |
| 备份数据                        | `backups/deploy/`、`backups/config/`                                | **否**（含 `.env` 快照，敏感） |
| `scripts/rsync-exclude.txt` | 仓库 `classquest/backend/scripts/`；服务器 `_shared/` 副本                  | Mac 侧 **是**           |


相关文档：`[FILE-STRUCTURE.md](./FILE-STRUCTURE.md)`。生产逐步部署见服务器上的 `DEPLOYMENT.md`（不进本仓库）或仓库 `docs/DEPLOYMENT-V1_5.md`。
