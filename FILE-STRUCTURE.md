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
│   ├── modules/                    # 独立课程模块
│   │   ├── module-3-ai-science-station/
│   │   └── module-4-ai-info-detective/
│   └── shared/                     # 业务无关 UI 与纯工具
├── backend/                        # V1.5 FastAPI 后端骨架
├── docs/                           # V1.5 架构与迁移文档
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

`backend/` 是 V1.5 轻量后端骨架，服务模块 4 运行时操作。它不替代 Moodle，不承载模块 3 的本地学习进度。

后端内部结构详见 `backend/FILE-STRUCTURE.md`。

## 依赖方向

```text
platform → modules / shared
modules  → shared
shared   → 不依赖 platform / modules / backend
backend  → 不被前端源码直接 import
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

- 平台或模块级目录变化：更新根 `FILE-STRUCTURE.md`。
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
- 当前主线版本：`0.7.0`，平台化架构已合入后的发布口径。
- 当前开发分支：`module-4-lesson-1-dev`，模块 4 课时 1 本地前端流程开发中，合并后计划发布 `v0.7.1`。
- 模块 4 当前已建立独立 app / domains / infra / lessons 结构，课时 1 已落地；课时 2-6 后续逐课时开发。

