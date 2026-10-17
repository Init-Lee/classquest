<!--
文件说明：模块 2 目录结构真相源。
职责：记录模块内分层、文件职责、依赖方向、阶段边界和新增课时/关卡的步骤。
更新触发：模块 2 新增目录、移动文件、调整分层、依赖方向、阶段边界或新增功能步骤时，需要同步更新本文件。
-->

# FILE-STRUCTURE — Module 2

## 当前结构（阶段 A）

```text
module-2-ai-comic/
├── app/
│   ├── layout/
│   │   ├── Module2Shell.tsx                 # 模块外壳：Provider、顶栏、教师横幅、学习包按钮位、Outlet
│   │   ├── Module2TopProgress.tsx           # 顶部六课时进度
│   │   └── module2-top-progress-state.ts    # 顶部进度纯函数状态
│   ├── providers/
│   │   └── Module2Provider.tsx              # 教师模式开关、内存演示态；学生档案阶段 A 恒为 null
│   └── lesson-registry.ts                   # 六课时注册表与访问规则纯函数
├── constants/
│   └── teacher-passphrase.ts                # 模块内独立课堂口令校验
├── domains/portfolio/
│   └── types.ts                             # 阶段 A 最小档案骨架；阶段 B 替换为数据契约 v1
├── features/
│   ├── global-actions/
│   │   └── Module2GlobalActions.tsx         # 「保存学习包」「导入学习包」禁用占位
│   └── progress-ui/
│       ├── InnerStepProgress.tsx            # 课时内四关进度组件
│       └── inner-step-progress-state.ts     # 四关进度纯函数状态
├── lessons/lesson-1/
│   ├── components/Module2StepPlaceholder.tsx  # 「本关将在后续阶段实现」占位卡
│   ├── steps/
│   │   ├── Step1ImportNovel.tsx
│   │   ├── Step2ReadSample.tsx
│   │   ├── Step3PickScenes.tsx
│   │   └── Step4VisualDirection.tsx
│   ├── config.ts                            # 四关标题与路径
│   ├── guards.ts                            # 关卡门禁（阶段 A：学生仅第 1 关，教师全开）
│   └── routes.tsx                           # 课时 1 框架：sticky 四关进度、门禁、未解锁卡片
├── pages/
│   └── Module2HomePage.tsx                  # 模块首页
├── module.config.ts                         # 平台配置（id/slug/basePath/status/lessonCount）
├── module2.regression.test.ts               # 骨架纯函数与模块边界回归测试
├── routes.tsx                               # 模块内部路由
├── README.md
└── FILE-STRUCTURE.md
```

## 计划中的目录（尚未创建）

按后续阶段新增，创建时同步更新本文件：

- `infra/persistence/`（阶段 B）：独立本机数据库连接与档案/资产仓库。
- `features/assets/`（阶段 B）：图片资产服务。
- `features/source-import/`、`features/learning-package/`（阶段 C）：小说读取与学习包导出导入；`Module2GlobalActions.tsx` 届时接入真实功能。
- `domains/portfolio/` 下的校验与修改语义（阶段 B）。

## 依赖方向

```text
pages / lessons  → app / features / constants / domains
app              → domains / constants / features（仅 UI 组件）
features         → domains / constants
domains          → 不依赖 app / pages / lessons
模块 2 全部代码   → 只可额外依赖 src/shared/ui、src/shared/utils、src/platform
```

- 禁止 import 其他模块（含模块 1）业务代码；与模块 1 只通过“小说文件”契约连接。`module2.regression.test.ts` 会扫描源码中的跨模块 import。
- 平台层只在 `src/platform/module-registry.ts` 与 `src/platform/router/index.tsx` 组合本模块入口。

## 路由

| 路径 | 内容 |
|---|---|
| `/module/2` | 模块首页 |
| `/module/2/lesson/1/step/1—4` | 课时 1 四关（阶段 A 为占位页） |
| `/module/2/lesson/2—6/*` | 未开放，回到 `/module/2` |
| `/module/2/comic` | 预留给「我的漫画」，当前未开放，回到 `/module/2` |
| 其他未知地址 | 回到 `/module/2` |

## 新增课时 / 关卡步骤

1. 在 `app/lesson-registry.ts` 把对应课时设为 `available: true`，并按真实保存字段实现 `isComplete`。
2. 新建 `lessons/lesson-N/{config,guards,routes}.ts(x)` 与 `steps/`，门禁只看必要字段、确认状态与来源匹配。
3. 在 `routes.tsx` 注册 `lesson/N/*`。
4. 为访问规则与门禁补 `*.regression.test.ts`。
5. 更新本文件与模块 `README.md`；开放首个可用课时后，同步把 `module.config.ts` 与平台注册表的 `status` 改为 `active`。
