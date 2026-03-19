/**
 * 文件说明：课时1 · 步骤5 · 证据收集清单（Wizard 分步填写）
 * 职责：引导学生分步填写辅助材料来源、证据执行表、分工确认和安全承诺
 *       过关条件：来源≥1、证据≥3、承诺已勾选
 * 更新触发：清单字段变化时；子步骤新增或删除时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, ArrowLeft, Plus, Trash2, Sparkles } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/app/providers/AppProvider"
import type { GroupSourceRow, GroupEvidencePlanRow } from "@/domains/group-plan/types"
import { AIHelperDrawer } from "../components/AIHelperDrawer"

const SUB_STEPS = ["辅助材料", "执行表", "分工确认", "安全承诺"]

export default function Step5Checklist() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [subStep, setSubStep] = useState(0)
  const [aiOpen, setAiOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [sources, setSources] = useState<GroupSourceRow[]>(
    portfolio?.lesson1.sourceRows.length ? portfolio.lesson1.sourceRows : [{ meta: "", fact: "", inspire: "" }]
  )
  const [evidences, setEvidences] = useState<GroupEvidencePlanRow[]>(
    portfolio?.lesson1.evidenceRows.length ? portfolio.lesson1.evidenceRows : [
      { item: "", type: "first-hand", whereWhen: "", method: "", recordIdea: "", owner: portfolio?.student.studentName || "" },
    ]
  )
  const [declaration, setDeclaration] = useState(portfolio?.lesson1.declarationAgreed || false)

  const addSource = () => setSources(s => [...s, { meta: "", fact: "", inspire: "" }])
  const removeSource = (idx: number) => setSources(s => s.filter((_, i) => i !== idx))
  const addEvidence = () => setEvidences(e => [...e, { item: "", type: "first-hand", whereWhen: "", method: "", recordIdea: "", owner: portfolio?.student.studentName || "" }])
  const removeEvidence = (idx: number) => setEvidences(e => e.filter((_, i) => i !== idx))

  const canFinish = sources.some(s => s.meta.trim()) && evidences.filter(e => e.item.trim()).length >= 3 && declaration

  const handleSaveAndNext = async () => {
    if (!portfolio || !canFinish) return
    setSaving(true)
    try {
      await savePortfolio({
        ...portfolio,
        lesson1: {
          ...portfolio.lesson1,
          sourceRows: sources,
          evidenceRows: evidences,
          declarationAgreed: declaration,
        },
        pointer: { ...portfolio.pointer, lessonId: 1, stepId: 6 },
      })
      navigate("/lesson/1/step/6")
    } finally {
      setSaving(false)
    }
  }

  const handleAutoSave = async () => {
    if (!portfolio) return
    await savePortfolio({
      ...portfolio,
      lesson1: { ...portfolio.lesson1, sourceRows: sources, evidenceRows: evidences, declarationAgreed: declaration },
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">第5关：证据收集清单</h3>
          <p className="text-muted-foreground text-sm">不是一屏轰炸，一步一步来</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAiOpen(true)} className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-yellow-500" /> AI 助手
        </Button>
      </div>

      {/* 子步骤进度条 */}
      <div className="flex items-center gap-2">
        {SUB_STEPS.map((label, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <button
              onClick={() => setSubStep(idx)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                idx === subStep ? "bg-primary text-primary-foreground" : idx < subStep ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
              }`}
            >
              {idx < subStep ? "✓ " : ""}{label}
            </button>
            {idx < SUB_STEPS.length - 1 && <div className="h-px w-4 bg-border" />}
          </div>
        ))}
      </div>

      {/* 子步骤1：辅助材料来源 */}
      {subStep === 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">辅助材料来源</CardTitle>
              <Button variant="outline" size="sm" onClick={addSource} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> 添加来源
              </Button>
            </div>
            <CardDescription>至少填 1 条——找到支持你研究方向的参考资料</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sources.map((source, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3 relative">
                {sources.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-3 right-3" onClick={() => removeSource(idx)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">来源（标题/出处/时间/链接）</label>
                  <Input placeholder="例：国家气象局2024年统计数据" value={source.meta} onChange={e => setSources(s => s.map((r, i) => i === idx ? { ...r, meta: e.target.value } : r))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">可核查的事实</label>
                  <Input placeholder="例：2023年城市噪音超标比例38%" value={source.fact} onChange={e => setSources(s => s.map((r, i) => i === idx ? { ...r, fact: e.target.value } : r))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">对本组计划的启发</label>
                  <Input placeholder="例：启发我们选学校门口作为重点观测点" value={source.inspire} onChange={e => setSources(s => s.map((r, i) => i === idx ? { ...r, inspire: e.target.value } : r))} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 子步骤2：执行表 */}
      {subStep === 1 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">证据执行表</CardTitle>
              <Button variant="outline" size="sm" onClick={addEvidence} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> 添加一行
              </Button>
            </div>
            <CardDescription>至少3条——把"要采什么"写得足够具体</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {evidences.map((ev, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3 relative">
                {evidences.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-3 right-3" onClick={() => removeEvidence(idx)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">证据项 *</label>
                    <Input placeholder="例：学校门口分贝读数" value={ev.item} onChange={e => setEvidences(d => d.map((r, i) => i === idx ? { ...r, item: e.target.value } : r))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">类型</label>
                    <select
                      value={ev.type}
                      onChange={e => setEvidences(d => d.map((r, i) => i === idx ? { ...r, type: e.target.value as "first-hand" | "second-hand" } : r))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="first-hand">一手</option>
                      <option value="second-hand">二手</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">地点与时间</label>
                    <Input placeholder="例：学校门口，周一7:30" value={ev.whereWhen} onChange={e => setEvidences(d => d.map((r, i) => i === idx ? { ...r, whereWhen: e.target.value } : r))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">方法与工具</label>
                    <Input placeholder="例：分贝计App + 手机" value={ev.method} onChange={e => setEvidences(d => d.map((r, i) => i === idx ? { ...r, method: e.target.value } : r))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">记录思路（粗粒度即可）</label>
                    <Input placeholder="例：先记时间地点，再补读数" value={ev.recordIdea} onChange={e => setEvidences(d => d.map((r, i) => i === idx ? { ...r, recordIdea: e.target.value } : r))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">负责人</label>
                    <Input placeholder="姓名" value={ev.owner} onChange={e => setEvidences(d => d.map((r, i) => i === idx ? { ...r, owner: e.target.value } : r))} />
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              已填 {evidences.filter(e => e.item.trim()).length} 条，还需 {Math.max(0, 3 - evidences.filter(e => e.item.trim()).length)} 条才能过关
            </p>
          </CardContent>
        </Card>
      )}

      {/* 子步骤3：分工确认 */}
      {subStep === 2 && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm font-medium">当前分工情况</p>
            {evidences.filter(e => e.item.trim()).length === 0 ? (
              <p className="text-sm text-muted-foreground">请先在"执行表"中填写证据计划</p>
            ) : (
              <div className="space-y-2">
                {[...new Set(evidences.map(e => e.owner).filter(Boolean))].map(owner => (
                  <div key={owner} className="flex items-center gap-2">
                    <Badge variant="outline">{owner}</Badge>
                    <span className="text-sm text-muted-foreground">
                      负责：{evidences.filter(e => e.owner === owner).map(e => e.item).join("、")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 子步骤4：安全承诺 */}
      {subStep === 3 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">安全与承诺</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={declaration}
                onChange={e => setDeclaration(e.target.checked)}
                className="h-4 w-4 mt-0.5 accent-primary"
              />
              <span className="text-sm">
                我承诺：所有证据都是真实采集的，不捏造、不侵犯他人隐私，采集现场证据时注意安全，
                公开资料会标明来源。
              </span>
            </label>
          </CardContent>
        </Card>
      )}

      {/* 底部导航 */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => subStep > 0 ? setSubStep(s => s - 1) : navigate("/lesson/1/step/4")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 上一步
        </Button>
        <div className="flex gap-2">
          {subStep < SUB_STEPS.length - 1 ? (
            <Button onClick={() => { handleAutoSave(); setSubStep(s => s + 1) }}>
              下一步 <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSaveAndNext} disabled={!canFinish || saving || !portfolio}>
              {saving ? "保存中..." : "完成清单，进入下一关"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {portfolio && (
        <AIHelperDrawer
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          kind="R3"
          portfolio={portfolio}
          onSave={savePortfolio}
          contextSummary={`证据清单：${evidences.filter(e => e.item).map(e => e.item).join("、")}`}
        />
      )}
    </div>
  )
}
