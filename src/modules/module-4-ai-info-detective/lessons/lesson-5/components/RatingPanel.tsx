/**
 * 文件说明：模块 4 课时 5 三维快评面板。
 * 职责：在答案揭示后收集 clarity、thinkingValue、explanationHelpfulness、issueFlags 与评论，并交给 Step2 提交 rating。
 * 更新触发：RatingSubmitRequest 字段、IssueFlag 枚举、快评维度、评分范围或 C5 反馈文案变化时，需要同步更新本文件。
 */

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import type { Lesson5IssueFlag } from "@/modules/module-4-ai-info-detective/api/lesson5-types"

export interface Lesson5RatingDraft {
  clarity: number
  thinkingValue: number
  explanationHelpfulness: number
  issueFlags: Lesson5IssueFlag[]
  comment: string
}

const ratingDimensions: Array<{ key: keyof Pick<Lesson5RatingDraft, "clarity" | "thinkingValue" | "explanationHelpfulness">; label: string }> = [
  { key: "clarity", label: "题目表达清晰" },
  { key: "thinkingValue", label: "能帮助我思考" },
  { key: "explanationHelpfulness", label: "解析对我有帮助" },
]

const issueFlagOptions: Array<{ value: Lesson5IssueFlag; label: string }> = [
  { value: "source_insufficient", label: "来源证据不足" },
  { value: "explanation_unclear", label: "解析不够清楚" },
  { value: "option_confusing", label: "选项容易混淆" },
  { value: "material_mismatch", label: "素材与题干不匹配" },
  { value: "other", label: "其它问题" },
]

export function RatingPanel({
  draft,
  submitting,
  error,
  onChange,
  onSubmit,
}: {
  draft: Lesson5RatingDraft
  submitting: boolean
  error: string
  onChange: (draft: Lesson5RatingDraft) => void
  onSubmit: () => void
}) {
  const toggleIssueFlag = (flag: Lesson5IssueFlag) => {
    const exists = draft.issueFlags.includes(flag)
    onChange({
      ...draft,
      issueFlags: exists ? draft.issueFlags.filter(item => item !== flag) : [...draft.issueFlags, flag],
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>三维快评</CardTitle>
        <CardDescription>请基于刚刚看到的题目、正解、解析和来源摘要完成评分。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        {ratingDimensions.map(dimension => (
          <div key={dimension.key} className="space-y-2">
            <p className="font-medium">{dimension.label}</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map(score => (
                <button
                  key={`${dimension.key}-${score}`}
                  type="button"
                  disabled={submitting}
                  onClick={() => onChange({ ...draft, [dimension.key]: score })}
                  className={`rounded-full border px-4 py-2 text-xs ${
                    draft[dimension.key] === score ? "border-slate-900 bg-slate-900 text-white" : "bg-white hover:bg-slate-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {score} 分
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-2">
          <p className="font-medium">可选问题标记</p>
          <div className="flex flex-wrap gap-2">
            {issueFlagOptions.map(option => (
              <button
                key={option.value}
                type="button"
                disabled={submitting}
                onClick={() => toggleIssueFlag(option.value)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  draft.issueFlags.includes(option.value) ? "border-amber-700 bg-amber-50 text-amber-800" : "bg-white hover:bg-slate-50"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block space-y-2">
          <span className="font-medium">补充说明（可选）</span>
          <textarea
            value={draft.comment}
            disabled={submitting}
            onChange={event => onChange({ ...draft, comment: event.target.value })}
            className="min-h-24 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
            placeholder="例如：我觉得解析里的某个证据最有帮助，或某个选项需要再清楚一点。"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? "提交快评中..." : "提交快评并进入下一题"}
        </Button>
      </CardContent>
    </Card>
  )
}
