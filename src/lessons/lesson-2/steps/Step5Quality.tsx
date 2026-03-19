/**
 * 文件说明：课时2 · 步骤5 · 质检与课后采集安排
 * 职责：对学生已录入的公开资源记录做3项硬检查；展示课后现场采集任务卡
 *       过关条件：所有记录质检通过
 * 更新触发：质检规则变化时；课后任务展示内容变化时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, CheckCircle2, XCircle, MapPin } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/app/providers/AppProvider"
import type { QualityCheckResult } from "@/domains/evidence/types"

export default function Step5Quality() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [_checked, setChecked] = useState(portfolio?.lesson2.qualityChecks.length ? true : false)

  if (!portfolio) return null

  const myName = portfolio.student.studentName
  const myRecords = portfolio.lesson2.publicRecords.filter(r => r.owner === myName)
  const existingChecks = portfolio.lesson2.qualityChecks
  const fieldTasks = portfolio.lesson1.evidenceRows.filter(r => r.owner === myName && r.type === "first-hand")

  const handleRunCheck = async () => {
    setChecking(true)
    try {
      const results: QualityCheckResult[] = myRecords.map((r, idx) => {
        const hasSourceAndTime = !!(r.sourcePlatform?.trim() && r.publishedAt?.trim())
        const provesSomething = !!(r.quoteOrNote?.trim() && r.quoteOrNote.length > 10)
        const isLocatable = !!(r.locator?.trim())
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
        pointer: allPassed ? { ...portfolio.pointer, lessonId: 2, stepId: 6 } : portfolio.pointer,
      })
      setChecked(true)
    } finally {
      setChecking(false)
    }
  }

  const allPassed = existingChecks.length > 0 && existingChecks.every(c => c.passed)

  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第5关：质量检查</h3>
        <p className="text-muted-foreground text-sm">每条证据要能经得起"你怎么知道？"的追问</p>
      </div>

      {/* 质检区 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">3 项质检标准</CardTitle>
          <CardDescription>每条记录都要通过这3项，才能算"有证据身份证"</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "有来源和时间", desc: "填了来源平台和发布时间" },
            { label: "能证明什么", desc: "摘要说明了与研究问题的关系" },
            { label: "素材能找到", desc: "定位信息可以让人找到原材料" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</div>
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 质检结果 */}
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
                <div className="flex items-center gap-2">
                  <Badge variant={check.passed ? "success" : "destructive"}>
                    {check.passed ? "✓ 通过" : "✗ 未通过"}
                  </Badge>
                  <span className="text-sm">记录 #{idx + 1}：{myRecords[idx]?.item}</span>
                </div>
                {!check.passed && (
                  <div className="space-y-1 text-xs text-red-700">
                    {!check.hasSourceAndTime && <p>· 缺少来源 / 时间信息</p>}
                    {!check.provesSomething && <p>· 摘要太短，无法判断证明了什么</p>}
                    {!check.isLocatable && <p>· 定位信息为空，素材找不到</p>}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Button className="w-full" onClick={handleRunCheck} disabled={checking || myRecords.length === 0}>
          {checking ? "检查中..." : "开始质检"}
        </Button>
      )}

      {/* 课后现场采集任务 */}
      {fieldTasks.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-orange-800">
              <MapPin className="h-4 w-4" /> 课后现场采集任务
            </CardTitle>
            <CardDescription className="text-orange-700">这些需要你课后去实地完成</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {fieldTasks.map((task, i) => (
              <div key={i} className="bg-white rounded-lg p-3 space-y-1 border border-orange-100">
                <p className="font-medium text-sm">{task.item}</p>
                <p className="text-xs text-muted-foreground">地点/时间：{task.whereWhen || "待确认"}</p>
                <p className="text-xs text-muted-foreground">方法工具：{task.method || "待确认"}</p>
              </div>
            ))}
            <p className="text-xs text-orange-700">完成后将素材上传到 Moodle，下节课继续入库</p>
          </CardContent>
        </Card>
      )}

      {!allPassed && existingChecks.length > 0 && (
        <Button variant="outline" className="w-full" onClick={handleRunCheck} disabled={checking}>
          修改后重新质检
        </Button>
      )}

      <div className="flex justify-end">
        <Button onClick={() => navigate("/lesson/2/step/6")} disabled={!allPassed}>
          质检通过，进入最后一关
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
