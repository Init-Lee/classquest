/**
 * 文件说明：模块 4 课时 2 来源记录说明卡。
 * 职责：向学生解释四类来源记录应填写的线索，帮助完成格式检查而不声称来源真实可信。
 * 更新触发：来源类型、来源记录示例或课堂提示变化时，需要同步更新本文件。
 */

import { LESSON2_SOURCE_GUIDES } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/data/screening-examples"

export function SourceRecordGuide() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {LESSON2_SOURCE_GUIDES.map(guide => (
        <div key={guide.value} className="rounded-2xl border bg-blue-50/60 p-4">
          <p className="font-medium text-blue-900">{guide.title}</p>
          <p className="mt-1 text-sm leading-6 text-blue-800">{guide.example}</p>
        </div>
      ))}
    </div>
  )
}
