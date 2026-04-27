/**
 * 文件说明：课时3 · 第4关 · 证据加工工坊
 * 职责：读取第3关已筛选材料，逐条引导学生完成三步加工（现象说明继承 + 最小加工 + 海报展示句），
 *       生成个人证据卡列表，全部完成后进入第5关。（本关不再展示顶栏「材料加工统一逻辑」四格图，该支架仅在第2关呈现。）
 * 更新触发：加工字段增减时；右侧参考组件契约变化时；EvidenceCard 结构调整时
 */

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight, ArrowLeft, CheckCircle2, Circle, ChevronLeft, ChevronRight,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Textarea } from "@/shared/ui/textarea"
import { usePortfolio } from "@/modules/module-3-ai-science-station/app/providers/AppProvider"
import { advancePointer } from "@/modules/module-3-ai-science-station/utils/pointer"
import { MaterialProcessingReferencePanel } from "@/modules/module-3-ai-science-station/features/material-processing-reference"
import type { MaterialTypeId } from "@/modules/module-3-ai-science-station/features/material-processing-reference"
import type { EvidenceCard, SelectedMaterial } from "@/modules/module-3-ai-science-station/domains/portfolio/types"
import type { PublicEvidenceRecord, FieldEvidenceTask } from "@/modules/module-3-ai-science-station/domains/evidence/types"

/** 将课时2中的素材类型字符串映射到证据卡的 materialType */
function toMaterialTypeId(rawTypes: string[]): EvidenceCard["materialType"] {
  if (rawTypes.includes("图像")) return "image"
  if (rawTypes.includes("视频")) return "video"
  if (rawTypes.includes("数据")) return "data"
  return "text"
}

/** 从 materialType 到 MaterialProcessingReferencePanel 的 Tab ID（类型一致，直接复用） */
function toTabId(t: EvidenceCard["materialType"]): MaterialTypeId {
  return t
}

/** 当前正在编辑的证据卡草稿 */
interface CardDraft {
  objectiveStatement: string
  processingResult: string
  posterExpression: string
}

const EMPTY_DRAFT: CardDraft = {
  objectiveStatement: "",
  processingResult: "",
  posterExpression: "",
}

/** 从 selectedMaterial 解析出原始材料详情 */
interface ResolvedMaterial {
  title: string
  sourceType: "public" | "field"
  detailLine: string
  materialTypes: string[]
  materialTypeId: EvidenceCard["materialType"]
  /** 第3关填写的现象说明句，作为 objectiveStatement 的初始值 */
  explanation: string
}

