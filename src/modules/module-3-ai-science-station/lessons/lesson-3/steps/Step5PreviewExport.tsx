/**
 * 文件说明：课时3 · 第5关 · 个人预览与导出
 * 职责：汇总展示第2关「为何关注」与第4关「个人证据卡」；
 *       提供检查清单让学生确认整理是否完整；
 *       保持「可能原因」灰色锁定态；
 *       提供「完成课时3」与「导出个人整理包」两个导出入口。
 * 更新触发：课时3输出字段增减时；导出格式调整时；检查清单条目变化时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft, ArrowRight, CheckCircle2, Circle, Lock, FileText, Download, Sparkles,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/modules/module-3-ai-science-station/app/providers/AppProvider"
import { advancePointer } from "@/modules/module-3-ai-science-station/utils/pointer"
import { downloadPersonalPackage } from "@/modules/module-3-ai-science-station/infra/persistence/serializers/continue-package"
import type { EvidenceCard, SelectedMaterial } from "@/modules/module-3-ai-science-station/domains/portfolio/types"
import type { PublicEvidenceRecord, FieldEvidenceTask } from "@/modules/module-3-ai-science-station/domains/evidence/types"

/** 检查清单条目（前两条自动计算，后两条手动勾选） */
interface CheckItem {
  id: string
  label: string
  auto: boolean
}

const MANUAL_CHECK_ITEMS: CheckItem[] = [
  {
    id: "phenomenon",
    label: "我的表达是现象说明，不是直接下原因判断",
    auto: false,
  },
  {
    id: "cause-known",
    label: "我知道「可能原因」下节课小组合并后再讨论",
    auto: false,
  },
]

/** 从 materialType 获取中文标签 */
function materialTypeLabel(t: EvidenceCard["materialType"]): string {
  switch (t) {
    case "image": return "图片"
    case "data": return "表格数据"
    case "video": return "视频"
    default: return "文字"
  }
}

