/**
 * 文件说明：课时4 · 第5关 · 升级校验与最终导出
 * 职责：组长对第4关结果进行升级（替换多媒体、完善来源与AI声明）；
 *       完成可信发布校验清单；导出最终提交版 HTML；
 *       组长视图为双栏：左栏说明+校验+导出完成，右栏海报最终 HTML「编辑/预览」Tab（与第2、4关一致）。
 *       组员以告知书形式阅读校验要点（无网页预览），勾选"已知悉"过关。
 * 更新触发：校验清单条目变化时；导出格式调整时；角色分离逻辑变化时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ShieldCheck, Download, CheckCircle2, Circle,
  Loader2, Info, Code2, Eye,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { usePortfolio } from "@/app/providers/AppProvider"
import { advancePointer } from "@/shared/utils/pointer"
import { LESSON_REGISTRY } from "@/app/lesson-registry"

/** 可信发布校验清单 */
const VERIFY_ITEMS = [
  { id: "question-clear", label: "探究问题表述清楚" },
  { id: "origin-real", label: '关注缘起真实，"为何关注"来自课时3个人表述' },
  { id: "evidence-processed", label: "每条证据都经过最小加工，而非直接复制原文" },
  { id: "cause-cautious", label: '「可能的原因」仍使用"可能/推测/初步认为"等谨慎表述' },
  { id: "source-traceable", label: "所有材料来源可追溯，页脚来源说明完整" },
  { id: "ai-declared", label: "AI使用声明完整，说明了哪些地方使用了AI辅助" },
  { id: "reading-path", label: "页面阅读路径清楚，层级结构合理" },
  { id: "media-real", label: "占位图/示例图已替换为真实多媒体（或确认无多媒体部分）" },
]

