/**
 * 文件说明：模块 1 课时 4 只读写作设定汇总。
 * 职责：在共用抽屉内按课时 1/2/3/4 分组展示已确认设定与本课情节安排；标题与交替底色走共用分组壳，不参与存档或完成判定。
 * 更新触发：侧栏字段、SDG 展示、占位文案、课组标题或本课开头/情节展示规则变化时，需要同步更新本文件。
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import type {
  Module1Lesson1State,
  Module1Lesson2State,
  Module1Lesson3State,
  Module1Lesson4State,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON4_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson4-copy"
import {
  Module1WritingSummaryBlock,
  Module1WritingSummaryGroup,
} from "@/modules/module-1-ai-story/features/writing-drawer/Module1WritingSummaryGroup"
import { buildModule1Lesson4WritingSummary } from "@/modules/module-1-ai-story/lessons/lesson-4/utils/build-lesson4-writing-summary"

interface Lesson4WritingSummaryProps {
  lesson1: Module1Lesson1State
  lesson2: Module1Lesson2State
  lesson3: Module1Lesson3State
  lesson4: Module1Lesson4State
}

export function Lesson4WritingSummary({
  lesson1,
  lesson2,
  lesson3,
  lesson4,
}: Lesson4WritingSummaryProps) {
  const summary = buildModule1Lesson4WritingSummary(lesson1, lesson2, lesson3, lesson4)

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg">{summary.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-relaxed">
        <p className="text-muted-foreground">{summary.intro}</p>
        <Module1WritingSummaryGroup lesson="lesson1">
          <Module1WritingSummaryBlock title="SDG 主题">
            <p>故事年份：{summary.year}（{MODULE1_LESSON4_SHARED_COPY.yearNote}）</p>
            <p>SDG 主题：{summary.sdg}</p>
            <p>选择理由：{summary.sdgWhy}</p>
          </Module1WritingSummaryBlock>
          <Module1WritingSummaryBlock title="城市问题">
            <p>城市问题：{summary.cityIssue}</p>
          </Module1WritingSummaryBlock>
          <Module1WritingSummaryBlock title="写给谁">
            <p>写给谁：{summary.audience}</p>
            <p>关注点：{summary.audienceConcern}</p>
          </Module1WritingSummaryBlock>
          <Module1WritingSummaryBlock title="主题核心">
            <p className="whitespace-pre-wrap">{summary.themeCore}</p>
          </Module1WritingSummaryBlock>
        </Module1WritingSummaryGroup>
        <Module1WritingSummaryGroup lesson="lesson2">
          <Module1WritingSummaryBlock title="我准备采用的写法">
            <p className="whitespace-pre-wrap">{summary.writingPlan}</p>
          </Module1WritingSummaryBlock>
          <Module1WritingSummaryBlock title="人物五项">
            <p>我是谁：{summary.who}</p>
            <p>我想要：{summary.want}</p>
            <p>我卡在：{summary.blocked}</p>
            <p>准备先尝试的行动：{summary.firstAction}（{MODULE1_LESSON4_SHARED_COPY.notFactNote}）</p>
            <p>可能发生的变化：{summary.possibleChange}（{MODULE1_LESSON4_SHARED_COPY.notFactNote}）</p>
          </Module1WritingSummaryBlock>
        </Module1WritingSummaryGroup>
        <Module1WritingSummaryGroup lesson="lesson3">
          <Module1WritingSummaryBlock title="题目与已确认开头">
            <p>题目：{summary.storyTitle}</p>
            <p className="whitespace-pre-wrap">确认开头摘要：{summary.openingExcerpt}</p>
          </Module1WritingSummaryBlock>
        </Module1WritingSummaryGroup>
        <Module1WritingSummaryGroup lesson="lesson4">
          <Module1WritingSummaryBlock title="本课情节安排">
            <p className="whitespace-pre-wrap">情节安排：{summary.plotPlan}</p>
            <p className="whitespace-pre-wrap">安排理由：{summary.planReason}</p>
          </Module1WritingSummaryBlock>
          <Module1WritingSummaryBlock title="承段摘要">
            <p className="whitespace-pre-wrap">初稿摘要：{summary.draftExcerpt}</p>
            <p className="whitespace-pre-wrap">确认稿摘要：{summary.finalExcerpt}</p>
          </Module1WritingSummaryBlock>
        </Module1WritingSummaryGroup>
        {summary.reviewNeeded && (
          <p className="text-xs text-amber-800">{MODULE1_LESSON4_SHARED_COPY.upstreamChanged}</p>
        )}
      </CardContent>
    </Card>
  )
}
