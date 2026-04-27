/**
 * 文件说明：课时1 · 步骤5 · 回顾与导出（原步骤6，已重编号）
 * 职责：展示本课完成情况和下一课预告；
 *       组长与组员共用布局：左侧为成果清单+完成按钮；右侧纵向为保存提示、下一课预告；组长额外在右侧最下展示导出卡（大屏约左右各 50%）
 *       提示学生通过右上角按钮保存进度和生成快照（不重复提供按钮）
 * 更新触发：回顾内容变化时；新增导出选项时；布局断点调整时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2, ArrowRight, Users, Download, Info } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/modules/module-3-ai-science-station/app/providers/AppProvider"
import { advancePointer } from "@/modules/module-3-ai-science-station/utils/pointer"
import { downloadLeaderFile } from "@/modules/module-3-ai-science-station/infra/persistence/serializers/continue-package"

export default function Step6Review() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [downloading, setDownloading] = useState(false)
  const [completing, setCompleting] = useState(false)

  /** 保存完成状态并直接跳转课时2，合并为一次点击 */
  const handleMarkComplete = async () => {
    if (!portfolio) return
    setCompleting(true)
    try {
      await savePortfolio({
        ...portfolio,
        lesson1: { ...portfolio.lesson1, completed: true },
        pointer: advancePointer(portfolio.pointer, 2, 1),
      })
      navigate("/module/3/lesson/2/step/1")
    } finally {
      setCompleting(false)
    }
  }

  const handleLeaderExport = () => {
    if (!portfolio) return
    setDownloading(true)
    try {
      downloadLeaderFile(portfolio)
    } finally {
      setDownloading(false)
    }
  }

  if (!portfolio) return null

  const { lesson1 } = portfolio
  const isLeader = portfolio.student.role === "leader"

  const validEvidence = lesson1.evidenceRows.filter(r => r.item.trim())
  const summary = [
    { label: "个人 R1", done: lesson1.r1ByMember.length > 0, detail: lesson1.r1ByMember.length > 0 ? `${lesson1.r1ByMember.length} 条` : "未完成" },
    { label: "小组讨论留痕", done: lesson1.groupDiscussion.length > 0, detail: `${lesson1.groupDiscussion.length} 人` },
    { label: "小组共识", done: !!lesson1.groupConsensus, detail: lesson1.groupConsensus ? lesson1.groupConsensus.finalResearchQuestion.slice(0, 20) + "…" : "未完成" },
    { label: "组员名单", done: lesson1.groupMembers.length > 0, detail: lesson1.groupMembers.length > 0 ? `${lesson1.groupMembers.length} 人` : "未登记" },
    { label: "证据清单", done: validEvidence.length >= 3, detail: `${validEvidence.length} 条计划` },
    { label: "安全承诺", done: lesson1.declarationAgreed, detail: lesson1.declarationAgreed ? "已勾选" : "未勾选" },
  ]

  const summaryCard = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">课时1的成果</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {summary.map(item => (
          <div key={item.label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className={`h-4 w-4 shrink-0 ${item.done ? "text-green-500" : "text-muted-foreground"}`} />
              <span className="text-sm">{item.label}</span>
            </div>
            <Badge variant={item.done ? "success" : "secondary"} className="shrink-0">{item.detail}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )

  /** 右上角保存/快照引导（蓝色） */
  const saveHintCard = (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="pt-5 space-y-2">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="space-y-1 text-sm text-blue-800">
            <p className="font-medium">现在是保存的最佳时机！</p>
            <p>点击右上角 <strong>「阶段快照」</strong> 生成 HTML 文件（上传到 Moodle 作为过程性材料）</p>
            <p>点击右上角 <strong>「保存进度」</strong> 下载继续学习包（换电脑后可导入继续）</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const leaderExportCard = (
    <Card className="border-yellow-300 bg-yellow-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-yellow-800">
          <Users className="h-4 w-4 text-yellow-600 shrink-0" />
          组长必做：导出组长文件
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-yellow-800">
          你的小组成员在课时2第2关需要导入这个文件，才能看到自己的分工任务。
          请导出后通过微信、QQ 或 U 盘发给每位组员。
        </p>
        <div className="bg-white/60 rounded-lg p-3 text-xs text-yellow-700 space-y-1">
          <p>📎 文件包含：小组共识、证据清单、各成员分工</p>
          <p>📁 文件名格式：<code>组长文件_{portfolio.student.groupName}_v{portfolio.groupPlanVersion}_日期时间.json</code></p>
        </div>
        <Button
          onClick={handleLeaderExport}
          disabled={downloading}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          {downloading ? "导出中..." : "导出组长文件"}
        </Button>
      </CardContent>
    </Card>
  )

  const nextLessonCard = (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="pt-6 space-y-2">
        <p className="font-semibold text-sm text-primary">下一课：证据采集与规范记录</p>
        <p className="text-sm text-muted-foreground">
          你们已经有了清单，下节课就要真正去采！公开资源在课堂完成，现场采集可以课后做。
        </p>
      </CardContent>
    </Card>
  )

  const completeRow = (
    <div className="flex items-center justify-end">
      <Button onClick={handleMarkComplete} disabled={completing || !portfolio}>
        {completing ? "保存中..." : "完成课时1，前往课时2"}
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )

  const leftColClass = "w-full lg:flex-1 lg:min-w-0 space-y-6 min-h-0 lg:max-h-[min(75vh,800px)] lg:overflow-y-auto"
  const rightColClass = "w-full lg:flex-1 lg:min-w-0 lg:sticky lg:top-24 lg:self-start"

  return (
    <div className="w-full max-w-7xl space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第5关：回顾与导出</h3>
        <p className="text-muted-foreground text-sm">
          {isLeader
            ? "检查课时1的成果，组长记得导出组长文件发给组员"
            : "检查课时1的成果，记得保存进度与生成快照"}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-stretch gap-6 w-full">
        <div className={leftColClass}>
          {summaryCard}
          {completeRow}
        </div>
        <aside className={`${rightColClass} space-y-6`}>
          {saveHintCard}
          {nextLessonCard}
          {isLeader ? leaderExportCard : null}
        </aside>
      </div>
    </div>
  )
}
