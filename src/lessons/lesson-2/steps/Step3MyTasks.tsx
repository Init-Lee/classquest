/**
 * 文件说明：课时2 · 步骤3 · 查看我的任务
 * 职责：只显示当前学生名下的任务分配，让学生聚焦"我现在要做什么"
 *       可查看全组规划（只读），但系统只载入个人任务用于后续推进
 * 更新触发：任务展示字段变化时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/app/providers/AppProvider"

export default function Step3MyTasks() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [showFull, setShowFull] = useState(false)

  if (!portfolio) return null

  const { student, lesson2, lesson1 } = portfolio
  const myAssignments = lesson2.assignments.filter(a => a.owner === student.studentName)

  const handleNext = async () => {
    await savePortfolio({
      ...portfolio,
      pointer: { ...portfolio.pointer, lessonId: 2, stepId: 4 },
    })
    navigate("/lesson/2/step/4")
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第3关：我的任务</h3>
        <p className="text-muted-foreground text-sm">只看你自己的——今天在课堂完成公开资源部分</p>
      </div>

      {/* 我的任务列表 */}
      {myAssignments.length > 0 ? (
        <div className="space-y-3">
          {myAssignments.map((task, i) => (
            <Card key={i} className="border-primary/20">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">任务 {i + 1}</Badge>
                  <span className="font-medium text-sm">{task.item}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>预计来源：{task.expectedSourceType === "field" ? "现场采集（课后）" : task.expectedSourceType === "public" ? "公开资源（课堂）" : "两种都有"}</p>
                  <p className="text-xs bg-muted/40 rounded px-2 py-1">
                    {task.expectedSourceType === "field"
                      ? "→ 今天先查阅相关公开资料，现场采集课后完成"
                      : "→ 今天在课堂完成公开资源入库"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            未找到你名下的任务，请联系组长确认分工
          </CardContent>
        </Card>
      )}

      {/* 查看全组规划（只读，折叠） */}
      <div>
        <button
          onClick={() => setShowFull(v => !v)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showFull ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          查看全组规划（只读）
        </button>
        {showFull && (
          <Card className="mt-3 opacity-80">
            <CardContent className="pt-4 space-y-2">
              <p className="text-xs text-muted-foreground">以下为全组证据清单，仅供参考，不可编辑</p>
              {lesson1.evidenceRows.map((row, i) => (
                <div key={i} className="flex items-center gap-2 text-xs border-b pb-1">
                  <Badge variant="outline">{row.type === "first-hand" ? "一手" : "二手"}</Badge>
                  <span>{row.item}</span>
                  <span className="ml-auto text-muted-foreground">→ {row.owner}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
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
