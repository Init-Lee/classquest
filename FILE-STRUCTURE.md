<!--
文件说明：ClassQuest 仓库结构真相源。
职责：记录平台级目录、模块边界、依赖方向、文档双锚点和新增模块流程；不穿透到具体课时字段。
更新触发：新增/移动平台级目录、模块目录、backend 目录、依赖边界或文档规则变化时，必须同步修订本文。
-->

# FILE-STRUCTURE — ClassQuest Root

本文件只描述仓库根级、平台级和模块级结构。模块内部课时、领域字段、数据包格式和后端服务细节，写入最近一层的 `README.md` 与 `FILE-STRUCTURE.md`。

## 根结构

```text
classquest/
├── public/                         # 静态公共资源
├── src/                            # 前端源码
│   ├── main.tsx                    # 前端入口，挂载平台路由
│   ├── index.css                   # 全局样式入口
│   ├── platform/                   # 平台门户、全局路由、模块注册表
│   ├── teacher-console/            # 模块 4 课时 5 教师控制台，独立挂载 /teacher/*
│   ├── modules/                    # 独立课程模块
│   │   ├── module-3-ai-science-station/
│   │   └── module-4-ai-info-detective/
│   └── shared/                     # 业务无关 UI 与纯工具
├── backend/                        # V1.5 FastAPI 后端骨架，含模块 4 课时 5 Phase 0 地基/C1a-C7a API 与课时 6 C0-C1b 后端
├── docs/                           # V1.5 架构与迁移文档
├── scripts/                        # 前端根级构建与发布前检查脚本
├── package.json
├── vite.config.ts
├── tsconfig.json
├── README.md
└── FILE-STRUCTURE.md
```

## 前端边界

### `src/platform/`

平台层负责：

- 平台门户首页
- 全局路由组合
- 模块注册表
- 平台级外壳
- 旧路径重定向

平台层不放任何课时步骤、题卡、继续学习包、小组协作或教师审核业务。

### `src/teacher-console/`

教师控制台是模块 4 课时 5 的教师侧独立入口，拥有自己的：

- README
- FILE-STRUCTURE
- routes
- app
- api
- pages
- components
- types

它承载登录、刷新保活、角色首页、教师班级可见性、demo 全班只读、admin 班级授权，以及课时 5 教师 session 控制台。当前范围包含建 session、列 session、draft 设置修改、锁池冻结、开放试答、锁定试答、计算/开放统计、开放统计后同步课堂收口、overview、phase 展示、C5 progress 只读表、C6 analytics 面板和 C7 revision-plans 只读观察面板；不复用模块 4 学生端内部业务状态，也不承载学生 attach、分配、作答或 V3 修订。

### `src/modules/`

每个模块是独立课程应用。模块拥有自己的：

- README
- FILE-STRUCTURE
- module.config
- routes
- pages
- lessons
- domains
- features
- infra
- components

模块之间禁止直接 import 业务代码。

### `src/shared/`

shared 只能放业务无关内容。

允许：

- UI 原子组件
- 视觉布局无关 primitives
- 通用 className 工具
- 纯格式化工具（不得包含模块业务词）

禁止：

- 课时 Guard
- 继续学习包格式
- 题卡业务
- 小组合并逻辑
- 教师演示逻辑
- 模块 3 或模块 4 专有领域类型

## 后端边界

`backend/` 是 V1.5 轻量后端骨架，服务模块 4 运行时操作。它不替代 Moodle，不承载模块 3 的本地学习进度。模块 4 课时 5 当前完成 Phase 0 后端地基、C1a 账号权限 API、C2a 题池提交/overview API、C3a 教师 session 后端控制、C4a 学生 session/assignment API、C5a answer/rating/progress API、C6a compute-stats/analytics/my-report API 与 C7a V3 修订/completion-summary/revision-plans API：schema 加载、fixture inspect/export/seed 管线、`backend/app/modules/module4/lesson5/` auth/admin/teacher/pool/session/participant/assignment/answer/rating/progress/stats/report/revision/completion 服务，以及 C1a 账号 seed 脚本。课时 6 C0-C1b 已接入 V3 发布审核、教师发布确认、学生本人状态查询、匿名公共挑战 runs/current/answers/summary 与分 context 统计。C7b 已接入学生 Step4 V3 修订与教师 revision-plans 面板。

