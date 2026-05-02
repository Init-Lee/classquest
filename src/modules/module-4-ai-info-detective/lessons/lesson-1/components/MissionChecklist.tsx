/**
 * 文件说明：课时 1 个人任务清单组件。
 * 职责：收集学生对下一课新闻素材、图片素材和来源记录准备任务的确认，并填写两个素材计划。
 * 更新触发：Step 5 清单项、计划字段或课时完成条件变化时，需要同步更新本文件。
 */

import { Input } from "@/shared/ui/input"
import { PERSONAL_TASK_CHECKLIST } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/data/checklist"

interface MissionChecklistProps {
  checkedKeys: string[]
  newsSourcePlan: string
  imageSourcePlan: string
  onChange: (next: {
    checkedKeys: string[]
    newsSourcePlan: string
    imageSourcePlan: string
  }) => void
}

export function MissionChecklist({
  checkedKeys,
  newsSourcePlan,
  imageSourcePlan,
  onChange,
}: MissionChecklistProps) {
  const toggleKey = (key: string) => {
    const nextKeys = checkedKeys.includes(key)
      ? checkedKeys.filter(item => item !== key)
      : [...checkedKeys, key]
    onChange({ checkedKeys: nextKeys, newsSourcePlan, imageSourcePlan })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {PERSONAL_TASK_CHECKLIST.map(item => (
          <label key={item.key} className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={checkedKeys.includes(item.key)}
              onChange={() => toggleKey(item.key)}
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-2 text-sm font-medium">
          我可能去哪里找新闻素材？
          <Input
            value={newsSourcePlan}
            onChange={event => onChange({ checkedKeys, newsSourcePlan: event.target.value, imageSourcePlan })}
            placeholder="例如：学校公众号、新闻网站、科技栏目"
          />
        </label>
        <label className="space-y-2 text-sm font-medium">
          我可能去哪里找图片素材？
          <Input
            value={imageSourcePlan}
            onChange={event => onChange({ checkedKeys, newsSourcePlan, imageSourcePlan: event.target.value })}
            placeholder="例如：校园宣传图、AI 生成图、现场拍摄图"
          />
        </label>
      </div>
    </div>
  )
}
