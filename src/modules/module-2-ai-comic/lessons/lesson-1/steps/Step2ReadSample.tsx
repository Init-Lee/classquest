/**
 * 文件说明：课时 1 第 2 关「看懂改编样例」。
 * 职责：整行展示教师虚构的四格、对照和一次修改，并记录学生看过样例以及一条观察；职责解说在右侧滑出栏，不占主区。不要求点开每一格。
 * 更新触发：第 2 关观察题、样例展示顺序、右侧滑出栏、进入下一关的条件，或“打开本关即记下第 1 关只读记号”变化时，需要同步更新本文件。
 */

import { useCallback, useEffect } from "react"
import { Textarea } from "@/shared/ui/textarea"
import { useModule2State } from "@/modules/module-2-ai-comic/app/providers/Module2Provider"
import { markModule2SampleViewed, setModule2SampleObservation } from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import { MODULE2_FIELD_LIMITS } from "@/modules/module-2-ai-comic/domains/portfolio/validate"
import { Lesson1ContinueButton, Lesson1StepHeader } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/lesson1-chrome"
import { markLesson1Step2Entered } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/lesson1-step2-visit"
import { SampleComicBoard } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/SampleComicBoard"
import { SampleResponsibilityCard } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/SampleResponsibilityCard"
import { SampleMissingNotice } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/SampleMissingNotice"
import { useGuanDengSample } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/use-guan-deng-sample"

export default function Step2ReadSample() {
  const { portfolio, updatePortfolio } = useModule2State()
  const portfolioId = portfolio?.id ?? null
  // 打开第 2 关就记一笔。回到第 1 关时小说改为只读，不改档案里的小说内容。
  useEffect(() => {
    if (!portfolioId) return
    markLesson1Step2Entered(portfolioId)
  }, [portfolioId])
  const sampleState = useGuanDengSample()
  const markReady = useCallback(() => {
    updatePortfolio(current => markModule2SampleViewed(current, new Date().toISOString()))
  }, [updatePortfolio])

  if (!portfolio) return null
  const observation = portfolio.lesson1.sampleObservation
  const ready = portfolio.lesson1.sampleViewed && observation.trim() !== ""

  return (
    <>
      <div className="min-w-0 max-w-full overflow-x-clip">
        <Lesson1StepHeader
          step={2}
          title="看懂改编样例"
          lead="先看完整的四格，再对照原文和一次修改。写下你发现的一项选择即可。"
        />
        <div className="min-w-0">
          {sampleState === null && <p className="text-sm text-muted-foreground">正在读取改编样例…</p>}
          {sampleState && !sampleState.ok && <SampleMissingNotice message={sampleState.message} missing={sampleState.missing} />}
          {sampleState?.ok && <SampleComicBoard sample={sampleState.sample} onPanelsReady={markReady} />}
          <div className="mt-8 max-w-3xl space-y-2">
            <label htmlFor="m2-observation" className="text-sm font-medium">
              你发现作者作出了哪一项选择？它怎样帮助读者理解故事？
            </label>
            <Textarea
              id="m2-observation"
              className="min-h-[96px]"
              maxLength={MODULE2_FIELD_LIMITS.sampleObservation}
              value={observation}
              placeholder="一两句话即可。"
              onChange={event => updatePortfolio(current => setModule2SampleObservation(current, event.target.value, new Date().toISOString()))}
            />
            <p className="text-xs text-muted-foreground">不需要点开每一格，也不用背定义。</p>
          </div>
          <Lesson1ContinueButton
            enabled={ready && Boolean(sampleState?.ok)}
            toStep={3}
            label="进入下一关"
            hint={sampleState && !sampleState.ok ? "样例图片还没显示出来，先不要进入下一关。" : "看完四格，并写下一条观察后，才能进入下一关。"}
          />
        </div>
      </div>
      {/* 滑出栏用固定定位，放在裁切容器外，避免收起或窄屏时被主区裁掉。 */}
      <SampleResponsibilityCard />
    </>
  )
}
