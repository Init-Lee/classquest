/**
 * 文件说明：课时3 · 第1关 · 继承前序成果与任务锚定
 * 职责：自动承接课时1/2已有成果（探究问题、个人辅助来源、资料条目摘要），
 *       展示四块海报框架的当前状态，告知本课任务边界，
 *       学生确认后进入第2关。
 * 更新触发：继承数据字段调整时；四块海报框架描述变化时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, BookOpen, FileSearch, Lock, Pencil, CheckCircle2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/app/providers/AppProvider"

export default function Step1InheritAnchor() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  if (!portfolio) return null

  const { student, lesson1, lesson2 } = portfolio
  // 组员优先用 confirmedOwnerName 匹配课时2记录的 owner 字段
  const myName = lesson1.confirmedOwnerName || student.studentName

  // 从课时2中过滤当前学生的记录
  const myPublicRecords = lesson2.publicRecords.filter((r) => r.owner === myName)
  const myFieldTasks = lesson2.fieldTasks.filter((t) => t.owner === myName)
  const totalMyRecords = myPublicRecords.length + myFieldTasks.length

  // 当前学生在课时1填写的辅助材料来源（sourceRows）
  const myR1 = lesson1.r1ByMember.find((r) => r.author === myName)
  const mySourceRows = myR1?.sourceRows ?? []

  const alreadyDone = portfolio.lesson3.missionAcknowledged

  const handleConfirm = async () => {
    if (saving) return
    setSaving(true)
    try {
      await savePortfolio({
        ...portfolio,
        lesson3: { ...portfolio.lesson3, missionAcknowledged: true },
      })
      navigate("/lesson/3/step/2")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* 身份与继承摘要 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-purple-600" />
            <CardTitle className="text-base">你已经完成的内容</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 探究问题 */}
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-medium">小组探究问题（来自课时1）</p>
            {lesson1.groupConsensus?.finalResearchQuestion ? (
              <p className="text-sm bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-blue-900">
                {lesson1.groupConsensus.finalResearchQuestion}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">暂无小组探究问题</p>
            )}
          </div>

          {/* 我的辅助材料来源线索 */}
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-medium">
              我的辅助材料来源线索（来自课时1，共 {mySourceRows.length} 条）
            </p>
            {mySourceRows.length > 0 ? (
              <ul className="space-y-1">
                {mySourceRows.map((row, i) => (
                  <li key={i} className="text-sm bg-gray-50 rounded px-3 py-1.5 text-gray-700">
                    {row.meta}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">暂无辅助材料来源记录</p>
            )}
          </div>

          {/* 课时2资料条目摘要 */}
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-medium">
              我在课时2录入的资料条目（共 {totalMyRecords} 条）
            </p>
            <div className="flex gap-3 flex-wrap">
              {myPublicRecords.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  公开资源 {myPublicRecords.length} 条
                </Badge>
              )}
              {myFieldTasks.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  现场采集 {myFieldTasks.length} 条
                </Badge>
              )}
              {totalMyRecords === 0 && (
                <span className="text-sm text-muted-foreground italic">暂无课时2记录</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 本课任务说明 */}
      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-purple-600" />
            <CardTitle className="text-base text-purple-900">这节课你要完成什么</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {[
              "这节课你只处理你自己负责的材料",
              "你的目标是把材料整理成可以交给组长汇总的证据卡",
              "「可能原因」今天不填，下节课小组资料合并后再讨论",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-purple-800">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-purple-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 四块海报框架预览 */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          海报框架 · 本课状态一览
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* 探究问题 - 已带入 */}
          <PosterBlock
            label="探究问题"
            status="inherited"
            statusText="已自动带入"
            description="来自小组课时1讨论成果"
          />
          {/* 关注缘起 - 本课加工 */}
          <PosterBlock
            label="关注缘起"
            status="todo"
            statusText="本课加工"
            description="从辅助材料线索中提炼表述"
          />
          {/* 已有证据 - 本课筛选+加工 */}
          <PosterBlock
            label="已有证据"
            status="todo"
            statusText="本课筛选 + 加工"
            description="从课时2记录中筛选并整理"
          />
          {/* 可能原因 - 锁定 */}
          <PosterBlock
            label="可能原因"
            status="locked"
            statusText="锁定"
            description="下节课小组资料合并后再填写"
          />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end">
        {alreadyDone ? (
          <Button onClick={() => navigate("/lesson/3/step/2")}>
            继续第2关 <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleConfirm} disabled={saving}>
            {saving ? "保存中…" : "开始整理我的材料"}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

/** 海报框架预览卡片子组件 */
function PosterBlock({
  label,
  status,
  statusText,
  description,
}: {
  label: string
  status: "inherited" | "todo" | "locked"
  statusText: string
  description: string
}) {
  const colorMap = {
    inherited: "border-blue-300 bg-blue-50",
    todo: "border-yellow-300 bg-yellow-50",
    locked: "border-gray-200 bg-gray-100 opacity-60",
  }
  const badgeColorMap = {
    inherited: "bg-blue-100 text-blue-700",
    todo: "bg-yellow-100 text-yellow-700",
    locked: "bg-gray-200 text-gray-500",
  }

  return (
    <div className={`rounded-lg border p-3 space-y-1.5 ${colorMap[status]}`}>
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        {status === "locked" ? (
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <Lock className="h-3 w-3" /> {statusText}
          </span>
        ) : status === "inherited" ? (
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badgeColorMap[status]}`}>
            {statusText}
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${badgeColorMap[status]}`}>
            <Pencil className="h-3 w-3" /> {statusText}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 leading-snug">{description}</p>
    </div>
  )
}
