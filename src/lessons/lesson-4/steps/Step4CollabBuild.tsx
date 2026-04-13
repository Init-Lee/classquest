/**
 * 文件说明：课时4 · 第4关 · 按流程协商完成小组网页生成
 * 职责：组长按操作流程完成小组网页 v1（AI辅助局部生成）并勾选确认各环节；
 *       组员以告知书形式阅读协作步骤（无网页预览），勾选"已知悉"即可过关。
 * 更新触发：协作流程步骤调整时；角色分离逻辑变化时；HTML 存储方式改变时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Globe, ArrowRight, CheckCircle2, Circle,
  Loader2, Info, Code2, Sparkles, AlertTriangle, Eye,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { usePortfolio } from "@/app/providers/AppProvider"
import { advancePointer } from "@/shared/utils/pointer"

/** 协作流程步骤（组长视图） */
const COLLAB_STEPS = [
  { id: "open-plan", label: "打开方案单", desc: "确认本组采用的底稿版本和主操手分工" },
  { id: "confirm-draft", label: "确认底稿版本", desc: "主操手打开选定的底稿，其他成员围绕主操手提供意见" },
  { id: "ai-generate", label: "AI辅助局部生成", desc: "用AI生成局部版块或骨架片段，人工确认后放入网页" },
  { id: "manual-check", label: "人工核对", desc: '标题准确、结构清楚、证据未失真、"可能原因"仍为谨慎表述' },
  { id: "source-check", label: "来源核对", desc: "确认所有材料来源可追溯，页脚来源说明完整" },
]

export default function Step4CollabBuild() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()

  const [webpageHtml, setWebpageHtml] = useState(portfolio?.lesson4.groupWebpageV1 ?? "")
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set())
  const [memberAcknowledged, setMemberAcknowledged] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")

  if (!portfolio) return null

  const { lesson4, student } = portfolio
  const isLeader = student.role === "leader"

  const allStepsChecked = COLLAB_STEPS.every(s => checkedSteps.has(s.id))
  const hasWebpageContent = webpageHtml.trim().length > 50

  const toggleStep = (id: string) => {
    setCheckedSteps(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await savePortfolio({ ...portfolio, lesson4: { ...lesson4, groupWebpageV1: webpageHtml } })
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
        pointer: advancePointer(portfolio.pointer, 4, 4),
        lesson4: { ...lesson4, groupWebpageV1: webpageHtml, collabCompleted: true },
      })
      navigate("/lesson/4/step/5")
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
        pointer: advancePointer(portfolio.pointer, 4, 4),
        lesson4: { ...lesson4, collabCompleted: true },
      })
      navigate("/lesson/4/step/5")
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
              第4关：小组网页协商生成（组员告知书）
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 space-y-1.5">
            <p className="text-sm text-gray-700">
              本关由主操手在组长设备上操作，小组围绕主操手当面协商完成网页 v1。
              你只需了解下方协作步骤，配合讨论与核对即可（本页不提供网页预览）。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              本关协作流程（请知悉）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            {COLLAB_STEPS.map((step, i) => (
              <div key={step.id} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                <span className="text-xs font-bold text-gray-400 shrink-0 mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{step.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
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
                我已参与本组讨论，并知悉上述协作流程与网页 v1 的生成安排
              </span>
            </button>
            {lesson4.collabCompleted ? (
              <Button onClick={() => navigate("/lesson/4/step/5")} className="w-full gap-2">
                <ArrowRight className="h-4 w-4" /> 前往第5关
              </Button>
            ) : (
              <Button
                onClick={handleMemberComplete}
                disabled={!memberAcknowledged || completing}
                className="w-full gap-2"
              >
                {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                确认已知悉，进入第5关
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ── 组长视图：双栏操作界面 ── */
  return (
    <div className="space-y-4 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* ══ 左栏：说明 + 原则 + 流程 + 完成 ══ */}
        <div className="space-y-4">
          <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4 text-orange-600" />
                第4关：按流程协商完成小组网页 v1
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 space-y-1">
              <p className="text-sm text-gray-700">
                按照下方流程，主操手主导，小组围绕主操手协商完成网页 v1。AI 只负责局部生成，不替代判断。
              </p>
              <p className="text-xs text-gray-500">• 左侧完成协作流程与勾选；右侧粘贴 HTML 并预览</p>
            </CardContent>
          </Card>

          {/* AI 辅助原则 */}
          <Card className="border-amber-100">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                AI 辅助原则
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-emerald-700">AI 可以做</p>
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    <li>· 生成局部 HTML 骨架片段</li>
                    <li>· 优化标题与段落措辞</li>
                    <li>· 帮助整理来源说明格式</li>
                    <li>· 补充局部版块结构</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-red-700">AI 不可以做</p>
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    <li>· 决定最终内容取舍</li>
                    <li>· 新增未经证实的事实</li>
                    <li>· 重写整页替代小组判断</li>
                    <li>· 修改"可能原因"表述强度</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 协作流程勾选 */}
          <Card>
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm">协作流程确认</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              {COLLAB_STEPS.map((step) => {
                const checked = checkedSteps.has(step.id)
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => toggleStep(step.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                      checked ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {checked
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      : <Circle className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
                    }
                    <div>
                      <p className={`text-sm font-medium ${checked ? "text-emerald-800" : "text-gray-700"}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* 完成确认 */}
          <Card className="border-emerald-200">
            <CardContent className="py-4 space-y-3">
              {!allStepsChecked && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  请先完成上方所有协作流程步骤，再确认完成本关。
                </div>
              )}
              {lesson4.collabCompleted ? (
                <Button onClick={() => navigate("/lesson/4/step/5")} className="w-full gap-2">
                  <ArrowRight className="h-4 w-4" /> 前往第5关
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={!allStepsChecked || !hasWebpageContent || completing}
                  className="w-full gap-2"
                >
                  {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  确认完成协商，进入第5关
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ══ 右栏：HTML 编辑器 + Tab 预览（sticky） ══ */}
        <div className="sticky top-4">
          <Card className="overflow-hidden">
            {/* Tab 切换 */}
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
              {activeTab === "edit" ? (
                <Textarea
                  value={webpageHtml}
                  onChange={e => setWebpageHtml(e.target.value)}
                  placeholder={`<!DOCTYPE html>\n<html lang="zh-CN">\n...\n</html>`}
                  rows={22}
                  className="text-xs font-mono resize-y"
                />
              ) : (
                <div className="border rounded-lg overflow-hidden bg-white">
                  {webpageHtml.trim() ? (
                    <iframe
                      srcDoc={webpageHtml}
                      className="w-full h-[520px] border-0"
                      sandbox="allow-same-origin"
                      title="小组网页v1预览"
                    />
                  ) : (
                    <div className="h-[520px] flex items-center justify-center text-sm text-muted-foreground">
                      请先在「编辑」标签粘贴 HTML 内容
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            {/* 底部操作栏 */}
            <div className="border-t px-3 py-2.5 bg-gray-50 flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="gap-1.5"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                保存网页 v1
              </Button>
              {lesson4.collabCompleted && (
                <span className="text-xs text-emerald-700 flex items-center gap-1 ml-auto">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 网页 v1 已完成
                </span>
              )}
            </div>
          </Card>

          {!hasWebpageContent && activeTab === "edit" && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-2">
              请先粘贴小组网页 HTML（至少 50 个字符），再确认完成本关。
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
