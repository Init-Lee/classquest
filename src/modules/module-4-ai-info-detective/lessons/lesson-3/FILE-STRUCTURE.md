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
│   ├── PreviewModeTabs.tsx
│   ├── InlineSelfCheckPanel.tsx
│   ├── AiReviewPanel.tsx
│   ├── CardEditorSection.tsx
│   └── SourceTypeSelect.tsx
├── data/
├── steps/
└── utils/
```

## 职责

- `config.ts`：课时标题、四步流程和路由片段。
- `guards.ts`：进入条件、完成判定和当前步骤解析。
- `routes.tsx`：课时 3 子路由、Guard 和步骤进度条；第 2～3 步使用全宽工作台布局（非 scroll-snap）。
- `data/default-options.ts`：固定三选项与四类来源类型文案。
- `utils/`：素材指纹、课时 2 快照草稿、自审和 QuickCheck。
- `components/Lesson3ScreenLayout.tsx`：第 1 步全屏滚动分屏布局。
- `components/QuestionCardEditorWorkbench.tsx`：**模块 4 私有**单屏编辑驾驶舱；左右各 50%（四 Tab 编辑 | 两行预览）；第 2、3 步共用，仅 `cardType` 与数据源不同。
- `components/QuestionCardLivePreview.tsx`：题卡答题前/答题后实时预览；桌面两行（图+题 / 解析+完成度与 AI 自检，后者仅编辑工作台传入时显示）。
- `components/InlineSelfCheckPanel.tsx`：四 Tab 结构完成度聚合（右侧反馈面板）。
- `components/AiReviewPanel.tsx`：题卡自检助手；失败不阻断保存 V1。
- `components/CardEditorSection.tsx`：编辑区块容器（保留供其他步骤复用）。
- `components/SourceTypeSelect.tsx`：来源类型选择（课时 2 带入只读场景下暂不在工作台使用）。
- `steps/`：四个路由步骤页面；Step2/Step3 为薄包装，仅传参给 Workbench。

## 依赖方向

```text
steps → components / utils / app / domains
components → api adapter / domains / shared
utils → domains / data
data → domains / question-card types
```

课时 3 组件不得直接调用模型服务或持有 API key，只能通过模块 4 API adapter 访问后端自检能力。
**QuestionCardEditorWorkbench 等编辑器组件仅限 module-4 内部，禁止 export 到 shared 或跨模块。**
