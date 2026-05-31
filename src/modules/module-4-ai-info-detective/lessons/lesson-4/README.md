<!--
文件说明：模块 4 课时 4 对外说明。
职责：说明课时 4 的课程目标、四关流程、QuickCheck、Step4 入库包、阶段快照、就绪三态与进入课时 5 的回退逻辑。
更新触发：课时 4 功能范围、QuickCheck 评分、Step4 保存/导航、快照字段、API 契约、后端联调计划或教师课堂说明变化时，需要同步更新本文件。
-->

# Lesson 4 — 题目卡互审与 V2 入库准备

课时 4 承接课时 3 的新闻/图片 V1 题卡，目标是通过同伴互审拿到 V2 修改前的反馈，并在 Step4 生成本地 `ready_for_lesson5` 入库准备包。

**今日完成链路：** V1 → 同伴反馈 → V2 修改/确认 → 就绪

## 教师使用说明（简版）

**课时定位：** 题目卡互审与 V2 入库准备——学生按 Step1→Step4 四关顺序完成，不可跳关。

| 关卡 | 教师需知 |
|------|----------|
| **Step1 互审** | 每人须完成「送审自己的题卡」+「审别人的题卡」；互审表单含四维度评分、理由与总体建议。双条件 gate：`outbound.completed && inbound.completed` 同时满足才放行。 |
| **Step2 反馈收件箱** | 学生逐条处理收到的互审反馈：`minor_fix` 需决策（含小修保留理由），`major_fix` / `content_violation` 为必改项。全部处理完方可进入 Step3。 |
| **Step3 V2 修改台** | 按反馈分项修改新闻/图片题卡；若互审四段全通过，可不写整体修改说明，直接确认 V2。新闻、图片双卡均 `confirmed` 后进入 Step4。 |
| **Step4 就绪报告** | 检查就绪三态（green/amber/red），green/amber 可保存 V2 入库包；保存时写入 `stageSnapshot` 供后续导出与审计。 |

**课堂关注点：** 互审质量（四维度+理由是否具体）→ 反馈处理是否到位（必改未漏）→ V2 修改是否落实 → Step4 快照中 T1/T2/T3 与就绪三态是否一致。

