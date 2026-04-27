/**
 * 文件说明：课时4 · 第2关 · 每个人独立完成 HTML + AI 草稿
 * 职责：
 *   左栏：内容参考摘要（组长展示自身 L3 数据；组员展示骨架包结构化内容）；
 *         AI 辅助提示词参考（含复制按钮）；HTML 模板参考（含复制按钮）。
 *   右栏：HTML 草稿编辑区，顶部 Tab 切换「编辑」/「预览」；
 *         底部保存与提交按钮。
 * 更新触发：骨架包格式变化时；AI 提示词模板调整时；HTML 草稿存储方式变化时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Code2, ArrowRight, CheckCircle2,
  Loader2, Sparkles, FileText, ChevronDown,
  Copy, Check,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Textarea } from "@/shared/ui/textarea"
import { usePortfolio } from "@/modules/module-3-ai-science-station/app/providers/AppProvider"
import { advancePointer } from "@/modules/module-3-ai-science-station/utils/pointer"
import type { SkeletonPackageV1 } from "@/modules/module-3-ai-science-station/infra/persistence/serializers/continue-package"

/** 示例 HTML 骨架模板（学生可在豆包中生成后粘贴） */
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>探究报告网页</title>
  <style>
    body { font-family: "Noto Sans SC", sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #1e40af; }
    h2 { color: #374151; font-size: 1.1rem; margin-top: 0; }
    .section { margin: 20px 0; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .evidence-card { background: #f5f3ff; padding: 12px; margin: 8px 0; border-radius: 6px; }
    .source { font-size: 12px; color: #6b7280; margin-top: 8px; }
    footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <h1>[海报标题]</h1>
  <p style="color:#6b7280">[副标题]</p>

  <div class="section">
    <h2>为什么关注这个问题</h2>
    <p>[在此填写"为何关注"的内容]</p>
  </div>

  <div class="section">
    <h2>我们看见了什么（证据）</h2>
    <div class="evidence-card">
      <p>[证据1：在此填写]</p>
      <p class="source">来源：[来源信息]</p>
    </div>
    <div class="evidence-card">
      <p>[证据2：在此填写]</p>
      <p class="source">来源：[来源信息]</p>
    </div>
  </div>

  <div class="section">
    <h2>可能的原因</h2>
    <p>[在此填写，注意用"可能 / 推测"等谨慎表述]</p>
  </div>

  <footer>
    <p>AI 使用声明：[说明哪些地方使用了 AI 辅助]</p>
    <p>来源追溯：[所有材料来源列表]</p>
  </footer>
</body>
</html>`

/** 一键复制 hook */
function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return { copied, copy }
}

export default function Step2PersonalDraft() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()

  const [draftHtml, setDraftHtml] = useState(portfolio?.lesson4.personalDraftHtml ?? "")
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [showAiTips, setShowAiTips] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)

  const templateCopy = useCopy()
  const aiCopy = useCopy()
  const skeletonCopy = useCopy()

  if (!portfolio) return null

  const { lesson4, lesson1, student } = portfolio
  const isLeader = student.role === "leader"
  const researchQuestion = lesson1.groupConsensus?.finalResearchQuestion ?? ""

  // 组长和组员都从 skeletonPackageJson 读取合并内容（组长在导出骨架时已写入）
  const skeleton: SkeletonPackageV1 | null = (() => {
    if (!lesson4.skeletonPackageJson) return null
    try { return JSON.parse(lesson4.skeletonPackageJson) as SkeletonPackageV1 }
    catch { return null }
  })()

  /** 骨架内容纯文本（供复制，含来源资料） */
  const skeletonText = skeleton ? [
    skeleton.posterTitle && `【标题】${skeleton.posterTitle}`,
    skeleton.posterSubtitle && `【副标题】${skeleton.posterSubtitle}`,
    skeleton.mergedWhyCare && `【为何关注】\n${skeleton.mergedWhyCare}`,
    skeleton.mergedWhatWeSee?.length
      && `【我们看见了什么】\n${skeleton.mergedWhatWeSee.map(s => `· ${s}`).join("\n")}`,
    skeleton.possibleCauses && `【可能的线索/原因】\n${skeleton.possibleCauses}`,
    skeleton.mergedSources?.length
      && `【来源资料】\n${skeleton.mergedSources.map(s => `· ${s}`).join("\n")}`,
  ].filter(Boolean).join("\n\n") : ""

  /** AI 提示词文本（含探究问题变量替换） */
  const aiPrompt = `请帮我生成一个探究报告网页的 HTML 骨架。要求：
探究问题是「${researchQuestion || "[填入你的探究问题]"}」；
包含"为何关注"、"证据区"、"可能的原因"、"来源说明"四个板块；
用基础 HTML + 简单内联 CSS，不要引入外部库；
证据区用 3 个证据卡的占位样式。`

  const handleSaveDraft = async () => {
    if (saving) return
    setSaving(true)
    try {
      await savePortfolio({
        ...portfolio,
        lesson4: { ...lesson4, personalDraftHtml: draftHtml },
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
        pointer: advancePointer(portfolio.pointer, 4, 2),
        lesson4: { ...lesson4, personalDraftHtml: draftHtml, personalDraftCompleted: true },
      })
      navigate("/module/3/lesson/4/step/3")
    } finally {
      setCompleting(false)
    }
  }

  const hasContent = draftHtml.trim().length > 50

  return (
    <div className="space-y-4 max-w-6xl">
      {/* ── 本关说明 ── */}
      <Card className="border-orange-200 bg-orange-50/30">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code2 className="h-4 w-4 text-orange-600" />
            第2关：每个人独立完成 HTML + AI 草稿
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3 space-y-1">
          <p className="text-sm text-gray-700">
            基于小组合并的内容，每个人独立完成一版个人网页草稿 v0。
          </p>
          <div className="text-xs text-gray-500 space-y-0.5">
            <p>• 左侧查看内容参考，用 AI 辅助生成 HTML 骨架，再把小组文字内容填进去</p>
            <p>• 右侧编辑草稿，支持实时预览；完成后点「确认提交草稿 v0」</p>
          </div>
          {isLeader && (
            <Badge variant="outline" className="text-xs mt-1">
              组长：你的草稿将作为第4关协商的候选底稿之一
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* ── 主体双栏 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* ══ 左栏：内容参考 ══ */}
        <div className="space-y-3">

          {/* 内容参考摘要：组长和组员统一展示骨架包合并内容 */}
          <Card className="border-emerald-100">
            <CardHeader className="pb-2 pt-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  小组合并内容（供草稿参考）
                </CardTitle>
                {skeletonText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 gap-1 text-xs"
                    onClick={() => skeletonCopy.copy(skeletonText)}
                  >
                    {skeletonCopy.copied
                      ? <><Check className="h-3 w-3 text-emerald-600" /> 已复制</>
                      : <><Copy className="h-3 w-3" /> 复制全文</>}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pb-3 space-y-2 text-xs">
              {skeleton ? (
                <>
                  {skeleton.posterTitle && (
                    <div>
                      <p className="text-muted-foreground mb-0.5">海报标题</p>
                      <p className="text-gray-800 font-semibold">{skeleton.posterTitle}</p>
                      {skeleton.posterSubtitle && (
                        <p className="text-gray-600 mt-0.5">{skeleton.posterSubtitle}</p>
                      )}
                    </div>
                  )}
                  {skeleton.mergedWhyCare && (
                    <div>
                      <p className="text-muted-foreground mb-0.5">为何关注</p>
                      <p className="text-gray-700 whitespace-pre-line bg-gray-50 rounded px-2 py-1.5">
                        {skeleton.mergedWhyCare}
                      </p>
                    </div>
                  )}
                  {skeleton.mergedWhatWeSee?.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-0.5">
                        我们看见了什么（{skeleton.mergedWhatWeSee.length} 条）
                      </p>
                      <ul className="space-y-0.5 bg-gray-50 rounded px-2 py-1.5">
                        {skeleton.mergedWhatWeSee.map((item, i) => (
                          <li key={i} className="text-gray-700">· {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {skeleton.possibleCauses && (
                    <div>
                      <p className="text-muted-foreground mb-0.5">可能的线索/原因</p>
                      <p className="text-gray-700 bg-violet-50 rounded px-2 py-1.5">
                        {skeleton.possibleCauses}
                      </p>
                    </div>
                  )}
                  {skeleton.mergedSources?.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-0.5">
                        来源资料（{skeleton.mergedSources.length} 条）
                      </p>
                      <ul className="space-y-0.5 bg-gray-50 rounded px-2 py-1.5">
                        {skeleton.mergedSources.map((src, i) => (
                          <li key={i} className="text-gray-600">· {src}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  {isLeader
                    ? "请先在第1关导出骨架包，合并内容将在此显示。"
                    : "骨架包已导入（第1关）。如需重新查看，可返回第1关。"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* AI 提示词参考 */}
          <Card>
            <CardHeader className="pb-2 pt-3">
              <button
                className="flex items-center gap-2 text-sm font-semibold text-left w-full"
                onClick={() => setShowAiTips(!showAiTips)}
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                AI 辅助提示词参考
                <ChevronDown className={`h-3.5 w-3.5 ml-auto transition-transform ${showAiTips ? "rotate-180" : ""}`} />
              </button>
            </CardHeader>
            {showAiTips && (
              <CardContent className="pb-4 space-y-2">
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-amber-800">可以这样告诉豆包：</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 gap-1 text-xs"
                      onClick={() => aiCopy.copy(aiPrompt)}
                    >
                      {aiCopy.copied
                        ? <><Check className="h-3 w-3 text-emerald-600" /> 已复制</>
                        : <><Copy className="h-3 w-3" /> 复制</>}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {aiPrompt}
                  </p>
                  <p className="text-xs text-amber-700 font-medium">
                    ⚠️ AI 生成后，你必须自己把骨架内容替换成小组实际内容，不能让 AI 直接填充事实。
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* HTML 模板参考 */}
          <Card>
            <CardHeader className="pb-2 pt-3">
              <button
                className="flex items-center gap-2 text-sm font-semibold text-left w-full"
                onClick={() => setShowTemplate(!showTemplate)}
              >
                <FileText className="h-4 w-4 text-blue-500" />
                HTML 结构模板参考
                <ChevronDown className={`h-3.5 w-3.5 ml-auto transition-transform ${showTemplate ? "rotate-180" : ""}`} />
              </button>
            </CardHeader>
            {showTemplate && (
              <CardContent className="pb-4 space-y-2">
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 gap-1 text-xs"
                    onClick={() => templateCopy.copy(HTML_TEMPLATE)}
                  >
                    {templateCopy.copied
                      ? <><Check className="h-3 w-3 text-emerald-600" /> 已复制</>
                      : <><Copy className="h-3 w-3" /> 复制模板</>}
                  </Button>
                </div>
                <pre className="text-xs bg-gray-50 border rounded-lg p-3 overflow-x-auto leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {HTML_TEMPLATE}
                </pre>
              </CardContent>
            )}
          </Card>
        </div>

        {/* ══ 右栏：草稿编辑器 ══ */}
        <div className="space-y-0 sticky top-4">
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
                <CheckCircle2 className="h-3.5 w-3.5" />
                预览
              </button>
            </div>

            <CardContent className="p-3">
              {activeTab === "edit" ? (
                /* 编辑 Tab */
                <Textarea
                  value={draftHtml}
                  onChange={e => setDraftHtml(e.target.value)}
                  placeholder={`<!DOCTYPE html>\n<html lang="zh-CN">\n...\n</html>`}
                  rows={22}
                  className="text-xs font-mono resize-y"
                />
              ) : (
                /* 预览 Tab */
                <div className="border rounded-lg overflow-hidden bg-white">
                  {draftHtml.trim() ? (
                    <iframe
                      srcDoc={draftHtml}
                      className="w-full h-[520px] border-0"
                      sandbox="allow-same-origin"
                      title="草稿预览"
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
                onClick={handleSaveDraft}
                disabled={saving}
                className="gap-1.5"
              >
                {saving
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <CheckCircle2 className="h-3.5 w-3.5" />}
                保存草稿
              </Button>

              {lesson4.personalDraftCompleted ? (
                <Button size="sm" onClick={() => navigate("/module/3/lesson/4/step/3")} className="gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5" /> 前往第3关
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleComplete}
                  disabled={!hasContent || completing}
                  className="gap-1.5"
                >
                  {completing
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <ArrowRight className="h-3.5 w-3.5" />}
                  确认提交草稿 v0
                </Button>
              )}

              {lesson4.personalDraftCompleted && (
                <span className="text-xs text-emerald-700 flex items-center gap-1 ml-auto">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 草稿 v0 已提交
                </span>
              )}
            </div>
          </Card>

          {!hasContent && activeTab === "edit" && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-2">
              请先粘贴你的 HTML 草稿（至少 50 个字符），再确认提交。
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
