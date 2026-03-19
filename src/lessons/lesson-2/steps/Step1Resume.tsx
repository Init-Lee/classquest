/**
 * 文件说明：课时2 · 步骤1 · 恢复进度
 * 职责：帮学生从本机或继续学习包恢复课时1的成果，确认身份和上次进度
 *       过关条件：已加载到有证据清单的档案
 * 更新触发：恢复流程或显示内容变化时
 */

import { useNavigate } from "react-router-dom"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/app/providers/AppProvider"
import { formatDateReadable } from "@/shared/utils/format"

export default function Step1Resume() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()

  if (!portfolio) return null

  const { student, lesson1, pointer } = portfolio
  const hasChecklist = lesson1.evidenceRows.length > 0

  const handleConfirm = async () => {
    await savePortfolio({
      ...portfolio,
      lesson2: { ...portfolio.lesson2, resumeDone: true },
      pointer: { ...pointer, lessonId: 2, stepId: 2 },
    })
    navigate("/lesson/2/step/2")
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第1关：确认你的进度</h3>
        <p className="text-muted-foreground text-sm">先确认你是谁，上次做到哪了</p>
      </div>

      {/* 身份确认卡 */}
      <Card className={hasChecklist ? "border-green-200" : "border-orange-200"}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className={`h-4 w-4 ${hasChecklist ? "text-green-500" : "text-orange-400"}`} />
            {hasChecklist ? "进度已就绪" : "未检测到课时1成果"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">姓名：</span>{student.studentName}</div>
            <div><span className="text-muted-foreground">班级：</span>{student.clazz}</div>
            <div><span className="text-muted-foreground">小组：</span>{student.groupName}</div>
            <div><span className="text-muted-foreground">角色：</span>
              <Badge variant={student.role === "leader" ? "default" : "secondary"} className="ml-1">
                {student.role === "leader" ? "组长" : "组员"}
              </Badge>
            </div>
          </div>
          <div className="border-t pt-3 text-sm">
            <p><span className="text-muted-foreground">上次进度：</span>课时{pointer.lessonId} · 第{pointer.stepId}关</p>
            <p className="text-xs text-muted-foreground mt-1">上次保存：{formatDateReadable(portfolio.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* 课时1成果摘要 */}
      {hasChecklist && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">课时1带来的成果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {lesson1.groupConsensus && (
              <div><span className="text-muted-foreground">研究问题：</span>{lesson1.groupConsensus.finalResearchQuestion}</div>
            )}
            <div><span className="text-muted-foreground">证据清单：</span>{lesson1.evidenceRows.length} 条计划</div>
            <div className="space-y-1">
              {lesson1.evidenceRows.slice(0, 3).map((ev, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>·</span>
                  <span>{ev.item}</span>
                  <Badge variant="outline" className="text-xs">{ev.type === "first-hand" ? "一手" : "二手"}</Badge>
                  <span className="text-primary">→ {ev.owner}</span>
                </div>
              ))}
              {lesson1.evidenceRows.length > 3 && (
                <p className="text-xs text-muted-foreground">...共 {lesson1.evidenceRows.length} 条</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!hasChecklist && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6 text-sm text-orange-800">
            未检测到课时1的证据清单。请先完成课时1步骤5，或使用右上角「导入进度」导入你之前的继续学习包。
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleConfirm} disabled={!hasChecklist}>
          确认，开始课时2
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
