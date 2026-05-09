<!--
文件说明：模块 4 课时 2 目录结构真相源。
职责：记录课时 2 内部文件职责、依赖方向和扩展规则，作为后续维护素材体检流程的结构锚点。
更新触发：课时 2 新增/删除主要文件、调整目录职责、移动领域类型或改变素材体检流程时，需要同步修订本文。
-->

# FILE-STRUCTURE — Module 4 Lesson 2

## 当前结构

```text
src/modules/module-4-ai-info-detective/lessons/lesson-2/
├── README.md
├── FILE-STRUCTURE.md
├── config.ts
├── guards.ts
├── routes.tsx
├── assets/
│   ├── step1-context.jpg
│   ├── step1-case-news.png
│   ├── step1-case-ai-image.jpg
│   ├── step1-case-privacy.jpg
│   ├── 类型符合.jpg
│   ├── 来源追溯.jpg
│   ├── 内容合规.jpg
│   ├── 价值判断.jpg
│   ├── step2_case_video_clip.jpg
│   ├── step2_case_unsourced_image.jpg
│   ├── step2_case_clear_faces.jpg
│   └── step2_case_obvious_ai_meme.jpg
├── components/
│   ├── Lesson2StepLayout.tsx
│   ├── CompressedMaterialUploader.tsx
│   ├── MaterialPreviewCard.tsx
│   ├── MaterialCriteriaRecheckCard.tsx
│   ├── ScreeningCriteriaCard.tsx
│   ├── SourceRecordGuide.tsx
│   ├── SourceRecordCheckBadge.tsx
│   ├── MaterialSelfCheckPanel.tsx
│   ├── MaterialReportCard.tsx
│   └── MaterialWorkbenchForm.tsx
├── data/
│   └── screening-examples.ts
├── steps/
│   ├── Step1MaterialBaseline.tsx
│   ├── Step2ScreeningCriteria.tsx
│   ├── Step3NewsWorkbench.tsx
│   ├── Step4ImageWorkbench.tsx
│   └── Step5ScreeningReport.tsx
└── utils/
    ├── compress-material-image.ts
    ├── source-record-check.ts
    ├── material-completion.ts
    └── evaluate-lesson2-quickcheck.ts
```

## 文件职责

- `config.ts`：课时元数据与五关展示文案。
- `guards.ts`：五关进入条件、完成状态和当前关卡解析。
- `routes.tsx`：课时 2 子路由、Guard、课内进度条和教师模式放行。
- `assets/step1-context.jpg`：第 1 关情境冲突屏插图，仅服务课时 2 第 1 关。
- `assets/step1-case-news.png`：第 1 关新闻截图快判案例，来自课时 1 样例素材的课时 2 独立副本。
- `assets/step1-case-ai-image.jpg`：第 1 关无来源 AI 感图片快判案例，来自课时 1 样例素材的课时 2 独立副本。
- `assets/step1-case-privacy.jpg`：第 1 关清晰人脸/隐私风险快判案例。
- `assets/类型符合.jpg`、`assets/来源追溯.jpg`、`assets/内容合规.jpg`、`assets/价值判断.jpg`：第 2 关第一屏四关体检标准主视觉图。
- `assets/step2_case_video_clip.jpg`、`assets/step2_case_unsourced_image.jpg`、`assets/step2_case_clear_faces.jpg`、`assets/step2_case_obvious_ai_meme.jpg`：第 2 关第二屏四关标准应用校准案例图。
- `components/CompressedMaterialUploader.tsx`：图片选择、压缩、预览与替换。
- `components/MaterialPreviewDialog.tsx`：第 3/4 关素材卡预览弹窗，整合图片、来源、自检、疑点、交流和当前三态结果。
- `steps/Step3NewsWorkbench.tsx`：新闻素材个人工作台，桌面端提供轻量固定左侧悬浮进度锚点，主内容按截图/来源、复核/记录、完成检查分组撑满页面推进，并自动生成三态结果。
- `steps/Step4ImageWorkbench.tsx`：图片素材个人工作台，复用第 3 关布局结构，按图片/来源、复核/记录、完成检查分组推进，并自动生成三态结果。
- `components/MaterialCriteriaRecheckCard.tsx`：旧版个人素材四关复判入口，当前课时 2 主流程已不再引用。
- `components/MaterialWorkbenchForm.tsx`：旧版第 3/4 关通用工作台表单，当前课时 2 主流程已不再引用。
- `components/MaterialSelfCheckPanel.tsx`：学生自检三项，不包含来源可追溯勾选。
- `utils/source-record-check.ts`：基础来源记录格式检查，不验证真实可信。
- `utils/evaluate-lesson2-quickcheck.ts`：无感生成 T1/T2/T3 的 achieved、evidence 与过程 metrics，不在学生闯关主界面显性评分。
- `../../infra/persistence/serializers/snapshot-html.ts`：课时 2 `lesson2-full` 阶段快照导出入口，按关卡顺序输出过程数据、素材卡、实时 QuickCheck 和整体进度。

## 依赖方向

允许：

```text
lesson-2 → app/providers
lesson-2 → domains/portfolio
lesson-2 → features/progress-ui
lesson-2 → shared/ui
lesson-2 → shared/utils
```

禁止：

```text
lesson-2 → module-3 business code
lesson-2 → backend fetch / API direct calls
lesson-2 → source truth verification / OCR / AI detection
```

## 更新规则

如果课时 2 新增主要字段或导出内容，需要同步更新：

- 本文件。
- 模块级 `FILE-STRUCTURE.md`。
- `domains/portfolio/types.ts` 的归一化逻辑。
- `infra/persistence/serializers/snapshot-html.ts` 的 `lesson2-full` 输出。
