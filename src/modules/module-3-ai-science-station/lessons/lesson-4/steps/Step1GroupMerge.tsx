/**
 * 文件说明：课时4 · 第1关 · 小组合并与补齐"可能的原因"
 * 职责：
 *   组长视图：
 *     - 左列：本关说明、探究问题、海报标题/副标题、"可能的原因"、保存与导出；
 *     - 右列：导入成员整理包（名单状态）+ 合并内容预览（骨架包将含内容）；
 *     - 组长自身课时3数据自动纳入合并，无需手动导入自己的包。
 *   组员视图：导入组长分发的小组骨架包 v1，查看内容，进入第2关。
 * 更新触发：个人整理包/骨架包格式变更时；合并逻辑调整时；角色分离逻辑变化时
 */

import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Upload, Users, ArrowRight, CheckCircle2, AlertCircle,
  FileText, Download, Loader2, Lock, Eye, UserCheck, UserX,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Textarea } from "@/shared/ui/textarea"
import { Input } from "@/shared/ui/input"
import { usePortfolio } from "@/modules/module-3-ai-science-station/app/providers/AppProvider"
import { advancePointer } from "@/modules/module-3-ai-science-station/utils/pointer"
import {
  deserializePersonalPackage,
  deserializeSkeletonPackageV1,
  serializeSkeletonPackageV1,
  type PersonalPackage,
  type SkeletonPackageV1,
} from "@/modules/module-3-ai-science-station/infra/persistence/serializers/continue-package"

