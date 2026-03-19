/**
 * 文件说明：课时2 · 步骤4 · 公开资源入库（课堂必做）
 * 职责：学生按标准化字段填写公开资源记录（相当于"给证据办身份证"）
 *       包含 URL 基础校验、时间格式提示、自动生成引用条目
 *       过关条件：至少1条公开资源记录草稿
 * 更新触发：记录字段变化时；引用格式更新时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Plus, Save } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/app/providers/AppProvider"
import type { PublicEvidenceRecord } from "@/domains/evidence/types"

/** 自动生成引用格式 */
function buildCitation(r: Partial<PublicEvidenceRecord>): string {
  const parts = [
    r.sourceOrg && `${r.sourceOrg}`,
    r.publishedAt && `（${r.publishedAt}）`,
    r.sourcePlatform && `《${r.sourcePlatform}》`,
    r.url && `[EB/OL]. ${r.url}`,
    r.capturedAt && `[获取于${r.capturedAt}]`,
  ].filter(Boolean)
  return parts.join("，")
}

const MATERIAL_TYPES = ["图表", "统计数据", "文字报告", "新闻", "学术论文", "政府公告", "视频截图", "其他"]

export default function Step4Evidence() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const myAssignments = portfolio?.lesson2.assignments || []
  const existingRecords = portfolio?.lesson2.publicRecords || []
  const myName = portfolio?.student.studentName || ""

  const defaultRecord = (planIdx: number): Partial<PublicEvidenceRecord> => ({
    planIndex: planIdx,
    item: myAssignments[planIdx]?.item || "",
    owner: myName,
    sourceType: "public",
    sourcePlatform: "",
    sourceOrg: "",
    url: "",
    publishedAt: "",
    capturedAt: new Date().toLocaleDateString("zh-CN"),
    materialTypes: [],
    methodTool: "浏览器搜索",
    locator: "",
    quoteOrNote: "",
    citationFull: "",
    status: "draft",
  })

  const [records, setRecords] = useState<Partial<PublicEvidenceRecord>[]>(
    existingRecords.filter(r => r.owner === myName).length > 0
      ? existingRecords.filter(r => r.owner === myName)
      : [defaultRecord(0)]
  )

  const updateRecord = (idx: number, field: keyof PublicEvidenceRecord, value: unknown) => {
    setRecords(prev => {
      const updated = prev.map((r, i) => {
        if (i !== idx) return r
        const newRecord = { ...r, [field]: value }
        newRecord.citationFull = buildCitation(newRecord)
        return newRecord
      })
      return updated
    })
  }

  const toggleMaterialType = (idx: number, type: string) => {
    const types = records[idx].materialTypes || []
    updateRecord(idx, "materialTypes", types.includes(type) ? types.filter(t => t !== type) : [...types, type])
  }

  const addRecord = () => setRecords(r => [...r, defaultRecord(r.length)])

  const handleSave = async () => {
    if (!portfolio) return
    setSaving(true)
    try {
      const others = (portfolio.lesson2.publicRecords || []).filter(r => r.owner !== myName)
      await savePortfolio({
        ...portfolio,
        lesson2: {
          ...portfolio.lesson2,
          publicRecords: [...others, ...records as PublicEvidenceRecord[]],
        },
        pointer: { ...portfolio.pointer, lessonId: 2, stepId: 4 },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    await handleSave()
    navigate("/lesson/2/step/5")
  }

  const hasValidRecord = records.some(r => r.sourcePlatform?.trim() && r.locator?.trim())

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">第4关：公开资源入库</h3>
          <p className="text-muted-foreground text-sm italic">你不是在填作业空格，而是在给证据办身份证。</p>
        </div>
        <Button variant="outline" size="sm" onClick={addRecord} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> 添加一条
        </Button>
      </div>

      {records.map((record, idx) => (
        <Card key={idx}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              证据 #{idx + 1}
              {record.item && <span className="font-normal text-muted-foreground">· {record.item}</span>}
            </CardTitle>
            <CardDescription>来源越清楚，证据越有说服力</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">来源平台 <span className="text-destructive">*</span></label>
                <Input placeholder="例：国家气象局官网" value={record.sourcePlatform} onChange={e => updateRecord(idx, "sourcePlatform", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">发布机构/来源主体 <span className="text-destructive">*</span></label>
                <Input placeholder="例：中国气象局" value={record.sourceOrg} onChange={e => updateRecord(idx, "sourceOrg", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">URL（网址）</label>
              <Input placeholder="https://..." value={record.url} onChange={e => updateRecord(idx, "url", e.target.value)} type="url" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">发布/更新时间 <span className="text-destructive">*</span></label>
                <Input placeholder="例：2024-03" value={record.publishedAt} onChange={e => updateRecord(idx, "publishedAt", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">获取时间</label>
                <Input value={record.capturedAt} onChange={e => updateRecord(idx, "capturedAt", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">素材类型（可多选）</label>
              <div className="flex flex-wrap gap-2">
                {MATERIAL_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleMaterialType(idx, type)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      (record.materialTypes || []).includes(type)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">定位信息（网页标题、截图编号等）<span className="text-destructive">*</span></label>
              <Input placeholder="例：第3页统计表格，截图已保存为 noise_data_01.jpg" value={record.locator} onChange={e => updateRecord(idx, "locator", e.target.value)} />
              <p className="text-xs text-muted-foreground">素材是否能找到，这条最关键</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">摘要/引用笔记</label>
              <Textarea placeholder="这个资料说了什么？与我们研究的关系是什么？" value={record.quoteOrNote} onChange={e => updateRecord(idx, "quoteOrNote", e.target.value)} rows={3} />
            </div>

            {record.citationFull && (
              <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">自动生成的引用条目：</p>
                <p className="text-xs italic">{record.citationFull}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Badge variant={record.status === "checked" ? "success" : "secondary"}>
                {record.status === "checked" ? "✓ 已质检" : "草稿"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleSave} disabled={saving || !portfolio} className="gap-1.5">
          <Save className="h-4 w-4" />
          {saving ? "保存中..." : saved ? "已保存！" : "保存"}
        </Button>
        <Button onClick={handleNext} disabled={!hasValidRecord || !portfolio}>
          保存并进入质检
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
