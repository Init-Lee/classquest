/**
 * 文件说明：课时2 · 步骤6 · 回顾与导出
 * 职责：展示课时2完成情况，提供导出继续学习包和生成阶段快照的入口
 *       课后说明：现场采集素材上传提醒
 * 更新触发：回顾内容变化时
 */

import { useNavigate } from "react-router-dom"
import { Download, Camera, CheckCircle2, ArrowLeft } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/app/providers/AppProvider"
import { downloadContinuePackage } from "@/infra/persistence/serializers/continue-package"
import { downloadSnapshot } from "@/infra/persistence/serializers/snapshot-html"

export default function Step6Review() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()

  if (!portfolio) return null

  const myName = portfolio.student.studentName
  const { lesson2, lesson1 } = portfolio
  const myRecords = lesson2.publicRecords.filter(r => r.owner === myName)
  const myChecks = lesson2.qualityChecks
  const myFieldTasks = lesson1.evidenceRows.filter(r => r.owner === myName && r.type === "first-hand")

  const handleComplete = async () => {
    await savePortfolio({
      ...portfolio,
      lesson2: { ...lesson2, completed: true },
    })
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第6关：回顾与导出</h3>
        <p className="text-muted-foreground text-sm">课堂部分完成了，做好收尾</p>
      </div>

      {/* 完成情况 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">课时2 · 课堂部分完成情况</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "公开资源记录", done: myRecords.length > 0, detail: `${myRecords.length} 条` },
            { label: "质量检查", done: myChecks.length > 0 && myChecks.every(c => c.passed), detail: myChecks.every(c => c.passed) ? "全部通过" : "未通过" },
            { label: "课后采集任务", done: true, detail: `${myFieldTasks.length} 条（课后完成）` },
          ].map(item => (
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

      {/* 导出操作 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">保存并提交</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <Download className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">继续学习包</p>
              <p className="text-xs text-muted-foreground">课后采集完成后导入继续填写</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => downloadContinuePackage(portfolio)}>下载</Button>
          </div>
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <Camera className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">阶段快照（推荐上传 Moodle）</p>
              <p className="text-xs text-muted-foreground">包含所有已完成的公开资源记录</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => downloadSnapshot("lesson2-public", portfolio)}>生成</Button>
          </div>
        </CardContent>
      </Card>

      {/* 课后提醒 */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="pt-4 space-y-2">
          <p className="font-medium text-sm text-orange-800">课后还需要做：</p>
          <ul className="space-y-1 text-sm text-orange-700">
            {myFieldTasks.map((task, i) => <li key={i}>· 现场采集：{task.item}（{task.whereWhen}）</li>)}
            <li>· 完成后把素材上传到 Moodle</li>
            <li>· 下节课带上继续学习包继续</li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/lesson/2/step/5")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 返回质检
        </Button>
        <Button onClick={handleComplete}>
          完成课时2 ✓
        </Button>
      </div>
    </div>
  )
}
