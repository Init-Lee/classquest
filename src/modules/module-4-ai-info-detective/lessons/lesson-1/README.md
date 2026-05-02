<!--
文件说明：模块 4 课时 1 说明文档。
职责：说明课时 1 的课程目标、五关结构、状态字段、教师模式和验收边界。
更新触发：课时目标、Step 数量、状态字段、Guard、教师演示策略或快照规则变化时，需要同步更新本文件。
-->

# Module 4 Lesson 1 — 框架发布与样例拆解

课时 1 的目标是让学生先看懂模块四的终局产出：新闻类题目卡 1 张、图片类题目卡 1 张，并理解“四部分题目卡”和网页题库答题前 / 答题后的展示逻辑。

## 五个 Step

1. `Step1MissionBrief`：任务发布，完成三题确认。
2. `Step2SampleObservation`：观察新闻类与图片类样例，确认四部分结构。
3. `Step3CardAnatomy`：将打乱内容归类到四部分题目卡。
4. `Step4QuizFlowDemo`：体验答题前只看素材和任务、答题后展开解析和来源。
5. `Step5TaskChecklist`：确认下一课个人素材准备任务，完成课时 1。

## 本地状态

课时 1 写入 `Module4Lesson1State`，字段包括：

```ts
missionAcknowledged
outcomeCheckPassed
newsSampleViewed
imageSampleViewed
samplePartsConfirmed
cardAnatomyCompleted
cardAnatomyScore
quizFlowSimulated
beforeAfterReason
personalTaskChecklistCompleted
newsSourcePlan
imageSourcePlan
completed
```

## 教师模式

模块四拥有独立教师模式，不复用模块三业务代码。教师入口在 `/module/4` 首页，进入后顶部显示演示横幅，可切换：

- 空白态
- 进行中
- 已完成

教师模式下 Guard 放行，保存只写内存演示档案，不污染学生真实数据。

## 开发边界

本课不调用后端，不写数据库，不实现教师审核、题库提交、真实试答统计或画廊。模块四业务组件留在模块四目录内，不直接 import 模块三业务代码。
