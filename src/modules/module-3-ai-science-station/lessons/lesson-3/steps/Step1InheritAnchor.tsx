/**
 * 文件说明：课时3 · 第1关 · 继承前序成果与任务锚定
 * 职责：自动承接课时1/2已有成果（探究问题、个人辅助来源、资料条目摘要），
 *       左侧说明本课任务边界；右侧 sticky 海报草图预览（独立组件）；
 *       学生确认后进入第2关。
 * 更新触发：继承数据字段调整时；左右栏布局或预览组件接口变化时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, BookOpen, FileSearch } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/modules/module-3-ai-science-station/app/providers/AppProvider"
import { advancePointer } from "@/modules/module-3-ai-science-station/utils/pointer"
import { PosterSketchPreview } from "../components/PosterSketchPreview"

export default function Step1InheritAnchor() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  if (!portfolio) return null

  const { student, lesson1, lesson2 } = portfolio
  const myName = lesson1.confirmedOwnerName || student.studentName

  const myPublicRecords = lesson2.publicRecords.filter((r) => r.owner === myName)
  const myFieldTasks = lesson2.fieldTasks.filter((t) => t.owner === myName)
  const totalMyRecords = myPublicRecords.length + myFieldTasks.length

  const myR1 = lesson1.r1ByMember.find((r) => r.author === myName)
  const mySourceRows = myR1?.sourceRows ?? []

  const alreadyDone = portfolio.lesson3.missionAcknowledged
  const researchQuestion = lesson1.groupConsensus?.finalResearchQuestion ?? null

  const handleConfirm = async () => {
    if (saving) return
    setSaving(true)
    try {
      // #region agent log
      fetch('http://127.0.0.1:7867/ingest/f477b48f-d907-4d17-af01-17b6b09ded5c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2a660e'},body:JSON.stringify({sessionId:'2a660e',location:'Step1InheritAnchor.tsx:handleConfirm',message:'handleConfirm called (new user path)',data:{pointerBefore:portfolio.pointer},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      await savePortfolio({
        ...portfolio,
        pointer: advancePointer(portfolio.pointer, 3, 1),
        lesson3: { ...portfolio.lesson3, missionAcknowledged: true },
      })
      navigate("/module/3/lesson/3/step/2")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col lg:grid lg:grid-cols-2 lg:items-start gap-8 lg:gap-8">
        {/* 左侧主内容（桌面端约 50% 栏宽） */}
        <div className="order-1 min-w-0 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-purple-600" />
                <CardTitle className="text-base">你已经带来的材料</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">小组探究问题（来自课时1）</p>
                {researchQuestion ? (
                  <p className="text-sm bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-blue-900">
                    {researchQuestion}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">暂无小组探究问题</p>
                )}
              </div>

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

          <Card className="border-purple-200/80 bg-purple-50/40">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-purple-600" />
                <CardTitle className="text-base text-purple-950">这节课你要完成什么</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-purple-950/90">
                <li>这节课你只处理自己负责的材料</li>
                <li>你的目标是把材料整理成可交给组长汇总的证据卡</li>
                <li>「可能原因」今天不填，下节课小组资料合并后再讨论</li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-1">
            {alreadyDone ? (
              <Button onClick={() => {
                // #region agent log (post-fix verify)
                fetch('http://127.0.0.1:7867/ingest/f477b48f-d907-4d17-af01-17b6b09ded5c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2a660e'},body:JSON.stringify({sessionId:'2a660e',location:'Step1InheritAnchor.tsx:continue-btn',message:'[post-fix] navigate only, no pointer update',data:{pointer:portfolio.pointer},timestamp:Date.now(),runId:'post-fix'})}).catch(()=>{});
                // #endregion
                navigate("/module/3/lesson/3/step/2")
              }}>
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

        {/* 右侧海报草图预览（桌面端约 50% 栏宽，与左侧等分） */}
        <div className="order-2 w-full min-w-0 flex justify-center lg:justify-center lg:pt-1">
          <PosterSketchPreview
            researchQuestion={researchQuestion}
            evidenceEntryCount={totalMyRecords}
          />
        </div>
      </div>
    </div>
  )
}