export default function Step4EvidenceWorkshop() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  // 当前正在处理的材料索引（对应 selectedMaterials[]）
  const [currentIdx, setCurrentIdx] = useState(0)
  // 各材料卡片草稿（key = materialIndex）
  const [drafts, setDrafts] = useState<Record<number, CardDraft>>({})

  if (!portfolio) return null

  const { lesson2, lesson3 } = portfolio
  const selectedMaterials = lesson3.selectedMaterials
  const savedCards = lesson3.evidenceCards

  // 解析每条 selectedMaterial 对应的原始材料详情
  const resolvedMaterials: ResolvedMaterial[] = selectedMaterials.map(
    (sm: SelectedMaterial): ResolvedMaterial => {
      if (sm.sourceType === "public") {
        const r = lesson2.publicRecords[sm.sourceIndex] as PublicEvidenceRecord | undefined
        const title = r?.item ?? `公开资源 #${sm.sourceIndex}`
        const rawTypes = r?.materialTypes ?? []
        return {
          title,
          sourceType: "public",
          detailLine: [
            r?.capturedAt ? `获取于 ${r.capturedAt}` : "",
            r?.sourcePlatform ?? "",
            r?.sourceOrg ?? "",
          ].filter(Boolean).join(" · "),
          materialTypes: rawTypes,
          materialTypeId: toMaterialTypeId(rawTypes),
          explanation: sm.explanation,
        }
      } else {
        const t = lesson2.fieldTasks[sm.sourceIndex] as FieldEvidenceTask | undefined
        const title = t?.materialName || t?.item || `现场采集 #${sm.sourceIndex}`
        const rawTypes = t?.materialTypes ?? []
        return {
          title,
          sourceType: "field",
          detailLine: [
            t?.date ? `采集于 ${t.date}` : "",
            t?.scene ?? "",
            t?.location ?? "",
          ].filter(Boolean).join(" · "),
          materialTypes: rawTypes,
          materialTypeId: toMaterialTypeId(rawTypes),
          explanation: sm.explanation,
        }
      }
    }
  )

  // 初始化：从已保存的 evidenceCards 恢复草稿，并将未加工材料的说明句继承为初始值
  useEffect(() => {
    const initDrafts: Record<number, CardDraft> = {}
    resolvedMaterials.forEach((rm, idx) => {
      const saved = savedCards.find((c) => c.materialIndex === idx)
      if (saved) {
        initDrafts[idx] = {
          objectiveStatement: saved.objectiveStatement,
          processingResult: saved.processingResult,
          posterExpression: saved.posterExpression,
        }
      } else {
        initDrafts[idx] = {
          ...EMPTY_DRAFT,
          objectiveStatement: rm.explanation,
        }
      }
    })
    setDrafts(initDrafts)
    // 定位到第一条未完成的材料
    const firstUnfinished = resolvedMaterials.findIndex(
      (_, idx) => !savedCards.some((c) => c.materialIndex === idx)
    )
    if (firstUnfinished !== -1) setCurrentIdx(firstUnfinished)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio.id])

  const currentMaterial = resolvedMaterials[currentIdx]
  const currentDraft = drafts[currentIdx] ?? { ...EMPTY_DRAFT, objectiveStatement: currentMaterial?.explanation ?? "" }

  const updateDraft = (field: keyof CardDraft, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [currentIdx]: { ...(prev[currentIdx] ?? EMPTY_DRAFT), [field]: value },
    }))
  }

  /** 当前卡片是否填写完整 */
  const currentDraftValid =
    currentDraft.objectiveStatement.trim().length > 0 &&
    currentDraft.processingResult.trim().length > 0 &&
    currentDraft.posterExpression.trim().length > 0

  /** 哪些材料已有保存的卡片 */
  const completedIndices = new Set(savedCards.map((c) => c.materialIndex))

  /** 全部材料是否都有完成的证据卡 */
  const allDone = resolvedMaterials.every((_, idx) => completedIndices.has(idx))

  const handleSaveCard = async () => {
    if (saving || !currentDraftValid) return
    setSaving(true)
    try {
      const draft = drafts[currentIdx]
      const rm = currentMaterial
      const newCard: EvidenceCard = {
        materialIndex: currentIdx,
        materialType: rm.materialTypeId,
        title: rm.title,
        processingResult: draft.processingResult.trim(),
        objectiveStatement: draft.objectiveStatement.trim(),
        posterExpression: draft.posterExpression.trim(),
        evidenceShows: "",
        relationToQuestion: "",
        limitedClaim: "",
      }

      // 替换已有同索引卡片，或追加新卡片
      const existing = savedCards.filter((c) => c.materialIndex !== currentIdx)
      const newCards = [...existing, newCard].sort((a, b) => a.materialIndex - b.materialIndex)

      // 判断是否全部完成（含本次）
      const newCompleted = new Set([...completedIndices, currentIdx])
      const isAllDone = resolvedMaterials.every((_, idx) => newCompleted.has(idx))

      await savePortfolio({
        ...portfolio,
        pointer: isAllDone
          ? advancePointer(portfolio.pointer, 3, 4)
          : portfolio.pointer,
        lesson3: { ...lesson3, evidenceCards: newCards },
      })

      if (isAllDone) {
        navigate("/module/3/lesson/3/step/5")
      } else {
        // 跳到下一条未完成的材料
        const nextUnfinished = resolvedMaterials.findIndex(
          (_, idx) => idx !== currentIdx && !newCompleted.has(idx)
        )
        if (nextUnfinished !== -1) setCurrentIdx(nextUnfinished)
      }
    } finally {
      setSaving(false)
    }
  }

  if (resolvedMaterials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <p className="text-muted-foreground text-sm">未找到第3关选中的材料，请返回第3关重新筛选。</p>
        <Button variant="outline" onClick={() => navigate("/module/3/lesson/3/step/3")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 返回第3关
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 w-full max-w-7xl mx-auto">
      {/* ── 第一行（全宽）：目标提示带 ── */}
      <div className="rounded-lg bg-violet-50 border border-violet-200 px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-violet-800">
            本关要把你在第3关选中的材料，整理成可以交给组长汇总的证据卡。
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-violet-700 shrink-0">
          <span>共 {resolvedMaterials.length} 条材料</span>
          <span>·</span>
          <span>当前第 {currentIdx + 1} 条</span>
          {currentMaterial && (
            <>
              <span>·</span>
              <span>类型：{currentMaterial.materialTypes[0] ?? "未知"}</span>
            </>
          )}
          <span>·</span>
          <span className="text-green-700 font-medium">已完成 {completedIndices.size}/{resolvedMaterials.length}</span>
        </div>
        {/* 材料切换导航 */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((i) => i - 1)}
            className="p-1 rounded hover:bg-violet-200 disabled:opacity-40 transition-colors"
            title="上一条材料"
          >
            <ChevronLeft className="h-4 w-4 text-violet-700" />
          </button>
          {resolvedMaterials.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              title={`切换到第 ${idx + 1} 条材料`}
              className={`w-6 h-6 rounded-full text-xs font-medium transition-colors ${
                idx === currentIdx
                  ? "bg-violet-700 text-white"
                  : completedIndices.has(idx)
                    ? "bg-green-500 text-white"
                    : "bg-violet-200 text-violet-700 hover:bg-violet-300"
              }`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            type="button"
            disabled={currentIdx === resolvedMaterials.length - 1}
            onClick={() => setCurrentIdx((i) => i + 1)}
            className="p-1 rounded hover:bg-violet-200 disabled:opacity-40 transition-colors"
            title="下一条材料"
          >
            <ChevronRight className="h-4 w-4 text-violet-700" />
          </button>
        </div>
      </div>

      {/* ── 第二行：左右双栏 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* 左栏：当前材料加工区 */}
        <div className="min-w-0 space-y-4 order-2 lg:order-1">
          {currentMaterial && (
            <>
              {/* 材料信息卡 */}
              <Card className="border-violet-200 bg-violet-50/30">
                <CardHeader className="pb-2 pt-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800">{currentMaterial.title}</span>
                        <Badge
                          variant="secondary"
                          className={`text-xs shrink-0 ${
                            currentMaterial.sourceType === "public"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {currentMaterial.sourceType === "public" ? "公开资源" : "现场采集"}
                        </Badge>
                        {completedIndices.has(currentIdx) && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            已完成
                          </Badge>
                        )}
                      </div>
                      {currentMaterial.detailLine && (
                        <p className="text-xs text-muted-foreground">{currentMaterial.detailLine}</p>
                      )}
                      {currentMaterial.materialTypes.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {currentMaterial.materialTypes.map((t) => (
                            <span key={t} className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* 证据卡填写区 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">证据卡填写</CardTitle>
                  <p className="text-xs text-muted-foreground font-normal">
                    按四步逻辑完成三个填写区，生成你的个人证据卡。
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 字段1：现象说明（继承自第3关） */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 text-[10px] font-bold text-amber-50 shrink-0">2</span>
                      这条材料让我看见了什么？
                    </label>
                    <p className="text-xs text-muted-foreground">
                      继承自你在第3关填写的现象说明句，可在此修改。
                    </p>
                    <Textarea
                      rows={3}
                      value={currentDraft.objectiveStatement}
                      onChange={(e) => updateDraft("objectiveStatement", e.target.value)}
                      placeholder="这组数据说明…… / 这张图片显示…… / 这段视频呈现出……"
                      className="text-sm resize-none"
                    />
                  </div>

                  {/* 字段2：最小加工说明 */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 text-[10px] font-bold text-amber-50 shrink-0">3</span>
                      我做了什么最小加工？
                    </label>
                    <p className="text-xs text-muted-foreground">
                      裁剪、圈点、摘录、压缩……让重点更清楚的必要处理。
                    </p>
                    <Textarea
                      rows={3}
                      value={currentDraft.processingResult}
                      onChange={(e) => updateDraft("processingResult", e.target.value)}
                      placeholder="例如：截取了关键数据的3列，删去无关说明文字……"
                      className="text-sm resize-none"
                    />
                  </div>

                  {/* 字段3：海报展示句 */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 text-[10px] font-bold text-amber-50 shrink-0">4</span>
                      海报上可以这样展示：
                    </label>
                    <p className="text-xs text-muted-foreground">
                      将材料转化为观众一眼看懂的直观表述，基于材料说，不要直接断言原因。
                    </p>
                    <Textarea
                      rows={3}
                      value={currentDraft.posterExpression}
                      onChange={(e) => updateDraft("posterExpression", e.target.value)}
                      placeholder="例如：「调查显示，周五午餐剩余率（41%）比其他日高约 10%」"
                      className="text-sm resize-none"
                    />
                  </div>

                  {/* 保存按钮 */}
                  <div className="pt-1 flex flex-col gap-2">
                    {!currentDraftValid && (
                      <p className="text-xs text-amber-700">
                        请填写以上三项内容后再保存证据卡。
                      </p>
                    )}
                    <Button
                      onClick={handleSaveCard}
                      disabled={saving || !currentDraftValid}
                      className="w-full"
                    >
                      {saving
                        ? "保存中…"
                        : allDone
                          ? "全部完成，进入下一步"
                          : completedIndices.has(currentIdx)
                            ? "更新此条证据卡"
                            : currentIdx < resolvedMaterials.length - 1
                              ? "保存证据卡，继续下一条"
                              : "保存证据卡"}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 本关材料完成情况一览 */}
              <Card className="border-gray-200">
                <CardContent className="pt-3 pb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">本关材料完成情况</p>
                  <ul className="space-y-1">
                    {resolvedMaterials.map((rm, idx) => (
                      <li
                        key={idx}
                        className={`flex items-center gap-2 text-xs cursor-pointer rounded px-1 py-0.5 transition-colors ${
                          idx === currentIdx ? "bg-violet-50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => setCurrentIdx(idx)}
                      >
                        {completedIndices.has(idx) ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        )}
                        <span className={`flex-1 truncate ${idx === currentIdx ? "font-medium text-violet-800" : "text-gray-700"}`}>
                          {rm.title}
                        </span>
                        {!completedIndices.has(idx) && (
                          <span className="text-amber-500 shrink-0">待加工</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* 右栏：材料处理参考（全部解锁）+ 当前证据卡预览 */}
        <div className="min-w-0 order-1 lg:order-2 space-y-4 lg:sticky lg:top-4">
          {/* 使用 key 在材料切换时重置默认 Tab */}
          <MaterialProcessingReferencePanel
            key={`ref-${currentIdx}`}
            unlockedTabIds={["image", "text", "data", "video"]}
            defaultTab={currentMaterial ? toTabId(currentMaterial.materialTypeId) : "text"}
          />

          {/* 当前证据卡预览 */}
          {(currentDraft.objectiveStatement || currentDraft.processingResult || currentDraft.posterExpression) && (
            <Card className="border-violet-200">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm text-violet-800">当前证据卡预览</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pb-3">
                {currentDraft.objectiveStatement && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">我看见了什么</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded px-2 py-1.5">
                      {currentDraft.objectiveStatement}
                    </p>
                  </div>
                )}
                {currentDraft.processingResult && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">最小加工</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded px-2 py-1.5">
                      {currentDraft.processingResult}
                    </p>
                  </div>
                )}
                {currentDraft.posterExpression && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">海报展示句</p>
                    <p className="text-sm font-medium text-gray-800 bg-violet-50 rounded px-2 py-1.5">
                      {currentDraft.posterExpression}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── 底部导航 ── */}
      <div className="flex justify-start">
        <Button variant="outline" size="sm" onClick={() => navigate("/module/3/lesson/3/step/3")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 上一步
        </Button>
      </div>
    </div>
  )
}
