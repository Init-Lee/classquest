<!--
文件说明：模块 4 课时 4 目录结构真相源。
职责：记录课时 4 前端目录职责、依赖方向和 Step1~4 完整流程边界。
更新触发：课时 4 新增组件、步骤、工具、数据文件、API adapter 或依赖方向变化时，需要同步更新本文件。
-->

# FILE-STRUCTURE — Lesson 4

## 当前结构

```text
lessons/lesson-4/
├── README.md
├── FILE-STRUCTURE.md
├── config.ts
├── guards.ts
├── routes.tsx
├── components/
│   ├── Lesson4StepLayout.tsx
│   ├── Lesson4SyncBanner.tsx
│   ├── PeerReviewGateStatus.tsx
│   ├── OutboundReviewPanel.tsx
│   ├── InboundReviewPanel.tsx
│   ├── ReviewCodeInput.tsx
│   ├── ReviewCountdown.tsx
│   ├── PeerReviewWorkbench.tsx          # re-export
│   ├── PeerReviewCardTrial.tsx          # 遗留，工作台已改用 peer-review-workbench
│   ├── PeerReviewRubricPanel.tsx
│   ├── PeerReviewSuggestionEditor.tsx
│   ├── feedback-inbox/
│   │   ├── FeedbackCardPanel.tsx       # 合并统计 + 四维度逐项 + 整体建议 + 不合规说明
│   │   ├── FeedbackCardStatsRow.tsx    # 单卡顶部小计（通过/小修/重改/内容合规 ✓✗）
│   │   ├── FeedbackDecisionItem.tsx
│   │   ├── FeedbackDecisionControls.tsx
│   │   └── FeedbackLevelBadge.tsx
│   ├── v2-revision-workbench/         # Step3 满屏修改台（拷贝 lesson-3 工作台交互模式，禁止 import lesson-3）
│   │   ├── V2RevisionWorkbench.tsx    # 左 2/3 wizard + 右 1/3 单卡三区建议
│   │   ├── V2RevisionSectionEditor.tsx
│   │   └── V2RevisionAdviceCard.tsx
│   ├── v2-readiness/                    # Step4 就绪报告与保存 CTA
│   │   ├── V2ReadinessCard.tsx
│   │   ├── V2PackagePreview.tsx
│   │   ├── V2ReadinessChecklist.tsx
│   │   └── ReadyForLesson5ActionBar.tsx
│   └── peer-review-workbench/
│       ├── PeerReviewWorkbench.tsx      # 编排：固定左右分栏（左试答+解析、右常驻评价）→ 提交
│       ├── PeerReviewTrialPhase.tsx
│       ├── PeerReviewSelfTrialPanel.tsx
│       ├── PeerReviewSelfTrialFeedbackPanel.tsx
│       ├── PeerReviewCardLivePreview.tsx
│       ├── PeerReviewFullPreviewPanel.tsx
│       ├── PeerReviewEvaluationPanel.tsx   # 右栏：量规维度 + 分卡总体建议/违规 + 字段级 Badge
│       ├── PeerReviewContentViolationField.tsx
│       ├── PeerReviewModerationTags.tsx    # 字段级 PeerReviewFieldIssueBadges
│       └── PeerReviewSubmitBar.tsx         # 「提交本卡审查」
├── steps/
│   ├── Step1PeerReviewRelay.tsx
│   ├── Step2FeedbackInbox.tsx
│   ├── Step3V2RevisionWorkbench.tsx
│   ├── Step4V2ReadinessReport.tsx
│   └── …
├── utils/
│   ├── build-lesson4-stage-snapshot.ts   # Step4 写入 lesson4.stageSnapshot
│   ├── get-lesson4-post-save-target.ts   # Step4 保存后 navigate 目标（课时5 / 模块首页）
│   ├── lesson4-portfolio-save-audit.regression.test.ts
│   ├── build-lesson4-ready-package.ts
│   ├── evaluate-lesson4-quick-check.ts   # T1/T2/T3 纯评分与 evidence
│   ├── evaluate-lesson4-quick-check.regression.test.ts
│   ├── evaluate-lesson4-ready-for-lesson5.ts
│   ├── derive-lesson4-class-id.ts
│   ├── evaluate-lesson4-gate.ts
│   ├── reset-lesson4-outbound.ts
│   ├── reset-lesson4-inbound.ts
│   ├── lesson4-sync-status.ts
│   ├── normalize-lesson4-review-status.ts
│   ├── lesson4-timers.ts
│   ├── validate-lesson4-review-feedback.ts
│   ├── collect-lesson4-review-texts.ts
│   ├── lesson4-review-moderation-local.ts
│   └── is-lesson4-option-key.ts
└── data/
    ├── lesson4-rubric.ts                  # 互审量规 + QuickCheck 分值/阈值常量
    └── source-type-labels.ts
```

