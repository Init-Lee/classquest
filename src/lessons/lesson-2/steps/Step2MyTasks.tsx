/**
 * 文件说明：课时2 · 步骤2 · 查看任务（原步骤3）
 * 职责：展示当前学生名下的任务（高亮），并始终展开全组规划供对比参考。
 *       不再折叠全组视图；大屏下「我的任务」与「全组规划」左右各约 50% 并列。
 * 过关条件：myAssignments.length > 0（有任务分配）
 * 更新触发：任务展示字段变化时；全组视图样式调整时
 */

import { useNavigate } from "react-router-dom"
import { ArrowRight, Users } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/app/providers/AppProvider"
import { advancePointer } from "@/shared/utils/pointer"

export default function Step2MyTasks() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()

  if (!portfolio) return null

  const { student, lesson2, lesson1 } = portfolio
  const myName = student.studentName
  const confirmedName = lesson1.confirmedOwnerName

  const myAssignments = lesson2.assignments.filter(
    a => a.owners.includes(myName) || (confirmedName ? a.owners.includes(confirmedName) : false),
  )

  /** 查找对应 evidenceRow 获取计划详情 */
  const getRow = (item: string) =>
    lesson1.evidenceRows.find(r => r.item === item)

  const handleNext = async () => {
    await savePortfolio({
      ...portfolio,
      pointer: advancePointer(portfolio.pointer, 2, 3),
    })
    navigate("/lesson/2/step/3")
  }

  return (
    <div className="space-y-6 w-full max-w-7xl">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第2关：我的任务</h3>
        <p className="text-muted-foreground text-sm">确认你今天要做什么，同时了解全组分工</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch">
        {/* ── 左：我的任务（高亮）约 50% ── */}
        <div className="lg:flex-1 lg:min-w-0 space-y-3 min-h-0 lg:max-h-[min(70vh,720px)] lg:overflow-y-auto">
          <p className="text-sm font-semibold border-b pb-2">我的任务</p>
          {myAssignments.length > 0 ? myAssignments.map((task, i) => {
            const row = getRow(task.item)
            return (
              <Card key={i} className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default">任务 {i + 1}</Badge>
                    <Badge variant={task.expectedSourceType === "field" ? "secondary" : "outline"} className="text-xs">
                      {task.expectedSourceType === "field" ? "现场采集（课后）" : "公开资源（课堂）"}
                    </Badge>
                    <span className="font-medium text-sm">{task.item}</span>
                  </div>
                  {row && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-1">
                      {row.whereWhen && <p><span className="font-medium text-foreground/70">地点/时间：</span>{row.whereWhen}</p>}
                      {row.method && <p><span className="font-medium text-foreground/70">方法工具：</span>{row.method}</p>}
                      {row.recordIdea && (
                        <p className="col-span-2"><span className="font-medium text-foreground/70">记录思路：</span>{row.recordIdea}</p>
                      )}
                    </div>
                  )}
                  <p className="text-xs bg-muted/50 rounded px-2 py-1">
                    {task.expectedSourceType === "field"
                      ? "→ 今天在课堂先查相关公开资料，现场采集课后完成"
                      : "→ 今天在课堂完成公开资源查阅与入库"}
                  </p>
                </CardContent>
              </Card>
            )
          }) : (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                未找到你名下的任务，请联系组长确认分工
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── 右：全组规划（只读）约 50% ── */}
        <div className="lg:flex-1 lg:min-w-0 space-y-3 min-h-0 lg:max-h-[min(70vh,720px)] lg:overflow-y-auto">
          <div className="flex items-center gap-2 border-b pb-2">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-sm font-semibold">全组规划（只读）</p>
            <span className="text-xs text-muted-foreground">共 {lesson1.evidenceRows.length} 条</span>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                证据清单
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm min-w-[280px]">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-6">#</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">证据项</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">类型</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">负责人</th>
                  </tr>
                </thead>
                <tbody>
                  {lesson1.evidenceRows.map((row, i) => {
                    const isMine =
                      row.owners.includes(myName) ||
                      (confirmedName ? row.owners.includes(confirmedName) : false)
                    return (
                      <tr
                        key={i}
                        className={`border-b last:border-0 transition-colors ${
                          isMine ? "bg-blue-50 font-medium" : "hover:bg-muted/20"
                        }`}
                      >
                        <td className="px-3 py-2 text-xs text-muted-foreground">{i + 1}</td>
                        <td className="px-3 py-2 text-sm">
                          {row.item}
                          {isMine && (
                            <span className="ml-2 text-xs text-primary font-normal">← 我的</span>
                          )}
                        </td>
                        <td className="px-3 py-2 hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {row.type === "first-hand" ? "现场采集" : "公开资源"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {row.owners.join("、")}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={myAssignments.length === 0}>
          了解了，开始入库
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
