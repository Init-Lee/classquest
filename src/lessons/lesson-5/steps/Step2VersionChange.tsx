/**
 * 文件说明：课时5 · 第2关 · 版本改动说明 v2
 * 职责：小组根据第1关整理出的优先修改点修改海报后，
 *       用结构化四列表格记录"改了什么、改前是什么、改后是什么、为什么改"。
 *       要求至少2行四列完整填写，不记录负责人。
 *       支持文本导出（剪贴板）和 JSON 导出（下载文件）。
 * 更新触发：表格字段变化时；校验规则调整时；导出格式改变时
 */

import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  ClipboardCopy, Download, CheckCircle2, AlertCircle,
  Plus, Trash2, ChevronRight, Info,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { usePortfolio } from "@/app/providers/AppProvider"
import { advancePointer } from "@/shared/utils/pointer"
import type { ChangeRecord } from "@/domains/portfolio/types"

/** 判断一行是否完整填写（四列都有内容） */
function isRowComplete(row: ChangeRecord): boolean {
  return Boolean(row.item.trim() && row.before.trim() && row.after.trim() && row.reason.trim())
}

export default function Step2VersionChange() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()

  const lesson5 = portfolio?.lesson5
  const student = portfolio?.student
  const themePack = portfolio?.lesson1.r1ByMember[0]?.themePack ?? "—"

  const [records, setRecords] = useState<ChangeRecord[]>(
    lesson5?.changeRecords && lesson5.changeRecords.length > 0
      ? lesson5.changeRecords
      : [
          { item: "", before: "", after: "", reason: "" },
          { item: "", before: "", after: "", reason: "" },
          { item: "", before: "", after: "", reason: "" },
        ]
  )
  const [errors, setErrors] = useState<string[]>([])
  const [copySuccess, setCopySuccess] = useState(false)
  const [jsonSuccess, setJsonSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  /** 更新某行的某个字段 */
  const updateRecord = useCallback((rowIdx: number, field: keyof ChangeRecord, value: string) => {
    setRecords(prev => prev.map((r, i) => i === rowIdx ? { ...r, [field]: value } : r))
  }, [])

  /** 新增一行 */
  const addRow = () => {
    setRecords(prev => [...prev, { item: "", before: "", after: "", reason: "" }])
  }

  /** 删除最后一行（至少保留2行） */
  const removeLastRow = () => {
    setRecords(prev => prev.length > 2 ? prev.slice(0, -1) : prev)
  }

  /** 校验 */
  const validate = (): string[] => {
    const errs: string[] = []
    const completeRows = records.filter(isRowComplete)
    if (completeRows.length < 2) {
      errs.push("请至少完成 2 条关键改动说明（每条需填写改动项目、改前、改后、原因）")
    }
    return errs
  }

  /** 保存草稿 */
  const saveDraft = useCallback(async (recs: ChangeRecord[], completed = false) => {
    if (!portfolio) return
    await savePortfolio({
      ...portfolio,
      lesson5: {
        ...portfolio.lesson5,
        changeRecords: recs,
        completed,
      },
    })
  }, [portfolio, savePortfolio])

  /** 生成文本导出内容 */
  const buildExportText = (): string => {
    const lines: string[] = [
      "版本改动说明",
      `班级：${student?.clazz ?? ""}`,
      `小组：${student?.groupName ?? ""}`,
      `主题包：${themePack}`,
      "",
    ]
    records.filter(r => r.item.trim()).forEach((r, i) => {
      lines.push(`【改动${i + 1}】`)
      lines.push(`修改项目：${r.item}`)
      lines.push(`修改前：${r.before}`)
      lines.push(`修改后：${r.after}`)
      lines.push(`为什么改：${r.reason}`)
      lines.push("")
    })
    lines.push("提醒：本页不记录分工，只记录本轮最关键的 2–3 条改动。")
    return lines.join("\n")
  }

  /** 生成 JSON 导出内容 */
  const buildExportJson = () => ({
    type: "lesson5-version-change-v2",
    basic: {
      clazz: student?.clazz ?? "",
      groupName: student?.groupName ?? "",
      themePack,
      exportedAt: new Date().toISOString(),
    },
    changeRecords: records.filter(r => r.item.trim()),
  })

  /** 文本导出到剪贴板 */
  const handleCopyText = async () => {
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
      await saveDraft(records)
    } catch {
      setErrors(["复制失败，请重试"])
    }
  }

  /** JSON 导出下载 */
  const handleDownloadJson = () => {
    const errs = validate()
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])
    const json = JSON.stringify(buildExportJson(), null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const filename = `${student?.clazz ?? ""}班_${student?.groupName ?? ""}_版本改动说明_v2.json`
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setJsonSuccess(true)
    setTimeout(() => setJsonSuccess(false), 3000)
    saveDraft(records)
  }

  /** 完成课时5 */
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
        pointer: advancePointer(portfolio!.pointer, 5, 2),
        lesson5: {
          ...portfolio!.lesson5,
          changeRecords: records,
          completed: true,
        },
      })
      navigate("/")
    } finally {
      setSaving(false)
    }
  }

  const completeCount = records.filter(isRowComplete).length

  /** 表格列配置 */
  const COLS: { key: keyof ChangeRecord; label: string; placeholder: string }[] = [
    { key: "item", label: "修改项目", placeholder: "改的是哪一块" },
    { key: "before", label: "修改前", placeholder: "原来怎么写 / 怎么讲" },
    { key: "after", label: "修改后", placeholder: "现在改成什么" },
    { key: "reason", label: "为什么改", placeholder: "依据哪条反馈 / 哪条证据" },
  ]

  return (
    <div className="space-y-6 w-full max-w-5xl">
      {/* 页面标题 */}
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第2关：改动落地</h3>
        <p className="text-muted-foreground text-sm">记录"改了什么"，不需要填写负责人</p>
      </div>

      {/* 说明提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 text-sm text-blue-800">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          拿着第1关整理的 2–3 条优先修改点，修改海报后在下表记录关键改动。
          提醒：本页不记录分工，只记录本轮最关键的 2–3 条改动。
        </span>
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

      {/* 改动说明表格 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
            <span>🔧 详细改动说明</span>
            <span className="text-xs font-normal text-muted-foreground">
              已完整填写 {completeCount} 行（至少需要 2 行）
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {records.map((row, rowIdx) => {
            const complete = isRowComplete(row)
            return (
              <div
                key={rowIdx}
                className={`border rounded-lg p-4 space-y-3 transition-colors ${
                  complete ? "border-green-300 bg-green-50/30" : rowIdx < 2 ? "border-orange-200" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">改动 {rowIdx + 1}</span>
                  {complete && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {!complete && rowIdx < 2 && (
                    <span className="text-xs text-orange-600">必填</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COLS.map(col => (
                    <div key={col.key} className={col.key === "reason" || col.key === "after" ? "" : ""}>
                      <div className="text-xs text-muted-foreground mb-1 font-medium">{col.label}</div>
                      <Textarea
                        placeholder={col.placeholder}
                        value={row[col.key]}
                        onChange={e => updateRecord(rowIdx, col.key, e.target.value)}
                        className="text-sm min-h-[60px] resize-none"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* 行操作按钮 */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              新增一行
            </Button>
            {records.length > 2 && (
              <Button variant="outline" size="sm" onClick={removeLastRow} className="gap-1.5 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" />
                删除最后一行
              </Button>
            )}
          </div>
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
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleCopyText}
            className="gap-2"
          >
            {copySuccess ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <ClipboardCopy className="h-4 w-4" />}
            {copySuccess ? "已复制！" : "导出文本"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadJson}
            className="gap-2"
          >
            {jsonSuccess ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Download className="h-4 w-4" />}
            {jsonSuccess ? "已下载！" : "导出 JSON"}
          </Button>
        </div>

        <Button
          onClick={handleComplete}
          disabled={saving || completeCount < 2}
          className="gap-2"
        >
          {saving ? "保存中…" : "完成课时5"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 底部提醒 */}
      <p className="text-xs text-muted-foreground text-center pb-2">
        ✅ 两张表合起来，就是：我们收到了什么意见 + 我们真正改了什么。
      </p>
    </div>
  )
}
