/**
 * 文件说明：课时 1 教师样例练习页。
 * 职责：让没有本人小说的学生观看《关灯这件事》，并明确这是练习，不写入完成状态，也不代替第 1 关的本人项目。
 * 更新触发：练习入口文案、样例展示或返回第 1 关的方式变化时，需要同步更新本文件。
 */

import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { SampleComicBoard } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/SampleComicBoard"
import { SampleMissingNotice } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/SampleMissingNotice"
import { useGuanDengSample } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/use-guan-deng-sample"

export default function Lesson1PracticePage() {
  const navigate = useNavigate()
  const sampleState = useGuanDengSample()

  return (
    <div className="mx-auto min-w-0 max-w-7xl overflow-x-clip px-4 py-6">
      <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
        <p className="font-medium">练习 · 教师虚构示例</p>
        <p className="mt-1">这里只供观察，不计入你的本人项目，也不能代替第 1 关。要完成自己的四格，请回到第 1 关导入自己的小说。</p>
      </div>
      <Button type="button" variant="outline" className="mb-6" onClick={() => navigate("/module/2/lesson/1/step/1")}>
        返回第 1 关
      </Button>
      {sampleState === null && <p className="text-sm text-muted-foreground">正在读取改编样例…</p>}
      {sampleState && !sampleState.ok && <SampleMissingNotice message={sampleState.message} missing={sampleState.missing} />}
      {sampleState?.ok && <SampleComicBoard sample={sampleState.sample} />}
    </div>
  )
}
