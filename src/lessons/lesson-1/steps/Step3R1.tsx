/**
 * 文件说明：课时1 · 步骤3 · 个人 R1
 * 职责：学生填写个人研究方向（主题包、观察范围、研究问题、记录思路等）
 *       右侧提供 AI 助手抽屉入口（R2/R3 提示词模板）
 *       过关条件：保存至少 1 条 R1 记录
 * 更新触发：R1 字段变化时；AI 助手提示词模板更新时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Save, Sparkles } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/app/providers/AppProvider"
import type { R1Record } from "@/domains/group-plan/types"
import { AIHelperDrawer } from "../components/AIHelperDrawer"

const THEME_PACKS = [
  { id: "A", label: "主题包 A", desc: "空气与健康" },
  { id: "B", label: "主题包 B", desc: "水资源与生活" },
  { id: "C", label: "主题包 C", desc: "噪音与城市" },
] as const

export default function Step3R1() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [aiOpen, setAiOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const existingR1 = portfolio?.lesson1.r1ByMember.find(
    r => r.author === portfolio.student.studentName
  )

  const [form, setForm] = useState<Partial<R1Record>>({
    themePack: existingR1?.themePack || "A",
    scope: existingR1?.scope || "",
    researchQuestionDraft: existingR1?.researchQuestionDraft || "",
    minEvidenceIdea: existingR1?.minEvidenceIdea || "",
    roughRecordIdea: existingR1?.roughRecordIdea || "",
    driftWarnings: existingR1?.driftWarnings || [],
  })

  const isValid = form.scope?.trim() && form.researchQuestionDraft?.trim() && form.minEvidenceIdea?.trim()

  const handleSave = async () => {
    if (!portfolio || !isValid) return
    setSaving(true)
    try {
      const newRecord: R1Record = {
        author: portfolio.student.studentName,
        themePack: form.themePack as "A" | "B" | "C",
        scope: form.scope!.trim(),
        researchQuestionDraft: form.researchQuestionDraft!.trim(),
        minEvidenceIdea: form.minEvidenceIdea!.trim(),
        roughRecordIdea: form.roughRecordIdea?.trim() || "",
        driftWarnings: form.driftWarnings || [],
        savedAt: new Date().toISOString(),
      }

      // 更新 r1ByMember：替换或新增当前学生的记录
      const others = portfolio.lesson1.r1ByMember.filter(r => r.author !== portfolio.student.studentName)
      await savePortfolio({
        ...portfolio,
        lesson1: {
          ...portfolio.lesson1,
          r1ByMember: [...others, newRecord],
        },
        pointer: { ...portfolio.pointer, lessonId: 1, stepId: 3 },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleNext = () => {
    navigate("/lesson/1/step/4")
  }

  const hasR1 = (portfolio?.lesson1.r1ByMember.length ?? 0) > 0

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">第3关：个人 R1</h3>
          <p className="text-muted-foreground text-sm">先定题，再谈证据。这一步只做你自己的判断</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAiOpen(true)} className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
          AI 助手
        </Button>
      </div>

      {/* 主题包选择 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">选择主题包</CardTitle>
          <CardDescription>每个主题包对应不同的研究方向，选一个你感兴趣的</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {THEME_PACKS.map(pack => (
              <button
                key={pack.id}
                type="button"
                onClick={() => setForm(f => ({ ...f, themePack: pack.id as "A" | "B" | "C" }))}
                className={`flex-1 flex flex-col gap-1 p-3 rounded-lg border-2 text-sm text-left transition-all ${
                  form.themePack === pack.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <Badge variant={form.themePack === pack.id ? "default" : "outline"} className="w-fit">
                  {pack.label}
                </Badge>
                <span className="text-muted-foreground text-xs">{pack.desc}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 核心填写区 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">填写你的判断</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">观察范围 <span className="text-destructive">*</span></label>
            <Input
              placeholder="例：学校附近 500 米内的主要路口"
              value={form.scope}
              onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">说清楚"在哪"和"多大范围"</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">研究问题候选 <span className="text-destructive">*</span></label>
            <Textarea
              placeholder="例：学校附近的噪音在什么时段最严重？主要来源是什么？"
              value={form.researchQuestionDraft}
              onChange={e => setForm(f => ({ ...f, researchQuestionDraft: e.target.value }))}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">要能回答"有没有？多少？什么时候？"的问题</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">最少要采什么证据？ <span className="text-destructive">*</span></label>
            <Textarea
              placeholder="例：至少需要 3 个时段的噪音分贝读数 + 现场照片"
              value={form.minEvidenceIdea}
              onChange={e => setForm(f => ({ ...f, minEvidenceIdea: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">大概怎么记录？（不用很细）</label>
            <Textarea
              placeholder="例：先记时间和地点，再补现象描述；拍照要留编号"
              value={form.roughRecordIdea}
              onChange={e => setForm(f => ({ ...f, roughRecordIdea: e.target.value }))}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">粗粒度想法就好，不要求精确字段</p>
          </div>
        </CardContent>
      </Card>

      {/* 已保存提示 */}
      {existingR1 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          ✓ 你已经保存过 R1 记录，可以继续修改或直接进入下一关
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={handleSave} disabled={!isValid || saving || !portfolio} className="gap-1.5">
          <Save className="h-4 w-4" />
          {saving ? "保存中..." : saved ? "已保存！" : "保存 R1"}
        </Button>
        <Button onClick={handleNext} disabled={!hasR1}>
          下一关：小组讨论
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* AI 助手抽屉 */}
      {portfolio && (
        <AIHelperDrawer
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          kind="R2"
          portfolio={portfolio}
          onSave={savePortfolio}
          contextSummary={`主题包：${form.themePack}，观察范围：${form.scope}，研究问题候选：${form.researchQuestionDraft}`}
        />
      )}
    </div>
  )
}
