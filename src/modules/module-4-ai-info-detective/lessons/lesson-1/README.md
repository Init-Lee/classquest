<!--
文件说明：模块 4 课时 1 说明文档。
职责：说明课时 1 的课程目标、五关结构、状态字段、教师模式和验收边界。
更新触发：课时目标、Step 数量、状态字段、Guard、教师演示策略或快照规则变化时，需要同步更新本文件。
-->

# Module 4 Lesson 1 — 框架发布与样例拆解

课时 1 的目标是让学生先看懂模块四的终局产出：新闻类题目卡 1 张、图片类题目卡 1 张；通过样例观察、四部分结构拆解和完整题卡模板说明，理解题卡由「素材展示、判断任务、解析、来源与核验入口」组成，并在课末确认下一课需要准备的新闻类与图片类候选素材包。

## 五个 Step

1. `Step1MissionBrief`：任务发布，完成三题确认。
2. `Step2SampleObservation`：观察新闻类与图片类样例，完成判断、解析核验和样例查看记录。
3. `Step3CardAnatomy`：复用样例结构舞台，完成田字型四部分结构配对。
4. `Step4QuizFlowDemo`：以“完整题卡说明书”方式查看素材展示、判断任务、解析、来源与核验入口四个模块，并在底部单次总确认完整题卡模板。
5. `Step5TaskChecklist`：填写下一课新闻/图片候选素材包计划，选择可能来源类型，阅读「避免使用素材」与「出口确认」左右分栏，并通过底部单次总勾选完成课时 1。

## 本地状态

课时 1 写入 `Module4Lesson1State`，字段包括：

```ts
missionAcknowledged
outcomeCheckPassed
missionQuizAttempts
missionQuizPassedAt
step2
newsSampleViewed
imageSampleViewed
samplePartsConfirmed
cardAnatomyCompleted
cardAnatomyScore
fullCardTemplateConfirmed
fullCardTemplateConfirmedAt
materialPrepChecklistKeys
materialPrepChecklistCompletedAt
step5
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
