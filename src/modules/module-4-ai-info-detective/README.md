<!--
文件说明：模块 4 AI 信息辨识员说明。
职责：说明模块 4 的课程目标、当前课时交付状态、开发阶段、教师模式和模块边界。
更新触发：模块 4 课程结构、题卡结构、页面路由、mock/fixture API、教师模式或后端接入策略变化时，需要同步更新本文件。
-->

# Module 4 — AI 信息辨识员

模块 4 是七年级收束模块，目标是围绕新闻与图片中的 AI 痕迹判断，完成题卡创作、教师审核、匿名试答、快速评分和画廊发布。

## 当前状态

课时 1「框架发布与样例拆解」已完成本地前端流程，提供独立 Module4Provider、IndexedDB 本地档案、继续学习包、阶段快照和教师讲解模式。第 1 关任务发布采用「固定关卡进度条 + 下方纵向吸附分屏滚动」与出血背景分段；第 2 关样例观察分屏完成新闻类/图片类的观察判断与解析核验；第 3 关用田字型结构配对拆解题卡四部分；第 4 关以说明书形式拆解完整题卡模板；第 5 关作为出口任务单，填写新闻/图片候选素材计划并一次性完成出口确认。

课时 2「素材搜集与合规初筛」已随 `v0.7.2` 发布本地前端流程。它以新闻截图和图片素材两条工作线为核心，完成素材准备现状登记、四项体检标准挑战、来源记录格式检查、素材自检、初步疑点提示、同伴/自我交流记录、`lesson2-full` 阶段快照和 QuickCheck 无感记录。来源检查只输出「来源记录格式通过」，不判断来源真实可信。

课时 3「题目卡 V1 制作与解析填写」已随 `v0.7.3` 发布本地前端流程。它从课时 2 新闻/图片素材复制快照，制作两张 V1 题卡，提供左右分栏编辑器、实时预览与题卡自检助手、嵌入式自审、Qwen/mock 题卡自检助手、`lesson3-full` 阶段快照和继续学习包字段。若学生回到课时 2 修改素材，课时 3 会提示“手动重新带入课时 2 最新素材”，并说明替换材料风险；学生可同步、不采纳或关闭提醒，同步时只更新素材/来源快照字段，不覆盖题干、答案、解析等 V1 创作内容。课时 3 只保存 V1 初稿，不做互审、V2、难度标注、正式入库、网页试答或 Q 分数。

课时 4「题目卡互审与 V2 入库准备」已完成 Step1-Step4：第 1 关「同伴互审中转站」送审/轮询/撤回/收件箱/领取/提交/拉取均可联调真实后端；第 2 关处理收到的互审反馈；第 3 关进入 V2 修改台完成新闻/图片双卡修订与确认；第 4 关生成 V2 就绪报告、QuickCheck、`stageSnapshot` 与 `ready_for_lesson5` 入库准备包。`VITE_MODULE4_LESSON4_PEER_REVIEW_MODE=http` 时学生端走 HTTP；**教师讲解模式强制 fixture**，不请求 lesson4 API、不写 IndexedDB。

课时 5 已进入「云端 Live Lesson Session」开发阶段，当前完成后端 Phase 0 schema/fixture 管线、C1a auth/admin/teacher 账号权限 API、C2a 学生 V2 提交与教师题池 overview API、C3 session 控制、C4a 学生 active-session/participant/assignment 后端、C5a answer/rating/progress 后端、C6a compute-stats/analytics/my-report 后端、C7a V3 修订/completion-summary/revision-plans 后端，以及前端 C7b Step1「提交 V2 后连接课堂」、Step2「等待试答 + 紧凑题序 + 单题作答/揭示/快评」、Step3「本人题卡统计报告」与 Step4「V3 学习任务工作台 + completion-summary + 本地快照」。学生端默认 fixture，可用 `VITE_MODULE4_LESSON5_MODE=http` 切到真实后端；fixture 试答演示需设置 `VITE_MODULE4_LESSON5_FIXTURE_PHASE=trial_open`，报告与 V3 学习任务演示需设置为 `analytics_open`。Step2 会渲染 `material.asset.dataUrl` 图片素材；Step3 展示并保存本人 news/image 题卡统计、三色样本状态和诊断提示；Step4 在 `analytics_open` 后即可提交 V3，保存 `lesson5-stage-v1` 并支持 `lesson5-full` HTML 快照。

