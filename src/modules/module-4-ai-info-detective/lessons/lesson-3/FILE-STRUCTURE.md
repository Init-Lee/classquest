<!--
文件说明：模块 4 课时 3 目录结构真相源。
职责：记录课时 3 前端目录职责、依赖方向和新增文件边界。
更新触发：课时 3 新增组件、步骤、工具、数据文件或依赖方向变化时，需要同步更新本文件。
-->

# FILE-STRUCTURE — Lesson 3

## 结构

```text
lessons/lesson-3/
├── README.md
├── FILE-STRUCTURE.md
├── config.ts
├── guards.ts
├── routes.tsx
├── components/
│   ├── Lesson3ScreenLayout.tsx
│   ├── QuestionCardEditorWorkbench.tsx
│   ├── QuestionCardLivePreview.tsx
│   ├── PreviewModeTabs.tsx          # 遗留组件，当前流程未引用
│   ├── QuestionCardSelfTrialPanel.tsx
│   ├── SelfTrialStatusStrip.tsx
│   ├── SelfTrialFeedbackPanel.tsx
│   ├── TaskOptionsEditor.tsx
│   ├── InlineSelfCheckPanel.tsx
│   ├── AiReviewPanel.tsx
│   ├── CardEditorSection.tsx
│   ├── SourceTypeSelect.tsx
│   └── useImeSafeDraftValue.ts
├── data/
├── steps/
└── utils/
```

## 职责

- `config.ts`：课时标题、四步流程和路由片段。
- `guards.ts`：进入条件、完成判定和当前步骤解析。
- `routes.tsx`：课时 3 子路由、Guard 和步骤进度条；第 2～4 步使用全宽工作台布局（非 scroll-snap）。
- `data/default-options.ts`：固定三选项与四类来源类型文案。
- `utils/`：素材指纹、课时 2 快照草稿、课时 2 手动同步、自审、QuickCheck 和自测失效规则。
- `utils/lesson2-snapshot-sync.ts`：检测课时 2 素材变更；学生确认后只同步素材/来源相关字段，并标记 AI 自检过期。
- `components/Lesson3ScreenLayout.tsx`：第 1 步全屏滚动分屏布局。
- `components/QuestionCardEditorWorkbench.tsx`：**模块 4 私有**单屏编辑驾驶舱；左右各 50%（四 Tab 编辑 | 两行预览）；第 2、3 步共用，仅 `cardType` 与数据源不同。
- `components/QuestionCardLivePreview.tsx`：题卡完整实时预览，直接展示素材、判断任务、参考答案、解析与来源核验。
- `components/QuestionCardSelfTrialPanel.tsx`：第 4 步三栏自测试答面板（素材 / 判断任务 / 答题反馈）。
- `components/SelfTrialStatusStrip.tsx`：第 4 步顶部极简状态条，展示新闻/图片自测进度并承载返回编辑器与确认 CTA。
- `components/SelfTrialFeedbackPanel.tsx`：第 4 步答题反馈右栏；答错时只展示所选选项解析、核心解析和来源核验，不单独展示参考答案解析。
- `components/TaskOptionsEditor.tsx`：判断选项与选项解析编辑器。
- `components/InlineSelfCheckPanel.tsx`：四 Tab 结构完成度聚合（右侧反馈面板）。
- `components/AiReviewPanel.tsx`：题卡自检助手；展示整体结果与四板块 ✅/❌，失败不阻断本地编辑。
- `utils/derive-lesson3-ai-review-tier.ts`：把 Qwen 自检结果归一为 `优秀 / 基本合格 / 不通过`，供编辑页门禁和面板文案复用。
- `components/CardEditorSection.tsx`：编辑区块容器（保留供其他步骤复用）。
- `components/SourceTypeSelect.tsx`：来源类型选择；课时 3 编辑题卡副本时可调整来源类型，不回写课时 2。
- `steps/`：四个路由步骤页面；Step2/Step3 为薄包装，仅传参给 Workbench。

## 依赖方向

```text
steps → components / utils / app / domains
components → api adapter / domains / shared
utils → domains / data
data → domains / question-card types
```

课时 3 组件不得直接调用模型服务或持有 API key，只能通过模块 4 API adapter 访问后端自检能力。进入后续自测试答前，题卡必须通过本地结构完成度，并让 AI 自检达到 `优秀` 或 `基本合格`；只有 `不通过` 需要补齐硬性缺失后重新自检。课时 3 只编辑题卡副本，不回写课时 2；编辑副本后旧 AI 自检结果标记为过期。编辑工作台右侧按实时预览与题卡自检助手拆分展示。
**QuestionCardEditorWorkbench 等编辑器组件仅限 module-4 内部，禁止 export 到 shared 或跨模块。**
