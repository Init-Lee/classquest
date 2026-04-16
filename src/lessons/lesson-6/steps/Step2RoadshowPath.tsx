/**
 * 文件说明：课时6 · 第2关 · 讲解路径定稿与轮流试讲
 * 职责：只读身份区；四行固定路演路径表；追问区；文本复制与 JSON 导出；校验后完成课时6
 * 更新触发：校验规则、导出格式或 UI 结构变化时
 */

import { useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle, CheckCircle2, ClipboardCopy, Download, Loader2,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { usePortfolio } from "@/app/providers/AppProvider"
import { advancePointer } from "@/shared/utils/pointer"
import type { Lesson6State, RoadshowStep } from "@/domains/portfolio/types"
import { getPortfolioGroupDisplayLabel } from "@/shared/utils/group-display"
import { cn } from "@/shared/utils/cn"
import { LESSON6_ROADSHOW_META } from "../config"
import {
  buildLesson6PathText,
  downloadLesson6PathJson,
  getThemePackLabel,
} from "../export"
import { validateLesson6Step2 } from "../validation"

export default function Step2RoadshowPath() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()

  const initialSteps = portfolio?.lesson6.roadshowSteps
  const [steps, setSteps] = useState<RoadshowStep[]>(() => initialSteps ?? [])
  const [challengeQuestion, setChallengeQuestion] = useState(
    () => portfolio?.lesson6.challengeQuestion ?? ""
  )
  const [evidenceBack, setEvidenceBack] = useState(
    () => portfolio?.lesson6.evidenceBack ?? ""
  )
  const [closingSentence, setClosingSentence] = useState(
    () => portfolio?.lesson6.closingSentence ?? ""
  )
  const [focusedRow, setFocusedRow] = useState<number | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [copyTip, setCopyTip] = useState(false)

  const persistPartial = useCallback(async (patch: {
    roadshowSteps?: RoadshowStep[]
    challengeQuestion?: string
    evidenceBack?: string
    closingSentence?: string
    pathExported?: boolean
  }) => {
    if (!portfolio) return
    await savePortfolio({
      ...portfolio,
      lesson6: {
        ...portfolio.lesson6,
        ...patch,
      },
    })
  }, [portfolio, savePortfolio])

  const updateStep = useCallback((index: number, field: keyof RoadshowStep, value: string) => {
    setSteps(prev => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }, [])

  const lesson6Draft: Lesson6State | null = useMemo(() => {
    if (!portfolio) return null
    return {
      ...portfolio.lesson6,
      roadshowSteps: steps,
      challengeQuestion,
      evidenceBack,
      closingSentence,
    }
  }, [portfolio, steps, challengeQuestion, evidenceBack, closingSentence])

  const handleCopyText = async () => {
    if (!portfolio || !lesson6Draft) return
    const text = buildLesson6PathText({
      ...portfolio,
      lesson6: lesson6Draft,
    })
    try {
      await navigator.clipboard.writeText(text)
      setCopyTip(true)
      window.setTimeout(() => setCopyTip(false), 2000)
      await persistPartial({ pathExported: true, roadshowSteps: steps, challengeQuestion, evidenceBack, closingSentence })
    } catch {
      setErrors(["无法写入剪贴板，请检查浏览器权限"])
    }
  }

  const handleDownloadJson = async () => {
    if (!portfolio || !lesson6Draft) return
    downloadLesson6PathJson({ ...portfolio, lesson6: lesson6Draft })
    await persistPartial({ pathExported: true, roadshowSteps: steps, challengeQuestion, evidenceBack, closingSentence })
  }

  const handleComplete = async () => {
    if (!portfolio || !lesson6Draft) return
    const errs = validateLesson6Step2(portfolio, lesson6Draft)
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])
    setSaving(true)
    try {
      await savePortfolio({
        ...portfolio,
        pointer: advancePointer(portfolio.pointer, 6, 2),
        lesson6: {
          ...portfolio.lesson6,
          roadshowSteps: steps,
          challengeQuestion,
          evidenceBack,
          closingSentence,
          completed: true,
        },
      })
      navigate("/")
    } finally {
      setSaving(false)
    }
  }

  if (!portfolio) {
    return <p className="text-sm text-muted-foreground">正在加载档案…</p>
  }

  const themePack = getThemePackLabel(portfolio)
  const groupLabel = getPortfolioGroupDisplayLabel(portfolio)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">身份信息（只读）</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3 text-sm">
          <div><span className="text-muted-foreground">班级：</span>{portfolio.student.clazz || "—"}</div>
          <div><span className="text-muted-foreground">小组：</span>{groupLabel}</div>
          <div><span className="text-muted-foreground">主题包：</span>{themePack}</div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">海报讲解路径（固定四行，顺序不可改）</h3>
        <div className="space-y-3">
          {steps.map((row, index) => {
            const meta = LESSON6_ROADSHOW_META[index]
            const longMust = row.mustSay.length > 80
            const longExp = row.expand.length > 120
            return (
              <div
                key={row.step}
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  focusedRow === index ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card"
                )}
                onFocusCapture={() => setFocusedRow(index)}
                onBlurCapture={e => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusedRow(null)
                }}
              >
                <div className="flex flex-wrap items-baseline gap-2 mb-2 text-sm font-medium">
                  <span className="text-primary">第{row.step}步</span>
                  <span>{row.name}</span>
                  {meta && <span className="text-xs text-muted-foreground font-normal">（{meta.task}）</span>}
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground">对应海报位置（必填）</label>
                    <Input
                      value={row.posterArea}
                      onChange={e => updateStep(index, "posterArea", e.target.value)}
                      placeholder="如：左上角标题区 / 中部数据图"
                      className="mt-0.5"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground">必说句（必填）</label>
                    <Textarea
                      value={row.mustSay}
                      onChange={e => updateStep(index, "mustSay", e.target.value)}
                      placeholder="一句短句，全组统一口径"
                      rows={2}
                      className="mt-0.5 min-h-[2.5rem]"
                    />
                    {longMust && (
                      <p className="text-xs text-amber-700 mt-1">建议压缩：必说句宜控制在 1 句话、约 20–40 字内（不强制拦截）</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground">可展开点（选填）</label>
                    <Textarea
                      value={row.expand}
                      onChange={e => updateStep(index, "expand", e.target.value)}
                      placeholder="不同成员可详略不同"
                      rows={2}
                      className="mt-0.5 min-h-[2.5rem]"
                    />
                    {longExp && (
                      <p className="text-xs text-amber-700 mt-1">建议压缩为短点，不写成长段</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Card className="border-violet-200 bg-violet-50/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">最容易被追问（必填）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">最可能被问的问题</label>
            <Textarea
              value={challengeQuestion}
              onChange={e => setChallengeQuestion(e.target.value)}
              rows={2}
              className="mt-0.5"
              placeholder="例如：你们怎么证明这和校园有关？"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">准备回到哪条证据</label>
            <Textarea
              value={evidenceBack}
              onChange={e => setEvidenceBack(e.target.value)}
              rows={2}
              className="mt-0.5"
              placeholder="对应海报上的哪一块材料、哪一条记录"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">最后一句收束话</label>
            <Textarea
              value={closingSentence}
              onChange={e => setClosingSentence(e.target.value)}
              rows={2}
              className="mt-0.5"
              placeholder="一句收束，不拖泥带水"
            />
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground border-l-2 border-muted pl-3">
        提醒：这里写的是讲解路径，不是全文稿。本页不是全文讲稿；请用短句填写，确保所有成员都能按同一路径讲出来。
      </p>

      {errors.length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive flex gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <ul className="list-disc list-inside space-y-1">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <Button type="button" variant="outline" className="gap-1" onClick={handleCopyText}>
          <ClipboardCopy className="h-4 w-4" />
          复制路径单文本
        </Button>
        {copyTip && <span className="text-xs text-green-600">已复制到剪贴板</span>}
        <Button type="button" variant="outline" className="gap-1" onClick={handleDownloadJson}>
          <Download className="h-4 w-4" />
          下载 JSON
        </Button>
        <Button
          type="button"
          className="gap-1 ml-auto"
          disabled={saving}
          onClick={handleComplete}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          完成课时6
        </Button>
      </div>
    </div>
  )
}
