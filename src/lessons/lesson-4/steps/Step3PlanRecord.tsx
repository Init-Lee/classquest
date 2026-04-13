/**
 * 文件说明：课时4 · 第3关 · 组长记录小组讨论与制作方案
 * 职责：组长填写小组制作方案单（底稿选择、分工、AI边界、媒体替换计划），
 *       确认后可导出 JSON 文件分发给组员；
 *       组员导入组长分发的方案单文件后，以告知书形式查看内容并勾选"已知悉"过关。
 * 更新触发：方案单字段变化时；角色分离逻辑调整时；导出/导入格式变化时
 */

import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  ClipboardList, ArrowRight, CheckCircle2, Lock,
  Loader2, Users, Info, Download, Upload, AlertCircle,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { usePortfolio } from "@/app/providers/AppProvider"
import { advancePointer } from "@/shared/utils/pointer"
import type { ProductionPlan } from "@/domains/portfolio/types"

const EMPTY_PLAN: ProductionPlan = {
  baseAuthor: "",
  operatorName: "",
  evidenceCheckerName: "",
  sourceCheckerName: "",
  aiVerifierName: "",
  mediaReplacementPlan: "",
  aiUsageBoundary: "",
  manualCheckPoints: "",
}

export default function Step3PlanRecord() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const planFileInputRef = useRef<HTMLInputElement>(null)

  const [plan, setPlan] = useState<ProductionPlan>(
    portfolio?.lesson4.productionPlan ?? EMPTY_PLAN
  )
  const [memberAcknowledged, setMemberAcknowledged] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [importingPlan, setImportingPlan] = useState(false)
  const [planImportError, setPlanImportError] = useState<string | null>(null)

  if (!portfolio) return null

  const { lesson4, student } = portfolio
  const isLeader = student.role === "leader"

  const updatePlan = (field: keyof ProductionPlan, value: string) => {
    setPlan(prev => ({ ...prev, [field]: value }))
  }

  const isFormValid =
    plan.baseAuthor.trim().length > 0 &&
    plan.operatorName.trim().length > 0

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await savePortfolio({
        ...portfolio,
        lesson4: { ...lesson4, productionPlan: plan },
      })
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async () => {
    if (completing) return
    setCompleting(true)
    try {
      await savePortfolio({
        ...portfolio,
        pointer: advancePointer(portfolio.pointer, 4, 3),
        lesson4: {
          ...lesson4,
          productionPlan: plan,
          planCompleted: true,
        },
      })
      navigate("/lesson/4/step/4")
    } finally {
      setCompleting(false)
    }
  }

  /** 组长：导出制作方案单 JSON，供组员导入 */
  const handleExportPlan = () => {
    const planToExport = lesson4.productionPlan ?? plan
    const exportData = {
      packageType: "production-plan-v1",
      groupName: student.groupName,
      leaderName: student.studentName,
      plan: planToExport,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `小组制作方案单_${student.groupName}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /** 组员完成告知确认 */
  const handleMemberComplete = async () => {
    if (completing) return
    setCompleting(true)
    try {
      await savePortfolio({
        ...portfolio,
        pointer: advancePointer(portfolio.pointer, 4, 3),
        lesson4: { ...lesson4, planCompleted: true },
      })
      navigate("/lesson/4/step/4")
    } finally {
      setCompleting(false)
    }
  }

  /** 组员：导入组长分发的制作方案单文件 */
  const handlePlanFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportingPlan(true)
    setPlanImportError(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (data.packageType !== "production-plan-v1" || !data.plan) {
        throw new Error("文件格式不正确，请确认为「小组制作方案单」文件")
      }
      await savePortfolio({
        ...portfolio,
        lesson4: { ...lesson4, productionPlan: data.plan as ProductionPlan },
      })
    } catch (err) {
      setPlanImportError(err instanceof Error ? err.message : "导入失败，请检查文件")
    } finally {
      setImportingPlan(false)
      if (planFileInputRef.current) planFileInputRef.current.value = ""
    }
  }

  /* ── 组员视图：导入 + 告知书 ── */
  if (!isLeader) {
    const existingPlan = lesson4.productionPlan
    return (
      <div className="space-y-6 max-w-3xl">
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-orange-600" />
              第3关：小组制作方案（组员查看版）
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm text-gray-700">
              本关由组长记录小组讨论结果，形成制作方案单。收到组长导出的文件后导入，阅读内容并确认已知悉。
            </p>
          </CardContent>
        </Card>

        {/* 导入区：始终显示，支持重新导入 */}
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Upload className="h-4 w-4 text-blue-600" />
              {existingPlan ? "重新导入制作方案单" : "导入小组制作方案单"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            {!existingPlan && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                等待组长导出「小组制作方案单」文件，收到后在此导入。
              </div>
            )}
            <div
              className="border-2 border-dashed border-blue-200 rounded-lg p-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
              onClick={() => planFileInputRef.current?.click()}
            >
              {importingPlan ? (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在读取…
                </div>
              ) : (
                <>
                  <Upload className="h-5 w-5 mx-auto mb-1 text-blue-400" />
                  <p className="text-sm text-muted-foreground">
                    {existingPlan ? "点击重新选择方案单文件" : "点击选择方案单文件"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">格式：小组制作方案单_*.json</p>
                </>
              )}
              <input
                ref={planFileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handlePlanFileChange}
              />
            </div>
            {planImportError && (
              <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {planImportError}
              </div>
            )}
            {existingPlan && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                已导入制作方案单，内容如下
              </div>
            )}
          </CardContent>
        </Card>

        {/* 方案内容展示 */}
        {existingPlan ? (
          <Card>
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-violet-600" />
                小组制作方案单
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              <Row label="底稿作者" value={existingPlan.baseAuthor} />
              <Row label="主操手" value={existingPlan.operatorName} />
              <Row label="证据核对" value={existingPlan.evidenceCheckerName} />
              <Row label="来源说明" value={existingPlan.sourceCheckerName} />
              <Row label="AI声明核查" value={existingPlan.aiVerifierName} />
              <Row label="媒体替换计划" value={existingPlan.mediaReplacementPlan} />
              <Row label="AI使用边界" value={existingPlan.aiUsageBoundary} />
              <Row label="必须人工核查" value={existingPlan.manualCheckPoints} />
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-emerald-200">
          <CardContent className="py-4 space-y-3">
            <button
              type="button"
              onClick={() => setMemberAcknowledged(!memberAcknowledged)}
              className={`w-full flex items-start gap-2.5 p-3 rounded-lg text-left transition-colors ${
                memberAcknowledged ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50 border border-gray-200"
              }`}
            >
              <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${memberAcknowledged ? "text-emerald-600" : "text-gray-300"}`} />
              <span className="text-sm text-gray-700">
                我已阅读小组制作方案，了解本组的分工安排和制作计划
              </span>
            </button>
            {lesson4.planCompleted ? (
              <Button onClick={() => navigate("/lesson/4/step/4")} className="w-full gap-2">
                <ArrowRight className="h-4 w-4" /> 前往第4关
              </Button>
            ) : (
              <Button
                onClick={handleMemberComplete}
                disabled={!memberAcknowledged || completing}
                className="w-full gap-2"
              >
                {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                确认已知悉，进入第4关
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ── 组长视图：完整方案单表单 ── */
  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="border-orange-200 bg-orange-50/30">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-orange-600" />
            第3关：记录小组讨论与制作方案
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3 space-y-1.5">
          <p className="text-sm text-gray-700">
            把第2关之后小组讨论形成的关键决策记录下来，作为第4关协作生成的执行说明。
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <Users className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-xs text-orange-700 font-medium">
              组长：由你填写并导出，组员需导入后才能看到方案内容
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm">底稿与分工安排</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">
              底稿作者 <span className="text-red-500">*</span>
            </label>
            <Input
              value={plan.baseAuthor}
              onChange={e => updatePlan("baseAuthor", e.target.value)}
              placeholder="采用哪位同学的草稿作为底稿（或描述合并方式）"
              className="text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">
                主操手 <span className="text-red-500">*</span>
              </label>
              <Input
                value={plan.operatorName}
                onChange={e => updatePlan("operatorName", e.target.value)}
                placeholder="第4关负责主要操作的人"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">证据核对负责人</label>
              <Input
                value={plan.evidenceCheckerName}
                onChange={e => updatePlan("evidenceCheckerName", e.target.value)}
                placeholder="负责核对证据是否准确"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">来源说明负责人</label>
              <Input
                value={plan.sourceCheckerName}
                onChange={e => updatePlan("sourceCheckerName", e.target.value)}
                placeholder="负责完善来源说明"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">AI声明核查负责人</label>
              <Input
                value={plan.aiVerifierName}
                onChange={e => updatePlan("aiVerifierName", e.target.value)}
                placeholder="负责完善AI使用声明"
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm">制作说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">多媒体替换计划</label>
            <Textarea
              value={plan.mediaReplacementPlan}
              onChange={e => updatePlan("mediaReplacementPlan", e.target.value)}
              placeholder="哪些占位图 / 示例图需要在第5关替换为真实内容"
              rows={2}
              className="text-sm resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">AI使用边界</label>
            <Textarea
              value={plan.aiUsageBoundary}
              onChange={e => updatePlan("aiUsageBoundary", e.target.value)}
              placeholder="哪些地方允许AI参与局部生成，哪些地方必须人工完成"
              rows={2}
              className="text-sm resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">必须人工核查的要点</label>
            <Textarea
              value={plan.manualCheckPoints}
              onChange={e => updatePlan("manualCheckPoints", e.target.value)}
              placeholder="证据是否失真？可能原因表述是否谨慎？来源是否可追溯？"
              rows={2}
              className="text-sm resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-200">
        <CardContent className="py-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              保存方案单
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPlan}
              disabled={!isFormValid && !lesson4.productionPlan}
              className="gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              导出方案单（分发给组员）
            </Button>
            {lesson4.planCompleted ? (
              <Button onClick={() => navigate("/lesson/4/step/4")} className="gap-2">
                <ArrowRight className="h-4 w-4" /> 前往第4关
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!isFormValid || completing}
                className="gap-2"
              >
                {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                确认方案单，进入第4关
              </Button>
            )}
          </div>
          {!isFormValid && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              请至少填写「底稿作者」和「主操手」，再确认或导出方案单。
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/** 只读展示行 */
function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-gray-800 bg-gray-50 rounded px-2 py-1.5 border border-gray-100">{value}</p>
    </div>
  )
}
