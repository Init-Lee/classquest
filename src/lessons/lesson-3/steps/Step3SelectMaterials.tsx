/**
 * 文件说明：课时3 · 第3关 · 筛选我的材料
 * 职责：从课时2的个人记录中筛选适合海报展示的材料；
 *       每条入选材料必须填写"这条材料说明了什么（现象说明句）"；
 *       保存后进入第4关。
 * 更新触发：筛选逻辑变化时；说明句字段结构调整时
 */

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, ArrowLeft, CheckSquare, Square, Info, AlertCircle } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Textarea } from "@/shared/ui/textarea"
import { usePortfolio } from "@/app/providers/AppProvider"
import type { SelectedMaterial } from "@/domains/portfolio/types"
import type { PublicEvidenceRecord, FieldEvidenceTask } from "@/domains/evidence/types"

/** 展示用统一材料条目（聚合 public/field 两类） */
interface MaterialItem {
  key: string
  sourceType: "public" | "field"
  sourceIndex: number
  title: string
  summary: string
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
  // 本地状态：各材料的说明句 Map<key, string>
  const [explanations, setExplanations] = useState<Record<string, string>>({})

  if (!portfolio) return null

  const { student, lesson1, lesson2 } = portfolio
  const myName = lesson1.confirmedOwnerName || student.studentName

  // 过滤当前学生的课时2记录
  const myPublicRecords = lesson2.publicRecords.filter((r) => r.owner === myName)
  const myFieldTasks = lesson2.fieldTasks.filter((t) => t.owner === myName)

  // 构建统一展示条目
  const allItems: MaterialItem[] = [
    ...myPublicRecords.map((r: PublicEvidenceRecord, i: number): MaterialItem => ({
      key: `public-${i}`,
      sourceType: "public",
      sourceIndex: lesson2.publicRecords.indexOf(r),
      title: r.item,
      summary: r.quoteOrNote || `${r.resourceType} · ${r.sourcePlatform}`,
      materialTypes: r.materialTypes,
      source: r.sourcePlatform + (r.sourceOrg ? ` · ${r.sourceOrg}` : ""),
    })),
    ...myFieldTasks.map((t: FieldEvidenceTask, i: number): MaterialItem => ({
      key: `field-${i}`,
      sourceType: "field",
      sourceIndex: lesson2.fieldTasks.indexOf(t),
      title: t.materialName || t.item,
      summary: `${t.scene}${t.location ? ` · ${t.location}` : ""} · ${t.date}`,
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
        lesson3: { ...portfolio.lesson3, selectedMaterials: newSelectedMaterials },
      })
      navigate("/lesson/3/step/4")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* 筛选提示 */}
      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">选哪些材料更值得进海报？</p>
              <ul className="space-y-0.5">
                {SELECTION_CRITERIA.map((c, i) => (
                  <li key={i} className="text-xs text-blue-700">• {c}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 区域 A：我的全部资料条目 */}
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
                    {/* 材料信息 */}
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
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                      <div className="flex gap-1 flex-wrap">
                        {item.materialTypes.map((t) => (
                          <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 区域 B：入选材料 — 填写说明句 */}
      {selectedItems.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            为每条入选材料写一句「这条材料说明了什么？」
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-3">
            提示：写现象说明句，不要直接写原因判断。例如：「该数据显示…，说明存在…现象」
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
                    placeholder="这条材料说明了什么？（写现象说明句，不要写原因判断）"
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
          请至少勾选 1 条材料，然后填写说明句才能进入下一步
        </p>
      )}

      {/* 导航按钮 */}
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={() => navigate("/lesson/3/step/2")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 上一步
        </Button>
        <Button onClick={handleSave} disabled={saving || !canProceed}>
          {saving
            ? "保存中…"
            : !canProceed
              ? `还需选材料并填写说明句`
              : `保存并进入下一步（已选 ${selectedItems.length} 条）`}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
