/**
 * 文件说明：模块 1 课时 3 只读写作设定汇总。
 * 职责：在共用抽屉内展示故事年份、SDG 主题、理由、城市问题、受众、文学参照、写法、人物五项，以及本课已确认的题目/开场。
 * 更新触发：侧栏字段、SDG 展示、占位文案或本课题目/开场展示规则变化时，需要同步更新本文件。
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import type {
  Module1Lesson1State,
  Module1Lesson2State,
  Module1Lesson3State,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON3_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson3-copy"
import { buildModule1Lesson3WritingSummary } from "@/modules/module-1-ai-story/lessons/lesson-3/utils/build-lesson3-writing-summary"

interface Lesson3WritingSummaryProps {
  lesson1: Module1Lesson1State
  lesson2: Module1Lesson2State
  lesson3: Module1Lesson3State
}

export function Lesson3WritingSummary({
  lesson1,
  lesson2,
  lesson3,
}: Lesson3WritingSummaryProps) {
  const summary = buildModule1Lesson3WritingSummary(lesson1, lesson2, lesson3)

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg">{summary.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-relaxed">
        <p className="text-muted-foreground">{summary.intro}</p>
        <section className="space-y-1">
          <p className="font-semibold">一、课时 1 故事主题</p>
          <p>故事年份：{summary.year}（{MODULE1_LESSON3_SHARED_COPY.yearNote}）</p>
          <p>SDG 主题：{summary.sdg}</p>
          <p>选择理由：{summary.sdgWhy}</p>
          <p>城市问题：{summary.cityIssue}</p>
          <p>写给谁：{summary.audience}</p>
          <p>关注点：{summary.audienceConcern}</p>
          <p className="whitespace-pre-wrap">主题核心：{summary.themeCore}</p>
        </section>
        <section className="space-y-1">
          <p className="font-semibold">二、文学参照</p>
          <p>作品：{summary.workTitle}</p>
          <p>作者：{summary.author}</p>
          <p>片段位置：{summary.location}</p>
          <p>版本说明：{summary.versionNote}</p>
          <p className="whitespace-pre-wrap">阅读出处：{summary.sourceNote}</p>
        </section>
        <section className="space-y-1">
          <p className="font-semibold">三、我准备采用的写法</p>
          <p className="whitespace-pre-wrap">{summary.writingPlan}</p>
        </section>
        <section className="space-y-1">
          <p className="font-semibold">四、我的选择理由</p>
          <p className="whitespace-pre-wrap">{summary.reason}</p>
        </section>
        <section className="space-y-2 rounded-lg bg-primary/5 p-3">
          <p className="font-semibold">五、人物五项</p>
          <p>我是谁：{summary.who}</p>
          <p>我想要：{summary.want}</p>
          <p>我卡在：{summary.blocked}</p>
          <p>准备先尝试的行动：{summary.firstAction}</p>
          <p>可能发生的变化：{summary.possibleChange}</p>
        </section>
        <section className="space-y-1">
          <p className="font-semibold">六、课时 3 已填</p>
          <p>题目：{summary.storyTitle}</p>
          <p>开场选择：{summary.openingPlan}</p>
          <p className="whitespace-pre-wrap">本段写法：{summary.focusTechnique}</p>
          <p className="whitespace-pre-wrap">初稿摘要：{summary.draftExcerpt}</p>
          <p className="whitespace-pre-wrap">确认稿摘要：{summary.finalExcerpt}</p>
        </section>
        {summary.reviewNeeded && (
          <p className="text-xs text-amber-800">{MODULE1_LESSON3_SHARED_COPY.upstreamChanged}</p>
        )}
      </CardContent>
    </Card>
  )
}
