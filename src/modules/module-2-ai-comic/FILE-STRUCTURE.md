<!--
文件说明：模块 2 目录结构真相源。
职责：记录模块内分层、文件职责、依赖方向、阶段边界和新增课时/关卡的步骤。
更新触发：模块 2 新增目录、移动文件、调整分层、依赖方向、阶段边界或新增功能步骤时，需要同步更新本文件。
-->

# FILE-STRUCTURE — Module 2

## 当前结构（阶段 B）

```text
module-2-ai-comic/
├── app/
│   ├── layout/
│   │   ├── Module2Shell.tsx                 # 模块外壳：Provider、顶栏、保存状态、教师横幅、学习包按钮位、Outlet
│   │   ├── Module2SaveStatus.tsx            # 唯一的保存状态组件：正在保存…／已保存到本机／保存失败（可重试）
│   │   ├── Module2TopProgress.tsx           # 顶部六课时进度
│   │   └── module2-top-progress-state.ts    # 顶部进度纯函数状态
│   ├── providers/
│   │   ├── Module2Provider.tsx              # 学生档案加载／自动创建、保存状态、教师模式
│   │   ├── module2-save-coordinator.ts      # 保存协调器：合并保存、事务完成后才报“已保存”、替换时加锁
│   │   ├── module2-save-coordinator.regression.test.ts
│   │   └── module2-teacher-mode.ts          # 教师模式内存持久化；教师模式下导入／重置不生效
│   └── lesson-registry.ts                   # 六课时注册表与访问规则纯函数（课时 1 完成看真实门禁）
├── constants/
│   ├── class-options.ts                     # 班级／座号选项（与模块一口径一致，独立维护）
│   ├── class-options.regression.test.ts
│   ├── resource-limits.ts                   # RESOURCE_LIMITS 与 IMAGE_PRESETS（初始值，待机房验证）
│   └── teacher-passphrase.ts                # 模块内独立课堂口令校验
├── domains/portfolio/
│   ├── types.ts                             # 数据契约 v1 与 createNewModule2Portfolio
│   ├── validate.ts                          # 运行时校验：结构合法性、引用一致性、未来版本拒绝
│   ├── validate.regression.test.ts
│   ├── lesson1-update.ts                    # 课时 1 修改语义、失效规则与四关门禁（唯一门禁实现）
│   ├── lesson1-update.regression.test.ts
│   └── image-versions.ts                    # 档案内图片版本与资产清单的纯函数追加
├── infra/persistence/
│   ├── indexeddb/
│   │   ├── connection.ts                    # 数据库 classquest-module2-v1 与四个 store 的定义、连接
│   │   └── transaction.ts                   # 事务封装：只在 complete 时成功，异常即 abort；错误分类
│   ├── repositories/
│   │   ├── portfolio.repository.ts          # 唯一的档案仓库：保存、图片版本、导出快照、原子替换
│   │   ├── asset.repository.ts              # 资产 blob 与缩略图缓存读写
│   │   └── asset-record.ts                  # 资产记录的读取校验
│   ├── module2-persistence.ts               # 默认仓库实例（共享一个连接）
│   └── persistence.regression.test.ts       # 基于 fake-indexeddb 的仓库测试
├── features/
│   ├── assets/
│   │   ├── asset-service.ts                 # 图片入库主流程：识别→检查→解码→主图／缩略图→去重保存
│   │   ├── image-sniff.ts                   # 按魔数识别 MIME、读文件头尺寸与透明标记、上限检查
│   │   ├── image-plan.ts                    # 主图／缩略图尺寸与格式规划
│   │   ├── image-canvas.ts                  # 解码（按 EXIF 方向）、透明检测、canvas 输出
│   │   ├── sha256.ts                        # SHA-256（crypto.subtle 优先，纯 JS 兜底）
│   │   ├── serial-queue.ts                  # 串行／限并发执行器
│   │   └── assets.regression.test.ts
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
│   ├── guards.ts                            # 关卡门禁：调用 lesson1-update 的真实门禁，教师全开
│   └── routes.tsx                           # 课时 1 框架：首次进入创建空白档案、四关进度、门禁、未解锁卡片
├── pages/
│   ├── Module2HomePage.tsx                  # 模块首页
│   └── dev/Module2AssetsDevPage.tsx         # 仅开发环境：图片资产测试页（独立夹具档案，不切换活动档案）
├── module.config.ts                         # 平台配置（id/slug/basePath/status/lessonCount）
├── module2.regression.test.ts               # 骨架纯函数、门禁与模块边界回归测试
├── routes.tsx                               # 模块内部路由
├── README.md
└── FILE-STRUCTURE.md
```

## 计划中的目录（尚未创建）

按后续阶段新增，创建时同步更新本文件：

- `features/source-import/`、`features/learning-package/`（阶段 C）：小说读取与学习包导出导入；`Module2GlobalActions.tsx` 届时接入真实功能。

## 依赖方向

```text
pages / lessons  → app / features / infra / constants / domains
app              → infra / domains / constants / features（仅 UI 组件）
features         → infra / domains / constants
infra            → domains / constants
domains          → constants；不依赖 app / pages / lessons / features / infra
模块 2 全部代码   → 只可额外依赖 src/shared/ui、src/shared/utils、src/platform
```

- 上述方向约束生产代码；`*.regression.test.ts` 为组装测试场景可引用其他层。
- 门禁、档案仓库、保存状态组件各只有一套实现（`lesson1-update.ts`、`portfolio.repository.ts`、`Module2SaveStatus.tsx`），不要再新增平行实现。
- IndexedDB 事务内不 await 异步工作（哈希、解码、字节比较都在事务外完成）。
- `pages/dev/` 只能通过 `import.meta.env.DEV` 条件懒加载注册，不能被生产代码静态 import；它只能读写自己的夹具档案。

- 禁止 import 其他模块（含模块 1）业务代码；与模块 1 只通过“小说文件”契约连接。`module2.regression.test.ts` 会扫描源码中的跨模块 import。
- 平台层只在 `src/platform/module-registry.ts` 与 `src/platform/router/index.tsx` 组合本模块入口。

## 路由

| 路径 | 内容 |
|---|---|
| `/module/2` | 模块首页 |
| `/module/2/lesson/1/step/1—4` | 课时 1 四关（当前为占位页） |
| `/module/2/dev/assets` | 仅开发环境：图片资产测试页；生产构建不注册 |
| `/module/2/lesson/2—6/*` | 未开放，回到 `/module/2` |
| `/module/2/comic` | 预留给「我的漫画」，当前未开放，回到 `/module/2` |
| 其他未知地址 | 回到 `/module/2` |

## 新增课时 / 关卡步骤

1. 在 `app/lesson-registry.ts` 把对应课时设为 `available: true`，并按真实保存字段实现 `isComplete`。
2. 新建 `lessons/lesson-N/{config,guards,routes}.ts(x)` 与 `steps/`，门禁只看必要字段、确认状态与来源匹配。
3. 在 `routes.tsx` 注册 `lesson/N/*`。
4. 为访问规则与门禁补 `*.regression.test.ts`。
5. 更新本文件与模块 `README.md`；开放首个可用课时后，同步把 `module.config.ts` 与平台注册表的 `status` 改为 `active`。
