/**
 * 文件说明：课时3 · 第3关 · 筛选我的材料（资料池）
 * 职责：从课时2的个人记录中筛选适合海报展示的材料；
 *       每条入选材料必须填写现象说明句（"这条材料让我看见了什么？"）；
 *       展示已入选材料清单汇总；保存后进入第4关证据加工工坊。
 * 更新触发：筛选逻辑变化时；说明句字段结构调整时；卡片展示字段增减时
 */

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight, ArrowLeft, CheckSquare, Square, Info, AlertCircle,
  CheckCircle2, Circle, X,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Textarea } from "@/shared/ui/textarea"
import { usePortfolio } from "@/modules/module-3-ai-science-station/app/providers/AppProvider"
import { advancePointer } from "@/modules/module-3-ai-science-station/utils/pointer"
import type { SelectedMaterial } from "@/modules/module-3-ai-science-station/domains/portfolio/types"
import type { PublicEvidenceRecord, FieldEvidenceTask } from "@/modules/module-3-ai-science-station/domains/evidence/types"

/** 展示用统一材料条目（聚合 public/field 两类） */
interface MaterialItem {
  key: string
  sourceType: "public" | "field"
  sourceIndex: number
  title: string
  /** 摘要/引用笔记（副文字行） */
  summary: string
  /** 详情行：时间 / 地点 / 来源简标 */
  detailLine: string
  materialTypes: string[]
  source: string
}

/** 筛选参考标准 */
const SELECTION_CRITERIA = [
  "与研究问题关系更直接",
  "现象更清楚、更具体",
  "更容易被观众看懂",
  "更适合做展示（图像/数据优先）",
  "与其他材料不重复",
]

