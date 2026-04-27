/**
 * 文件说明：课时2 · 步骤3（原步骤4） · 证据入库
 * 职责：根据学生任务类型动态展示两种填报模板：
 *       - 公开资源：资源类型/来源平台/链接/素材类型/方法工具/笔记，自动生成引用条目
 *       - 现场采集：素材名称/场景/日期/素材类型/方法工具/合规确认，自动生成条目
 *       每张卡顶部展示课时1执行表对应条目（whereWhen/method/recordIdea）作为参考，
 *       让学生不必切换页面也能看到自己在课时1规划的采集思路。
 *       同时有公开与现场任务时，大屏下两区块左右各约 50% 并列，可独立滚动。
 * 过关条件：公开每条记录需有URL+获取时间；现场每条任务需有名称+日期+4项合规确认
 * 更新触发：表单字段变化；引用格式调整；过关规则变化；支架文件版本更新
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Plus, Save, MapPin, Trash2, Copy, Check } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/modules/module-3-ai-science-station/app/providers/AppProvider"
import type { PublicEvidenceRecord, FieldEvidenceTask } from "@/modules/module-3-ai-science-station/domains/evidence/types"
import { advancePointer } from "@/modules/module-3-ai-science-station/utils/pointer"

// ── 选项常量 ──────────────────────────────────────────────────────────────────
/** 公开资源与现场采集共用的素材类型 */
const SHARED_MATERIAL_TYPES = ["文字", "数据", "图像", "视频", "音频", "其他"]
const RESOURCE_TYPES = ["统计数据", "政策文件", "机构报告", "新闻报道", "科普文章", "学术论文", "其他"]
const SOURCE_PLATFORMS = ["政府/机构官网", "学校官网", "数据库平台", "媒体网站", "百科类网站", "其他"]
const PUBLIC_METHODS = ["检索", "站内搜索", "下载PDF", "截图", "数据整理", "其他"]
const FIELD_SCENES = ["校园", "社区", "家庭", "街区", "公园", "商场", "路口", "其他"]
const FIELD_METHODS = ["拍照", "摄像", "计数", "访谈录音", "测量", "其他"]

// ── 公共样式工具 ──────────────────────────────────────────────────────────────
const selectCls =
  "w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm " +
  "transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
const dateCls =
  "w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm " +
  "transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"

// ── 自动引用生成 ──────────────────────────────────────────────────────────────
function buildPublicCitation(r: Partial<PublicEvidenceRecord>, ownerName: string): string {
  const platform = r.sourcePlatform === "其他"
    ? (r.sourcePlatformOther?.trim() || "其他来源")
    : r.sourcePlatform?.trim() || ""
  const rtype = r.resourceType === "其他"
    ? (r.resourceTypeOther?.trim() || "其他类型")
    : r.resourceType?.trim() || ""
  const types = (r.materialTypes || []).join("/")
  const methods = (r.methods || []).map(m => m === "其他" ? (r.methodOther?.trim() || "其他") : m).join("/")
  const urls = (r.urls || []).filter(u => u.trim())
  if (!ownerName || !r.capturedAt) return ""
  const source = [platform, rtype].filter(Boolean).join("·")
  return (
    `${ownerName}（${r.capturedAt}）。` +
    `${source ? source + "：" : ""}${r.item || ""}` +
    (types ? `【${types}】` : "") +
    (methods ? `。方法：${methods}` : "") +
    (urls.length ? `。链接：${urls.join("；")}` : "") +
    (r.publishedUnknown ? "" : r.publishedAt ? `（发布：${r.publishedAt}）` : "")
  )
}

function buildFieldCitation(t: Partial<FieldEvidenceTask>, ownerName: string): string {
  const scene = t.scene === "其他" ? (t.sceneOther?.trim() || "其他") : t.scene?.trim() || ""
  const types = (t.materialTypes || []).join("/")
  const methods = (t.methods || []).map(m => m === "其他" ? (t.methodOther?.trim() || "其他") : m).join("/")
  if (!ownerName || !t.date) return ""
  const where = [scene, t.location?.trim()].filter(Boolean).join(" ")
  return (
    `${ownerName}（${t.date}）。` +
    `${t.materialName?.trim() || t.item || "素材"}` +
    (types ? `【${types}】` : "") +
    (where ? `。地点：${where}` : "") +
    (methods ? `。采集方法：${methods}` : "") +
    "。"
  )
}

