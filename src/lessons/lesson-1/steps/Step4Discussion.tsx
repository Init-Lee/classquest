/**
 * 文件说明：课时1 · 步骤3 · 小组讨论留痕（原步骤4，已重编号）
 * 职责：组长录入讨论留痕并形成共识卡；组员查看讨论并可导入组长文件
 *       组长视图大屏下「讨论留痕表」与「小组共识卡」左右并列
 *       过关条件：必须存在 groupConsensus
 * 更新触发：讨论表字段或共识卡字段变化时；布局断点调整时
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
import { advancePointer } from "@/shared/utils/pointer"
import type { GroupDiscussionEntry, GroupConsensus } from "@/domains/group-plan/types"
import { deserializeContinuePackage } from "@/infra/persistence/serializers/continue-package"

/** 组员模式：导入组长文件 + 确认分工名字 */
function MemberView() {
  const { portfolio, importPortfolio, savePortfolio } = usePortfolio()
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [savingName, setSavingName] = useState(false)
  const navigate = useNavigate()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const imported = await deserializeContinuePackage(file)
      if (portfolio) {
        // 同步：共识卡、讨论留痕、证据清单、组员名单；清空旧的分工确认名（防止过期）
        await importPortfolio({
          ...portfolio,
          lesson1: {
            ...portfolio.lesson1,
            groupDiscussion: imported.lesson1.groupDiscussion,
            groupConsensus: imported.lesson1.groupConsensus,
            groupMembers: imported.lesson1.groupMembers ?? [],
            evidenceRows: imported.lesson1.evidenceRows,
            confirmedOwnerName: undefined,
          },
          groupPlanVersion: imported.groupPlanVersion,
        })
        setImportResult("✓ 导入成功！已同步小组共识、证据清单和组员名单")
      }
    } catch (err) {
      setImportResult(`✗ 导入失败：${err instanceof Error ? err.message : "请检查文件"}`)
    } finally {
      setImporting(false)
    }
  }

  /** 组员点击确认自己在组长分工中的名字 */
  const handleConfirmName = async (ownerName: string) => {
    if (!portfolio || savingName) return
    setSavingName(true)
    try {
      await savePortfolio({
        ...portfolio,
        lesson1: { ...portfolio.lesson1, confirmedOwnerName: ownerName },
      })
    } finally {
      setSavingName(false)
    }
  }

  const hasConsensus = !!portfolio?.lesson1.groupConsensus
  const confirmedOwnerName = portfolio?.lesson1.confirmedOwnerName
  const myName = portfolio?.student.studentName ?? ""

  // 从证据清单 owners 数组中提取所有出现过的姓名
  const ownerNames = hasConsensus
    ? [...new Set(portfolio!.lesson1.evidenceRows.flatMap(r => r.owners).filter(Boolean))]
    : []

  return (
    <div className="space-y-4">
      {/* 第一步：导入组长文件 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-blue-600" />
            你是组员 · 第一步：导入组长文件
          </CardTitle>
          <CardDescription>
            导入组长文件后，你可以看到小组共识和证据清单。
            后续课时1第4关只读查看，课时2第2关直接选名字即可——无需再次导入。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-blue-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
            <span className="text-sm text-blue-600">
              {importing ? "导入中..." : hasConsensus ? "重新导入组长文件" : "点击导入组长文件"}
            </span>
            <input type="file" accept=".json" className="hidden" onChange={handleFileChange} disabled={importing} />
          </label>
          {importResult && (
            <p className={`text-sm ${importResult.startsWith("✓") ? "text-green-700" : "text-red-700"}`}>
              {importResult}
            </p>
          )}
          {hasConsensus && !importResult && (
            <p className="text-sm text-green-700">✓ 已同步：{portfolio!.lesson1.groupConsensus!.finalResearchQuestion}</p>
          )}
        </CardContent>
      </Card>

      {/* 第二步：确认分工名字（导入成功后展示） */}
      {hasConsensus && ownerNames.length > 0 && (
        <Card className={confirmedOwnerName ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className={`h-4 w-4 ${confirmedOwnerName ? "text-green-600" : "text-amber-600"}`} />
              {confirmedOwnerName ? "✓ 已确认分工名字" : "第二步：确认你在分工中的名字"}
            </CardTitle>
            <CardDescription>
              你注册时填写的名字：<span className="font-medium">{myName}</span>
              {confirmedOwnerName
                ? <>，已与分工名「<span className="font-medium">{confirmedOwnerName}</span>」匹配</>
                : "。请在下方找到组长给你分配任务时用的名字并点击确认"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {ownerNames.map(name => (
                <button
                  key={name}
                  onClick={() => handleConfirmName(name)}
                  disabled={savingName}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all disabled:opacity-60 ${
                    confirmedOwnerName === name
                      ? "border-green-500 bg-green-500 text-white"
                      : name.trim() === myName.trim()
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary"
                  }`}
                >
                  {name}
                  {name.trim() === myName.trim() && confirmedOwnerName !== name && (
                    <span className="ml-1 text-xs opacity-70">（可能是你）</span>
                  )}
                </button>
              ))}
            </div>
            {savingName && <p className="text-xs text-muted-foreground">确认中...</p>}
            {confirmedOwnerName && (
              <p className="text-xs text-green-700">
                后续课时2会自动根据此名字匹配你的任务，无需重新选择。
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => navigate("/lesson/1/step/4")}
          disabled={!hasConsensus}
        >
          下一关：证据清单（只读查看）
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
        pointer: advancePointer(portfolio.pointer, 1, 3),
      })
      navigate("/lesson/1/step/4")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
        {/* 讨论留痕表 */}
        <Card className="flex-1 min-w-0 lg:max-h-[min(70vh,720px)] lg:overflow-y-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500 shrink-0" />
                讨论留痕表
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addMember} className="gap-1 shrink-0">
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
        <Card className="flex-1 min-w-0 lg:max-w-md xl:max-w-lg lg:max-h-[min(70vh,720px)] lg:overflow-y-auto">
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
      </div>

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
    <div className="space-y-4 w-full max-w-6xl">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第3关：小组讨论留痕</h3>
        <p className="text-muted-foreground text-sm">
          {isLeader ? "整理所有人的 R1，带领小组形成共识" : "等组长整理好后，导入组长文件查看共识"}
        </p>
      </div>
      {isLeader ? <LeaderView /> : <MemberView />}
    </div>
  )
}
