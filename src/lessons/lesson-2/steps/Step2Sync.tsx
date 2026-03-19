/**
 * 文件说明：课时2 · 步骤2 · 同步小组任务
 * 职责：组长直接跳过（自动通过）；组员导入组长文件后选择自己的名字绑定身份
 *       系统从共享层提取当前学生名下的分配任务
 * 更新触发：组员同步流程变化时；导入逻辑调整时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Crown, UserCheck } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/app/providers/AppProvider"
import { deserializeContinuePackage } from "@/infra/persistence/serializers/continue-package"
import type { Lesson2Assignment } from "@/domains/evidence/types"

export default function Step2Sync() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [memberList, setMemberList] = useState<string[]>([])
  const [importedData, setImportedData] = useState<{ evidenceRows: typeof portfolio extends null ? never : NonNullable<typeof portfolio>["lesson1"]["evidenceRows"]; groupPlanVersion: number } | null>(null)
  const [selectedName, setSelectedName] = useState("")

  if (!portfolio) return null

  const isLeader = portfolio.student.role === "leader"

  /** 组长：直接通过，生成自己名下的 assignments */
  const handleLeaderProceed = async () => {
    const myAssignments: Lesson2Assignment[] = portfolio.lesson1.evidenceRows
      .filter(row => row.owner === portfolio.student.studentName)
      .map((row, idx) => ({
        planIndex: idx,
        item: row.item,
        owner: row.owner,
        expectedSourceType: row.type === "first-hand" ? "field" : "public",
        fromLeaderVersion: portfolio.groupPlanVersion,
      }))

    await savePortfolio({
      ...portfolio,
      lesson2: {
        ...portfolio.lesson2,
        leaderSyncDone: true,
        assignments: myAssignments,
      },
      pointer: { ...portfolio.pointer, lessonId: 2, stepId: 3 },
    })
    navigate("/lesson/2/step/3")
  }

  /** 组员：先导入文件，再选名字 */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    setMemberList([])

    try {
      const imported = await deserializeContinuePackage(file)
      const owners = [...new Set(imported.lesson1.evidenceRows.map(r => r.owner).filter(Boolean))]
      setMemberList(owners)
      setImportedData({ evidenceRows: imported.lesson1.evidenceRows, groupPlanVersion: imported.groupPlanVersion })
      setImportResult("✓ 文件读取成功，请选择你的名字")
    } catch (err) {
      setImportResult(`✗ ${err instanceof Error ? err.message : "导入失败"}`)
    } finally {
      setImporting(false)
      if (e.target) e.target.value = ""
    }
  }

  /** 选中名字后，生成当前学生名下的 assignments */
  const handleSelectName = async (name: string) => {
    if (!importedData) return
    setSelectedName(name)

    const myAssignments: Lesson2Assignment[] = importedData.evidenceRows
      .filter(row => row.owner === name)
      .map((row, idx) => ({
        planIndex: idx,
        item: row.item,
        owner: name,
        expectedSourceType: row.type === "first-hand" ? "field" : "public",
        fromLeaderVersion: importedData.groupPlanVersion,
      }))

    await savePortfolio({
      ...portfolio,
      lesson1: {
        ...portfolio.lesson1,
        groupDiscussion: portfolio.lesson1.groupDiscussion,
        evidenceRows: importedData.evidenceRows,
      },
      lesson2: {
        ...portfolio.lesson2,
        leaderSyncDone: true,
        assignments: myAssignments,
      },
      groupPlanVersion: importedData.groupPlanVersion,
      pointer: { ...portfolio.pointer, lessonId: 2, stepId: 3 },
    })
    navigate("/lesson/2/step/3")
  }

  if (isLeader) {
    return (
      <div className="space-y-6 max-w-xl">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">第2关：同步小组任务</h3>
        </div>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" /> 你是组长
            </CardTitle>
            <CardDescription>无需导入文件，直接加载你名下的任务即可</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm mb-4">
              <p>你名下的任务（来自课时1清单）：</p>
              {portfolio.lesson1.evidenceRows.filter(r => r.owner === portfolio.student.studentName).map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{r.type === "first-hand" ? "一手" : "二手"}</Badge>
                  <span className="text-sm">{r.item}</span>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={handleLeaderProceed}>
              确认，查看我的任务
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第2关：同步小组任务</h3>
        <p className="text-muted-foreground text-sm">导入组长发来的组长文件，然后找到你自己的名字</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-blue-500" /> 导入组长文件
          </CardTitle>
          <CardDescription>组长文件由组长从课时1步骤6导出，通过微信/QQ/U盘分发给你</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
            <span className="text-sm text-muted-foreground">{importing ? "读取中..." : "点击选择组长文件"}</span>
            <input type="file" accept=".json" className="hidden" onChange={handleFileChange} disabled={importing} />
          </label>

          {importResult && (
            <p className={`text-sm ${importResult.startsWith("✓") ? "text-green-700" : "text-red-700"}`}>
              {importResult}
            </p>
          )}

          {/* 选择名字列表 */}
          {memberList.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">选择你的名字：</p>
              <div className="flex flex-wrap gap-2">
                {memberList.map(name => (
                  <button
                    key={name}
                    onClick={() => handleSelectName(name)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedName === name
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                选中后系统会自动加载你名下的任务，并跳转到下一关
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