export default function Step5PreviewExport() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [proceeding, setProceeding] = useState(false)
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({})

  if (!portfolio) return null

  const { lesson2, lesson3, student } = portfolio
  const { toolboxWhyOnPoster, toolboxNoticeWhat, evidenceCards, selectedMaterials } = lesson3
  const isLeader = student.role === "leader"

  /** 获取 selectedMaterial 对应的原始标题 */
  const getMaterialTitle = (sm: SelectedMaterial): string => {
    if (sm.sourceType === "public") {
      const r = lesson2.publicRecords[sm.sourceIndex] as PublicEvidenceRecord | undefined
      return r?.item ?? `公开资源 #${sm.sourceIndex}`
    }
    const t = lesson2.fieldTasks[sm.sourceIndex] as FieldEvidenceTask | undefined
    return t?.materialName || t?.item || `现场采集 #${sm.sourceIndex}`
  }

  /** 自动判断的检查项状态 */
  const hasWhy = toolboxWhyOnPoster.trim().length > 0
  const hasCards = evidenceCards.length > 0

  const toggleManual = (id: string) => {
    setManualChecks((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  /** 全部清单都已勾选 */
  const allChecked =
    hasWhy && hasCards && MANUAL_CHECK_ITEMS.every((item) => manualChecks[item.id])

  /**
   * 导出个人整理包（JSON 格式，仅组员）
   * 同时标记 personalPackageExported=true，供组长在课时4第1关导入合并。
   */
  const handleExport = async () => {
    setSaving(true)
    try {
      downloadPersonalPackage(portfolio)
      await savePortfolio({
        ...portfolio,
        lesson3: { ...lesson3, personalPackageExported: true },
      })
    } finally {
      setSaving(false)
    }
  }

  /**
   * 标记课时3完成并进入课时4。
   * 同时推进指针到 {3, 5}，供进度条显示正确关卡。
   */
  const handleProceed = async () => {
    if (proceeding) return
    setProceeding(true)
    try {
      await savePortfolio({
        ...portfolio,
        pointer: advancePointer(portfolio.pointer, 3, 5),
        lesson3: { ...lesson3, completed: true },
      })
      navigate("/module/3/lesson/4/step/1")
    } finally {
      setProceeding(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── 上部：本节完成情况总览 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* A. 为何关注 */}
        <Card className={`${hasWhy ? "border-emerald-200 bg-emerald-50/30" : "border-amber-200 bg-amber-50/30"}`}>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              {hasWhy ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-amber-500 shrink-0" />
              )}
              为何关注
              <span className="text-xs font-normal text-muted-foreground">（第2关成果）</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            {toolboxNoticeWhat && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-0.5">我注意到的现象</p>
                <p className="text-xs text-gray-600 bg-white rounded px-2 py-1.5 border border-gray-100">
                  {toolboxNoticeWhat}
                </p>
              </div>
            )}
            {hasWhy ? (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">海报表述草稿</p>
                <p className="text-sm font-medium text-emerald-800 bg-white rounded px-2 py-1.5 border border-emerald-100">
                  {toolboxWhyOnPoster}
                </p>
              </div>
            ) : (
              <p className="text-sm text-amber-700 italic">
                尚未填写「为何关注」表述，请返回第2关补充。
              </p>
            )}
          </CardContent>
        </Card>

        {/* B. 我们看见了什么 */}
        <Card className={`${hasCards ? "border-violet-200 bg-violet-50/30" : "border-amber-200 bg-amber-50/30"}`}>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              {hasCards ? (
                <CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-amber-500 shrink-0" />
              )}
              我们看见了什么
              <span className="text-xs font-normal text-muted-foreground">（第4关成果）</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            {hasCards ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  已完成 {evidenceCards.length} 张证据卡
                </p>
                {evidenceCards.map((card, i) => {
                  const sm = selectedMaterials[card.materialIndex]
                  const title = sm ? getMaterialTitle(sm) : card.title
                  return (
                    <div key={i} className="bg-white rounded border border-violet-100 px-2 py-1.5 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-gray-800 truncate">{title}</span>
                        <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700 shrink-0">
                          {materialTypeLabel(card.materialType)}
                        </Badge>
                      </div>
                      {card.posterExpression && (
                        <p className="text-xs text-violet-700 line-clamp-2">
                          {card.posterExpression}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-amber-700 italic">
                尚未完成证据卡，请返回第4关继续加工。
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 中部：检查区 ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            出发前检查
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          {/* 自动计算项 */}
          <div className={`flex items-start gap-2.5 p-2.5 rounded-lg ${hasWhy ? "bg-emerald-50" : "bg-amber-50"}`}>
            {hasWhy ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            )}
            <span className={`text-sm ${hasWhy ? "text-emerald-800" : "text-amber-700"}`}>
              我已经完成「为何关注」表述
            </span>
          </div>
          <div className={`flex items-start gap-2.5 p-2.5 rounded-lg ${hasCards ? "bg-emerald-50" : "bg-amber-50"}`}>
            {hasCards ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            )}
            <span className={`text-sm ${hasCards ? "text-emerald-800" : "text-amber-700"}`}>
              我已经整理好至少 1 条证据卡
            </span>
          </div>

          {/* 手动勾选项 */}
          {MANUAL_CHECK_ITEMS.map((item) => {
            const checked = !!manualChecks[item.id]
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleManual(item.id)}
                className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-colors ${
                  checked ? "bg-emerald-50 hover:bg-emerald-100/80" : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                {checked ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                )}
                <span className={`text-sm ${checked ? "text-emerald-800" : "text-gray-700"}`}>
                  {item.label}
                </span>
              </button>
            )
          })}

          {/* 可能原因锁定卡 */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-100 opacity-70 select-none">
            <Lock className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-sm text-gray-500 font-medium">可能原因</span>
              <p className="text-xs text-gray-400 mt-0.5">下节课小组合并后再讨论</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 下部：导出与进入课时4 ── */}
      <Card className="border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-blue-600" />
            {isLeader ? "完成并进入课时4" : "导出整理包并进入课时4"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          {/* 组员：先导出个人整理包（JSON，供课时4组长导入合并） */}
          {!isLeader && (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={handleExport}
                disabled={saving}
              >
                <FileText className="h-4 w-4 shrink-0" />
                {lesson3.personalPackageExported ? "重新导出个人整理包" : "导出个人整理包（.json）"}
              </Button>
              {lesson3.personalPackageExported && (
                <p className="text-xs text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 已导出，请将文件交给组长
                </p>
              )}
            </div>
          )}

          {/* 进入课时4（主操作） */}
          {lesson3.completed ? (
            /* 已完成：直接导航，无需重新勾清单 */
            <Button
              onClick={() => navigate("/module/3/lesson/4/step/1")}
              className="gap-2 w-full sm:w-auto"
            >
              <ArrowRight className="h-4 w-4 shrink-0" />
              前往课时4
            </Button>
          ) : (
            <>
              <Button
                onClick={handleProceed}
                disabled={proceeding || !allChecked}
                className="gap-2 w-full sm:w-auto"
              >
                {proceeding ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 animate-pulse" />
                ) : (
                  <ArrowRight className="h-4 w-4 shrink-0" />
                )}
                完成课时3，进入课时4
              </Button>
              {!allChecked && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                  请先完成上方检查清单中的所有项目，再进入课时4。
                </p>
              )}
            </>
          )}

          <div className="border-t pt-3 space-y-1.5">
            {isLeader ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                下节课（课时4）你作为组长，需要汇总组员的个人整理包，完成小组合并。
                请提醒组员在本课结束前完成导出。
              </p>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                导出的个人整理包（.json 文件）请保存好，下节课带来交给组长。
                如需留存 HTML 版记录，请使用右上角「阶段快照」按钮。
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── 底部导航 ── */}
      <div className="flex justify-start">
        <Button variant="outline" size="sm" onClick={() => navigate("/module/3/lesson/3/step/4")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 上一步
        </Button>
      </div>
    </div>
  )
}