export default function Step1GroupMerge() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const leaderFileInputRef = useRef<HTMLInputElement>(null)
  const memberFileInputRef = useRef<HTMLInputElement>(null)

  // ---- 组长状态：从 DB 恢复已导入的成员包 ----
  const [importedPackages, setImportedPackages] = useState<PersonalPackage[]>(() => {
    const raw = portfolio?.lesson4.importedPackagesJson
    if (!raw) return []
    try { return JSON.parse(raw) as PersonalPackage[] }
    catch { return [] }
  })
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [possibleCauses, setPossibleCauses] = useState(
    portfolio?.lesson4.possibleCauses ?? ""
  )
  const [posterTitle, setPosterTitle] = useState(
    portfolio?.lesson4.posterTitle ?? ""
  )
  const [posterSubtitle, setPosterSubtitle] = useState(
    portfolio?.lesson4.posterSubtitle ?? ""
  )
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  // ---- 组员状态 ----
  const [importingSkeleton, setImportingSkeleton] = useState(false)
  const [skeletonImportError, setSkeletonImportError] = useState<string | null>(null)
  const [skeletonPreview, setSkeletonPreview] = useState<SkeletonPackageV1 | null>(null)

  if (!portfolio) return null

  const { lesson4, lesson3, lesson2, lesson1, student } = portfolio
  const isLeader = student.role === "leader"
  const researchQuestion = lesson1.groupConsensus?.finalResearchQuestion ?? ""
  const myName = lesson1.confirmedOwnerName || student.studentName

  // ── 成员名单（来自课时1组长录入，过滤掉组长自身避免重复） ──
  const groupMemberNames: string[] = (lesson1.groupMembers ?? []).filter(
    name => name.trim() && name !== myName
  )
  const hasMemberList = groupMemberNames.length > 0

  // ── 组长自身数据包（自动包含） ──
  const leaderSelfPackage: PersonalPackage = {
    packageType: "personal-package-v1",
    studentName: student.studentName,
    role: "leader",
    groupName: student.groupName,
    toolboxWhyOnPoster: lesson3.toolboxWhyOnPoster,
    toolboxNoticeWhat: lesson3.toolboxNoticeWhat,
    selectedMaterials: lesson3.selectedMaterials,
    evidenceCards: lesson3.evidenceCards,
    publicRecords: lesson2.publicRecords.filter(r => r.owner === myName),
    fieldTasks: lesson2.fieldTasks.filter(t => t.owner === myName),
    exportedAt: "",
  }

  /** 全部包（组长自身 + 已导入的成员包），用于合并计算 */
  const allPackages: PersonalPackage[] = [leaderSelfPackage, ...importedPackages]

  /** 合并"为何关注"：每人一行 */
  const mergedWhyCare = allPackages
    .filter(p => p.toolboxWhyOnPoster.trim())
    .map(p => `【${p.studentName}】${p.toolboxWhyOnPoster.trim()}`)
    .join("\n")

  /** 合并"我们看见了什么"：所有证据卡的 posterExpression */
  const mergedWhatWeSee: string[] = allPackages.flatMap(p =>
    p.evidenceCards
      .filter(c => c.posterExpression?.trim())
      .map(c => `【${p.studentName}】${c.posterExpression.trim()}`)
  )

  /**
   * 合并来源资料：所有成员课时2的完整采集条目字符串（citationFull）
   * 含公开资源记录 + 现场采集任务，citationFull 为课时2自动生成的标准格式
   */
  const mergedSources: string[] = allPackages.flatMap(p => [
    ...p.publicRecords
      .filter(r => (r.citationFull ?? r.item)?.trim())
      .map(r => (r.citationFull?.trim() || r.item.trim())),
    ...p.fieldTasks
      .filter(t => (t.citationFull ?? t.materialName ?? t.item)?.trim())
      .map(t => (t.citationFull?.trim() || t.materialName?.trim() || t.item.trim())),
  ])

  // ── 成员导入状态 ──
  const importedNames = new Set(importedPackages.map(p => p.studentName))

  // ============================================================
  // 组长：导入成员个人整理包（导入后自动持久化到 DB）
  // ============================================================
  const handleLeaderFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setImporting(true)
    setImportError(null)

    const errors: string[] = []
    let nextPackages = [...importedPackages]

    for (const file of files) {
      try {
        const pkg = await deserializePersonalPackage(file)
        // 跳过自己的包（组长数据已自动包含）
        if (pkg.studentName === student.studentName) continue
        const existingIdx = nextPackages.findIndex(p => p.studentName === pkg.studentName)
        if (existingIdx >= 0) {
          nextPackages[existingIdx] = pkg
        } else {
          nextPackages.push(pkg)
        }
      } catch (err) {
        errors.push(`${file.name}：${err instanceof Error ? err.message : "解析失败"}`)
      }
    }

    setImportedPackages(nextPackages)
    if (errors.length > 0) setImportError(errors.join("\n"))
    setImporting(false)
    if (leaderFileInputRef.current) leaderFileInputRef.current.value = ""

    // 导入完成后立即持久化，防止刷新丢失
    await savePortfolio({
      ...portfolio,
      lesson4: {
        ...lesson4,
        memberPackagesImported: nextPackages.length,
        importedPackagesJson: JSON.stringify(nextPackages),
      },
    })
  }

  /** 组长：保存合并进度（不跳转） */
  const handleSaveMerge = async () => {
    if (saving) return
    setSaving(true)
    try {
      await savePortfolio({
        ...portfolio,
        lesson4: {
          ...lesson4,
          memberPackagesImported: importedPackages.length,
          importedPackagesJson: JSON.stringify(importedPackages),
          groupMergeCompleted: true,
          possibleCauses,
          posterTitle,
          posterSubtitle,
        },
      })
    } finally {
      setSaving(false)
    }
  }

  /** 组长：导出骨架包，标记 skeletonExported，同时将骨架 JSON 存入 skeletonPackageJson 供第2关使用 */
  const handleExportSkeleton = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const skeletonData = {
        researchQuestion,
        groupName: student.groupName,
        leaderName: student.studentName,
        posterTitle,
        posterSubtitle,
        mergedWhyCare,
        mergedWhatWeSee,
        mergedSources,
        memberPackages: allPackages,
        possibleCauses,
      }
      const blob = serializeSkeletonPackageV1(skeletonData)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `小组网页骨架包v1_${student.groupName}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // 组长也将骨架包存入 skeletonPackageJson，第2关可直接读取展示合并内容
      const skeletonJson = JSON.stringify({
        packageType: "skeleton-package-v1",
        ...skeletonData,
        exportedAt: new Date().toISOString(),
      })

      await savePortfolio({
        ...portfolio,
        pointer: advancePointer(portfolio.pointer, 4, 1),
        lesson4: {
          ...lesson4,
          memberPackagesImported: importedPackages.length,
          importedPackagesJson: JSON.stringify(importedPackages),
          groupMergeCompleted: true,
          possibleCauses,
          posterTitle,
          posterSubtitle,
          skeletonExported: true,
          skeletonPackageJson: skeletonJson,
        },
      })
    } finally {
      setExporting(false)
    }
  }

  const canExport = posterTitle.trim().length > 0
    && posterSubtitle.trim().length > 0
    && possibleCauses.trim().length > 0

  // ============================================================
  // 组员：导入骨架包
  // ============================================================
  const handleSkeletonFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportingSkeleton(true)
    setSkeletonImportError(null)
    try {
      const pkg = await deserializeSkeletonPackageV1(file)
      setSkeletonPreview(pkg)
      await savePortfolio({
        ...portfolio,
        pointer: advancePointer(portfolio.pointer, 4, 1),
        lesson4: {
          ...lesson4,
          skeletonImported: true,
          skeletonPackageJson: JSON.stringify(pkg),
        },
      })
    } catch (err) {
      setSkeletonImportError(err instanceof Error ? err.message : "导入失败，请检查文件")
    } finally {
      setImportingSkeleton(false)
      if (memberFileInputRef.current) memberFileInputRef.current.value = ""
    }
  }

  // 组员：解析已保存的骨架包（刷新后从 DB 恢复预览）
  const memberSkeleton: SkeletonPackageV1 | null = (() => {
    if (skeletonPreview) return skeletonPreview
    if (lesson4.skeletonPackageJson) {
      try { return JSON.parse(lesson4.skeletonPackageJson) as SkeletonPackageV1 }
      catch { return null }
    }
    return null
  })()

  // ============================================================
  // 渲染
  // ============================================================
  return (
    <div className="space-y-6 max-w-6xl">

      {/* ============================================================
          组长视图：左列（说明/标题/原因/导出）+ 右列（导入+合并预览）
      ============================================================ */}
      {isLeader && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* ─────────────── 左列 ─────────────── */}
          <div className="space-y-5 min-w-0">
            <Card className="border-orange-200 bg-orange-50/30">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  第1关：小组合并与补齐"可能的原因"
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 space-y-1.5">
                <p className="text-sm text-gray-700">
                  在开始制作网页之前，先把大家在课时3完成的个人成果合并成一份小组统一的文字骨架。
                </p>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>• <strong>左侧</strong>：填写海报标题与副标题、补齐「可能的原因」、保存并导出骨架包</p>
                  <p>• <strong>右侧</strong>：按名单导入成员整理包，并随时查看合并内容预览（含组长自身数据）</p>
                </div>
              </CardContent>
            </Card>

            {researchQuestion && (
              <Card>
                <CardContent className="py-3">
                  <p className="text-xs text-muted-foreground mb-1">本组探究问题（来自课时1）</p>
                  <p className="text-sm font-medium text-gray-800">{researchQuestion}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-600" />
                  海报标题与副标题
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <p className="text-xs text-muted-foreground">
                  为本次小组探究的网页海报起一个清晰的标题（研究问题的简洁表达）和副标题（补充说明方向或范围）。
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">标题 *</label>
                    <Input
                      value={posterTitle}
                      onChange={e => setPosterTitle(e.target.value)}
                      placeholder="例：共享单车停放乱象——谁该负责？"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">副标题 *</label>
                    <Input
                      value={posterSubtitle}
                      onChange={e => setPosterSubtitle(e.target.value)}
                      placeholder="例：基于XX路段的实地调查与案例分析"
                      className="text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-600" />
                  补齐"可能的原因"
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <p className="text-xs text-muted-foreground">
                  汇总所有成员证据后，小组讨论：基于这些现象，「可能的原因」是什么？
                  必须用「可能 / 推测 / 初步认为」等谨慎表述，不要直接下定论。
                </p>
                <Textarea
                  value={possibleCauses}
                  onChange={e => setPossibleCauses(e.target.value)}
                  placeholder="基于上述证据，我们初步推测可能的原因是……（请用谨慎表述）"
                  rows={6}
                  className="text-sm resize-none"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveMerge}
                  disabled={saving}
                  className="gap-1.5"
                >
                  {saving
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <CheckCircle2 className="h-3.5 w-3.5" />}
                  保存进度
                </Button>
              </CardContent>
            </Card>

            <Card className="border-emerald-200">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Download className="h-4 w-4 text-emerald-600" />
                  导出小组网页文字骨架包 v1
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <p className="text-xs text-muted-foreground">
                  导出后分发给每位组员，大家在第2关各自导入，独立完成一版个人网页草稿。
                </p>
                {!canExport && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                    请先填写海报标题、副标题和"可能的原因"，再导出骨架包。
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={handleExportSkeleton}
                    disabled={!canExport || exporting}
                    className="gap-2"
                  >
                    {exporting
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Download className="h-4 w-4" />}
                    {lesson4.skeletonExported ? "重新导出骨架包" : "导出骨架包"}
                  </Button>
                  <Button
                    variant={lesson4.skeletonExported ? "default" : "outline"}
                    onClick={() => navigate("/module/3/lesson/4/step/2")}
                    disabled={!lesson4.skeletonExported}
                    className="gap-2"
                  >
                    进入第2关 <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                {lesson4.skeletonExported && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    骨架包 v1 已导出，可进入第2关
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ─────────────── 右列：仅导入 + 合并预览 ─────────────── */}
          <div className="space-y-5 min-w-0 lg:sticky lg:top-4 lg:self-start">
            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-600" />
                  导入成员整理包
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                {hasMemberList ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">
                      成员名单（{importedPackages.length}/{groupMemberNames.length} 已导入）
                    </p>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                      <UserCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="text-xs font-medium text-blue-800 flex-1">{student.studentName}</span>
                      <Badge className="text-xs bg-blue-100 text-blue-700 border-0">组长 · 自动</Badge>
                    </div>
                    {groupMemberNames.map(name => {
                      const imported = importedNames.has(name)
                      return (
                        <div
                          key={name}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${
                            imported
                              ? "bg-emerald-50 border-emerald-200"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          {imported
                            ? <UserCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            : <UserX className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
                          <span className={`text-xs font-medium flex-1 ${imported ? "text-emerald-800" : "text-gray-600"}`}>
                            {name}
                          </span>
                          <Badge
                            variant={imported ? "default" : "outline"}
                            className={`text-xs ${imported ? "bg-emerald-100 text-emerald-700 border-0" : "text-gray-400"}`}
                          >
                            {imported ? "已导入" : "未导入"}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    课时1未录入成员名单，请直接导入文件。
                  </div>
                )}

                <div
                  className="border-2 border-dashed border-blue-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                  onClick={() => leaderFileInputRef.current?.click()}
                >
                  {importing ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      正在读取文件…
                    </div>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mx-auto mb-1 text-blue-400" />
                      <p className="text-xs text-muted-foreground">点击选择个人整理包文件（可多选）</p>
                      <p className="text-xs text-muted-foreground mt-0.5 opacity-70">格式：个人整理包_*.json</p>
                    </>
                  )}
                  <input
                    ref={leaderFileInputRef}
                    type="file"
                    accept=".json"
                    multiple
                    className="hidden"
                    onChange={handleLeaderFileChange}
                  />
                </div>
                {importError && (
                  <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <pre className="whitespace-pre-wrap">{importError}</pre>
                  </div>
                )}

                {importedPackages.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs text-muted-foreground">已导入内容摘要</p>
                    {importedPackages.map((pkg, i) => (
                      <div key={i} className="border rounded-lg p-2.5 bg-gray-50/60 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium">{pkg.studentName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {pkg.evidenceCards.length} 张证据卡
                          </Badge>
                        </div>
                        {pkg.toolboxWhyOnPoster && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            为何关注：{pkg.toolboxWhyOnPoster}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gray-600" />
                  合并内容预览（骨架包将包含以下内容）
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="bg-gray-50 rounded-lg p-3 space-y-3 text-xs max-h-[min(70vh,520px)] overflow-y-auto">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <p className="font-medium text-gray-500 mb-0.5">【标题】</p>
                      {posterTitle
                        ? <p className="text-gray-800 font-semibold">{posterTitle}</p>
                        : <p className="text-gray-400 italic">未填写</p>}
                    </div>
                    <div>
                      <p className="font-medium text-gray-500 mb-0.5">【副标题】</p>
                      {posterSubtitle
                        ? <p className="text-gray-700">{posterSubtitle}</p>
                        : <p className="text-gray-400 italic">未填写</p>}
                    </div>
                  </div>

                  <div>
                    <p className="font-medium text-gray-500 mb-0.5">
                      【为何关注】（{allPackages.filter(p => p.toolboxWhyOnPoster.trim()).length} 人）
                    </p>
                    {mergedWhyCare
                      ? <p className="text-gray-700 whitespace-pre-line">{mergedWhyCare}</p>
                      : <p className="text-gray-400 italic">暂无数据</p>}
                  </div>

                  <div>
                    <p className="font-medium text-gray-500 mb-0.5">
                      【我们看见了什么】（{mergedWhatWeSee.length} 条证据表述）
                    </p>
                    {mergedWhatWeSee.length > 0 ? (
                      <ul className="space-y-0.5">
                        {mergedWhatWeSee.map((item, i) => (
                          <li key={i} className="text-gray-700">· {item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 italic">暂无数据（成员证据卡填写海报表述后出现）</p>
                    )}
                  </div>

                  <div>
                    <p className="font-medium text-gray-500 mb-0.5">【可能的线索/原因】</p>
                    {possibleCauses.trim()
                      ? <p className="text-gray-700 whitespace-pre-line">{possibleCauses}</p>
                      : <p className="text-gray-400 italic">未填写</p>}
                  </div>

                  {mergedSources.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-500 mb-0.5">
                        【来源资料】（{mergedSources.length} 条）
                      </p>
                      <ul className="space-y-0.5">
                        {mergedSources.slice(0, 5).map((src, i) => (
                          <li key={i} className="text-gray-600">· {src}</li>
                        ))}
                        {mergedSources.length > 5 && (
                          <li className="text-gray-400">…共 {mergedSources.length} 条</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground pt-1 border-t">
                    合并成员共 {allPackages.length} 人（含组长自身）。
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ============================================================
          组员视图：本关说明 + 导入骨架包
      ============================================================ */}
      {!isLeader && (
        <>
          <Card className="border-orange-200 bg-orange-50/30 max-w-3xl">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-600" />
                第1关：小组合并与补齐"可能的原因"
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 space-y-1.5">
              <p className="text-sm text-gray-700">
                在开始制作网页之前，先把大家在课时3完成的个人成果合并成一份小组统一的文字骨架。
              </p>
              <p className="text-xs text-gray-500">
                收到组长分发的「小组网页文字骨架包 v1」后，在下方导入，查看内容，进入第2关。
              </p>
            </CardContent>
          </Card>

          {/* 骨架包文件 input：两个分支共用同一个 ref */}
          <input
            ref={memberFileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleSkeletonFileChange}
          />

          {lesson4.skeletonImported && memberSkeleton ? (
            <Card className="border-emerald-200">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  已导入小组骨架包 v1
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <div className="bg-gray-50 rounded-lg p-3 space-y-3 text-xs max-h-[min(70vh,480px)] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    <p><span className="text-muted-foreground">小组：</span>{memberSkeleton.groupName}</p>
                    <p><span className="text-muted-foreground">组长：</span>{memberSkeleton.leaderName}</p>
                  </div>
                  {memberSkeleton.posterTitle && (
                    <div>
                      <p className="font-medium text-gray-500 mb-0.5">海报标题</p>
                      <p className="text-gray-800 font-semibold">{memberSkeleton.posterTitle}</p>
                      {memberSkeleton.posterSubtitle && (
                        <p className="text-gray-600 mt-0.5">{memberSkeleton.posterSubtitle}</p>
                      )}
                    </div>
                  )}
                  {memberSkeleton.mergedWhyCare && (
                    <div>
                      <p className="font-medium text-gray-500 mb-0.5">为何关注</p>
                      <p className="text-gray-700 whitespace-pre-line">{memberSkeleton.mergedWhyCare}</p>
                    </div>
                  )}
                  {memberSkeleton.mergedWhatWeSee?.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-500 mb-0.5">
                        我们看见了什么（{memberSkeleton.mergedWhatWeSee.length} 条）
                      </p>
                      <ul className="space-y-0.5">
                        {memberSkeleton.mergedWhatWeSee.map((item, i) => (
                          <li key={i} className="text-gray-700">· {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {memberSkeleton.possibleCauses && (
                    <div>
                      <p className="font-medium text-gray-500 mb-0.5">可能的线索/原因</p>
                      <p className="text-gray-700">{memberSkeleton.possibleCauses}</p>
                    </div>
                  )}
                  {memberSkeleton.mergedSources?.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-500 mb-0.5">
                        来源资料（{memberSkeleton.mergedSources.length} 条）
                      </p>
                      <ul className="space-y-0.5">
                        {memberSkeleton.mergedSources.map((src, i) => (
                          <li key={i} className="text-gray-600">· {src}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {skeletonImportError && (
                  <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {skeletonImportError}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 items-center">
                  <Button onClick={() => navigate("/module/3/lesson/4/step/2")} className="gap-2">
                    进入第2关，完成个人草稿 <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => memberFileInputRef.current?.click()}
                    disabled={importingSkeleton}
                    className="gap-1.5"
                  >
                    {importingSkeleton
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Upload className="h-3.5 w-3.5" />}
                    重新导入骨架包
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-600" />
                  导入小组网页文字骨架包 v1
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  等待组长分发「小组网页文字骨架包 v1」，收到后在此导入。
                </div>
                <div
                  className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                  onClick={() => memberFileInputRef.current?.click()}
                >
                  {importingSkeleton ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      正在读取…
                    </div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 mx-auto mb-1.5 text-blue-400" />
                      <p className="text-sm text-muted-foreground">点击选择骨架包文件</p>
                      <p className="text-xs text-muted-foreground mt-0.5">格式：小组网页骨架包v1_*.json</p>
                    </>
                  )}
                </div>
                {skeletonImportError && (
                  <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {skeletonImportError}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