export default function Step5UpgradeVerify() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()

  const [finalHtml, setFinalHtml] = useState(portfolio?.lesson4.finalHtml || portfolio?.lesson4.groupWebpageV1 || "")
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [memberAcknowledged, setMemberAcknowledged] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")

  if (!portfolio) return null

  const { lesson4, student } = portfolio
  const isLeader = student.role === "leader"

  const allChecked = VERIFY_ITEMS.every(item => checkedItems.has(item.id))
  const hasFinalContent = finalHtml.trim().length > 50

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await savePortfolio({ ...portfolio, lesson4: { ...lesson4, finalHtml } })
    } finally {
      setSaving(false)
    }
  }

  const handleExport = () => {
    setExporting(true)
    try {
      const blob = new Blob([finalHtml], { type: "text/html;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `小组网页海报_${student.groupName}_最终版.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const handleComplete = async () => {
    if (completing) return
    setCompleting(true)
    try {
      await savePortfolio({
        ...portfolio,
        pointer: advancePointer(portfolio.pointer, 4, 5),
        lesson4: {
          ...lesson4,
          finalHtml,
          verificationPassed: true,
          finalExported: true,
          completed: true,
        },
      })
      const lesson5Config = LESSON_REGISTRY.find(l => l.id === 5)
      if (lesson5Config?.enabled) {
        navigate("/lesson/5/step/1")
      } else {
        navigate("/")
      }
    } finally {
      setCompleting(false)
    }
  }

  const handleMemberComplete = async () => {
    if (completing) return
    setCompleting(true)
    try {
      await savePortfolio({
        ...portfolio,
        pointer: advancePointer(portfolio.pointer, 4, 5),
        lesson4: { ...lesson4, completed: true },
      })
      const lesson5Config = LESSON_REGISTRY.find(l => l.id === 5)
      if (lesson5Config?.enabled) {
        navigate("/lesson/5/step/1")
      } else {
        navigate("/")
      }
    } finally {
      setCompleting(false)
    }
  }

  /* ── 组员视图：告知书 ── */
  if (!isLeader) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-orange-600" />
              第5关：升级校验与最终提交（组员告知书）
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 space-y-1.5">
            <p className="text-sm text-gray-700">
              本关由组长在组长设备上完成最终升级、可信发布校验并导出 HTML。
              你只需了解下方校验要点与流程即可（本页不提供网页预览）；最终作品以组长导出文件或课堂展示为准。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-violet-600" />
              可信发布校验要点（请知悉）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            {VERIFY_ITEMS.map((item, i) => (
              <div key={item.id} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                <span className="text-xs font-bold text-gray-400 shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-sm text-gray-800">{item.label}</p>
              </div>
            ))}
          </CardContent>
        </Card>

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
                我已了解本关升级与校验流程，知悉小组将完成最终版并导出
              </span>
            </button>
            {lesson4.completed ? (
              <Button onClick={() => navigate("/")} className="w-full gap-2">
                <CheckCircle2 className="h-4 w-4" /> 课时4已完成，返回首页
              </Button>
            ) : (
              <Button
                onClick={handleMemberComplete}
                disabled={!memberAcknowledged || completing}
                className="w-full gap-2"
              >
                {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                确认完成课时4
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ── 组长视图：双栏（左：说明+校验+导出；右：海报最终页编辑/预览） ── */
  return (
    <div className="space-y-4 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="space-y-4">
          <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-orange-600" />
                第5关：升级校验与最终导出
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 space-y-1">
              <p className="text-sm text-gray-700">
                对第4关结果进行最后升级：替换真实多媒体、完善来源说明、补全AI声明；
                完成可信发布校验，导出最终提交版 HTML。
              </p>
              <p className="text-xs text-gray-500">
                • 左侧完成校验清单与下载；右侧编辑海报最终 HTML，与第2关、第4关布局一致
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-violet-600" />
                可信发布校验清单
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              {VERIFY_ITEMS.map(item => {
                const checked = checkedItems.has(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-colors ${
                      checked ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {checked
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      : <Circle className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
                    }
                    <span className={`text-sm ${checked ? "text-emerald-800" : "text-gray-700"}`}>{item.label}</span>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Download className="h-4 w-4 text-emerald-600" />
                导出与完成
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={!hasFinalContent || exporting}
                  className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  下载最终版 HTML
                </Button>
                {lesson4.completed ? (
                  <Button onClick={() => navigate("/")} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" /> 课时4已完成，返回首页
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={!allChecked || !hasFinalContent || completing}
                    className="gap-2"
                  >
                    {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    完成课时4
                  </Button>
                )}
              </div>
              {!allChecked && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                  请先完成上方所有校验清单项目，再点「完成课时4」。
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                下载的 HTML 文件即为本次课时4的最终作品，可上传 Moodle 或打印存档。
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="sticky top-4">
          <Card className="overflow-hidden">
            <div className="flex border-b bg-gray-50">
              <button
                className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === "edit"
                    ? "bg-white border-b-2 border-blue-500 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("edit")}
              >
                <Code2 className="h-3.5 w-3.5" />
                编辑
              </button>
              <button
                className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === "preview"
                    ? "bg-white border-b-2 border-blue-500 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("preview")}
              >
                <Eye className="h-3.5 w-3.5" />
                预览
              </button>
            </div>

            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-2">
                已从第4关网页 v1 预填。请在此基础上升级：替换占位图、完善来源、补全 AI 声明。
              </p>
              {activeTab === "edit" ? (
                <Textarea
                  value={finalHtml}
                  onChange={e => setFinalHtml(e.target.value)}
                  placeholder={`<!DOCTYPE html>\n<html lang="zh-CN">\n...\n</html>`}
                  rows={22}
                  className="text-xs font-mono resize-y"
                />
              ) : (
                <div className="border rounded-lg overflow-hidden bg-white">
                  {finalHtml.trim() ? (
                    <iframe
                      srcDoc={finalHtml}
                      className="w-full h-[520px] border-0"
                      sandbox="allow-same-origin"
                      title="海报最终页预览"
                    />
                  ) : (
                    <div className="h-[520px] flex items-center justify-center text-sm text-muted-foreground">
                      请先在「编辑」标签粘贴 HTML 内容
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            <div className="border-t px-3 py-2.5 bg-gray-50 flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="gap-1.5"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                保存最终版
              </Button>
              {lesson4.completed && (
                <span className="text-xs text-emerald-700 flex items-center gap-1 ml-auto">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 课时4 已完成
                </span>
              )}
            </div>
          </Card>

          {!hasFinalContent && activeTab === "edit" && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-2">
              请先粘贴最终海报 HTML（至少 50 个字符），再勾选清单并导出/完成。
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