首页建档与模块三一致：姓名、班级（初一（1）班～初一（12）班）、班学号（左侧班级序号只读 + 右侧学号后两位 01～50，合成四位存档）；无档案不可直接进入课时 1（直达 `/module/4/lesson/1/...` 会退回 `/module/4`）。

已创建或更新：

- `module.config.ts`
- `routes.tsx`
- `pages/Module4HomePage.tsx`
- `app/`
- `domains/`
- `infra/`
- `lessons/lesson-1/`
- `lessons/lesson-2/`
- `lessons/lesson-3/`
- `lessons/lesson-4/`
- `lessons/lesson-5/`
- `api/`
- `README.md`
- `FILE-STRUCTURE.md`

## 后续课程结构

1. 框架发布与样例拆解
2. 素材搜集与合规初筛
3. 题卡创作与解释撰写
4. 题目卡互审与 V2 入库准备
5. 网页试答与反馈优化
6. 题库发布与可信反思

## 开发策略

- Phase A：本地前端流程。当前完成课时 1-4，其中课时 4 已覆盖互审、反馈处理、V2 修改台、V2 就绪报告、QuickCheck、阶段快照和 V2 ready 包；课时 5 已开放 Step1 提交 V2 到题池、Step2 等待/紧凑题序、单题作答、图片素材渲染、答案揭示和三维快评、Step3 本人题卡统计报告，以及 Step4 V3 修订、completion-summary 保存和 `lesson5-full` HTML 快照，课时 6 按独立分支/阶段推进。
- Phase B：课时 4 已完成 SQLite 基座与 B1~B7 真实同伴互审联调；后续扩展云端 Live Lesson Session、试答、评分、画廊等运行时能力。
- Phase C：按课时接入 FastAPI；课时 3 题卡自检助手与课时 4 peer-review / moderation / SQLite API 已接入，课时 5 已接入 C1a 账号权限、C2a 学生 V2 提交/题池 overview、C3 session 控制、C4a 学生 attach/assignment 端点、C5a answer/rating/progress 端点、C6a compute-stats/analytics/my-report 端点与 C7a V3 修订/completion-summary/revision-plans 端点。
- Phase D：统计重算与频段展示。

## 教师模式

教师入口位于 `/module/4` 首页。进入后顶部显示教师讲解横幅，Guard 会放行，课时 1-5 可直接浏览；选择题、判断题、结构配对等客观答案默认隐藏，由教师按需点击显示；填空、素材工作台与计划类内容使用示例档案直接展示，保存只写内存讲解档案。课时 3 讲解档案预填新闻/图片题卡参考答案、解析、来源核验与第 4 步自测结果；题卡自检助手与学生端共用线上 API，演示素材的静态图片路径不会提交给后端。课时 5 teacher-console 前端入口已可用，HTTP 模式可查看班级题池 overview、控制 session 到 `pool_locked/trial_open/trial_locked/analytics_open` 并在开放统计反馈后同步课堂收口，计算/重算统计，查看 C5 试答 progress 表、C6 analytics 面板与 C7 revision-plans 只读观察面板；学生端 Step2 可显示等待状态、紧凑题序、单题作答、图片素材、揭示和快评，Step3 可查看本人题卡统计报告，Step4 可在 `analytics_open` 后提交 V3 修订并导出阶段快照。

**课时 4 教师演示**：与学生 Step1 同一 UI；`utils/module4-teacher-mode-flag.ts` 的 `isModule4TeacherModeActive()` 使 adapter 强制 fixture（零 lesson4 HTTP）；Step1 提供「演示状态」一键切换（`app/lesson4-teacher-demo-presets.ts`）；进入 `/module/4/lesson/4` 时横幅提示「演示 · 不写入学生数据」。

## 边界规则

模块 4 业务组件留在本目录内。即使与模块 3 视觉相似，也不要直接 import 模块 3 业务代码。