## 职责

- `config.ts`：课时标题、四步流程和路由片段。
- `guards.ts`：进入条件、完成判定和当前步骤解析。
- `routes.tsx`：课时 4 子路由、Guard 和步骤进度条；Step3 启用满屏 workbench 布局（`document.overflow=hidden`，高度 `calc(100dvh - sticky - chrome)`）。
- `components/v2-revision-workbench/`：Step3 V2 修改台；左 2/3 四段 wizard 编辑，右 1/3 单 Card 三区（本项建议 / 总体+合规 / 作者整体反馈）。
- `components/Lesson4StepLayout.tsx`：课时 4 步骤页容器；支持 `titleExtra` 在标题行右侧展示连接状态等。
- `components/Lesson4SyncBanner.tsx`：Step1 HTTP 同步/连接状态；`variant="inline"` 用于标题行右侧紧凑展示。
- `components/PeerReviewGateStatus.tsx`：顶部两个通关条件与环形互审说明（整合于条件列表下方）。
- `components/OutboundReviewPanel.tsx`：作者侧送审、同伴学号后两位输入、等待、撤回、轮询、拉取反馈。
- `components/InboundReviewPanel.tsx`：审查者侧刷新任务、输入审查码、领取；claimed 时双卡通过后展示「整体提交」。
- `components/peer-review-workbench/`：审查工作台（试答 → 左栏完整预览 + 右栏分卡评价 → 提交本卡审查）；整体提交在 InboundReviewPanel。
- `utils/evaluate-lesson4-quick-check.ts`：纯函数评分层；只计算 T1/T2/T3 分数、达成状态、evidence、总分等级和 blockers。
- `utils/build-lesson4-stage-snapshot.ts`：Step4 保存入库包时复用 `quickCheck` 构建 `lesson4.stageSnapshot` 摘要，不内联评分逻辑。
- `utils/get-lesson4-post-save-target.ts`：解析课时 5 是否可用及保存后 navigate 路径。
- `utils/build-lesson4-ready-package.ts`：构建 `readiness.exportedPackageJson`（`lesson4-ready-for-lesson5-v1`），仅携带课时 5 必需的双卡与就绪摘要。
- `utils/evaluate-lesson4-ready-for-lesson5.ts`：Step4 就绪三态 green/amber/red 与分组清单。
- `utils/validate-lesson4-review-feedback.ts`：分卡校验试答、各维度档位与原因、分卡总体建议与违规；整体提交前校验双卡 approved。
- `utils/collect-lesson4-review-texts.ts`：聚合分卡待审文字，供 moderation adapter 调用。
- `utils/lesson4-review-moderation-local.ts`：默认本地规则 mock，与后端 `moderation.py` 规则对齐。
- `data/lesson4-rubric.ts`：三档档位文案、评价维度列表、帮助说明与 QuickCheck T1/T2/T3 分值阈值。

## API adapter

课时 4 页面通过 `api/lesson4-peer-review.adapter.ts` 访问互审后端（B1~B7 HTTP 模式已接通），通过 `api/lesson4-review-moderation.adapter.ts` 做提交前文字审核；教师模式 `isModule4TeacherModeActive()` 强制 fixture，零 lesson4 HTTP。

## 依赖方向

```text
steps → components / utils / app / domains / api
components/v2-revision-workbench → components/feedback-inbox / utils / domains / shared ui
components/peer-review-workbench → components（量规/建议）/ domains / shared ui
utils → domains / data
api/lesson4-peer-review.adapter.ts → api/coerce-lesson4-review-request-json.ts
```

- `components/feedback-inbox/`：Step2 反馈收件箱；每张题卡合并展示统计、四维度评价、整体建议与内容合规说明。
- Step4 UI 只调用 `evaluate-lesson4-quick-check.ts`、`evaluate-lesson4-ready-for-lesson5.ts`、`build-lesson4-ready-package.ts` 与 `build-lesson4-stage-snapshot.ts`；禁止在 Step4 组件内新增评分、快照或包字段拼装逻辑。

## 边界

课时 4 组件仅限 module-4 内部，禁止 export 到 shared 或跨模块复用。禁止从 `lessons/lesson-3` import 业务组件。
