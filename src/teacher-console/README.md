<!--
文件说明：teacher-console 功能入口说明。
职责：说明教师控制台的范围、运行模式、路由入口、账号口径与当前已实现能力。
更新触发：教师控制台功能范围、运行方式、环境变量、账号/API 契约或后续 Live Session 阶段变化时，需要同步更新本文。
-->

# Teacher Console

`src/teacher-console/` 是模块 4 课时 5 的教师控制台前端入口，独立挂载在 `/teacher/*`，不进入平台门户壳或模块 4 学生学习外壳。

## 当前范围

- 登录页：仅列 `xnwy-admin`、`xnwy-li`、`xnwy-zhang`、`xnwy-tang`、`xnwy-demo` 五个账号；`xnwy-demo` 免密码，其它账号的真实口令由用户输入，不在前端硬编码。
- 刷新保活：登录 token 与用户快照保存到 `sessionStorage`，刷新后通过 `me` 恢复。
- 角色首页：admin 显示授权入口；teacher 显示可见班级的题池规模、最近课时 5 会话、运行类型、阶段状态、题量与更新时间，并仅为 `manage` 班级提供「进入课时5控制台」入口；demo 是全局只读看板，显示全部班级的 `view` 概览且无写按钮。
- admin 授权页：读取班级、账号和授权明细，保存时调用教师班级授权全量覆盖写入。
- 课时 5 控制台页：`/teacher/module/4/lesson/5` 仅面向 `manage` 班级，支持建 session、列 session、draft 设置修改、锁池冻结当前 V2、从 `pool_locked` 开放试答、从 `trial_open` 锁定试答、在 `trial_locked` 计算/重算统计并开放到 `analytics_open`；开放统计反馈即同步课堂收口，学生 V3 改为学生端学习任务，不再由教师端控制。页面仍展示 session overview、phase 步骤条、C5 试答 progress 表、C6 analytics 面板与 C7 revision-plans 只读观察面板；班级当前 V2 题池卡片可点击懒加载当前 V2 详情弹窗；`view`/demo 账号停留在首页只读看板，不进入操作控制台；progress 表每 5 秒读取全班 answered/rated/completed 聚合，不展示答案、解析或来源，analytics 面板默认不暴露题卡作者身份。

本目录当前不实现学生实时运行时，不包含学生 attach、分配、作答；教师端 C7b 覆盖统计计算、统计开放、revision-plans 只读监控与同步课堂收口提示，学生 V3 由模块 4 学生端完成。

## 运行模式

默认 fixture：

```bash
npm run dev
```

HTTP 联调：

```bash
VITE_TEACHER_CONSOLE_MODE=http VITE_MODULE4_LESSON5_MODE=http npm run dev
```

HTTP 模式对接 C1a-C7a：

- `POST /api/v1/module4/auth/login`
- `GET /api/v1/module4/auth/me`
- `POST /api/v1/module4/auth/logout`
- `GET /api/v1/teacher/module4/classes`
- `GET /api/v1/teacher/module4/lesson5/classes/{class_id}/pool-overview`
- `GET /api/v1/teacher/module4/lesson5/classes/{class_id}/pool-items/{item_id}`
- `POST /api/v1/teacher/module4/lesson5/sessions`
- `GET /api/v1/teacher/module4/lesson5/sessions?classId={class_id}`
- `PATCH /api/v1/teacher/module4/lesson5/sessions/{session_id}/settings`
- `POST /api/v1/teacher/module4/lesson5/sessions/{session_id}/lock-pool`
- `POST /api/v1/teacher/module4/lesson5/sessions/{session_id}/phase`
- `GET /api/v1/teacher/module4/lesson5/sessions/{session_id}/overview`
- `GET /api/v1/teacher/module4/lesson5/sessions/{session_id}/progress`
- `POST /api/v1/teacher/module4/lesson5/sessions/{session_id}/compute-stats`
- `GET /api/v1/teacher/module4/lesson5/sessions/{session_id}/analytics`
- `GET /api/v1/teacher/module4/lesson5/sessions/{session_id}/revision-plans`
- `GET /api/v1/admin/module4/classes`
- `GET /api/v1/admin/module4/users`
- `GET /api/v1/admin/module4/class-assignments`
- `PUT /api/v1/admin/module4/teachers/{user_id}/classes`

如需指定后端地址，沿用全局 `VITE_API_BASE_URL`；本地 Vite 代理默认转发 `/api` 到 `http://127.0.0.1:8000`。

fixture 演示统计开放与 V3 观察可设置 `VITE_MODULE4_LESSON5_FIXTURE_PHASE=analytics_open`。若从 `trial_locked` 手动推进，请先点“计算统计”，再点“开放统计”，此时同步课堂即已收口。
