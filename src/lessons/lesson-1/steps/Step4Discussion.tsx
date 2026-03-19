/**
 * 文件说明：课时1 · 步骤4 · 小组讨论留痕
 * 职责：组长录入讨论留痕并形成共识卡；组员查看讨论并可导入组长文件
 *       过关条件：必须存在 groupConsensus
 * 更新触发：讨论表字段或共识卡字段变化时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Plus, Trash2, Crown, UserCheck } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/app/providers/AppProvider"
import type { GroupDiscussionEntry, GroupConsensus } from "@/domains/group-plan/types"
import { deserializeContinuePackage } from "@/infra/persistence/serializers/continue-package"

/** 组员模式：导入组长文件 */
function MemberView() {
  const { portfolio, importPortfolio } = usePortfolio()
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const imported = await deserializeContinuePackage(file)
      // 只同步共享层数据，不覆盖个人数据
      if (portfolio) {
        await importPortfolio({
          ...portfolio,
          lesson1: {
            ...portfolio.lesson1,
            groupDiscussion: imported.lesson1.groupDiscussion,
            groupConsensus: imported.lesson1.groupConsensus,
            sourceRows: imported.lesson1.sourceRows,
            evidenceRows: imported.lesson1.evidenceRows,
          },
          groupPlanVersion: imported.groupPlanVersion,
        })
        setResult("✓ 导入成功！已同步小组共识和证据清单")
      }
    } catch (err) {
      setResult(`✗ 导入失败：${err instanceof Error ? err.message : "请检查文件"}`)
    } finally {
      setImporting(false)
    }
  }

  const hasConsensus = !!portfolio?.lesson1.groupConsensus

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-blue-600" />
            你是组员
          </CardTitle>
          <CardDescription>
            等待组长完成讨论并发出组长文件。导入后你可以看到小组共识和你的分工。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-blue-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
            <span className="text-sm text-blue-600">{importing ? "导入中..." : "点击导入组长文件"}</span>
            <input type="file" accept=".json" className="hidden" onChange={handleFileChange} disabled={importing} />
          </label>
          {result && (
            <p className={`text-sm ${result.startsWith("✓") ? "text-green-700" : "text-red-700"}`}>{result}</p>
          )}
        </CardContent>
      </Card>

      {hasConsensus && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 space-y-2">
            <p className="text-sm font-medium text-green-800">✓ 已同步小组共识</p>
            <p className="text-sm text-green-700">最终研究问题：{portfolio!.lesson1.groupConsensus!.finalResearchQuestion}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={() => navigate("/lesson/1/step/5")} disabled={!hasConsensus}>
          下一关：证据清单
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

/** 组长模式：录入讨论留痕 + 共识卡 */
function LeaderView() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const [discussions, setDiscussions] = useState<GroupDiscussionEntry[]>(
    portfolio?.lesson1.groupDiscussion.length
      ? portfolio.lesson1.groupDiscussion
      : [{ memberName: portfolio?.student.studentName || "", r1Question: "", r1EvidenceIdeas: ["", ""], adopted: "yes", note: "" }]
  )

  const [consensus, setConsensus] = useState<Partial<GroupConsensus>>(
    portfolio?.lesson1.groupConsensus || {
      themePack: "A",
      scope: "",
      finalResearchQuestion: "",
      firstHandEvidenceIdeas: [""],
      secondHandSourceIdeas: [""],
      roughRecordIdeas: [""],
      whyThisPlan: "",
    }
  )

  const addMember = () => setDiscussions(d => [...d, { memberName: "", r1Question: "", r1EvidenceIdeas: ["", ""], adopted: "yes", note: "" }])
  const removeMember = (idx: number) => setDiscussions(d => d.filter((_, i) => i !== idx))

  const handleSave = async () => {
    if (!portfolio) return
    const hasConsensus = consensus.finalResearchQuestion?.trim()
    if (!hasConsensus) return

    setSaving(true)
    try {
      await savePortfolio({
        ...portfolio,
        lesson1: {
          ...portfolio.lesson1,
          groupDiscussion: discussions,
          groupConsensus: {
            themePack: consensus.themePack as "A" | "B" | "C",
            scope: consensus.scope || "",
            finalResearchQuestion: consensus.finalResearchQuestion || "",
            firstHandEvidenceIdeas: consensus.firstHandEvidenceIdeas || [],
            secondHandSourceIdeas: consensus.secondHandSourceIdeas || [],
            roughRecordIdeas: consensus.roughRecordIdeas || [],
            whyThisPlan: consensus.whyThisPlan || "",
            confirmedAt: new Date().toISOString(),
          },
        },
        pointer: { ...portfolio.pointer, lessonId: 1, stepId: 4 },
      })
      navigate("/lesson/1/step/5")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 讨论留痕表 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              讨论留痕表
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addMember} className="gap-1">
              <Plus className="h-3.5 w-3.5" /> 添加成员
            </Button>
          </div>
          <CardDescription>记录每位成员的 R1 方向和讨论结果</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {discussions.map((entry, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3 relative">
              <div className="absolute top-3 right-3">
                {discussions.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMember(idx)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">成员姓名</label>
                  <Input
                    placeholder="姓名"
                    value={entry.memberName}
                    onChange={e => setDiscussions(d => d.map((m, i) => i === idx ? { ...m, memberName: e.target.value } : m))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">是否采纳</label>
                  <select
                    value={entry.adopted}
                    onChange={e => setDiscussions(d => d.map((m, i) => i === idx ? { ...m, adopted: e.target.value as GroupDiscussionEntry["adopted"] } : m))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="yes">完全采纳</option>
                    <option value="partial">部分采纳</option>
                    <option value="no">未采纳</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">R1 问题候选</label>
                <Input
                  placeholder="该成员提出的研究问题"
                  value={entry.r1Question}
                  onChange={e => setDiscussions(d => d.map((m, i) => i === idx ? { ...m, r1Question: e.target.value } : m))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">备注</label>
                <Input
                  placeholder="讨论中的备注"
                  value={entry.note}
                  onChange={e => setDiscussions(d => d.map((m, i) => i === idx ? { ...m, note: e.target.value } : m))}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 小组共识卡 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">小组共识卡</CardTitle>
          <CardDescription>讨论后确定的最终方向，这是后续证据清单的基础</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">最终研究问题 <span className="text-destructive">*</span></label>
            <Textarea
              placeholder="小组最终确定的研究问题"
              value={consensus.finalResearchQuestion}
              onChange={e => setConsensus(c => ({ ...c, finalResearchQuestion: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">最终观察范围</label>
            <Input
              placeholder="在哪儿、多大范围"
              value={consensus.scope}
              onChange={e => setConsensus(c => ({ ...c, scope: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">为什么选这个方向？</label>
            <Textarea
              placeholder="简述理由"
              value={consensus.whyThisPlan}
              onChange={e => setConsensus(c => ({ ...c, whyThisPlan: e.target.value }))}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Badge variant="outline">
          {portfolio?.lesson1.groupConsensus ? "✓ 已保存共识" : "待填写共识"}
        </Badge>
        <Button
          onClick={handleSave}
          disabled={!consensus.finalResearchQuestion?.trim() || saving || !portfolio}
        >
          {saving ? "保存中..." : "保存共识，进入下一关"}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

export default function Step4Discussion() {
  const { portfolio } = usePortfolio()
  const isLeader = portfolio?.student.role === "leader"

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第4关：小组讨论留痕</h3>
        <p className="text-muted-foreground text-sm">
          {isLeader ? "整理所有人的 R1，带领小组形成共识" : "等组长整理好后，导入组长文件查看共识"}
        </p>
      </div>
      {isLeader ? <LeaderView /> : <MemberView />}
    </div>
  )
}
