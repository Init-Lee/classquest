/**
 * 文件说明：课时2 · 步骤1（合并） · 进度确认与任务领取
 * 职责：将原"恢复进度"（Step1Resume）与"同步小组任务"（Step2Sync）合并为一页：
 *       A. 展示身份卡与课时1关键成果；
 *       B. 角色导向的任务确认（组长直接加载/组员自动或手动匹配）。
 *       一次点击完成 resumeDone + leaderSyncDone + assignments 写入，跳转至步骤2。
 * 更新触发：身份展示字段变化时；任务同步流程调整时；步骤合并逻辑修改时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight, Crown, UserCheck, AlertCircle, CheckCircle2,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/app/providers/AppProvider"
import { formatDateReadable } from "@/shared/utils/format"
import type { Lesson2Assignment } from "@/domains/evidence/types"

export default function Step1Combined() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  if (!portfolio) return null

  const { student, lesson1, lesson2, pointer } = portfolio
  const isLeader = student.role === "leader"
  const { evidenceRows, groupMembers } = lesson1

  /** 将 evidenceRow 转换为 Lesson2Assignment */
  const buildAssignments = (name: string): Lesson2Assignment[] =>
    evidenceRows
      .filter(row => row.owners.includes(name))
      .map((row, idx) => ({
        planIndex: idx,
        item: row.item,
        owners: row.owners,
        expectedSourceType: row.type === "first-hand" ? "field" : "public",
        fromLeaderVersion: portfolio.groupPlanVersion,
      }))

  /** 确认并写入，跳转到步骤2 */
  const handleConfirm = async (confirmedName?: string) => {
    if (saving) return
    setSaving(true)
    try {
      const name = confirmedName ?? student.studentName
      const myAssignments = buildAssignments(name)
      await savePortfolio({
        ...portfolio,
        lesson1: confirmedName
          ? { ...lesson1, confirmedOwnerName: confirmedName }
          : lesson1,
        lesson2: {
          ...lesson2,
          resumeDone: true,
          leaderSyncDone: true,
          assignments: myAssignments,
        },
        pointer: { ...pointer, lessonId: 2, stepId: 2 },
      })
      navigate("/lesson/2/step/2")
    } finally {
      setSaving(false)
    }
  }

  // ── A. 身份卡 + 课时1摘要（所有角色均显示） ────────────────────────────────
  const identitySection = (
    <div className="space-y-3">
      <Card className={lesson1.evidenceRows.length > 0 ? "border-green-200" : "border-orange-200"}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className={`h-4 w-4 ${lesson1.evidenceRows.length > 0 ? "text-green-500" : "text-orange-400"}`} />
            {lesson1.evidenceRows.length > 0 ? "课时1成果已就绪" : "未检测到课时1成果"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">姓名：</span>{student.studentName}</div>
            <div><span className="text-muted-foreground">班级：</span>{student.clazz}</div>
            <div><span className="text-muted-foreground">小组：</span>{student.groupName}</div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">角色：</span>
              <Badge variant={isLeader ? "default" : "secondary"}>
                {isLeader ? "组长" : "组员"}
              </Badge>
            </div>
          </div>
          <div className="border-t pt-2 text-sm space-y-0.5">
            {lesson1.groupConsensus?.finalResearchQuestion && (
              <p><span className="text-muted-foreground">研究问题：</span>{lesson1.groupConsensus.finalResearchQuestion}</p>
            )}
            <p><span className="text-muted-foreground">证据清单：</span>{evidenceRows.length} 条计划</p>
            <p className="text-xs text-muted-foreground">上次保存：{formatDateReadable(portfolio.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      {lesson1.evidenceRows.length === 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-4 text-sm text-orange-800">
            未检测到课时1的证据清单，请先完成课时1步骤5，或使用右上角「导入进度」导入继续学习包。
          </CardContent>
        </Card>
      )}
    </div>
  )

  // ── 如果已完成同步，显示摘要 + 继续按钮 ─────────────────────────────────────
  const alreadySynced = lesson2.leaderSyncDone && lesson2.assignments.length > 0
  if (alreadySynced) {
    const displayName = lesson1.confirmedOwnerName ?? student.studentName
    return (
      <div className="space-y-6 max-w-xl">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">第1关：确认进度与任务</h3>
        </div>
        {identitySection}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> 已完成任务确认
            </CardTitle>
            <CardDescription>你（{displayName}）名下共 {lesson2.assignments.length} 项任务</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {lesson2.assignments.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {a.expectedSourceType === "field" ? "现场采集" : "公开资源"}
                </Badge>
                <span>{a.item}</span>
              </div>
            ))}
            <Button className="w-full mt-3" onClick={() => navigate("/lesson/2/step/2")}>
              继续 <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── B. 任务确认区块（角色分支） ───────────────────────────────────────────────

  // 组长视图
  if (isLeader) {
    const myName = student.studentName
    const myRows = evidenceRows.filter(r => r.owners.includes(myName))
    return (
      <div className="space-y-6 max-w-xl">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">第1关：确认进度与任务</h3>
          <p className="text-muted-foreground text-sm">确认你的身份和课时1成果，然后加载本人任务</p>
        </div>
        {identitySection}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" /> 你是组长
            </CardTitle>
            <CardDescription>无需导入文件，直接确认你名下的任务</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {myRows.length > 0 ? myRows.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {r.type === "first-hand" ? "现场采集" : "公开资源"}
                </Badge>
                <span>{r.item}</span>
                <span className="text-xs text-muted-foreground ml-auto">{r.whereWhen || "—"}</span>
              </div>
            )) : (
              <p className="text-amber-700 text-sm">未找到你名下的任务，请检查课时1第4关的分工设置</p>
            )}
            <Button
              className="w-full mt-2"
              onClick={() => handleConfirm()}
              disabled={saving || lesson1.evidenceRows.length === 0}
            >
              {saving ? "加载中…" : "确认，进入我的任务"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── 组员视图 ─────────────────────────────────────────────────────────────────
  const myRegisteredName = student.studentName
  const allGroupNames = groupMembers.length > 0
    ? groupMembers
    : [...new Set(evidenceRows.flatMap(r => r.owners).filter(Boolean))]

  // 无分工数据
  if (allGroupNames.length === 0) {
    return (
      <div className="space-y-6 max-w-xl">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">第1关：确认进度与任务</h3>
        </div>
        {identitySection}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm font-medium">未找到小组分工数据</p>
            </div>
            <p className="text-sm text-orange-700">
              请先回到 <strong>课时1 · 第3关</strong>，导入组长发来的组长文件，同步小组数据后再继续。
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 自动匹配：注册名在名单中唯一出现时可免选
  const existingConfirmed = lesson1.confirmedOwnerName
  const matchCount = allGroupNames.filter(n => n === myRegisteredName).length
  const autoName = existingConfirmed || (matchCount === 1 ? myRegisteredName : null)

  // Case B：自动匹配
  if (autoName) {
    const previewRows = evidenceRows.filter(r => r.owners.includes(autoName))
    return (
      <div className="space-y-6 max-w-xl">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">第1关：确认进度与任务</h3>
          <p className="text-muted-foreground text-sm">确认你的身份和课时1成果，然后领取本人任务</p>
        </div>
        {identitySection}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-600" /> 找到你了
            </CardTitle>
            <CardDescription>
              已根据姓名 <strong>{myRegisteredName}</strong> 匹配到你的分工
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {previewRows.length > 0 ? previewRows.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {r.type === "first-hand" ? "现场采集" : "公开资源"}
                </Badge>
                <span>{r.item}</span>
                <span className="text-xs text-muted-foreground ml-auto">{r.whereWhen || "—"}</span>
              </div>
            )) : (
              <p className="text-sm text-amber-700">小组清单中暂无你名下的任务，请联系组长确认分工</p>
            )}
            <Button
              className="w-full mt-2"
              onClick={() => handleConfirm(autoName)}
              disabled={saving}
            >
              {saving ? "同步中…" : "确认，领取我的任务"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Case C：手动选择（同名或名字不在名单中）
  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第1关：确认进度与任务</h3>
        <p className="text-muted-foreground text-sm">
          {matchCount > 1
            ? `小组中有多位同名成员"${myRegisteredName}"，请点击对应的名字确认身份`
            : "未能自动匹配到你的名字，请从下方小组名单中选择"}
        </p>
      </div>
      {identitySection}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-blue-600" /> 请确认你是谁
          </CardTitle>
          <CardDescription>点击你的名字，系统自动加载你名下的任务</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {allGroupNames.map((name, idx) => (
              <button
                key={`${name}-${idx}`}
                onClick={() => handleConfirm(name)}
                disabled={saving}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all disabled:opacity-60 ${
                  name.trim() === myRegisteredName.trim()
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary"
                }`}
              >
                {name}
                {name.trim() === myRegisteredName.trim() && (
                  <span className="ml-1 text-xs opacity-70">（可能是你）</span>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {saving ? "正在加载任务…" : "选中后系统自动加载你名下的任务，并跳转到下一关"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
