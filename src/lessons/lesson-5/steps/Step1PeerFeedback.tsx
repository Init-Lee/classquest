/**
 * 文件说明：课时5 · 第1关 · 同伴反馈单 v2
 * 职责：课堂预演结束后，记录员/组长把口头意见汇总为2-3条优先修改点。
 *       包含四维度评估卡片、优先修改清单、总体建议，以及文本导出。
 *       本页不是人均单独填写，而是小组共用一张汇总单。
 * 更新触发：反馈维度变化时；校验规则调整时；导出格式改变时
 */

import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { ClipboardCopy, CheckCircle2, AlertCircle, ChevronRight, Info } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { usePortfolio } from "@/app/providers/AppProvider"
import { advancePointer } from "@/shared/utils/pointer"
import type { FeedbackDimension } from "@/domains/portfolio/types"

/** 维度状态对应的显示文案 */
const STATUS_LABELS: Record<FeedbackDimension["status"], string> = {
  clear: "基本清楚",
  "needs-change": "需要修改",
  "": "未判断",
}

export default function Step1PeerFeedback() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()

  const lesson5 = portfolio?.lesson5
  const student = portfolio?.student

  const [dimensions, setDimensions] = useState<FeedbackDimension[]>(
    lesson5?.feedbackDimensions ?? [
      { name: "讲解逻辑", status: "", suggestion: "" },
      { name: "证据支撑", status: "", suggestion: "" },
      { name: "结论合理性", status: "", suggestion: "" },
      { name: "建议可行性", status: "", suggestion: "" },
    ]
  )
  const [priorityChanges, setPriorityChanges] = useState<string[]>(
    lesson5?.priorityChanges ?? ["", "", ""]
  )
  const [overallSuggestion, setOverallSuggestion] = useState(lesson5?.overallSuggestion ?? "")
  const [errors, setErrors] = useState<string[]>([])
  const [copySuccess, setCopySuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  /** 主题包信息 */
  const themePack = portfolio?.lesson1.r1ByMember[0]?.themePack ?? "—"

  /** 更新某个维度的状态 */
  const updateDimensionStatus = (index: number, status: FeedbackDimension["status"]) => {
    setDimensions(prev => prev.map((d, i) => i === index ? { ...d, status } : d))
  }

  /** 更新某个维度的建议 */
  const updateDimensionSuggestion = useCallback((index: number, suggestion: string) => {
    setDimensions(prev => prev.map((d, i) => i === index ? { ...d, suggestion } : d))
  }, [])

  /** 更新优先修改点 */
  const updatePriorityChange = (index: number, value: string) => {
    setPriorityChanges(prev => prev.map((p, i) => i === index ? value : p))
  }

  /** 校验表单 */
  const validate = (): string[] => {
    const errs: string[] = []
    const filledPriorities = priorityChanges.filter(p => p.trim())
    if (filledPriorities.length < 2) {
      errs.push("请至少整理出 2 条本轮优先修改点")
    }
    return errs
  }

  /** 保存草稿到 IndexedDB */
  const saveDraft = useCallback(async (
    dims: FeedbackDimension[],
    priorities: string[],
    overall: string,
    exported: boolean,
    completed: boolean
  ) => {
    if (!portfolio) return
    await savePortfolio({
      ...portfolio,
      lesson5: {
        ...portfolio.lesson5,
        feedbackDimensions: dims,
        priorityChanges: priorities,
        overallSuggestion: overall,
        feedbackExported: exported,
        feedbackCompleted: completed,
      },
    })
  }, [portfolio, savePortfolio])

  /** 生成导出文本 */
  const buildExportText = (): string => {
    const lines: string[] = [
      "同伴反馈单",
      `班级：${student?.clazz ?? ""}`,
      `小组：${student?.groupName ?? ""}`,
      `主题包：${themePack}`,
      "",
      "一、四个维度判断",
    ]
    dimensions.forEach((d, i) => {
      lines.push(`${i + 1}. ${d.name}：${d.status === "clear" ? "基本清楚" : d.status === "needs-change" ? "需要修改" : "未判断"}`)
      if (d.suggestion.trim()) {
        lines.push(`   建议：${d.suggestion}`)
      }
    })
    lines.push("")
    lines.push("二、本轮优先修改清单")
    priorityChanges.forEach((p, i) => {
      if (p.trim()) lines.push(`${i + 1}. ${p}`)
    })
    if (overallSuggestion.trim()) {
      lines.push("")
      lines.push("三、总体建议")
      lines.push(overallSuggestion)
    }
    lines.push("")
    lines.push("下一步：根据这 2–3 条优先修改点，修改海报并填写《版本改动说明》。")
    return lines.join("\n")
  }

  /** 导出文本到剪贴板 */
  const handleExport = async () => {
    const errs = validate()
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])
    try {
      await navigator.clipboard.writeText(buildExportText())
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 3000)
      await saveDraft(dimensions, priorityChanges, overallSuggestion, true, false)
    } catch {
      setErrors(["复制失败，请手动复制下方文本"])
    }
  }

  /** 完成第1关，进入第2关 */
  const handleComplete = async () => {
    const errs = validate()
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])
    if (saving) return
    setSaving(true)
    try {
      await savePortfolio({
        ...portfolio!,
        pointer: advancePointer(portfolio!.pointer, 5, 1),
        lesson5: {
          ...portfolio!.lesson5,
          feedbackDimensions: dimensions,
          priorityChanges,
          overallSuggestion,
          feedbackExported: true,
          feedbackCompleted: true,
        },
      })
      navigate("/lesson/5/step/2")
    } finally {
      setSaving(false)
    }
  }

  const filledPriorities = priorityChanges.filter(p => p.trim()).length

  return (
    <div className="space-y-6 w-full max-w-3xl">
      {/* 页面标题 */}
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第1关：意见入池</h3>
        <p className="text-muted-foreground text-sm">先听清问题，再决定改哪里</p>
      </div>

      {/* 使用说明横幅 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-sm text-amber-800">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>本页不是每个人各填一张，而是小组汇总本轮最值得修改的 2–3 条意见。</span>
      </div>

      {/* 研究身份（只读） */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">研究身份</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">班级</div>
              <div className="font-medium">{student?.clazz ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">小组</div>
              <div className="font-medium">{student?.groupName ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">主题包</div>
              <div className="font-medium">{themePack}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 使用规则说明卡（只读） */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-blue-800">📋 使用提醒</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-1.5 text-sm text-blue-900 list-decimal list-inside">
            <li>每个成员至少说 1 条有效意见</li>
            <li>只记"最值得改"的 2–3 条</li>
            <li>反馈重点放在逻辑、证据、结论、建议，不讨论美丑</li>
          </ol>
        </CardContent>
      </Card>

      {/* 四个反馈维度 */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">四个维度判断（不要求全部填写）</h4>
        {dimensions.map((dim, i) => (
          <Card key={dim.name} className={dim.status === "needs-change" ? "border-orange-300 bg-orange-50/30" : ""}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-medium text-sm">{i + 1}. {dim.name}</span>
                <div className="flex gap-2">
                  {(["clear", "needs-change"] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => updateDimensionStatus(i, dim.status === s ? "" : s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        dim.status === s
                          ? s === "clear"
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-muted-foreground border-border hover:border-foreground"
                      }`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
              {(dim.status === "needs-change" || dim.suggestion) && (
                <Textarea
                  placeholder={`${dim.name}方面的关键建议（选填，写一句话）`}
                  value={dim.suggestion}
                  onChange={e => updateDimensionSuggestion(i, e.target.value)}
                  className="text-sm min-h-[60px] resize-none"
                  rows={2}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 优先修改清单（核心区） */}
      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            🎯 本轮优先修改清单
            <span className="text-xs font-normal text-muted-foreground ml-1">（前2条必填，第3条选填）</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            写具体，不写"感觉一般"。例：「"浪费很严重"结论证据不够，建议补数据或缩小结论范围」
          </p>
          {priorityChanges.map((value, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`mt-2.5 text-sm font-semibold shrink-0 w-4 ${i < 2 ? "text-primary" : "text-muted-foreground"}`}>
                {i + 1}.
              </span>
              <Textarea
                placeholder={i < 2 ? `优先修改点 ${i + 1}（必填）` : "优先修改点 3（选填）"}
                value={value}
                onChange={e => updatePriorityChange(i, e.target.value)}
                className="text-sm min-h-[60px] resize-none flex-1"
                rows={2}
              />
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
            {filledPriorities >= 2
              ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              : <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
            }
            已填 {filledPriorities} / 至少需要 2 条
          </div>
        </CardContent>
      </Card>

      {/* 总体建议 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">总体建议（选填）</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="我们最想提醒你们的一点是……"
            value={overallSuggestion}
            onChange={e => setOverallSuggestion(e.target.value)}
            className="text-sm min-h-[70px] resize-none"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
          {errors.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {e}
            </div>
          ))}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3 justify-between items-center pt-2 border-t">
        <Button
          variant="outline"
          onClick={handleExport}
          className="gap-2"
        >
          {copySuccess ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <ClipboardCopy className="h-4 w-4" />}
          {copySuccess ? "已复制！" : "导出文本到剪贴板"}
        </Button>

        <Button
          onClick={handleComplete}
          disabled={saving || filledPriorities < 2}
          className="gap-2"
        >
          {saving ? "保存中…" : "完成第1关，进入改动落地"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 底部提示 */}
      <p className="text-xs text-muted-foreground text-center pb-2">
        下一步：根据这 2–3 条优先修改点，修改海报并填写《版本改动说明》。
      </p>
    </div>
  )
}
