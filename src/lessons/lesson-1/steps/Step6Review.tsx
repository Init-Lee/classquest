/**
 * 文件说明：课时1 · 步骤6 · 回顾与导出
 * 职责：展示本课完成情况、下一课预告；提供导出继续学习包和生成阶段快照的快捷入口
 * 更新触发：回顾内容变化时；新增导出选项时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Download, Camera, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/app/providers/AppProvider"
import { downloadContinuePackage } from "@/infra/persistence/serializers/continue-package"
import { downloadSnapshot } from "@/infra/persistence/serializers/snapshot-html"

export default function Step6Review() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [completed, setCompleted] = useState(portfolio?.lesson1.completed || false)

  const handleMarkComplete = async () => {
    if (!portfolio) return
    await savePortfolio({
      ...portfolio,
      lesson1: { ...portfolio.lesson1, completed: true },
      pointer: { lessonId: 2, stepId: 1, updatedAt: new Date().toISOString() },
    })
    setCompleted(true)
  }

  const handleDownloadPackage = () => {
    if (portfolio) downloadContinuePackage(portfolio)
  }

  const handleSnapshot = () => {
    if (portfolio) downloadSnapshot("lesson1-full", portfolio)
  }

  if (!portfolio) return null

  const { lesson1 } = portfolio

  const summary = [
    { label: "个人 R1", done: lesson1.r1ByMember.length > 0, detail: lesson1.r1ByMember.length > 0 ? `${lesson1.r1ByMember.length} 条` : "未完成" },
    { label: "小组讨论留痕", done: lesson1.groupDiscussion.length > 0, detail: `${lesson1.groupDiscussion.length} 人` },
    { label: "小组共识", done: !!lesson1.groupConsensus, detail: lesson1.groupConsensus?.finalResearchQuestion?.slice(0, 20) + "..." || "未完成" },
    { label: "证据清单", done: lesson1.evidenceRows.length >= 3, detail: `${lesson1.evidenceRows.length} 条计划` },
    { label: "安全承诺", done: lesson1.declarationAgreed, detail: lesson1.declarationAgreed ? "已勾选" : "未勾选" },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第6关：回顾与导出</h3>
        <p className="text-muted-foreground text-sm">检查一下今天的成果，然后保存好</p>
      </div>

      {/* 完成情况总览 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">今天的成果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 ${item.done ? "text-green-500" : "text-muted-foreground"}`} />
                <span className="text-sm">{item.label}</span>
              </div>
              <Badge variant={item.done ? "success" : "secondary"}>{item.detail}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 导出操作区 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">保存你的成果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <Download className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">继续学习包</p>
              <p className="text-xs text-muted-foreground">换电脑后导入即可继续，请妥善保存</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadPackage}>
              下载
            </Button>
          </div>

          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <Camera className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">阶段快照（推荐）</p>
              <p className="text-xs text-muted-foreground">生成 HTML 文件，上传到 Moodle 作为过程性材料</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSnapshot}>
              生成
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 下一课预告 */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6 space-y-2">
          <p className="font-semibold text-sm text-primary">下一课：证据采集与规范记录</p>
          <p className="text-sm text-muted-foreground">
            你们已经有了清单，下节课就要真正去采！公开资源在课堂完成，现场采集可以课后做。
            记住保存好你的继续学习包。
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        {!completed ? (
          <Button onClick={handleMarkComplete} className="ml-auto">
            完成课时1，前往课时2
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={() => navigate("/lesson/2/step/1")} className="ml-auto">
            进入课时2
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}
