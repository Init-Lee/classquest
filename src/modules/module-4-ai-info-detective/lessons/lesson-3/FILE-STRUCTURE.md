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
├── data/
├── steps/
└── utils/
```

## 职责

- `config.ts`：课时标题、四步流程和路由片段。
- `guards.ts`：进入条件、完成判定和当前步骤解析。
- `routes.tsx`：课时 3 子路由、Guard 和步骤进度条。
- `data/default-options.ts`：固定三选项与四类来源类型文案。
- `utils/`：素材指纹、课时 2 快照草稿、自审和 QuickCheck。
- `components/`：共用题卡编辑器、实时预览、来源选择、嵌入式自审和题卡自检助手。
- `steps/`：四个路由步骤页面。

## 依赖方向

```text
steps → components / utils / app / domains
components → api adapter / domains / shared
utils → domains / data
data → domains / question-card types
```

课时 3 组件不得直接调用模型服务或持有 API key，只能通过模块 4 API adapter 访问后端自检能力。
