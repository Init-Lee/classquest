/**
 * 文件说明：课时5 · 第2关 · 改动落地（组长编辑 / 组员导入核对）
 * 职责：
 *   组长：左侧约 1/3 展示第1关汇总（组长定稿 + 已导入组员意见摘要），右侧约 2/3 为改动表；
 *         「修改项目」与「依据哪条反馈」同一行展示（小屏纵向堆叠；≥sm 时修改项目约 1/4 列宽、依据反馈约 3/4）；海报五部分下拉 + 第1关闭环依据下拉；
 *         默认仅 2 条改动行且均为必填；填写完整后可导出「改动落地汇总包」JSON，亦可「新增一行」扩展；首次完成课时5前须至少导出一次汇总包（`versionChangeLeaderPackageExported`），若档案中本课已标记完成（`lesson5.completed`）则不再拦截，便于组长事后改表无需重复导出。
 *   组员：「选择汇总包文件」保留天青描边强调；「完成课时5」与组长同款主按钮（默认 variant），不单独套色。
 * 更新触发：汇总包格式、海报板块枚举、校验规则或角色分支变化时
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Download, CheckCircle2, AlertCircle, Plus, Trash2, ChevronRight, Info,
  Upload, Loader2,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { usePortfolio } from "@/modules/module-3-ai-science-station/app/providers/AppProvider"
import { cn } from "@/shared/utils/cn"
import { advancePointer } from "@/modules/module-3-ai-science-station/utils/pointer"
import type { ChangeRecord, ModulePortfolio } from "@/modules/module-3-ai-science-station/domains/portfolio/types"
import { LESSON5_POSTER_SECTION_OPTIONS, normalizeLesson5PosterSectionItem } from "../config"
import {
  buildLesson5VersionChangeLeaderPackage,
  downloadLesson5VersionChangeLeaderPackage,
  parseLesson5VersionChangeLeaderPackageJson,
  type Lesson5VersionChangeLeaderPackageV1,
} from "@/modules/module-3-ai-science-station/infra/persistence/serializers/continue-package"

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

/** 组员「导入汇总包」主按钮：天青描边+底（与组长琥珀导出按钮区分；完成课时5 与组长一致不用此类） */
const MEMBER_IMPORT_BTN =
  "border-2 border-sky-600 bg-sky-100 text-sky-950 hover:bg-sky-200 hover:border-sky-700 shadow-sm"

/** 依据哪条反馈：由第1关组长定稿 + 已导入组员意见包生成下拉项 */
function buildFeedbackReasonOptions(portfolio: ModulePortfolio): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = []
  const pc = portfolio.lesson5.priorityChange.trim()
  if (pc) {
    const v = `【组长·本轮优先修改】${pc}`
    out.push({ value: v, label: v.length > 80 ? `${v.slice(0, 80)}…` : v })
  }
  let pkgs: { studentName: string; priorityChange?: string; feedbackDimensions?: { name: string; status: string; suggestion?: string }[] }[] = []
  try {
    const arr = JSON.parse(portfolio.lesson5.peerFeedbackImportedPackagesJson || "[]") as unknown
    if (Array.isArray(arr)) pkgs = arr as typeof pkgs
  } catch {
    /* 忽略 */
  }
  for (const p of pkgs) {
    const line = (p.priorityChange ?? "").trim()
    if (line) {
      const v = `【${p.studentName}·优先修改】${line}`
      out.push({ value: v, label: v.length > 80 ? `${v.slice(0, 80)}…` : v })
    }
    for (const d of p.feedbackDimensions ?? []) {
      if (d.status !== "" || (d.suggestion && d.suggestion.trim())) {
        const st = d.status === "needs-change" ? "需改" : d.status === "clear" ? "清楚" : "未判断"
        const v = `【${p.studentName}·${d.name}】${st}${d.suggestion?.trim() ? `：${d.suggestion.trim()}` : ""}`
        out.push({ value: v, label: v.length > 80 ? `${v.slice(0, 80)}…` : v })
      }
    }
  }
  if (out.length === 0) {
    out.push({ value: "【无分项】请在第1关补充组长定稿或导入组员意见包", label: "【无分项】请在第1关补充组长定稿或导入组员意见包" })
  }
  return out
}

