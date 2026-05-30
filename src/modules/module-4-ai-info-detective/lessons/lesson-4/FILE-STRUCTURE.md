<!--
文件说明：模块 4 课时 4 目录结构真相源。
职责：记录课时 4 前端目录职责、依赖方向和本阶段 Step1/占位边界。
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
│   └── Step1PeerReviewRelay.tsx
├── utils/
│   ├── build-lesson4-review-request.ts
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
    ├── lesson4-rubric.ts
    └── source-type-labels.ts
```

## 职责

- `config.ts`：课时标题、四步流程和路由片段。
- `guards.ts`：进入条件、完成判定和当前步骤解析；本阶段只开放第 1 关，Step2-4 由路由显示锁定占位。
- `routes.tsx`：课时 4 子路由、Guard 和步骤进度条。
- `components/Lesson4SyncBanner.tsx`：Step1 页面级 HTTP 同步/连接状态横幅（与出站/入站面板解耦）。
- `components/PeerReviewGateStatus.tsx`：顶部两个通关条件展示。
- `components/OutboundReviewPanel.tsx`：作者侧送审、同伴学号后两位输入、等待、撤回、轮询、拉取反馈。
- `components/InboundReviewPanel.tsx`：审查者侧刷新任务、输入审查码、领取；claimed 时双卡通过后展示「整体提交」。
- `components/peer-review-workbench/`：审查工作台（试答 → 左栏完整预览 + 右栏分卡评价 → 提交本卡审查）；整体提交在 InboundReviewPanel。
- `utils/build-lesson4-review-request.ts`：从 lesson3 V1 卡构建冻结送审 JSON。
- `utils/validate-lesson4-review-feedback.ts`：分卡校验试答、各维度档位与原因、分卡总体建议与违规；整体提交前校验双卡 approved。
- `utils/collect-lesson4-review-texts.ts`：聚合分卡待审文字，供 moderation adapter 调用。
- `utils/lesson4-review-moderation-local.ts`：默认本地规则 mock，与后端 `moderation.py` 规则对齐。
- `data/lesson4-rubric.ts`：三档档位文案、评价维度列表与帮助说明。

## API adapter

课时 4 页面通过 `api/lesson4-peer-review.adapter.ts` 访问互审后端（B1~B7 HTTP 模式已接通），通过 `api/lesson4-review-moderation.adapter.ts` 做提交前文字审核；教师模式 `isModule4TeacherModeActive()` 强制 fixture，零 lesson4 HTTP。

## 依赖方向

```text
steps → components / utils / app / domains / api
components/peer-review-workbench → components（量规/建议）/ domains / shared ui
utils → domains / data
api/lesson4-peer-review.adapter.ts → api/coerce-lesson4-review-request-json.ts
```

## 边界

课时 4 组件仅限 module-4 内部，禁止 export 到 shared 或跨模块复用。禁止从 `lessons/lesson-3` import 业务组件。Step2-4 本阶段不新增业务组件。