export default function Step3SelectMaterials() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  // 本地状态：勾选状态 Map<key, boolean>
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  // 本地状态：各材料的现象说明句 Map<key, string>
  const [explanations, setExplanations] = useState<Record<string, string>>({})

  if (!portfolio) return null

  const { student, lesson1, lesson2 } = portfolio
  const myName = lesson1.confirmedOwnerName || student.studentName

  // 过滤当前学生的课时2记录
  const myPublicRecords = lesson2.publicRecords.filter((r) => r.owner === myName)
  const myFieldTasks = lesson2.fieldTasks.filter((t) => t.owner === myName)

  // 构建统一展示条目（增强资料池样式）
  const allItems: MaterialItem[] = [
    ...myPublicRecords.map((r: PublicEvidenceRecord, i: number): MaterialItem => ({
      key: `public-${i}`,
      sourceType: "public",
      sourceIndex: lesson2.publicRecords.indexOf(r),
      title: r.item,
      summary: r.quoteOrNote || `${r.resourceType} · ${r.sourcePlatform}`,
      detailLine: [
        r.capturedAt ? `获取于 ${r.capturedAt}` : "",
        r.sourcePlatform,
        r.sourceOrg,
      ].filter(Boolean).join(" · "),
      materialTypes: r.materialTypes,
      source: r.sourcePlatform + (r.sourceOrg ? ` · ${r.sourceOrg}` : ""),
    })),
    ...myFieldTasks.map((t: FieldEvidenceTask, i: number): MaterialItem => ({
      key: `field-${i}`,
      sourceType: "field",
      sourceIndex: lesson2.fieldTasks.indexOf(t),
      title: t.materialName || t.item,
      summary: t.citationFull || `${t.scene}${t.location ? ` · ${t.location}` : ""}`,
      detailLine: [
        t.date ? `采集于 ${t.date}` : "",
        t.scene,
        t.location,
      ].filter(Boolean).join(" · "),
      materialTypes: t.materialTypes,
      source: `现场采集 · ${t.scene}`,
    })),
  ]

  // 初始化：从已保存的 selectedMaterials 恢复状态
  useEffect(() => {
    const saved = portfolio.lesson3.selectedMaterials
    if (saved.length > 0) {
      const selMap: Record<string, boolean> = {}
      const expMap: Record<string, string> = {}
      saved.forEach((sm) => {
        const item = allItems.find(
          (it) => it.sourceType === sm.sourceType && it.sourceIndex === sm.sourceIndex
        )
        if (item) {
          selMap[item.key] = true
          expMap[item.key] = sm.explanation
        }
      })
      setSelected(selMap)
      setExplanations(expMap)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleSelect = (key: string) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  /** 取消选择某条材料 */
  const deselect = (key: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelected((prev) => ({ ...prev, [key]: false }))
  }

  const selectedItems = allItems.filter((it) => selected[it.key])
  const canProceed =
    selectedItems.length > 0 &&
    selectedItems.every((it) => (explanations[it.key] ?? "").trim().length > 0)

  const handleSave = async () => {
    if (saving || !canProceed) return
    setSaving(true)
    try {
      const newSelectedMaterials: SelectedMaterial[] = selectedItems.map((it) => ({
        sourceType: it.sourceType,
        sourceIndex: it.sourceIndex,
        explanation: explanations[it.key]?.trim() ?? "",
      }))
      await savePortfolio({
        ...portfolio,
        pointer: advancePointer(portfolio.pointer, 3, 3),
        lesson3: { ...portfolio.lesson3, selectedMaterials: newSelectedMaterials },
      })
      navigate("/module/3/lesson/3/step/4")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* 筛选提示 */}
      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="pt-4 pb-3">
          <div className="flex gap-2">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">选哪些材料更值得进海报？</p>
              <ul className="space-y-0.5 mb-2">
                {SELECTION_CRITERIA.map((c, i) => (
                  <li key={i} className="text-xs text-blue-700">• {c}</li>
                ))}
              </ul>
              <p className="text-xs text-blue-600 border-t border-blue-200 pt-2">
                本关先完成「筛选 + 现象说明」，具体加工将在下一关进行。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 区域 A：我的全部资料条目（资料池） */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          我的全部资料条目（勾选想要入选的材料）
        </p>

        {allItems.length === 0 ? (
          <Card>
            <CardContent className="pt-6 pb-6 text-center">
              <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                暂未找到你在课时2录入的资料条目。
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                请确认课时2已完成证据入库，或联系老师检查姓名是否一致。
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {allItems.map((item) => {
              const isSelected = !!selected[item.key]
              return (
                <div
                  key={item.key}
                  className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-purple-300 bg-purple-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => toggleSelect(item.key)}
                >
                  <div className="flex items-start gap-3">
                    {/* 勾选图标 */}
                    <div className="mt-0.5 shrink-0">
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-purple-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    {/* 材料信息（资料池增强） */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800 truncate">{item.title}</span>
                        <Badge
                          variant="secondary"
                          className={`text-xs shrink-0 ${
                            item.sourceType === "public"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.sourceType === "public" ? "公开资源" : "现场采集"}
                        </Badge>
                      </div>
                      {/* 详情行：时间/地点/来源简标 */}
                      {item.detailLine && (
                        <p className="text-xs text-muted-foreground">{item.detailLine}</p>
                      )}
                      {/* 摘要/笔记 */}
                      {item.summary && (
                        <p className="text-xs text-gray-500 line-clamp-2">{item.summary}</p>
                      )}
                      {/* 材料类型标签 */}
                      {item.materialTypes.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {item.materialTypes.map((t) => (
                            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 已入选材料清单（汇总区） */}
      {selectedItems.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm text-purple-800 flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              本次已入选材料
              <span className="text-xs font-normal text-purple-600">
                {selectedItems.length} / {allItems.length} 条已入选
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <ul className="space-y-1.5">
              {selectedItems.map((item) => {
                const hasSentence = (explanations[item.key] ?? "").trim().length > 0
                return (
                  <li key={item.key} className="flex items-center gap-2 text-sm">
                    {hasSentence ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className={`flex-1 truncate ${hasSentence ? "text-gray-700" : "text-amber-700"}`}>
                      {item.title}
                    </span>
                    {!hasSentence && (
                      <span className="text-xs text-amber-500 shrink-0">待填说明句</span>
                    )}
                    <button
                      type="button"
                      title="取消选择"
                      onClick={(e) => deselect(item.key, e)}
                      className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 区域 B：入选材料 — 填写现象说明句 */}
      {selectedItems.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            请用一句现象说明句写出：这条材料让我看见了什么？
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-3">
            写现象说明句，不要直接写原因判断。例如：这组数据说明…… / 这张图片显示…… / 这段视频呈现出……
          </p>
          <div className="space-y-3">
            {selectedItems.map((item) => (
              <Card key={item.key} className="border-purple-200">
                <CardHeader className="pb-2 pt-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        item.sourceType === "public"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {item.sourceType === "public" ? "公开资源" : "现场采集"}
                    </Badge>
                    <CardTitle className="text-sm truncate">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Textarea
                    placeholder="这条材料让我看见了什么？（写现象说明句，不要写原因判断）"
                    value={explanations[item.key] ?? ""}
                    onChange={(e) =>
                      setExplanations((prev) => ({ ...prev, [item.key]: e.target.value }))
                    }
                    className="text-sm min-h-[72px] resize-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 完成条件提示 */}
      {selectedItems.length === 0 && allItems.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          请至少勾选 1 条材料，然后填写现象说明句才能进入下一步
        </p>
      )}

      {/* 导航按钮 + 下一关过渡提示 */}
      <div className="space-y-2">
        {canProceed && (
          <p className="text-xs text-center text-muted-foreground">
            下一关将根据你在本关选中的材料，进入对应类型的加工工坊。
          </p>
        )}
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={() => navigate("/module/3/lesson/3/step/2")}>
            <ArrowLeft className="mr-1 h-4 w-4" /> 上一步
          </Button>
          <Button onClick={handleSave} disabled={saving || !canProceed}>
            {saving
              ? "保存中…"
              : !canProceed
                ? "还需选材料并填写说明句"
                : `保存并进入下一步（已选 ${selectedItems.length} 条）`}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