function isPosterSection(s: string): boolean {
  const normalized = normalizeLesson5PosterSectionItem(s.trim())
  return (LESSON5_POSTER_SECTION_OPTIONS as readonly string[]).includes(normalized)
}

function isRowCompleteLeader(row: ChangeRecord, reasonOptions: { value: string }[]): boolean {
  if (!isPosterSection(row.item.trim())) return false
  if (!row.before.trim() || !row.after.trim() || !row.reason.trim()) return false
  return reasonOptions.some(o => o.value === row.reason)
}

export default function Step2VersionChange() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const leaderFileRef = useRef<HTMLInputElement>(null)

  const lesson5 = portfolio?.lesson5
  const isLeader = portfolio?.student.role === "leader"

  const [records, setRecords] = useState<ChangeRecord[]>(() => {
    const base =
      lesson5?.changeRecords && lesson5.changeRecords.length > 0
        ? lesson5.changeRecords
        : [
            { item: "", before: "", after: "", reason: "" },
            { item: "", before: "", after: "", reason: "" },
          ]
    return base.map(r => ({ ...r, item: normalizeLesson5PosterSectionItem(r.item) }))
  })
  const [errors, setErrors] = useState<string[]>([])
  const [exportSuccess, setExportSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [memberAck, setMemberAck] = useState(lesson5?.versionChangeMemberAcknowledged ?? false)

  const reasonOptions = useMemo(() => (portfolio ? buildFeedbackReasonOptions(portfolio) : []), [portfolio])

  const leaderPreviewPkg = useMemo(() => {
    if (!portfolio || !isLeader) return null
    try {
      return buildLesson5VersionChangeLeaderPackage(portfolio, records)
    } catch {
      return null
    }
  }, [portfolio, isLeader, records])

  const memberParsedPkg = useMemo((): Lesson5VersionChangeLeaderPackageV1 | null => {
    if (!portfolio || isLeader) return null
    const raw = portfolio.lesson5.importedVersionChangePackageJson?.trim()
    if (!raw) return null
    try {
      return parseLesson5VersionChangeLeaderPackageJson(raw)
    } catch {
      return null
    }
  }, [portfolio, isLeader])

  /** 组长编辑态自动写回 lesson5.changeRecords（与档案一致时不写，避免与父状态循环） */
  useEffect(() => {
    if (!portfolio || !isLeader) return
    if (JSON.stringify(records) === JSON.stringify(portfolio.lesson5.changeRecords)) return
    const t = window.setTimeout(() => {
      void savePortfolio({
        ...portfolio,
        lesson5: { ...portfolio.lesson5, changeRecords: records },
      })
    }, 600)
    return () => window.clearTimeout(t)
  }, [records, portfolio, isLeader, savePortfolio])

  useEffect(() => {
    if (portfolio && !isLeader) {
      setMemberAck(portfolio.lesson5.versionChangeMemberAcknowledged)
    }
  }, [portfolio, isLeader])

  const updateRecord = useCallback((rowIdx: number, field: keyof ChangeRecord, value: string) => {
    setRecords(prev => prev.map((r, i) => (i === rowIdx ? { ...r, [field]: value } : r)))
  }, [])

  const addRow = () => {
    setRecords(prev => [...prev, { item: "", before: "", after: "", reason: "" }])
  }

  const removeLastRow = () => {
    setRecords(prev => (prev.length > 2 ? prev.slice(0, -1) : prev))
  }

  const validateLeader = (): string[] => {
    const errs: string[] = []
    const complete = records.filter(r => isRowCompleteLeader(r, reasonOptions))
    if (complete.length < 2) {
      errs.push("默认展示 2 条改动均为必填：请至少完整填写 2 条（每条须选海报五部分、改前、改后、依据下拉与第1关闭环对应）；新增行后仍须满足至少 2 条完整")
    }
    return errs
  }

  /** 组长：导出汇总包 */
  const handleLeaderExportPackage = async () => {
    const errs = validateLeader()
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])
    if (!portfolio) return
    const next: ModulePortfolio = {
      ...portfolio,
      lesson5: {
        ...portfolio.lesson5,
        changeRecords: records,
        versionChangeLeaderPackageExported: true,
      },
    }
    await savePortfolio(next)
    downloadLesson5VersionChangeLeaderPackage(next, records)
    setExportSuccess(true)
    window.setTimeout(() => setExportSuccess(false), 3000)
  }

  /** 组长：完成课时5 */
  const handleLeaderComplete = async () => {
    const errs = validateLeader()
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    // 首次完成本课前须至少导出一次汇总包；本课已完成后（lesson5.completed）不再校验，避免组长改表后被迫重复导出
    if (
      portfolio?.student.role === "leader"
      && !portfolio.lesson5.completed
      && !portfolio.lesson5.versionChangeLeaderPackageExported
    ) {
      setErrors([
        "首次完成课时5前，请先点击「导出改动落地汇总包」下载 JSON 并发给组员（仅需一次；本课已完成后若再改表不会再次要求导出）",
      ])
      return
    }
    setErrors([])
    if (saving || !portfolio) return
    setSaving(true)
    try {
      await savePortfolio({
        ...portfolio,
        pointer: advancePointer(portfolio.pointer, 5, 2),
        lesson5: {
          ...portfolio.lesson5,
          changeRecords: records,
          completed: true,
        },
      })
      navigate("/module/3")
    } finally {
      setSaving(false)
    }
  }

  /** 组员：导入汇总包 */
  const handleMemberImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !portfolio) return
    setImporting(true)
    setImportError(null)
    try {
      const text = await file.text()
      parseLesson5VersionChangeLeaderPackageJson(text)
      await savePortfolio({
        ...portfolio,
        lesson5: {
          ...portfolio.lesson5,
          importedVersionChangePackageJson: text,
          versionChangeMemberAcknowledged: false,
        },
      })
      setMemberAck(false)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "导入失败")
    } finally {
      setImporting(false)
    }
  }

  /** 组员：勾选核对后完成 */
  const handleMemberComplete = async () => {
    if (!portfolio || !memberParsedPkg || !memberAck) return
    setSaving(true)
    try {
      await savePortfolio({
        ...portfolio,
        pointer: advancePointer(portfolio.pointer, 5, 2),
        lesson5: {
          ...portfolio.lesson5,
          versionChangeMemberAcknowledged: true,
          completed: true,
        },
      })
      navigate("/module/3")
    } finally {
      setSaving(false)
    }
  }

  /** 左侧汇总区（组长用实时预览包；组员用已导入包） */
  function SummaryColumn({ pkg, readOnly }: { pkg: Lesson5VersionChangeLeaderPackageV1 | null; readOnly: boolean }) {
    if (!pkg) {
      return (
        <Card className="border-dashed">
          <CardContent className="pt-4 text-sm text-muted-foreground">暂无第1关汇总数据</CardContent>
        </Card>
      )
    }
    return (
      <div className="space-y-3">
        <Card className="bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">探究问题（共识）</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{pkg.finalResearchQuestion || "—"}</CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-primary">组长 · 本轮优先修改</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{pkg.leaderPriorityChange.trim() || "—"}</CardContent>
        </Card>
        {pkg.peerSummaries.length > 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">组员意见摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[55vh] overflow-y-auto">
              {pkg.peerSummaries.map((p, i) => (
                <div key={`${p.studentName}-${i}`} className="border rounded-lg p-3 text-xs space-y-1 bg-background">
                  <div className="font-semibold text-foreground">{p.studentName}</div>
                  <div className="text-muted-foreground">优先修改：</div>
                  <div className="whitespace-pre-wrap">{p.priorityChange || "—"}</div>
                  <div className="text-muted-foreground mt-1">四维度：</div>
                  <div className="whitespace-pre-wrap text-muted-foreground">{p.dimensionsSummary}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <p className="text-xs text-muted-foreground">第1关未导入组员意见包时，此处仅显示组长定稿。</p>
        )}
        {readOnly && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">只读：数据来自组长导出的汇总包</p>
        )}
      </div>
    )
  }

  if (!portfolio) {
    return <p className="text-sm text-muted-foreground">正在加载档案…</p>
  }

  const completeLeaderRows = records.filter(r => isRowCompleteLeader(r, reasonOptions)).length
  /** 组长首次完成本课前须先导出汇总包；本课已完成后不再要求 */
  const leaderFirstFinishNeedsExport =
    isLeader && !portfolio.lesson5.completed && !portfolio.lesson5.versionChangeLeaderPackageExported

  const memberRawJson = portfolio.lesson5.importedVersionChangePackageJson?.trim() ?? ""

  /* ─── 组员：已导入但 JSON 损坏 ─── */
  if (!isLeader && memberRawJson && !memberParsedPkg) {
    return (
      <div className="space-y-6 w-full max-w-lg mx-auto">
        <h3 className="text-xl font-bold">第2关：改动落地</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 space-y-3">
          <p>已保存的汇总包无法解析，可能文件已损坏。请删除后重新导入组长发送的 JSON。</p>
          <Button
            variant="outline"
            onClick={async () => {
              await savePortfolio({
                ...portfolio,
                lesson5: { ...portfolio.lesson5, importedVersionChangePackageJson: "", versionChangeMemberAcknowledged: false },
              })
            }}
          >
            清除并重新导入
          </Button>
        </div>
      </div>
    )
  }

  /* ─── 组员：未导入 ─── */
  if (!isLeader && !memberParsedPkg) {
    return (
      <div className="space-y-6 w-full max-w-lg mx-auto">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">第2关：改动落地</h3>
          <p className="text-muted-foreground text-sm">组员：请等待组长导出「改动落地汇总包」并发送给你后，在此导入。</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              导入组长汇总包
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">格式：JSON，由组长在本关点击「导出改动落地汇总包」生成。</p>
            <input ref={leaderFileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleMemberImport} />
            <Button
              type="button"
              variant="outline"
              className={cn("w-full gap-2", MEMBER_IMPORT_BTN)}
              disabled={importing}
              onClick={() => leaderFileRef.current?.click()}
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              选择汇总包文件
            </Button>
            {importError && <p className="text-xs text-red-600">{importError}</p>}
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ─── 组员：已导入 ─── */
  if (!isLeader && memberParsedPkg) {
    return (
      <div className="space-y-6 w-full max-w-6xl mx-auto">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">第2关：改动落地</h3>
          <p className="text-muted-foreground text-sm">组员：请核对组长汇总的第1关意见与改动表，确认无误后完成本课时。</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 space-y-3 min-w-0">
            <h4 className="text-sm font-semibold text-muted-foreground">第1关汇总</h4>
            <SummaryColumn pkg={memberParsedPkg} readOnly />
          </div>
          <div className="lg:col-span-2 space-y-3 min-w-0">
            <h4 className="text-sm font-semibold text-muted-foreground">详细改动表（只读）</h4>
            {memberParsedPkg.changeRecords.map((row, rowIdx) => (
              <div key={rowIdx} className="border rounded-lg p-4 space-y-2 bg-muted/10 text-sm">
                <div className="font-medium text-muted-foreground">改动 {rowIdx + 1}</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-3 gap-y-1">
                  <div className="min-w-0 sm:col-span-1">
                    <span className="text-muted-foreground">修改项目：</span>
                    {normalizeLesson5PosterSectionItem(row.item)}
                  </div>
                  <div className="min-w-0 sm:col-span-3"><span className="text-muted-foreground">依据哪条反馈：</span><span className="whitespace-pre-wrap break-words">{row.reason}</span></div>
                </div>
                <div><span className="text-muted-foreground">修改前：</span><span className="whitespace-pre-wrap">{row.before}</span></div>
                <div><span className="text-muted-foreground">修改后：</span><span className="whitespace-pre-wrap">{row.after}</span></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-sky-500/55 bg-sky-50/50 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={memberAck}
              onChange={e => setMemberAck(e.target.checked)}
            />
            <span>我已阅读并核对组长汇总的意见与改动说明</span>
          </label>
          <Button
            className="gap-2 sm:ml-auto"
            disabled={saving || !memberAck}
            onClick={handleMemberComplete}
          >
            {saving ? "保存中…" : "完成课时5"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  /* ─── 组长 ─── */
  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第2关：改动落地</h3>
        <p className="text-muted-foreground text-sm">组长：左侧为第1关汇总；右侧填写海报改动，导出 JSON 发给组员。</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 text-sm text-blue-800">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>修改项目与依据反馈并排选择（宽屏下修改项目约 1/4、依据约 3/4）；修改项目限定为海报五部分，依据须从下拉选择并与第1关组长定稿及已导入组员意见包对应。</span>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1 min-w-0 space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">第1关汇总</h4>
          <SummaryColumn pkg={leaderPreviewPkg} readOnly={false} />
        </div>

        <div className="lg:col-span-2 min-w-0 space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">详细改动说明</h4>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
                <span>改动表</span>
                <span className="text-xs font-normal text-muted-foreground">
                  已完整 {completeLeaderRows} 行（默认 2 行均必填；导出需至少 2 行完整）
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {records.map((row, rowIdx) => {
                const complete = isRowCompleteLeader(row, reasonOptions)
                const posterSelectValue = (() => {
                  const n = normalizeLesson5PosterSectionItem(row.item.trim())
                  return (LESSON5_POSTER_SECTION_OPTIONS as readonly string[]).includes(n) ? n : ""
                })()
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
                      {!complete && rowIdx < 2 && <span className="text-xs text-orange-600">必填</span>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="min-w-0 sm:col-span-1">
                        <div className="text-xs text-muted-foreground mb-1 font-medium">修改项目</div>
                        <select
                          className={SELECT_CLASS}
                          value={posterSelectValue}
                          onChange={e => updateRecord(rowIdx, "item", e.target.value)}
                        >
                          <option value="">请选择海报板块</option>
                          {LESSON5_POSTER_SECTION_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div className="min-w-0 sm:col-span-3">
                        <div className="text-xs text-muted-foreground mb-1 font-medium">依据哪条反馈</div>
                        <select
                          className={SELECT_CLASS}
                          value={reasonOptions.some(o => o.value === row.reason) ? row.reason : ""}
                          onChange={e => updateRecord(rowIdx, "reason", e.target.value)}
                        >
                          <option value="">请选择与第1关对应的反馈</option>
                          {reasonOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 font-medium">修改前</div>
                      <Textarea
                        placeholder="原来怎么写 / 怎么展示"
                        value={row.before}
                        onChange={e => updateRecord(rowIdx, "before", e.target.value)}
                        className="text-sm min-h-[60px] resize-none"
                        rows={2}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 font-medium">修改后</div>
                      <Textarea
                        placeholder="现在改成什么"
                        value={row.after}
                        onChange={e => updateRecord(rowIdx, "after", e.target.value)}
                        className="text-sm min-h-[60px] resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                )
              })}
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
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t">
        {leaderFirstFinishNeedsExport && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>首次完成课时5前，请先点击「导出改动落地汇总包」下载 JSON 并发给组员；本课已完成后若再改表，不会再次要求导出。</span>
          </div>
        )}
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <Button
            variant="outline"
            onClick={handleLeaderExportPackage}
            disabled={completeLeaderRows < 2}
            className={cn(
              "gap-2",
              portfolio.lesson5.versionChangeLeaderPackageExported
                ? "border-green-300 bg-green-50/80 text-green-900 hover:bg-green-50 hover:border-green-400"
                : "border-2 border-amber-500 bg-amber-50 text-amber-950 shadow-sm hover:bg-amber-100 hover:border-amber-600 ring-2 ring-amber-400/45 ring-offset-2 ring-offset-background",
            )}
          >
            {exportSuccess ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Download className="h-4 w-4" />}
            {exportSuccess ? "已导出！" : "导出改动落地汇总包（JSON）"}
          </Button>
          <Button
            onClick={handleLeaderComplete}
            disabled={saving || completeLeaderRows < 2 || leaderFirstFinishNeedsExport}
            className="gap-2"
          >
            {saving ? "保存中…" : "完成课时5"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
