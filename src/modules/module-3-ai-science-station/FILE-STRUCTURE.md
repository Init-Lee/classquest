<!--
文件说明：模块 3 AI 科学传播站目录结构真相源。
职责：记录模块 3 内部 app、pages、lessons、domains、features、infra、utils 和 constants 的职责边界。
更新触发：模块 3 内部新增/移动课时、字段、数据包、教师演示能力、持久化或工具文件时，需要同步修订本文。
-->

# FILE-STRUCTURE — Module 3 AI Science Station

本文件只描述模块 3 内部结构。平台级结构见根 `FILE-STRUCTURE.md`。

## 结构

```text
src/modules/module-3-ai-science-station/
├── README.md
├── FILE-STRUCTURE.md
├── app/                    # 模块 3 应用壳、Provider、教师演示预设、课时注册表
├── pages/                  # 模块 3 首页与旧版导入页
├── lessons/                # 课时 1-6，每课独立 config / guards / routes / steps
├── domains/                # 模块 3 领域类型与纯数据结构
├── features/               # 模块 3 内部功能区
├── infra/                  # 模块 3 本地持久化与序列化
├── utils/                  # 模块 3 专用纯工具
└── constants/              # 模块 3 专用常量与演示数据
```

## 依赖方向

```text
app      → pages / lessons / features / domains / infra / utils / constants / shared
pages    → app / features / domains / shared
lessons  → app / features / domains / infra / utils / shared
features → app / domains / infra / utils / shared
infra    → domains / utils / shared
utils    → domains
shared   → 不依赖模块 3
```

## `app/`

- `layout/AppShell.tsx`：模块 3 顶层外壳、顶部进度、教师演示横幅。
- `layout/GlobalActions.tsx`：保存进度、导入进度、阶段快照、重置。
- `layout/TopLessonProgress.tsx`：课时级进度条。
- `providers/AppProvider.tsx`：模块 3 学习档案 Provider。
- `lesson-registry.ts`：课时注册表与指针修正。
- `teacher-demo-presets.ts`：教师演示模式预设。

## `lessons/`

```text
lessons/
├── lesson-1/
├── lesson-2/
├── lesson-3/
├── lesson-4/
├── lesson-5/
└── lesson-6/
```

每个课时保持自己的 `config.ts`、`guards.ts`、`routes.tsx` 和 `steps/`。

## `domains/`

保存模块 3 领域类型，不放 React 组件。

```text
domains/
├── student/
├── progress/
├── portfolio/
├── group-plan/
├── evidence/
├── prompts/
└── snapshot/
```

## `features/`

- `progress-ui/`：关卡内进度条。
- `material-processing-reference/`：课时 3 材料加工参考。
- `legacy-import/`：旧版数据迁移向导。

## `infra/`

- `persistence/indexeddb/`：浏览器本地存储连接。
- `persistence/repositories/`：学习档案读写仓库。
- `persistence/serializers/`：继续学习包、跨角色文件、阶段快照。

业务代码不得直接访问底层存储，统一通过 repository 与 serializer。

## 跨角色数据包

模块 3 保留以下文件流转：

- 继续学习包：全局保存/导入。
- 组长文件：课时 1 产出，组员导入。
- 个人整理包：课时 3 产出，课时 4 组长导入。
- 小组骨架包：课时 4 组长导出，组员导入。
- 制作方案单：课时 4 组长导出，组员导入。
- 同伴意见包：课时 5 组员导出，组长导入。
- 改动落地汇总包：课时 5 组长导出，组员导入。
- 海报路演讲解路径单：课时 6 导出。

## 重要行为约束

- 页面和步骤组件不直接读写浏览器本地存储。
- 教师演示模式不写入真实学习数据。
- 学生可见文案避免技术词。
- 模块 3 业务组件不得导出给模块 4 复用。
- 路由命名空间固定为 `/module/3/lesson/...`。

