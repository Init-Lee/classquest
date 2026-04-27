/**
 * 文件说明：课时5 · 第1关 · 同伴反馈单 v2（组长 / 组员双模式）
 * 职责：
 *   组员：每人填写四维度与一条「本轮最关注的修改点」；可导出同伴意见包交组长；无复制文本留痕；无「汇总说明」横幅、无研究身份区；
 *         使用提醒第2条仅组长可见（组员不显示「只记最值得改 2–3 条」）。
 *   组长：左侧与组员相同的汇总编辑区（组长填写内容即汇总定稿）；右侧按课时1名单核对并导入组员意见包（支持多选），
 *         下方汇总预览；组长不导出同伴意见包。
 * 更新触发：意见包格式、导入规则、校验文案或角色分支变化时
 */

import { useState, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle, ChevronRight, Upload, Users, Loader2,
  UserCheck, UserX,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { usePortfolio } from "@/modules/module-3-ai-science-station/app/providers/AppProvider"
import { advancePointer } from "@/modules/module-3-ai-science-station/utils/pointer"
import type { FeedbackDimension, Lesson5State } from "@/modules/module-3-ai-science-station/domains/portfolio/types"
import { createEmptyLesson5State } from "@/modules/module-3-ai-science-station/domains/portfolio/types"
import {
  downloadPeerFeedbackOpinionPackage,
  parsePeerFeedbackOpinionPackageJson,
  type PeerFeedbackOpinionPackage,
} from "@/modules/module-3-ai-science-station/infra/persistence/serializers/continue-package"
/** 维度状态对应的显示文案 */
const STATUS_LABELS: Record<FeedbackDimension["status"], string> = {
  clear: "基本清楚",
  "needs-change": "需要修改",
  "": "未判断",
}

/** 是否满足导出意见包 / 点「完成」过关：至少一条优先修改 + 至少一个维度已判断或有建议 */
function isPeerFeedbackFormReady(dimensions: FeedbackDimension[], priorityChange: string): boolean {
  if (!priorityChange.trim()) return false
  return dimensions.some(d => d.status !== "" || d.suggestion.trim())
}

export default function Step1PeerFeedback() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const leaderFileRef = useRef<HTMLInputElement>(null)

  const lesson5 = portfolio?.lesson5
  const isLeader = portfolio?.student.role === "leader"

  const [dimensions, setDimensions] = useState<FeedbackDimension[]>(
    () => lesson5?.feedbackDimensions ?? createEmptyLesson5State().feedbackDimensions
  )
  const [priorityChange, setPriorityChange] = useState(lesson5?.priorityChange ?? "")
  const [importedPackages, setImportedPackages] = useState<PeerFeedbackOpinionPackage[]>(() => {
    const raw = portfolio?.lesson5.peerFeedbackImportedPackagesJson
    if (!raw) return []
    try {
      const arr = JSON.parse(raw) as unknown
      return Array.isArray(arr) ? (arr as PeerFeedbackOpinionPackage[]) : []
    } catch {
      return []
    }
  })
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const updateDimensionStatus = (index: number, status: FeedbackDimension["status"]) => {
    setDimensions(prev => prev.map((d, i) => (i === index ? { ...d, status } : d)))
  }

  const updateDimensionSuggestion = useCallback((index: number, suggestion: string) => {
    setDimensions(prev => prev.map((d, i) => (i === index ? { ...d, suggestion } : d)))
  }, [])

  const validate = (): string[] => {
    const errs: string[] = []
    if (!isPeerFeedbackFormReady(dimensions, priorityChange)) {
      errs.push("请填写「本轮优先修改」至少一句话，并在四个维度中至少选择一项判断或填写建议")
    }
    return errs
  }

  const persistLesson5Patch = async (patch: Partial<Lesson5State>) => {
    if (!portfolio) return
    await savePortfolio({
      ...portfolio,
      lesson5: { ...portfolio.lesson5, ...patch },
    })
  }

  /** 组员：导出同伴意见包 JSON（交给组长导入） */
  const handleDownloadOpinionPackage = () => {
    const errs = validate()
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])
    if (!portfolio) return
    downloadPeerFeedbackOpinionPackage({
      ...portfolio,
      lesson5: { ...portfolio.lesson5, feedbackDimensions: dimensions, priorityChange },
    })
    void persistLesson5Patch({ feedbackDimensions: dimensions, priorityChange, feedbackExported: true })
  }

  /** 组长：导入组员意见包（可多选；以课时1登记名单为准，不再强绑 student.groupName） */
  const handleLeaderImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (files.length === 0 || !portfolio) return
    setImporting(true)
    setImportError(null)
    const myName = portfolio.lesson1.confirmedOwnerName || portfolio.student.studentName
    const roster = (portfolio.lesson1.groupMembers ?? []).map(n => n.trim()).filter(Boolean)
    const errors: string[] = []
    let next = [...importedPackages]

    for (const file of files) {
      try {
        const text = await file.text()
        const pkg = parsePeerFeedbackOpinionPackageJson(text)
        if (pkg.studentName.trim() === myName.trim()) {
          continue
        }
        if (roster.length > 0 && !roster.some(n => n === pkg.studentName.trim())) {
          errors.push(`${file.name}：「${pkg.studentName}」不在课时1登记的小组成员名单中`)
          continue
        }
        next = next.filter(p => p.studentName.trim() !== pkg.studentName.trim())
        next.push(pkg)
      } catch (err) {
        errors.push(`${file.name}：${err instanceof Error ? err.message : "解析失败"}`)
      }
    }

    try {
      await savePortfolio({
        ...portfolio,
        lesson5: {
          ...portfolio.lesson5,
          feedbackDimensions: dimensions,
          priorityChange,
          peerFeedbackImportedPackagesJson: JSON.stringify(next),
        },
      })
      setImportedPackages(next)
      if (errors.length > 0) setImportError(errors.join("\n"))
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "保存失败")
    } finally {
      setImporting(false)
    }
  }

  /** 完成第1关 */
  const handleComplete = async () => {
    const errs = validate()
    if (errs.length > 0) {
      setErrors(errs)
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
          feedbackDimensions: dimensions,
          priorityChange,
          peerFeedbackImportedPackagesJson: JSON.stringify(importedPackages),
          feedbackExported: true,
          feedbackCompleted: true,
        },
      })
      navigate("/module/3/lesson/5/step/2")
    } finally {
      setSaving(false)
    }
  }

  const ready = isPeerFeedbackFormReady(dimensions, priorityChange)

  if (!portfolio) {
    return <p className="text-sm text-muted-foreground">正在加载档案…</p>
  }

  const myDisplayName = portfolio.lesson1.confirmedOwnerName || portfolio.student.studentName
  const peerMemberNames = (portfolio.lesson1.groupMembers ?? []).filter(
    n => n.trim() && n.trim() !== myDisplayName.trim()
  )
  const hasPeerRoster = peerMemberNames.length > 0
  const importedOpinionNames = new Set(importedPackages.map(p => p.studentName.trim()))
  const opinionImportedCount = peerMemberNames.filter(n => importedOpinionNames.has(n)).length

  /** 左侧共用表单区 */
  const formSection = (
    <div className="space-y-4">
      {/* 使用提醒 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-blue-800">使用提醒</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-1.5 text-sm text-blue-900 list-decimal list-inside">
            <li>每个成员至少说 1 条有效意见</li>
            {isLeader && <li>只记「最值得改」的 2–3 条，汇总到下方「本轮优先修改」</li>}
            <li>反馈重点放在逻辑、证据、结论、建议，不讨论美丑</li>
          </ol>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">四个维度判断（不要求全部填写）</h4>
        {dimensions.map((dim, i) => (
          <Card key={`${dim.name}-${i}`} className={dim.status === "needs-change" ? "border-orange-300 bg-orange-50/30" : ""}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-medium text-sm">{i + 1}. {dim.name}</span>
                <div className="flex gap-2">
                  {(["clear", "needs-change"] as const).map(s => (
                    <button
                      key={s}
                      type="button"
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

      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {isLeader ? "本轮优先修改（小组汇总定稿）" : "本轮优先修改（我最关注的一条）"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-2">
            写具体，不写「感觉一般」。例：「&quot;浪费很严重&quot;结论证据不够，建议补数据或缩小结论范围」
          </p>
          <Textarea
            placeholder={isLeader ? "汇总后写出本组本轮最优先的一条或一小段话" : "写出你最希望小组优先修改的一点"}
            value={priorityChange}
            onChange={e => setPriorityChange(e.target.value)}
            className="text-sm min-h-[80px] resize-none"
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  )

  /** 组长右侧：导入 + 汇总预览 */
  const leaderSidePanel = isLeader && (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            导入组员意见包
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            请组员在本关填写完成后使用「导出意见包」发给你；在此可多选 JSON 一次导入。同名成员会覆盖旧包；组长本人在左侧填写，无需再导自己的包。
          </p>
          {hasPeerRoster ? (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                组员意见（{opinionImportedCount}/{peerMemberNames.length} 已导入）
              </p>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                <UserCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span className="text-xs font-medium text-blue-800 flex-1">{myDisplayName}</span>
                <Badge className="text-xs bg-blue-100 text-blue-700 border-0">组长 · 左侧表单</Badge>
              </div>
              {peerMemberNames.map(name => {
                const done = importedOpinionNames.has(name.trim())
                return (
                  <div
                    key={name}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${
                      done ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    {done
                      ? <UserCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      : <UserX className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
                    <span className={`text-xs font-medium flex-1 ${done ? "text-emerald-800" : "text-gray-600"}`}>
                      {name}
                    </span>
                    <Badge
                      variant={done ? "default" : "outline"}
                      className={`text-xs ${done ? "bg-emerald-100 text-emerald-700 border-0" : "text-gray-400"}`}
                    >
                      {done ? "已导入" : "未导入"}
                    </Badge>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              课时1未录入成员名单，可直接导入意见包文件（无法按人核对）。
            </div>
          )}
          <input
            ref={leaderFileRef}
            type="file"
            accept=".json,application/json"
            multiple
            className="hidden"
            onChange={handleLeaderImportFile}
          />
          <Button
            type="button"
            variant="outline"
            disabled={importing}
            className="w-full gap-2"
            onClick={() => leaderFileRef.current?.click()}
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            选择意见包文件（可多选）
          </Button>
          {importError && (
            <pre className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2 whitespace-pre-wrap">{importError}</pre>
          )}
          <p className="text-xs text-muted-foreground">已保存意见包共 {importedPackages.length} 份</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            汇总预览
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto text-sm">
          {importedPackages.length === 0 && !priorityChange.trim() && !dimensions.some(d => d.status || d.suggestion.trim()) ? (
            <p className="text-muted-foreground text-xs">导入组员意见包后，将在此列出；左侧为组长汇总定稿区，填写后也会出现在下方。</p>
          ) : null}
          {importedPackages.map(pkg => (
            <div key={`${pkg.studentName}-${pkg.exportedAt}`} className="border rounded-lg p-3 bg-muted/30 space-y-1">
              <div className="font-medium text-foreground">{pkg.studentName}</div>
              <div className="text-xs text-muted-foreground">{pkg.clazz} · {pkg.groupName}</div>
              <div className="text-xs mt-2"><span className="text-muted-foreground">优先修改：</span>{pkg.priorityChange || "—"}</div>
            </div>
          ))}
          <div className="border-2 border-primary/40 rounded-lg p-3 bg-primary/5 space-y-1">
            <div className="font-medium text-primary">组长（本机汇总表）</div>
            <div className="text-xs text-muted-foreground">与左侧表单同步</div>
            <div className="text-xs mt-2"><span className="text-muted-foreground">优先修改：</span>{priorityChange.trim() || "—"}</div>
            <div className="text-xs mt-1 text-muted-foreground">
              四维度：
              {dimensions.filter(d => d.status === "needs-change").length}
              项标为「需要修改」
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className={`space-y-6 w-full ${isLeader ? "max-w-6xl" : "max-w-3xl"}`}>
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第1关：意见入池</h3>
        <p className="text-muted-foreground text-sm">
          {isLeader ? "组长：汇总组员意见并定稿「本轮优先修改」" : "组员：发表你对海报的个人意见"}
        </p>
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

      {isLeader ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 min-w-0">{formSection}</div>
          <div className="space-y-4 min-w-0 lg:sticky lg:top-4">{leaderSidePanel}</div>
        </div>
      ) : (
        formSection
      )}

      <div className="flex flex-wrap gap-3 justify-between items-center pt-2 border-t">
        <div className="flex flex-wrap gap-2">
          {!isLeader && (
            <Button variant="outline" onClick={handleDownloadOpinionPackage} disabled={!ready} className="gap-2">
              导出意见包
            </Button>
          )}
        </div>
        <Button onClick={handleComplete} disabled={saving || !ready} className="gap-2">
          {saving ? "保存中…" : "完成第1关，进入改动落地"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
