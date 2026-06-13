<!--
文件说明：src/teacher-console/ 目录结构真相源。
职责：记录教师控制台目录职责、分层边界、依赖方向、命名与新增功能步骤。
更新触发：teacher-console 新增/移动/删除目录文件、调整分层、改变依赖方向或新增功能流程变化时，需要同步更新本文。
-->

# FILE-STRUCTURE — src/teacher-console

## 结构

```text
src/teacher-console/
├── README.md                         # 功能入口、运行模式与 API 口径
├── FILE-STRUCTURE.md                 # 本目录结构真相源
├── routes.tsx                        # /teacher/* 内部路由组合
├── types.ts                          # 教师控制台前端与后端 API 对齐的共享类型
├── app/
│   ├── TeacherConsoleProvider.tsx     # 会话、刷新保活与登录/登出上下文
│   ├── teacher-session-storage.ts     # sessionStorage 持久化
│   └── teacher-permissions.ts         # 角色与班级权限判断
├── api/
│   ├── teacher-auth.adapter.ts        # login/me/logout，fixture|http 双模式
│   ├── teacher-admin.adapter.ts       # teacher/classes、题池 overview/详情 与 admin 授权 API，fixture|http 双模式
│   ├── teacher-lesson5.adapter.ts     # 课时 5 session/锁池/phase/overview/progress/analytics/revision-plans API，fixture|http 双模式
│   └── teacher-lesson6.adapter.ts     # 课时 6 发布审核 list/detail/publish/overview/item-stats API，fixture|http 双模式
├── components/
│   ├── TeacherShell.tsx               # 独立控制台外壳
│   ├── RoleBadge.tsx                  # 角色标签
│   ├── ClassSelector.tsx              # admin 班级选择器
│   ├── PermissionGuard.tsx            # 页面级权限守卫
│   ├── Lesson5SessionCreatePanel.tsx  # 课时 5 session 创建表单
│   ├── Lesson5SessionList.tsx         # session 列表与 draft 设置修改
│   ├── Lesson5PhaseControlBar.tsx     # phase 步骤条、试答控制、C6 计算/开放统计、C7 同步课堂收口提示
│   ├── Lesson5SessionDataTabs.tsx     # 题池/试答/统计/V3 文件夹式标签页容器与阶段解锁
│   ├── Lesson5PoolOverview.tsx        # session overview、班级题池可视与 V2 题卡详情弹窗
│   ├── Lesson5TrialProgressTable.tsx  # C5 试答进度只读轮询表
│   ├── Lesson5AnalyticsPanel.tsx      # C6 题卡级统计 analytics 面板
│   ├── Lesson5RevisionPlansPanel.tsx  # C7 学生 V3 学习任务观察面板
│   ├── Lesson6PublicBankOverview.tsx  # 课时 6 公共题库与待确认审核顶部概览卡
│   ├── Lesson6V3ReviewQueue.tsx       # 课时 6 V3 发布审核队列、筛选与勾选批量确认入口
│   ├── Lesson6V3ReviewPreviewDialog.tsx # 课时 6 V3 题卡预览、统计、修订说明与单张确认弹窗
│   ├── Lesson6ChallengeStatsPanel.tsx # 课时 6 公共挑战基础数字卡与 Top N 简表
│   ├── Lesson6ContextComparisonCard.tsx # 课时 6 课上/访客 context 正确率对比与逐题差异提示
│   └── Lesson6ItemPerformanceTable.tsx # 课时 6 公共题库完整逐题统计表与质量信号标签
├── utils/
│   ├── lesson5-session-data-tabs.ts   # 课时 5 数据标签页解锁/推荐切换规则
│   └── lesson6-stat-signals.ts        # 课时 6 中性质量信号、context 差异阈值与聚合工具
└── pages/
    ├── TeacherLoginPage.tsx           # 账号下拉 + demo 免密码提示 + 非 demo 口令输入
    ├── TeacherHomePage.tsx            # 角色首页、教师班级、题池 overview、最近 session 看板与课时 5/课时 6 入口
    ├── Module4Lesson5ConsolePage.tsx  # 课时 5 教师 session 控制台
    ├── Module4Lesson6ReviewPage.tsx   # 课时 6 教师 V3 发布审核页
    └── AdminClassAssignmentPage.tsx   # admin 班级授权全量覆盖页
```

## 边界

- `teacher-console` 是模块 4 课时 5/课时 6 的教师侧入口，但作为平台顶层独立应用挂载在 `/teacher/*`。
- `platform/router` 只负责挂载本目录路由，不承载教师控制台业务逻辑。
- 本目录可以依赖 `shared` UI 与纯工具，不直接 import 后端代码，不复用模块 4 学生端内部业务状态。
- 当前覆盖账号登录、刷新保活、角色首页、教师班级可见性、demo 全局只读看板、题池 overview/详情和最近 session 摘要只读展示、admin 授权、课时 5 教师 session 控制台，以及课时 6 V3 发布审核页和公共挑战统计面板。
- 课时 5 教师 session 控制台只面向 `manage` 班级，做到建 session、列 session、draft 设置修改、锁池冻结、从 `pool_locked` 开放试答、从 `trial_open` 锁定试答、在 `trial_locked` 计算/重算统计、开放到 `analytics_open` 后同步课堂收口、overview、phase 步骤条、试答进度只读表、analytics 面板和 revision-plans 只读观察面板；`revision_open/closed` 仅作为底层保留阶段存在，不再进入教师端展示或控制。课时 6 发布审核页对 `teacher`/`demo` 可见，顶部展示 publicBank/pendingReview 概览，列表和详情按可见班级只读展示，单张确认与勾选后批量确认只允许目标班级 `manage` teacher 执行；统计标签页通过 overview 与 item-stats 展示基础数字、Top N 简表、全量逐题表、课上/访客 context 对比和中性质量信号。统计面板默认匿名 item 标签，不展示作者姓名/座位、run_id、应答者身份、IP/UA 或匿名 session id。学生 attach、分配、作答、V3 修订与 Lesson6 学生端发布状态查询仍不放入本目录，由模块 4 学生端负责。

## 新增功能步骤

1. 先在 `types.ts` 对齐后端 API 字段。
2. 在 `api/` 中同时补 fixture 与 http 分支，默认 fixture；`VITE_TEACHER_CONSOLE_MODE=http` 走后端，课时 6 HTTP 验收也允许 `VITE_MODULE4_LESSON6_MODE=http` 统一切换教师控制台到后端。
3. 在 `utils/` 中放纯展示规则或统计派生工具；如需权限 helper，再放入 `app/`，避免页面散落权限字符串。
4. 在 `pages/` 或 `components/` 中落 UI，并保持 demo 账号展示全班只读且无写按钮。
5. 若新增路由，更新 `routes.tsx`、本文和必要的根级文档。