后端内部结构详见 `backend/FILE-STRUCTURE.md`。

## 根级脚本边界

`scripts/` 只放前端根级构建、发布前检查或仓库级维护脚本，不放后端运行时脚本。后端初始化、备份、seed 与 fixture 导出脚本继续放在 `backend/scripts/`。

## 依赖方向

```text
platform        → modules / teacher-console / shared
teacher-console → shared
modules         → shared
shared          → 不依赖 platform / modules / teacher-console / backend
backend         → 不被前端源码直接 import
```

允许示例：

```ts
import { Button } from '@/shared/ui/button'
import { MODULE_REGISTRY } from '@/platform/module-registry'
```

禁止示例：

```ts
// 模块 4 内禁止引用模块 3 业务代码
import { SomeModule3Component } from '@/modules/module-3-ai-science-station/...'
```

## 文档双锚点

- 根 `README.md`：对外入口，说明项目是什么、怎么运行、模块状态、技术栈和版本策略。
- 根 `FILE-STRUCTURE.md`：结构真相源，说明平台/模块级目录职责和依赖方向。

结构变化时按最近层级更新：

- 平台、teacher-console 或模块级目录变化：更新根 `FILE-STRUCTURE.md`。
- 模块 3 内部变化：更新 `src/modules/module-3-ai-science-station/FILE-STRUCTURE.md`。
- 模块 4 内部变化：更新 `src/modules/module-4-ai-info-detective/FILE-STRUCTURE.md`。
- 后端顶层变化：更新 `backend/FILE-STRUCTURE.md`。
- 模块 4 后端内部变化：更新 `backend/app/modules/module4/FILE-STRUCTURE.md`。

## 新增模块流程

1. 在 `src/modules/module-N-slug/` 下创建 `README.md` 与 `FILE-STRUCTURE.md`。
2. 创建 `module.config.ts`、`routes.tsx` 与模块首页。
3. 在 `src/platform/module-registry.ts` 注册模块入口。
4. 只把业务无关 UI 放入 `src/shared`。
5. 更新根 `README.md` 和本文件。

## 当前版本口径

- 稳定发布：`v0.6.0`，模块 3 六课时完成。
- 当前主线版本：`0.7.3`，模块 4 课时 3「题目卡 V1 制作与解析填写」本地前端流程已合入后的发布口径；主线文档已同步课时 4 Step1-Step4、V2 ready 包与 lesson4 后端 routes 的实际边界。
- 上一发布：`0.7.2`，模块 4 课时 2「素材搜集与合规初筛」。
- 模块 4 当前已建立独立 app / domains / infra / lessons 结构，课时 1-5 已落地到课时 5 Step4；课时 4 已覆盖互审、反馈处理、V2 修改台、V2 就绪报告、QuickCheck、阶段快照和 V2 ready 包，并可通过 lesson4 peer-review / moderation / SQLite routes 联调；课时 5「云端 Live Lesson Session」已进入开发阶段，当前完成 Phase 0 后端 schema、fixture inspect/export/seed 管线、C1a auth/admin/teacher 账号权限 API、C1b/C2b 前端 teacher-console（含题池 overview 只读展示）、C2a 题池提交/overview API、学生 Step1 提交流、C3a session 后端控制、C3b 前端教师控制台、C4a 学生 session/assignment 后端、C4b 学生连接/分配列表、C5a 后端 answer/rating/progress、C5b 前端单题作答评分 UI/图片素材渲染/教师 progress 表/锁定试答按钮、C6a 后端 compute-stats/analytics/my-report、C6b 学生报告与教师 analytics 面板、C7a 后端 V3 修订/completion-summary/revision-plans，以及 C7b 学生 Step4 修订快照与教师 revision-plans 面板。课时 6 后端已完成 C0-C1b：发布审核、公共题库 overview、学生发布状态、匿名公共挑战和分 context 统计。

