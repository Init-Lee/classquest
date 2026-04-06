/**
 * 文件说明：课时2 · 步骤4（原步骤5） · 质检与课后采集安排
 * 职责：对学生已录入的公开资源记录做3项硬检查；展示课后现场采集任务卡
 *       过关条件：所有记录质检通过
 *       大屏下左侧为质检流程，右侧为课后现场采集（各约 50%）
 * 更新触发：质检规则变化时；课后任务展示内容变化时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, ArrowLeft, CheckCircle2, XCircle, MapPin } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/app/providers/AppProvider"
import { advancePointer } from "@/shared/utils/pointer"
import type { QualityCheckResult } from "@/domains/evidence/types"

export default function Step4Quality() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [_checked, setChecked] = useState(portfolio?.lesson2.qualityChecks.length ? true : false)

  if (!portfolio) return null

  // 组员在小组中的名字优先用 confirmedOwnerName，防止注册姓名与组长录入名不一致导致记录匹配失败
  const myName = portfolio.lesson1.confirmedOwnerName || portfolio.student.studentName
  const confirmedName = portfolio.lesson1.confirmedOwnerName
  const myRecords = portfolio.lesson2.publicRecords.filter(r => r.owner === myName)
  const existingChecks = portfolio.lesson2.qualityChecks
  // 仅现场采集任务：无公开记录，跳过质检环节
  const isFieldOnly = myRecords.length === 0
  // Bug3 修复：课后现场采集提醒只在有 field 类型任务时显示，基于 lesson2.assignments 判断
  const hasFieldAssignments = portfolio.lesson2.assignments.some(
    a => a.expectedSourceType === "field" &&
      (a.owners.includes(myName) || (confirmedName ? a.owners.includes(confirmedName) : false))
  )
  // 从课时2现场任务中找到当前用户的采集计划（在 Step4 填写）
  const fieldTasks = portfolio.lesson2.fieldTasks.filter(
    t => t.owner === myName || (confirmedName ? t.owner === confirmedName : false)
  )

  const handleRunCheck = async () => {
    setChecking(true)
    try {
      const results: QualityCheckResult[] = myRecords.map((r, idx) => {
        const hasSourceAndTime = !!(r.sourcePlatform?.trim() && r.capturedAt?.trim())
        const provesSomething = !!(r.quoteOrNote?.trim() && r.quoteOrNote.length > 10)
        const isLocatable = !!(r.urls?.some(u => u.trim()))
        return {
          recordIndex: idx,
          hasSourceAndTime,
          provesSomething,
          isLocatable,
          passed: hasSourceAndTime && provesSomething && isLocatable,
          checkedAt: new Date().toISOString(),
        }
      })

      const allPassed = results.every(r => r.passed)

      // 更新质检结果，通过的记录标记为 checked
      const updatedRecords = portfolio.lesson2.publicRecords.map(r => {
        if (r.owner !== myName) return r
        const idx = myRecords.indexOf(r as typeof myRecords[0])
        const check = results[idx]
        return check?.passed ? { ...r, status: "checked" as const } : r
      })

      await savePortfolio({
        ...portfolio,
        lesson2: {
          ...portfolio.lesson2,
          publicRecords: updatedRecords,
          qualityChecks: results,
        },
        pointer: allPassed ? advancePointer(portfolio.pointer, 2, 4) : portfolio.pointer,
      })
      setChecked(true)
    } finally {
      setChecking(false)
    }
  }

  const allPassed = isFieldOnly || (existingChecks.length > 0 && existingChecks.every(c => c.passed))

  const fieldTasksCard = hasFieldAssignments && fieldTasks.length > 0 ? (
    <Card className="border-orange-200 bg-orange-50 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-orange-800">
          <MapPin className="h-4 w-4 shrink-0" /> 课后现场采集任务
        </CardTitle>
        <CardDescription className="text-orange-700">这些需要你课后去实地完成</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {fieldTasks.map((task, i) => (
          <div key={i} className="bg-white rounded-lg p-3 space-y-1 border border-orange-100">
            <p className="font-medium text-sm">{task.materialName || task.item}</p>
            <p className="text-xs text-muted-foreground">
              日期：{task.date || "待确认"} · 场景：
              {task.scene === "其他" ? task.sceneOther : task.scene || "待确认"}
              {task.location ? ` · ${task.location}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">方法：{task.methods?.join("、") || "待确认"}</p>
          </div>
        ))}
        <p className="text-xs text-orange-700">完成后将素材上传到 Moodle，下节课继续入库</p>
      </CardContent>
    </Card>
  ) : (
    <Card className="border-dashed h-full min-h-[200px] flex flex-col">
      <CardContent className="pt-6 flex-1 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
        {hasFieldAssignments
          ? "现场采集分工已登记，请先在第3关填写计划，此处将显示任务摘要"
          : "当前分工不包含现场采集，本列暂无内容"}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 w-full max-w-7xl">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第4关：质量检查</h3>
        <p className="text-muted-foreground text-sm">每条证据要能经得起"你怎么知道？"的追问</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch">
        {/* 左列：质检（约 50%） */}
        <div className="lg:flex-1 lg:min-w-0 space-y-6 min-h-0 lg:max-h-[min(75vh,800px)] lg:overflow-y-auto">
          {isFieldOnly ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-5 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-800">你的任务为现场采集，无需质检公开资源</p>
                  <p className="text-xs text-green-700">请确认右侧采集计划，课后按计划完成现场采集并提交素材</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">3 项质检标准</CardTitle>
                  <CardDescription>每条记录都要通过这3项，才能算"有证据身份证"</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "有来源和获取时间", desc: "填了来源平台和获取时间" },
                    { label: "能证明什么", desc: "摘要说明了与研究问题的关系" },
                    { label: "素材能找到", desc: "至少一条 URL 不为空" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {existingChecks.length > 0 ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      {allPassed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                      质检结果
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {existingChecks.map((check, idx) => (
                      <div key={idx} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={check.passed ? "success" : "destructive"}>
                            {check.passed ? "✓ 通过" : "✗ 未通过"}
                          </Badge>
                          <span className="text-sm">记录 #{idx + 1}：{myRecords[idx]?.item}</span>
                        </div>
                        {!check.passed && (
                          <div className="space-y-1 text-xs text-red-700">
                            {!check.hasSourceAndTime && <p>· 缺少来源平台或获取时间</p>}
                            {!check.provesSomething && <p>· 摘要太短，无法判断证明了什么</p>}
                            {!check.isLocatable && <p>· URL 为空，素材无法找到</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Button className="w-full" onClick={handleRunCheck} disabled={checking}>
                  {checking ? "检查中..." : "开始质检"}
                </Button>
              )}

              {!allPassed && existingChecks.length > 0 && (
                <Button variant="outline" className="w-full" onClick={handleRunCheck} disabled={checking}>
                  修改后重新质检
                </Button>
              )}
            </>
          )}
        </div>

        {/* 右列：课后现场（约 50%） */}
        <div className="lg:flex-1 lg:min-w-0 min-h-0 lg:max-h-[min(75vh,800px)] lg:overflow-y-auto">
          {fieldTasksCard}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/lesson/2/step/3")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 上一步：修改证据
        </Button>
        <Button onClick={() => navigate("/lesson/2/step/5")} disabled={!allPassed}>
          {isFieldOnly ? "确认计划，进入最后一关" : "质检通过，进入最后一关"}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