// ── 默认数据工厂 ──────────────────────────────────────────────────────────────
const createDefaultPublicRecord = (
  planIdx: number,
  item: string,
  ownerName: string,
): Partial<PublicEvidenceRecord> => ({
  planIndex: planIdx,
  item,
  owner: ownerName,
  sourceType: "public",
  resourceType: "",
  sourcePlatform: "",
  sourceOrg: "",
  urls: [""],
  publishedAt: "",
  publishedUnknown: false,
  capturedAt: new Date().toISOString().slice(0, 10),
  materialTypes: [],
  methods: [],
  quoteOrNote: "",
  citationFull: "",
  status: "draft",
})

const createDefaultFieldTask = (
  planIdx: number,
  item: string,
  ownerName: string,
): Partial<FieldEvidenceTask> => ({
  planIndex: planIdx,
  item,
  owner: ownerName,
  sourceType: "field",
  materialName: "",
  scene: "",
  location: "",
  date: new Date().toISOString().slice(0, 10),
  materialTypes: [],
  methods: [],
  compNoFace: false,
  compNoPrivate: false,
  compNoFake: false,
  compSafety: false,
  citationFull: "",
  status: "todo",
})

// ── 标签切换按钮 ──────────────────────────────────────────────────────────────
function TagButton({
  label,
  active,
  color = "blue",
  onClick,
}: {
  label: string
  active: boolean
  color?: "blue" | "orange"
  onClick: () => void
}) {
  const activeStyle =
    color === "orange"
      ? "bg-orange-500 text-white border-orange-500"
      : "bg-primary text-primary-foreground border-primary"
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
        active ? activeStyle : "border-border hover:border-primary"
      }`}
    >
      {label}
    </button>
  )
}

// ── 课时1执行表参考面板 ────────────────────────────────────────────────────────
function L1Ref({ item, evidenceRows }: {
  item: string
  evidenceRows: { item: string; whereWhen: string; method: string; recordIdea: string }[]
}) {
  const row = evidenceRows.find(r => r.item === item)
  if (!row || (!row.whereWhen && !row.method && !row.recordIdea)) return null
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5 space-y-1.5 mb-1">
      <p className="text-xs font-semibold text-slate-500">📋 课时1执行表 · 参考（只读）</p>
      {row.whereWhen && (
        <p className="text-xs text-slate-600">
          <span className="font-medium">地点/时间：</span>{row.whereWhen}
        </p>
      )}
      {row.method && (
        <p className="text-xs text-slate-600">
          <span className="font-medium">方法工具：</span>{row.method}
        </p>
      )}
      {row.recordIdea && (
        <p className="text-xs text-slate-600">
          <span className="font-medium">记录思路：</span>{row.recordIdea}
        </p>
      )}
    </div>
  )
}

// ── 主组件 ─────────────────────────────────────────────────────────────────────
export default function Step3Evidence() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null)

  if (!portfolio) return null

  // 组员在小组中的名字优先用 confirmedOwnerName（组长文件中确认的名字），
  // 防止注册姓名与组长录入名不一致导致任务/记录匹配失败；组长无 confirmedOwnerName，回退 studentName
  const myName = portfolio.lesson1.confirmedOwnerName || portfolio.student.studentName
  const myAssignments = portfolio.lesson2.assignments.filter(a => a.owners.includes(myName))
  const evidenceRows = portfolio.lesson1.evidenceRows

  const publicAssignments = myAssignments.filter(
    a => a.expectedSourceType === "public" || a.expectedSourceType === "mixed",
  )
  const fieldAssignments = myAssignments.filter(
    a => a.expectedSourceType === "field" || a.expectedSourceType === "mixed",
  )
  const hasPublic = publicAssignments.length > 0
  const hasField = fieldAssignments.length > 0

  // 动态标题
  let stepTitle = "第3关：证据入库"
  let stepSubtitle = "登记本次课的证据资料与现场采集计划"
  if (hasPublic && !hasField) {
    stepTitle = "第3关：公开资源入库"
    stepSubtitle = "你不是在填作业空格，而是在给证据办「身份证」"
  } else if (!hasPublic && hasField) {
    stepTitle = "第3关：现场采集计划"
    stepSubtitle = "课后采集出发前——把计划写清楚，采到有用的证据"
  }

  // ── 公开资源状态 ──
  const existingPublic = portfolio.lesson2.publicRecords.filter(r => r.owner === myName)
  const [publicRecords, setPublicRecords] = useState<Partial<PublicEvidenceRecord>[]>(
    existingPublic.length > 0
      ? existingPublic
      : hasPublic
        ? publicAssignments.map(a => createDefaultPublicRecord(a.planIndex, a.item, myName))
        : [],
  )

  // ── 现场采集任务状态 ──
  const existingField = portfolio.lesson2.fieldTasks.filter(t => t.owner === myName)
  const [fieldTasks, setFieldTasks] = useState<Partial<FieldEvidenceTask>[]>(
    existingField.length > 0
      ? existingField
      : hasField
        ? fieldAssignments.map(a => createDefaultFieldTask(a.planIndex, a.item, myName))
        : [],
  )

  // ── 公开资源更新函数 ──
  const updatePublicRecord = (idx: number, patch: Partial<PublicEvidenceRecord>) => {
    setPublicRecords(prev =>
      prev.map((r, i) => {
        if (i !== idx) return r
        const updated = { ...r, ...patch }
        updated.citationFull = buildPublicCitation(updated, myName)
        return updated
      }),
    )
  }
  const addPublicUrl = (recIdx: number) => {
    updatePublicRecord(recIdx, { urls: [...(publicRecords[recIdx].urls || []), ""] })
  }
  const removePublicUrl = (recIdx: number, urlIdx: number) => {
    const urls = (publicRecords[recIdx].urls || []).filter((_, i) => i !== urlIdx)
    updatePublicRecord(recIdx, { urls: urls.length ? urls : [""] })
  }
  const changePublicUrl = (recIdx: number, urlIdx: number, val: string) => {
    const urls = [...(publicRecords[recIdx].urls || [""])]
    urls[urlIdx] = val
    updatePublicRecord(recIdx, { urls })
  }
  const togglePublicType = (idx: number, type: string) => {
    const types = publicRecords[idx].materialTypes || []
    updatePublicRecord(idx, {
      materialTypes: types.includes(type) ? types.filter(t => t !== type) : [...types, type],
    })
  }
  const togglePublicMethod = (idx: number, method: string) => {
    const methods = publicRecords[idx].methods || []
    updatePublicRecord(idx, {
      methods: methods.includes(method) ? methods.filter(m => m !== method) : [...methods, method],
    })
  }

  // ── 现场任务更新函数 ──
  const updateFieldTask = (idx: number, patch: Partial<FieldEvidenceTask>) => {
    setFieldTasks(prev =>
      prev.map((t, i) => {
        if (i !== idx) return t
        const updated = { ...t, ...patch }
        updated.citationFull = buildFieldCitation(updated, myName)
        return updated
      }),
    )
  }
  const toggleFieldType = (idx: number, type: string) => {
    const types = fieldTasks[idx].materialTypes || []
    updateFieldTask(idx, {
      materialTypes: types.includes(type) ? types.filter(t => t !== type) : [...types, type],
    })
  }
  const toggleFieldMethod = (idx: number, method: string) => {
    const methods = fieldTasks[idx].methods || []
    updateFieldTask(idx, {
      methods: methods.includes(method) ? methods.filter(m => m !== method) : [...methods, method],
    })
  }

  // ── 复制引用条目 ──
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(key)
      setTimeout(() => setCopiedIdx(null), 2000)
    })
  }

  // ── 保存 ──
  const handleSave = async () => {
    setSaving(true)
    try {
      const otherPublic = portfolio.lesson2.publicRecords.filter(r => r.owner !== myName)
      const otherField = portfolio.lesson2.fieldTasks.filter(t => t.owner !== myName)
      await savePortfolio({
        ...portfolio,
        lesson2: {
          ...portfolio.lesson2,
          publicRecords: [...otherPublic, ...(publicRecords as PublicEvidenceRecord[])],
          fieldTasks: [...otherField, ...(fieldTasks as FieldEvidenceTask[])],
        },
        pointer: advancePointer(portfolio.pointer, 2, 3),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    await handleSave()
    navigate("/module/3/lesson/2/step/4")
  }

  // ── 过关条件 ──
  const hasValidPublic =
    !hasPublic ||
    (publicRecords.length > 0 &&
      publicRecords.every(r => r.urls?.some(u => u.trim()) && r.capturedAt?.trim()))

  const hasValidField =
    !hasField ||
    (fieldTasks.length > 0 &&
      fieldTasks.every(
        t =>
          t.materialName?.trim() &&
          t.date?.trim() &&
          t.compNoFace &&
          t.compNoPrivate &&
          t.compNoFake &&
          t.compSafety,
      ))

  const canProceed = hasValidPublic && hasValidField
  const dualEvidenceColumns = hasPublic && hasField

  // ── 渲染 ──────────────────────────────────────────────────────────────────
  return (
    <div className={`space-y-6 w-full mx-auto ${dualEvidenceColumns ? "max-w-7xl" : "max-w-2xl"}`}>
      {/* 标题 */}
      <div className="space-y-1">
        <h3 className="text-xl font-bold">{stepTitle}</h3>
        <p className="text-muted-foreground text-sm italic">{stepSubtitle}</p>
      </div>

      <div
        className={
          dualEvidenceColumns
            ? "flex flex-col lg:flex-row gap-6 lg:items-stretch"
            : "contents"
        }
      >
      {/* ════════════════ 公开资源区块 ════════════════ */}
      {hasPublic && (
        <div
          className={
            dualEvidenceColumns
              ? "space-y-4 lg:flex-1 lg:min-w-0 min-h-0 lg:max-h-[min(78vh,820px)] lg:overflow-y-auto"
              : "space-y-4"
          }
        >
          {dualEvidenceColumns && (
            <p className="text-sm font-semibold text-muted-foreground border-b pb-2 shrink-0">
              📄 公开资源入库（课堂完成）
            </p>
          )}

          {publicRecords.map((record, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  公开资源 #{idx + 1}
                  {record.item && (
                    <span className="font-normal text-muted-foreground">· {record.item}</span>
                  )}
                </CardTitle>
                <CardDescription>来源越清楚，证据越有说服力</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 课时1执行表参考 */}
                <L1Ref item={record.item || ""} evidenceRows={evidenceRows} />

                {/* A. 来源信息 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      资源类型 <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={record.resourceType || ""}
                      onChange={e => updatePublicRecord(idx, { resourceType: e.target.value })}
                      className={selectCls}
                    >
                      <option value="">请选择…</option>
                      {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {record.resourceType === "其他" && (
                      <Input
                        placeholder="请说明资源类型"
                        value={record.resourceTypeOther || ""}
                        onChange={e => updatePublicRecord(idx, { resourceTypeOther: e.target.value })}
                        className="mt-1"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      来源平台 <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={record.sourcePlatform || ""}
                      onChange={e => updatePublicRecord(idx, { sourcePlatform: e.target.value })}
                      className={selectCls}
                    >
                      <option value="">请选择…</option>
                      {SOURCE_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {record.sourcePlatform === "其他" && (
                      <Input
                        placeholder="请说明来源平台"
                        value={record.sourcePlatformOther || ""}
                        onChange={e => updatePublicRecord(idx, { sourcePlatformOther: e.target.value })}
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">发布机构</label>
                  <Input
                    placeholder="例：国家气象局、市环保局"
                    value={record.sourceOrg || ""}
                    onChange={e => updatePublicRecord(idx, { sourceOrg: e.target.value })}
                  />
                </div>

                {/* B. 链接列表 */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    链接 URL <span className="text-destructive">*</span>
                    <span className="text-muted-foreground font-normal ml-1">（至少填1条，第一条用于引用）</span>
                  </label>
                  {(record.urls || [""]).map((url, urlIdx) => (
                    <div key={urlIdx} className="flex gap-2 items-center">
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={url}
                        onChange={e => changePublicUrl(idx, urlIdx, e.target.value)}
                        className="flex-1"
                      />
                      {(record.urls || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePublicUrl(idx, urlIdx)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addPublicUrl(idx)}
                    className="gap-1 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> 添加链接
                  </Button>
                </div>

                {/* C. 时间 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">发布/更新时间</label>
                    <input
                      type="date"
                      disabled={!!record.publishedUnknown}
                      value={record.publishedUnknown ? "" : (record.publishedAt || "")}
                      onChange={e => updatePublicRecord(idx, { publishedAt: e.target.value })}
                      className={dateCls}
                    />
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!record.publishedUnknown}
                        onChange={() => {
                          const next = !record.publishedUnknown
                          updatePublicRecord(idx, {
                            publishedUnknown: next,
                            publishedAt: next ? "" : record.publishedAt,
                          })
                        }}
                        className="h-3.5 w-3.5"
                      />
                      不确定（发布时间未知）
                    </label>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      获取时间 <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="date"
                      value={record.capturedAt || ""}
                      onChange={e => updatePublicRecord(idx, { capturedAt: e.target.value })}
                      className={dateCls}
                    />
                  </div>
                </div>

                {/* D. 素材类型 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">素材类型（可多选）</label>
                  <div className="flex flex-wrap gap-2">
                    {SHARED_MATERIAL_TYPES.map(type => (
                      <TagButton
                        key={type}
                        label={type}
                        active={(record.materialTypes || []).includes(type)}
                        onClick={() => togglePublicType(idx, type)}
                      />
                    ))}
                  </div>
                </div>

                {/* E. 方法与工具 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">方法与工具（可多选）</label>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {PUBLIC_METHODS.map(method => (
                      <label key={method} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(record.methods || []).includes(method)}
                          onChange={() => togglePublicMethod(idx, method)}
                          className="h-3.5 w-3.5"
                        />
                        {method}
                      </label>
                    ))}
                  </div>
                  {(record.methods || []).includes("其他") && (
                    <Input
                      placeholder="请说明其他方法"
                      value={record.methodOther || ""}
                      onChange={e => updatePublicRecord(idx, { methodOther: e.target.value })}
                    />
                  )}
                </div>

                {/* F. 摘要笔记 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">摘要/引用笔记</label>
                  <Textarea
                    placeholder="这个资料说了什么？与我们研究的关系是什么？（写清楚有助于质检通过）"
                    value={record.quoteOrNote || ""}
                    onChange={e => updatePublicRecord(idx, { quoteOrNote: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* G. 自动生成引用条目 */}
                {record.citationFull && (
                  <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">资料条目（自动生成）：</p>
                      <button
                        type="button"
                        onClick={() => handleCopy(record.citationFull!, `pub-${idx}`)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {copiedIdx === `pub-${idx}`
                          ? <><Check className="h-3.5 w-3.5 text-green-500" /> 已复制</>
                          : <><Copy className="h-3.5 w-3.5" /> 复制</>}
                      </button>
                    </div>
                    <p className="text-xs italic leading-relaxed">{record.citationFull}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Badge variant={record.status === "checked" ? "default" : "secondary"}>
                    {record.status === "checked" ? "✓ 已质检" : "草稿"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPublicRecords(r => [
                ...r,
                createDefaultPublicRecord(r.length, "", myName),
              ])
            }
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> 添加一条公开资源
          </Button>
        </div>
      )}

      {/* ════════════════ 现场采集计划区块 ════════════════ */}
      {hasField && (
        <div
          className={
            dualEvidenceColumns
              ? "space-y-4 lg:flex-1 lg:min-w-0 min-h-0 lg:max-h-[min(78vh,820px)] lg:overflow-y-auto"
              : "space-y-4"
          }
        >
          {dualEvidenceColumns && (
            <p className="text-sm font-semibold text-muted-foreground border-b pb-2 shrink-0">
              🏃 现场采集计划（课后完成）
            </p>
          )}

          {fieldTasks.map((task, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  现场任务 #{idx + 1}
                  {task.item && (
                    <span className="font-normal text-muted-foreground">· {task.item}</span>
                  )}
                </CardTitle>
                <CardDescription>把计划写得越具体，课后采集越顺利</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 课时1执行表参考 */}
                <L1Ref item={task.item || ""} evidenceRows={evidenceRows} />

                {/* A. 素材名称 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    素材名称 <span className="text-destructive">*</span>
                    <span className="font-normal ml-1">（简短命名，如"操场东门噪声读数"）</span>
                  </label>
                  <Input
                    placeholder="例：学校正门噪声分贝读数"
                    value={task.materialName || ""}
                    onChange={e => updateFieldTask(idx, { materialName: e.target.value })}
                  />
                </div>

                {/* B. 场景 + 日期 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      采集场景 <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={task.scene || ""}
                      onChange={e => updateFieldTask(idx, { scene: e.target.value })}
                      className={selectCls}
                    >
                      <option value="">请选择…</option>
                      {FIELD_SCENES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {task.scene === "其他" && (
                      <Input
                        placeholder="请说明采集场景"
                        value={task.sceneOther || ""}
                        onChange={e => updateFieldTask(idx, { sceneOther: e.target.value })}
                        className="mt-1"
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      采集日期 <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="date"
                      value={task.date || ""}
                      onChange={e => updateFieldTask(idx, { date: e.target.value })}
                      className={dateCls}
                    />
                  </div>
                </div>

                {/* C. 地点描述 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">地点描述（可选）</label>
                  <Input
                    placeholder="例：主楼一楼走廊饮水台旁"
                    value={task.location || ""}
                    onChange={e => updateFieldTask(idx, { location: e.target.value })}
                  />
                </div>

                {/* D. 素材类型 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">素材类型（可多选）</label>
                  <div className="flex flex-wrap gap-2">
                    {SHARED_MATERIAL_TYPES.map(type => (
                      <TagButton
                        key={type}
                        label={type}
                        active={(task.materialTypes || []).includes(type)}
                        color="orange"
                        onClick={() => toggleFieldType(idx, type)}
                      />
                    ))}
                  </div>
                </div>

                {/* E. 方法与工具 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">方法与工具（可多选）</label>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {FIELD_METHODS.map(method => (
                      <label key={method} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(task.methods || []).includes(method)}
                          onChange={() => toggleFieldMethod(idx, method)}
                          className="h-3.5 w-3.5"
                        />
                        {method}
                      </label>
                    ))}
                  </div>
                  {(task.methods || []).includes("其他") && (
                    <Input
                      placeholder="请说明其他方法"
                      value={task.methodOther || ""}
                      onChange={e => updateFieldTask(idx, { methodOther: e.target.value })}
                    />
                  )}
                </div>

                {/* F. 合规确认 */}
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-800">
                    ⚠ 合规确认（全部勾选后才能过关）
                  </p>
                  {[
                    { key: "compNoFace" as const, label: "未拍摄他人人脸（或已获当事人同意）" },
                    { key: "compNoPrivate" as const, label: "未拍住户窗内或其他隐私场所" },
                    { key: "compNoFake" as const, label: "数据与素材真实，不造假不补数据" },
                    { key: "compSafety" as const, label: "结伴安全采集，不单独外出" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-start gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!task[key]}
                        onChange={() => updateFieldTask(idx, { [key]: !task[key] })}
                        className="h-4 w-4 mt-0.5 flex-shrink-0"
                      />
                      <span className="text-amber-800">{label}</span>
                    </label>
                  ))}
                </div>

                {/* G. 自动生成引用条目 */}
                {task.citationFull && (
                  <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">资料条目（自动生成）：</p>
                      <button
                        type="button"
                        onClick={() => handleCopy(task.citationFull!, `field-${idx}`)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {copiedIdx === `field-${idx}`
                          ? <><Check className="h-3.5 w-3.5 text-green-500" /> 已复制</>
                          : <><Copy className="h-3.5 w-3.5" /> 复制</>}
                      </button>
                    </div>
                    <p className="text-xs italic leading-relaxed">{task.citationFull}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>

      {/* 无任务提示 */}
      {!hasPublic && !hasField && (
        <Card className="border-muted">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            未找到你名下的任务，请回到第1关确认进度与任务分配
          </CardContent>
        </Card>
      )}

      {/* 底部操作 */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={saving || !portfolio}
          className="gap-1.5"
        >
          <Save className="h-4 w-4" />
          {saving ? "保存中…" : saved ? "已保存！" : "保存"}
        </Button>
        <div className="flex flex-col items-end gap-1">
          <Button onClick={handleNext} disabled={!canProceed}>
            保存并进入质检
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          {!canProceed && (
            <p className="text-xs text-amber-600">
              {!hasValidPublic && "请为每条公开资源填写 URL 与获取时间"}
              {!hasValidField && "请填写每个现场任务的素材名称、日期并完成合规确认"}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
