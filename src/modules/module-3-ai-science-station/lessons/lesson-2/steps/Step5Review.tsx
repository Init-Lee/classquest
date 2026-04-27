/**
 * 文件说明：课时2 · 步骤5（原步骤6） · 回顾与收尾
 * 职责：展示课时2完成情况摘要；引导学生使用右上角全局按钮保存/快照；
 *       完成后智能跳转——若课时3已开放则进入课时3第1关，否则返回首页
 *       大屏下左侧为课堂完成情况与保存提示，右侧为课后提醒（各约 50%）
 * 更新触发：回顾内容变化时；课时3开放后需取消 enabled 判断或调整目标路由
 */

import { useNavigate } from "react-router-dom"
import { CheckCircle2, ArrowLeft, Info } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/modules/module-3-ai-science-station/app/providers/AppProvider"
import { LESSON_REGISTRY } from "@/modules/module-3-ai-science-station/app/lesson-registry"
import { advancePointer } from "@/modules/module-3-ai-science-station/utils/pointer"

export default function Step5Review() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()

  if (!portfolio) return null

  // 组员在小组中的名字优先用 confirmedOwnerName，防止注册姓名与组长录入名不一致导致记录匹配失败
  const { lesson2, lesson1 } = portfolio
  const myName = lesson1.confirmedOwnerName || portfolio.student.studentName
  const myRecords = lesson2.publicRecords.filter(r => r.owner === myName)
  const myChecks = lesson2.qualityChecks
  const confirmedName = lesson1.confirmedOwnerName
  const myFieldTasks = lesson2.fieldTasks.filter(
    t => t.owner === myName || (confirmedName ? t.owner === confirmedName : false)
  )

  /** 完成课时2，判断是否有下一课时可跳转 */
  const handleComplete = async () => {
    await savePortfolio({
      ...portfolio,
      lesson2: { ...lesson2, completed: true },
      pointer: advancePointer(portfolio.pointer, 2, 5),
    })
    const lesson3 = LESSON_REGISTRY.find(l => l.id === 3)
    if (lesson3?.enabled) {
      navigate("/module/3/lesson/3/step/1")
    } else {
      navigate("/module/3")
    }
  }

  return (
    <div className="space-y-6 w-full max-w-7xl">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第5关：回顾与收尾</h3>
        <p className="text-muted-foreground text-sm">课堂部分完成了，做好收尾</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch">
        <div className="lg:flex-1 lg:min-w-0 space-y-6 min-h-0 lg:max-h-[min(75vh,800px)] lg:overflow-y-auto">
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

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-800">随时保存、随时快照</p>
                <p className="text-xs text-blue-700">
                  点击右上角 <span className="font-semibold">「保存进度」</span> 下载继续学习包，课后采集完成后导入继续填写；
                  点击 <span className="font-semibold">「阶段快照」</span> 生成 HTML 文件上传 Moodle。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:flex-1 lg:min-w-0 min-h-0 lg:max-h-[min(75vh,800px)] lg:overflow-y-auto">
          <Card className="bg-orange-50 border-orange-200 h-full">
            <CardContent className="pt-4 space-y-2">
              <p className="font-medium text-sm text-orange-800">课后还需要做：</p>
              <ul className="space-y-1 text-sm text-orange-700">
                {myFieldTasks.map((task, i) => (
                  <li key={i}>
                    · 现场采集：{task.materialName || task.item}
                    （{task.scene === "其他" ? task.sceneOther : task.scene}{task.date ? " · " + task.date : ""}）
                  </li>
                ))}
                <li>· 完成后把素材上传到 Moodle</li>
                <li>· 下节课带上继续学习包继续</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/module/3/lesson/2/step/4")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 返回质检
        </Button>
        <Button onClick={handleComplete}>
          完成课时2 ✓
        </Button>
      </div>
    </div>
  )
}