**演示口令：** `xnwy` — 与学生同一套 UI，强制 fixture、零 HTTP、不写学生 IndexedDB。详见下方 [教师演示模式](#教师演示模式)。

## 四关流程

| 关卡 | 页面 | 完成标记 | 说明 |
|------|------|----------|------|
| Step1 | 同伴互审中转站 | `step1Completed` / `gatePassed` | 双条件 gate：`outbound.completed && inbound.completed` |
| Step2 | 反馈收件箱 | `step2Completed` | 读取 `receivedReviewJson`，生成并保存 `feedbackInbox.decisions` |
| Step3 | V2 修改台 | `step3Completed` | 双卡 `newsConfirmed` / `imageConfirmed`；写入 `v2.*.revision` |
| Step4 | V2 就绪报告 | `step4Completed` / `completed` | 评估就绪三态，保存入库包并写入 `stageSnapshot` |

## Step4 · 保存 V2 入库准备包

- **CTA**：「保存 V2 入库准备包，{下一目标}」——阻塞态（就绪 **red**）时按钮禁用。
- **落盘字段**：`quickCheck`、`readiness.readyForLesson5=true`、`readiness.exportedPackageJson`（`lesson4-ready-for-lesson5-v1` 最小入库包）、`step4Completed`、`completed`、`completedAt`、`stageSnapshot`。
- **进度指针**：课时 5 已在 `lesson-registry` 标记 `available: true` 时写入 `{ lessonId: 5, stepId: 1 }`；否则保持 `{ lessonId: 4, stepId: 4 }`。
- **导航（与课时 3 V1 保存同 pattern）**：
  - 存在且可用的课时 5 → `navigate(registry.lesson5.path)`
  - 尚无课时 5 → `navigate("/module/4")` 模块首页（不 404）

## 就绪三态（green / amber / red）

Step4 对新闻、图片题卡分别评估，综合为整课状态：

| 状态 | 含义 | 能否保存入库包 |
|------|------|----------------|
| **green** | 四段互审均为通过，或修改路径已全部满足 | 是 |
| **amber** | 有小修保留（`keep_with_reason`）且理由已记录 | 是 |
| **red** | 仍有阻塞项（未确认 V2、缺修改说明、必改未解决等） | 否 |

**全通过免 summary：** 当 `areAllCardSectionsPass` 为 true 且无小修保留时，不检查「修改说明完整」；`revision.summary` 允许空字符串，与 `evaluateLesson4V2CardReadiness` / `evaluateLesson4ReadyForLesson5` 一致。

## QuickCheck 与评分拆分

- `data/lesson4-rubric.ts` 统一保存 QuickCheck 分值与阈值：T1 35、T2 30、T3 35；达成阈值分别为 25、21、25；总分等级为 `excellent` / `achieved` / `basic` / `not_achieved`。
- `utils/evaluate-lesson4-quick-check.ts` 只负责 T1/T2/T3 评分和 evidence，不渲染 UI、不写快照、不生成入库包。
- `pass` 不产生作者任务；`minor_fix` 是可决策任务，其中 `keep_with_reason` 需要作者理由；`major_fix` / `content_violation` 是必改任务，未解决时阻塞 T2/T3。
- 全通过题卡允许 `revision.summary` 为空，T3 evidence 会记录 `noRevisionNeeded=true`、`readyForLesson5Status=green`。

## 阶段快照

- **写入时机**：Step4 点击保存入库包成功时，写入 `lesson4.stageSnapshot`（JSON 摘要，随 IndexedDB / 继续学习包持久化）。
- **HTML 导出**：课时 4 任意 step 页顶栏「阶段快照」可下载 `lesson4-full` HTML（`infra/persistence/serializers/snapshot-html.ts`）。
- **摘要字段**：四关完成标记、`gatePassed`、V2 双卡确认与 `revision`、是否收到 `receivedReviewJson`、`quickCheck` 目标分与等级、rubric 观测计数、`decisionsSummary`（含 `authorPlan`）、`readiness`、就绪评估三态。

构建逻辑见 `utils/build-lesson4-stage-snapshot.ts`。

## Step1 互审（摘要）

- 前端 adapter：`api/lesson4-peer-review.adapter.ts`；`.env.local` 设置 `VITE_MODULE4_LESSON4_PEER_REVIEW_MODE=http` 后走真实 HTTP（教师模式强制 fixture）。
- **分卡提交 + 整体提交**、**fieldKey 约定**、**HTTP hydrate**、**倒计时与 20s 轮询** 等行为见历史联调记录（B1~B7 已落地）。

## 教师演示模式

与学生 Step1 **同一套 UI**；教师模式 **强制 fixture**，零 lesson4 HTTP，不写学生 IndexedDB。入口与 preset 见 `app/lesson4-teacher-demo-presets.ts`。

## 进度完整性（audit）

关键字段经 `savePortfolio` → `normalizeModule4Portfolio` → IndexedDB 全量写入，Step3 进入 Step4 时会同步落盘 `feedbackInbox.decisions`。回归测试：

- `utils/lesson4-portfolio-save-audit.regression.test.ts`
- `utils/evaluate-lesson4-ready-for-lesson5.regression.test.ts`

## 运行验证

```bash
npm run build
npx vitest run src/modules/module-4-ai-info-detective/lessons/lesson-4/utils
```

手动验证 Step4：

1. 完成 Step1~3，进入 `/module/4/lesson/4/step/4`。
2. 三态为 green/amber 时点击保存；刷新后 `lesson4.completed` 与 `stageSnapshot` 应仍在。
3. 当前课时 5 未开放，保存后应回到 `/module/4` 首页。
