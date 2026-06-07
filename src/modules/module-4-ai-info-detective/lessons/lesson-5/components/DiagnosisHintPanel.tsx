/**
 * 文件说明：模块 4 课时 5 学生报告诊断提示面板。
 * 职责：把后端 my-report 返回的 diagnosisHints 转译为学生可读的改进建议，供 Step3 题卡统计卡片复用。
 * 更新触发：C6 诊断枚举、学生报告展示语气或 Step3 改进建议策略变化时，需要同步更新本文件。
 */

import type { Lesson5DiagnosisHint } from "@/modules/module-4-ai-info-detective/api/lesson5-types"

const hintLabels: Record<Lesson5DiagnosisHint, string> = {
  needs_more_samples: "样本还少：先把这份数据当作方向提示，不要急着给题卡下结论。",
  low_correct_rate: "正确率偏低：检查题干是否给了足够证据，选项之间是否容易混淆。",
  low_clarity: "清晰度偏低：补充题干里的判断对象、关键信息和排除条件。",
  low_thinking_value: "思考价值偏低：让选项更能引导同学比较证据，而不是只凭直觉判断。",
  low_explanation_helpfulness: "解析帮助度偏低：在解析中写清证据链、反例和核验路径。",
  high_issue_flag_rate: "问题标记偏高：优先复查来源记录、素材匹配度和表达歧义。",
}

interface DiagnosisHintPanelProps {
  hints: Lesson5DiagnosisHint[]
}

export function DiagnosisHintPanel({ hints }: DiagnosisHintPanelProps) {
  if (hints.length === 0) {
    return (
      <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        暂无明显风险提示。请继续保留来源记录，并在后续修订时对照同学反馈微调表述。
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-medium">诊断提示</p>
      <ul className="mt-2 space-y-1.5">
        {hints.map(hint => (
          <li key={hint} className="leading-6">• {hintLabels[hint] ?? hint}</li>
        ))}
      </ul>
    </div>
  )
}
