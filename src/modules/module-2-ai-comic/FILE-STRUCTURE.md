<!--
文件说明：模块 2 目录结构真相源。
职责：记录模块内分层、文件职责、依赖方向、阶段边界和新增课时/关卡的步骤。
更新触发：模块 2 新增目录、移动文件、调整分层、依赖方向、阶段边界或新增功能步骤时，需要同步更新本文件。
-->

# FILE-STRUCTURE — Module 2

## 当前结构（阶段 D：课时一四关与教师样例；门户仍为 draft）

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
│   │   └── Module2GlobalActions.tsx         # 学生模式保存／导入学习包；教师模式按钮禁用
│   ├── source-import/                       # 小说字符串解析与候选草稿，不覆盖已确认来源
│   │   ├── parse-novel.ts                   # 按文件内容分流；阶段快照与模块一进度文件只给指引
│   │   ├── parse-novel-html.ts              # 新版数据块与旧版 HTML
│   │   ├── parse-novel-markdown.ts          # 旧版 Markdown；边界不明则转人工
│   │   ├── novel-draft.ts                   # 候选草稿、人工粘贴与改稿
│   │   ├── stage-novel.ts                   # 接入课时 1 的保存候选语义
│   │   ├── teaching-sample.ts               # 教学样例题目与四段正文指纹
│   │   └── source-import.regression.test.ts
│   ├── learning-package/                    # .cqpack 打包、校验与下载
│   │   ├── package-contract.ts              # 路径、体积、文件名与给学生看的文案
│   │   ├── package-zip.ts                   # fflate 打包与限额解压
│   │   ├── package-read.ts                  # 清单、图片与门禁重算
│   │   ├── prepare-learning-package.ts      # 先保存再取快照，自检后才可下载
│   │   ├── pack.worker.ts                   # Vite 模块 Worker
│   │   ├── pack-client.ts                   # 页面侧 Worker 调用
│   │   ├── download-cqpack.ts               # 交给浏览器下载，不声称已写入磁盘
│   │   └── learning-package.regression.test.ts
│   └── progress-ui/
│       ├── InnerStepProgress.tsx            # 课时内四关进度组件
│       └── inner-step-progress-state.ts     # 四关进度纯函数状态
├── lessons/lesson-1/
│   ├── components/
│   │   ├── identity-form.ts             # 第 1 关身份：文件已有项只读，缺项才补填
│   │   ├── identity-form.regression.test.ts # 文件身份锁、合并与确认口径
│   │   ├── lesson1-chrome.tsx           # 关卡标题（第 1 关可占满内容区）；下一关前等待保存完成
│   │   ├── lesson1-step2-visit.ts       # 本机记下已打开第 2 关，供第 1 关只读；不写入档案
│   │   ├── lesson1-step2-visit.regression.test.ts # 第 2 关本机记号按档案分开
│   │   ├── lesson1-commit.ts            # 确认动作等待本机保存完成
│   │   ├── Lesson1CompletePanel.tsx     # 完成页：三项目标、保存学习包、下一课待开放
│   │   ├── OriginalWorkPanel.tsx        # 已确认原作；窄屏在下，宽屏在右
│   │   ├── SampleComicBoard.tsx         # 四格整页、单格对照、教师模拟对照
│   │   ├── SampleResponsibilityCard.tsx # 第 2 关职责与 AARON；窄屏在下可收起，宽屏在右
│   │   ├── SampleFigure.tsx             # 单张样例图与放大
│   │   ├── SampleMissingNotice.tsx      # 列出缺少的样例文件
│   │   └── use-guan-deng-sample.ts      # 读取样例清单
│   ├── sample/load-guan-deng-sample.ts  # 以 sample-manifest.json 为唯一清单
│   ├── steps/
│   │   ├── Step1ImportNovel.tsx         # 顶部单页选项卡、四段田字、占满内容区；进第 2 关后全文只读，解锁或重新导入才改。不提供练习入口
│   │   ├── Step2ReadSample.tsx          # 看懂改编样例并写一条观察；职责解说在右侧知识卡
│   │   ├── Step3PickScenes.tsx          # 起承转合四句
│   │   └── Step4VisualDirection.tsx     # 2—3 个视觉词与一句理由
│   ├── config.ts                            # 四关标题与路径
│   ├── copy.ts                              # 给学生看的固定说明，不含小说正文
│   ├── guards.ts                            # 关卡门禁：调用 lesson1-update 的真实门禁，教师全开
│   └── routes.tsx                           # 四关、最近一关、门禁；旧练习地址回到第 1 关
├── pages/
│   ├── Module2HomePage.tsx                  # 模块首页
│   └── dev/Module2AssetsDevPage.tsx         # 仅开发环境：图片资产测试页（独立夹具档案，不切换活动档案）
├── module.config.ts                         # 平台配置（id/slug/basePath/status/lessonCount）
├── module2.regression.test.ts               # 骨架纯函数、门禁与模块边界回归测试
├── routes.tsx                               # 模块内部路由
├── README.md
└── FILE-STRUCTURE.md
```

## 模块外静态素材

`classquest/public/module-2/samples/guan-deng/` 是教师样例的静态文件，从 `build_Plan/module-2/assets/` 原样复制。页面只 fetch `sample-manifest.json` 及其点名的原文、记录和图片。这些图片不是学生资产，不进 assets store，也不进学习包。`sample-viewer.html` 只随素材保留，页面不嵌入它。

## 计划中的目录（尚未创建）

按后续阶段新增，创建时同步更新本文件：

- 课时 2—6 的关卡页面。课时 1 不再使用占位页。`features/source-import/` 的解析和确认函数由第 1 关直接调用。

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
| `/module/2/lesson/1/step/1—4` | 课时 1 四关。改编样例只在第 2 关；进入第 2 关仍须本人小说已确认且不是教学样例 |
| `/module/2/lesson/1/practice` | 已收掉。直连回到第 1 关 `/module/2/lesson/1/step/1` |
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
