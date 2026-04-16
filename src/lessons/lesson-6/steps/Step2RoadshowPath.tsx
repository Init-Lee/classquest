/**
 * 文件说明：课时6 · 第2关 · 讲解路径定稿与轮流试讲
 * 职责：组长——分页填写 + 末页导出/完成，并可「预览海报说明流程」弹窗；组员——导入 JSON 后以**整合稿**「海报路演说明流程」通读核对（非分框表单）
 * 更新触发：分页结构、导入逻辑、整合稿版式、预览弹窗或校验变化时
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  Upload,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { usePortfolio } from "@/app/providers/AppProvider"
import { advancePointer } from "@/shared/utils/pointer"
import type { Lesson6State, ModulePortfolio, RoadshowStep } from "@/domains/portfolio/types"
import { cn } from "@/shared/utils/cn"
import { LESSON6_ROADSHOW_META } from "../config"
import {
  downloadLesson6PathJson,
  parseLesson6RoadshowPathPackageJson,
} from "../export"
import { isStep2EvidencePosterAreaOk, validateLesson6Step2 } from "../validation"

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

/** 与「演讲负责人」标签横排时使用：覆盖 SELECT_CLASS 的 w-full，避免独占一行把标签挤到上方 */
const PRESENTER_SELECT_CLASS =
  "h-9 w-auto min-w-[9rem] max-w-[14rem] shrink-0 py-1"

/** 四步表单：栏目标题（须明显大于占位提示字号） */
const STEP_FIELD_LABEL_CLASS =
  "block text-base font-semibold text-foreground leading-snug tracking-tight"
/** 四步表单：输入区略压暗占位符，突出栏目标题 */
const STEP_CONTROL_CLASS = "mt-1 placeholder:text-muted-foreground/65"

/** 组员「导入路径单」主按钮：与课时5第2关一致的天青强调 */
const MEMBER_IMPORT_BTN =
  "border-2 border-sky-600 bg-sky-100 text-sky-950 hover:bg-sky-200 hover:border-sky-700 shadow-sm"

const POSTER_AREA_SUGGESTION_CHIPS = [
  "标题区",
  "研究问题区",
  "为何关注区",
  "证据图片区",
  "数据记录区",
  "判断与建议区",
  "页脚来源区",
] as const

const STEP_FIELD_LABELS = [
  {
    a: "这一步我先指向海报哪里？",
    b: "这一步我一定会说的一句话",
    c: "这一步我还可以补充什么？（选填）",
  },
  {
    a: "这一步我会指向哪一块证据？",
    b: "这一步我一定会说的一句话",
    c: "这一步我还可以补充什么？（选填）",
  },
  {
    a: "这一步我会落到哪一块判断或建议？",
    b: "这一步我一定会说的一句话",
    c: "这一步我还可以补充什么？（选填）",
  },
  {
    a: "这一步我准备回到哪条证据？",
    b: "这一步我一定会说的一句话",
    c: "这一步我还可以补充什么？（选填）",
  },
] as const

const POSTER_PLACEHOLDERS = [
  "例如：左上角标题区 / 研究问题区",
  "例如：中部证据图片区 / 右侧数据记录区",
  "例如：下方判断与建议区",
  "例如：回到中部照片区 / 数据记录区",
] as const

const MUSTSAY_PLACEHOLDERS = [
  "例如：我们研究的问题是……",
  "例如：请看海报这里，这组照片 / 记录说明……",
  "例如：因此我们认为……所以我们建议……",
  "例如：如果你问我们怎么证明，我们会回到……",
] as const

const EXPAND_PLACEHOLDER =
  "这一步你还可以补充什么？可详一点，也可以不写"

const STEP2_PAGE_COUNT = 7

const STEP2_SIDE_HINTS: { prev: string; next: string }[] = [
  { prev: "", next: "第1步·点题" },
  { prev: "讲解路径单", next: "第2步·指证据" },
  { prev: "第1步", next: "第3步·说判断与建议" },
  { prev: "第2步", next: "第4步·应追问并收束" },
  { prev: "第3步", next: "第4步补充·追问" },
  { prev: "第4步", next: "导出与完成" },
  { prev: "追问区", next: "" },
]

function PosterAreaChipsRow({
  onPick,
  readOnly,
}: {
  onPick: (text: string) => void
  readOnly?: boolean
}) {
  if (readOnly) return null
  return (
    <div className="flex flex-wrap gap-1.5 mb-1.5" aria-label="海报位置快捷提示（可选）">
      {POSTER_AREA_SUGGESTION_CHIPS.map(chip => (
        <button
          key={chip}
          type="button"
          className={cn(
            "text-xs rounded-md border border-dashed border-muted-foreground/35",
            "bg-background px-2 py-0.5 text-muted-foreground",
            "hover:border-primary/45 hover:text-foreground hover:bg-muted/40 transition-colors"
          )}
          onClick={() => onPick(chip)}
        >
          {chip}
        </button>
      ))}
    </div>
  )
}

/**
 * 演讲负责人下拉：仅使用真实姓名（课时1「小组成员」+ 当前学生姓名去重），不出现「组长」等角色名
 */
function buildPresenterOptions(portfolio: ModulePortfolio): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const push = (raw: string) => {
    const t = raw.trim()
    if (t && !seen.has(t)) {
      seen.add(t)
      out.push(t)
    }
  }
  for (const n of portfolio.lesson1.groupMembers ?? []) {
    push(String(n ?? ""))
  }
  push(portfolio.student.studentName ?? "")
  return out
}

const flowText = (s: string) => (s.trim() ? s.trim() : "—")

/**
 * 整合后的「海报路演说明流程」：一份可通读、可上台用的路线稿（非分栏输入框样式）
 * 触发：组员只读区、组长预览弹窗；字段含义或版式调整时改此组件
 */
function PosterRoadshowFlowDocument({
  steps,
  challengeQuestion,
  evidenceBack,
  closingSentence,
  showHeader = true,
  className,
}: {
  steps: RoadshowStep[]
  challengeQuestion: string
  evidenceBack: string
  closingSentence: string
  /** false：用于对话框内，避免与 DialogTitle 重复大标题 */
  showHeader?: boolean
  className?: string
}) {
  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card text-foreground shadow-sm overflow-hidden",
        className
      )}
    >
      {showHeader ? (
        <header className="border-b border-border bg-muted/35 px-5 py-4 sm:px-8 sm:py-5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            海报路演说明流程
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            全组按此顺序讲解。以下为路线与要点，可临场发挥详略，不必照念全文稿。
          </p>
        </header>
      ) : null}
      <div className="px-5 py-6 sm:px-8 sm:py-8 space-y-9">
        {steps.map((row, i) => {
          const labels = STEP_FIELD_LABELS[i] ?? STEP_FIELD_LABELS[0]
          const meta = LESSON6_ROADSHOW_META[i]
          return (
            <section key={row.step} className="space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-primary leading-snug">
                第{row.step}步 · {row.name}
                <span className="block sm:inline sm:ml-2 text-base sm:text-lg font-semibold text-foreground/95 mt-1 sm:mt-0">
                  演讲负责人：{flowText(row.presenterBy)}
                </span>
              </h3>
              {meta ? (
                <p className="text-sm text-muted-foreground pl-0 border-l-2 border-primary/30 pl-3">
                  {meta.task}
                </p>
              ) : null}
              <dl className="space-y-3 text-sm sm:text-[15px] leading-relaxed">
                <div>
                  <dt className="font-semibold text-foreground">{labels.a}</dt>
                  <dd className="mt-1.5 text-foreground/95 whitespace-pre-wrap">
                    {flowText(row.posterArea)}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">{labels.b}</dt>
                  <dd className="mt-1.5 text-foreground/95 whitespace-pre-wrap">
                    {flowText(row.mustSay)}
                  </dd>
                </div>
                {row.expand.trim() ? (
                  <div>
                    <dt className="font-semibold text-foreground">{labels.c}</dt>
                    <dd className="mt-1.5 text-foreground/90 whitespace-pre-wrap">
                      {row.expand.trim()}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          )
        })}

        <section className="space-y-3 pt-2 border-t border-border">
          <h3 className="text-lg sm:text-xl font-bold text-violet-900">
            追问与收束准备
          </h3>
          <dl className="space-y-3 text-sm sm:text-[15px] leading-relaxed">
            <div>
              <dt className="font-semibold text-foreground">最可能被问的问题</dt>
              <dd className="mt-1.5 text-foreground/95 whitespace-pre-wrap">
                {flowText(challengeQuestion)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">
                我准备回到哪条证据回答
              </dt>
              <dd className="mt-1.5 text-foreground/95 whitespace-pre-wrap">
                {flowText(evidenceBack)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">最后一句怎么收住</dt>
              <dd className="mt-1.5 text-foreground/95 whitespace-pre-wrap">
                {flowText(closingSentence)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </article>
  )
}

export default function Step2RoadshowPath() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const leaderFileRef = useRef<HTMLInputElement>(null)
  const isLeader = portfolio?.student.role === "leader"

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
  const [page, setPage] = useState(0)
  const [focusedRow, setFocusedRow] = useState<number | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [flowPreviewOpen, setFlowPreviewOpen] = useState(false)
  const [memberAck, setMemberAck] = useState(
    () => portfolio?.lesson6.roadshowPathMemberAcknowledged ?? false
  )

  useEffect(() => {
    if (portfolio && !isLeader) {
      setMemberAck(portfolio.lesson6.roadshowPathMemberAcknowledged)
    }
  }, [portfolio, isLeader])

  /** 组员导入后从档案同步表单（避免本地 state 落后） */
  useEffect(() => {
    if (!portfolio || isLeader) return
    if (!portfolio.lesson6.importedRoadshowPathPackageJson?.trim()) return
    setSteps(portfolio.lesson6.roadshowSteps)
    setChallengeQuestion(portfolio.lesson6.challengeQuestion)
    setEvidenceBack(portfolio.lesson6.evidenceBack)
    setClosingSentence(portfolio.lesson6.closingSentence)
  }, [
    portfolio,
    isLeader,
    portfolio?.lesson6.importedRoadshowPathPackageJson,
    portfolio?.lesson6.roadshowSteps,
    portfolio?.lesson6.challengeQuestion,
    portfolio?.lesson6.evidenceBack,
    portfolio?.lesson6.closingSentence,
  ])

  const persistPartial = useCallback(
    async (patch: Partial<Lesson6State>) => {
      if (!portfolio) return
      await savePortfolio({
        ...portfolio,
        lesson6: {
          ...portfolio.lesson6,
          ...patch,
        },
      })
    },
    [portfolio, savePortfolio]
  )

  const updateStep = useCallback(
    (index: number, field: keyof RoadshowStep, value: string) => {
      setSteps(prev =>
        prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
      )
    },
    []
  )

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

  const memberRawJson = portfolio?.lesson6.importedRoadshowPathPackageJson?.trim() ?? ""
  const memberParsed = useMemo(() => {
    if (!portfolio || isLeader || !memberRawJson) return null
    try {
      return parseLesson6RoadshowPathPackageJson(memberRawJson)
    } catch {
      return null
    }
  }, [portfolio, isLeader, memberRawJson])

  const handleLeaderExportJson = async () => {
    if (!portfolio || !lesson6Draft) return
    const errs = validateLesson6Step2(portfolio, lesson6Draft)
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])
    downloadLesson6PathJson({ ...portfolio, lesson6: lesson6Draft })
    await persistPartial({
      pathExported: true,
      roadshowPathLeaderPackageExported: true,
      roadshowSteps: steps,
      challengeQuestion,
      evidenceBack,
      closingSentence,
    })
    setExportSuccess(true)
    window.setTimeout(() => setExportSuccess(false), 3000)
  }

  const handleLeaderComplete = async () => {
    if (!portfolio || !lesson6Draft) return
    const errs = validateLesson6Step2(portfolio, lesson6Draft)
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    if (
      isLeader &&
      !portfolio.lesson6.completed &&
      !portfolio.lesson6.roadshowPathLeaderPackageExported
    ) {
      setErrors([
        "首次完成课时6前，请先点击「导出海报路演讲解路径单（JSON）」下载并发给组员（仅需一次；本课已完成后若再改表不会再次要求导出）",
      ])
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

  const handleMemberImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !portfolio) return
    setImporting(true)
    setImportError(null)
    try {
      const text = await file.text()
      const parsed = parseLesson6RoadshowPathPackageJson(text)
      await savePortfolio({
        ...portfolio,
        lesson6: {
          ...portfolio.lesson6,
          roadshowSteps: parsed.roadshowSteps,
          challengeQuestion: parsed.challengeQuestion,
          evidenceBack: parsed.evidenceBack,
          closingSentence: parsed.closingSentence,
          importedRoadshowPathPackageJson: text,
          roadshowPathMemberAcknowledged: false,
        },
      })
      setMemberAck(false)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "导入失败")
    } finally {
      setImporting(false)
    }
  }

  const handleMemberComplete = async () => {
    if (!portfolio || !memberAck) return
    setSaving(true)
    try {
      await savePortfolio({
        ...portfolio,
        pointer: advancePointer(portfolio.pointer, 6, 2),
        lesson6: {
          ...portfolio.lesson6,
          roadshowPathMemberAcknowledged: true,
          completed: true,
        },
      })
      navigate("/")
    } finally {
      setSaving(false)
    }
  }

  const renderStepCard = (index: number, readOnly: boolean) => {
    const row = steps[index]
    if (!row) return null
    const meta = LESSON6_ROADSHOW_META[index]
    const labels = STEP_FIELD_LABELS[index] ?? STEP_FIELD_LABELS[0]
    const longMust = row.mustSay.length > 80
    const longExp = row.expand.length > 120
    const step2VagueHint =
      index === 1 &&
      row.posterArea.trim().length > 0 &&
      !isStep2EvidencePosterAreaOk(row.posterArea)
    const presenterOpts = portfolio ? buildPresenterOptions(portfolio) : []

    return (
      <div
        className={cn(
          "rounded-lg border p-3 transition-colors",
          !readOnly && focusedRow === index
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border bg-card"
        )}
        onFocusCapture={() => !readOnly && setFocusedRow(index)}
        onBlurCapture={e => {
          if (!readOnly && !e.currentTarget.contains(e.relatedTarget as Node))
            setFocusedRow(null)
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
            <span className="text-2xl font-bold tracking-tight text-primary">
              第{row.step}步
            </span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {row.name}
            </span>
            {meta && (
              <span className="text-sm sm:text-base text-muted-foreground font-normal w-full sm:w-auto basis-full sm:basis-auto">
                （{meta.task}）
              </span>
            )}
          </div>
          {!readOnly ? (
            <div className="flex shrink-0 flex-nowrap flex-row items-center gap-2 w-full min-w-0 justify-start sm:justify-end sm:w-auto sm:max-w-none">
              <label
                htmlFor={`l6-presenter-${index}`}
                className="text-sm font-medium text-foreground whitespace-nowrap shrink-0"
              >
                演讲负责人
              </label>
              <select
                id={`l6-presenter-${index}`}
                className={cn(SELECT_CLASS, PRESENTER_SELECT_CLASS)}
                value={
                  presenterOpts.includes(row.presenterBy) ? row.presenterBy : ""
                }
                onChange={e => updateStep(index, "presenterBy", e.target.value)}
                aria-label={`第${row.step}步演讲负责人`}
              >
                <option value="">请选择姓名</option>
                {presenterOpts.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex shrink-0 flex-row flex-wrap items-center gap-2 text-sm w-full sm:w-auto max-w-full">
              <span className="text-muted-foreground whitespace-nowrap">
                演讲负责人
              </span>
              <span className="font-semibold text-foreground">
                {row.presenterBy.trim() || "—"}
              </span>
            </div>
          )}
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={STEP_FIELD_LABEL_CLASS}>{labels.a}</label>
            <PosterAreaChipsRow
              readOnly={readOnly}
              onPick={text => updateStep(index, "posterArea", text)}
            />
            <Input
              value={row.posterArea}
              readOnly={readOnly}
              disabled={readOnly}
              onChange={e => updateStep(index, "posterArea", e.target.value)}
              placeholder={POSTER_PLACEHOLDERS[index] ?? POSTER_PLACEHOLDERS[0]}
              className={cn(STEP_CONTROL_CLASS, "text-sm")}
            />
            {step2VagueHint && !readOnly && (
              <p className="text-xs text-amber-800/90 mt-1">
                建议把海报位置写得更具体，如「左上角标题区」「证据图片区」
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className={STEP_FIELD_LABEL_CLASS}>{labels.b}</label>
            <Textarea
              value={row.mustSay}
              readOnly={readOnly}
              disabled={readOnly}
              onChange={e => updateStep(index, "mustSay", e.target.value)}
              placeholder={MUSTSAY_PLACEHOLDERS[index] ?? MUSTSAY_PLACEHOLDERS[0]}
              rows={2}
              className={cn(STEP_CONTROL_CLASS, "min-h-[2.5rem] text-sm")}
            />
            {longMust && !readOnly && (
              <p className="text-xs text-amber-800/90 mt-1">
                建议把这句话再压短一点，方便全组统一说法
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className={STEP_FIELD_LABEL_CLASS}>{labels.c}</label>
            <Textarea
              value={row.expand}
              readOnly={readOnly}
              disabled={readOnly}
              onChange={e => updateStep(index, "expand", e.target.value)}
              placeholder={EXPAND_PLACEHOLDER}
              rows={2}
              className={cn(STEP_CONTROL_CLASS, "min-h-[2.5rem] text-sm")}
            />
            {longExp && !readOnly && (
              <p className="text-xs text-amber-800/90 mt-1">
                建议压缩为短点，不写成长段（本项为选填）
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderFollowUpCard = (readOnly: boolean) => (
    <Card className="border-violet-200 bg-violet-50/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          第4步补充：准备被追问时怎么回答
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className={STEP_FIELD_LABEL_CLASS}>最可能被问的问题</label>
          <Textarea
            value={challengeQuestion}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={e => setChallengeQuestion(e.target.value)}
            rows={2}
            className={cn(STEP_CONTROL_CLASS, "text-sm")}
            placeholder="例如：你们怎么证明这个现象真的存在？"
          />
        </div>
        <div>
          <label className={STEP_FIELD_LABEL_CLASS}>
            我准备回到哪条证据回答
          </label>
          <Textarea
            value={evidenceBack}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={e => setEvidenceBack(e.target.value)}
            rows={2}
            className={cn(STEP_CONTROL_CLASS, "text-sm")}
            placeholder="例如：回到中部照片区和右侧记录表"
          />
        </div>
        <div>
          <label className={STEP_FIELD_LABEL_CLASS}>最后一句怎么收住？</label>
          <Textarea
            value={closingSentence}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={e => setClosingSentence(e.target.value)}
            rows={2}
            className={cn(STEP_CONTROL_CLASS, "text-sm")}
            placeholder="例如：总之，我们想说明的是……"
          />
        </div>
      </CardContent>
    </Card>
  )

  if (!portfolio) {
    return <p className="text-sm text-muted-foreground">正在加载档案…</p>
  }

  const leaderFirstFinishNeedsExport =
    isLeader &&
    !portfolio.lesson6.completed &&
    !portfolio.lesson6.roadshowPathLeaderPackageExported

  const trackWidthPct = STEP2_PAGE_COUNT * 100
  const translatePct = (page * 100) / STEP2_PAGE_COUNT
  const side = STEP2_SIDE_HINTS[page] ?? { prev: "", next: "" }
  const canPrev = page > 0
  const canNext = page < STEP2_PAGE_COUNT - 1

  /* ─── 组员：JSON 损坏 ─── */
  if (!isLeader && memberRawJson && !memberParsed) {
    return (
      <div className="space-y-6 w-full max-w-lg mx-auto">
        <h3 className="text-xl font-bold">第2关：讲解路径定稿</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 space-y-3">
          <p>已保存的路径单无法解析，可能文件已损坏。请删除后重新导入组长发送的 JSON。</p>
          <Button
            variant="outline"
            onClick={async () => {
              await savePortfolio({
                ...portfolio,
                lesson6: {
                  ...portfolio.lesson6,
                  importedRoadshowPathPackageJson: "",
                  roadshowPathMemberAcknowledged: false,
                },
              })
            }}
          >
            清除并重新导入
          </Button>
        </div>
      </div>
    )
  }

  /* ─── 组员：未导入 ─── */
  if (!isLeader && !memberParsed) {
    return (
      <div className="space-y-6 w-full max-w-lg mx-auto">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">第2关：讲解路径定稿</h3>
          <p className="text-muted-foreground text-sm">
            组员：请等待组长导出「海报路演讲解路径单」JSON 并发送给你后，在此导入。
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              导入组长路径单
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              格式：JSON，由组长在本关点击「导出海报路演讲解路径单（JSON）」生成。
            </p>
            <input
              ref={leaderFileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleMemberImport}
            />
            <Button
              type="button"
              variant="outline"
              className={cn("w-full gap-2", MEMBER_IMPORT_BTN)}
              disabled={importing}
              onClick={() => leaderFileRef.current?.click()}
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              选择路径单文件
            </Button>
            {importError && <p className="text-xs text-red-600">{importError}</p>}
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ─── 组员：已导入 · 只读核对 ─── */
  if (!isLeader && memberParsed) {
    return (
      <div className="space-y-6 w-full max-w-[min(100%,110rem)] mx-auto">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">第2关：讲解路径定稿</h3>
          <p className="text-muted-foreground text-sm">
            组员：请核对组长填写的讲解路径单，确认无误后完成本课时。
          </p>
        </div>
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          只读：数据来自组长导出的路径单 JSON
        </p>

        <PosterRoadshowFlowDocument
          steps={steps}
          challengeQuestion={challengeQuestion}
          evidenceBack={evidenceBack}
          closingSentence={closingSentence}
          className="max-w-3xl mx-auto"
        />

        <p className="text-xs text-muted-foreground border-l-2 border-muted pl-3 leading-relaxed max-w-3xl mx-auto">
          提醒：先记「路线」，再练「表达」。本页为整合说明稿，方便通读与上台试讲。
        </p>

        <div className="rounded-lg border border-sky-500/55 bg-sky-50/50 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={memberAck}
              onChange={e => setMemberAck(e.target.checked)}
            />
            <span>我已阅读并核对组长填写的讲解路径单</span>
          </label>
          <Button
            className="gap-2 sm:ml-auto"
            disabled={saving || !memberAck}
            onClick={handleMemberComplete}
          >
            {saving ? "保存中…" : "完成课时6"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  /* ─── 组长 · 分页卡片 ─── */
  return (
    <div className="w-full max-w-[min(100%,110rem)] mx-auto px-1.5 sm:px-3 pb-6">
      <div
        className={cn(
          "flex flex-col justify-center min-h-[min(78vh,880px)]",
          "py-4 md:py-6"
        )}
      >
        <div className="flex items-stretch justify-center gap-1 sm:gap-2 md:gap-3 w-full">
          <div className="flex shrink-0 flex-col items-center justify-center gap-1 self-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border-muted-foreground/25 shadow-sm"
              disabled={!canPrev}
              aria-label="上一页"
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} aria-hidden />
            </Button>
            {side.prev ? (
              <span className="hidden lg:block max-w-[5.5rem] text-center text-[10px] leading-snug text-muted-foreground line-clamp-3">
                {side.prev}
              </span>
            ) : null}
          </div>

          <main className="flex min-w-0 flex-1 flex-col rounded-xl border bg-card/60 shadow-md px-2 py-4 sm:px-5 sm:py-6 lg:px-8">
            <div className="overflow-hidden w-full rounded-lg flex-1 flex flex-col justify-center min-h-[min(52vh,600px)]">
              <div
                className={cn(
                  "flex ease-out transition-transform duration-500",
                  "motion-reduce:transition-none motion-reduce:duration-0",
                  "will-change-transform"
                )}
                style={{
                  width: `${trackWidthPct}%`,
                  transform: `translateX(-${translatePct}%)`,
                }}
              >
                {Array.from({ length: STEP2_PAGE_COUNT }, (_, slideIdx) => (
                  <div
                    key={slideIdx}
                    className="w-[calc(100%/7)] shrink-0 min-w-0 box-border px-1 sm:px-3 py-2 flex min-h-[min(48vh,520px)] items-center"
                  >
                    <div className="w-full max-h-[min(70vh,720px)] overflow-y-auto pr-1 space-y-4">
                      {slideIdx === 0 && (
                        <div className="rounded-lg border border-border bg-muted/25 px-4 py-4">
                          <h2 className="text-lg font-semibold tracking-tight">讲解路径单</h2>
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            这里写的是「讲解路线」，不是全文稿。
                            <br />
                            全组顺序一致，但每一步可以讲得详一点或简一点。
                          </p>
                          <p className="text-xs text-muted-foreground mt-3">
                            请把你在第1关里想好的路线写进下面各页；仍是「路线单」，不是演讲全文。
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            下面四步卡片<strong className="text-foreground/90">右上角</strong>
                            请为每一步指定「演讲负责人」（选真实姓名），尽量让小组都参与讲解，避免一人全包。
                          </p>
                        </div>
                      )}
                      {slideIdx >= 1 && slideIdx <= 4 && renderStepCard(slideIdx - 1, false)}
                      {slideIdx === 5 && renderFollowUpCard(false)}
                      {slideIdx === 6 && (
                        <div className="space-y-4">
                          <Button
                            type="button"
                            variant="secondary"
                            className="gap-2 w-full sm:w-auto"
                            onClick={() => setFlowPreviewOpen(true)}
                          >
                            <Eye className="h-4 w-4" aria-hidden />
                            预览海报说明流程
                          </Button>
                          <p className="text-xs text-muted-foreground border-l-2 border-muted pl-3 leading-relaxed">
                            整合稿与组员导入后所见相同；可先预览再导出 JSON。
                            <br />
                            提醒：先写「路线」，再练「表达」，不要把表格写成整段演讲稿。
                          </p>

                          {leaderFirstFinishNeedsExport && (
                            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                              <span>
                                首次完成课时6前，请先点击「导出海报路演讲解路径单（JSON）」下载并发给组员；本课已完成后若再改表，不会再次要求导出。
                              </span>
                            </div>
                          )}

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

                          <div className="flex flex-wrap gap-3 justify-between items-center pt-2 border-t">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleLeaderExportJson}
                              disabled={saving}
                              className={cn(
                                "gap-2",
                                portfolio.lesson6.roadshowPathLeaderPackageExported
                                  ? "border-green-300 bg-green-50/80 text-green-900 hover:bg-green-50 hover:border-green-400"
                                  : "border-2 border-amber-500 bg-amber-50 text-amber-950 shadow-sm hover:bg-amber-100 hover:border-amber-600 ring-2 ring-amber-400/45 ring-offset-2 ring-offset-background"
                              )}
                            >
                              {exportSuccess ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              {exportSuccess
                                ? "已导出！"
                                : "导出海报路演讲解路径单（JSON）"}
                            </Button>
                            <Button
                              type="button"
                              className="gap-2"
                              disabled={
                                saving || leaderFirstFinishNeedsExport
                              }
                              onClick={handleLeaderComplete}
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              完成课时6
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-[11px] text-muted-foreground tabular-nums pt-2 shrink-0">
              第 {page + 1} / {STEP2_PAGE_COUNT} 页
              {side.next ? (
                <span className="text-muted-foreground/80"> · 下一屏：{side.next}</span>
              ) : null}
            </p>
          </main>

          <div className="flex shrink-0 flex-col items-center justify-center gap-1 self-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border-muted-foreground/25 shadow-sm"
              disabled={!canNext}
              aria-label="下一页"
              onClick={() => setPage(p => Math.min(STEP2_PAGE_COUNT - 1, p + 1))}
            >
              <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} aria-hidden />
            </Button>
            {side.next ? (
              <span className="hidden lg:block max-w-[5.5rem] text-center text-[10px] leading-snug text-muted-foreground line-clamp-3">
                {side.next}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog open={flowPreviewOpen} onOpenChange={setFlowPreviewOpen}>
        <DialogContent className="max-w-3xl w-[min(100vw-1rem,48rem)] max-h-[min(90vh,880px)] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-3 pr-14 text-left space-y-1.5 border-b border-border shrink-0">
            <DialogTitle>海报路演说明流程</DialogTitle>
            <DialogDescription>
              当前草稿预览，版式与组员导入后所见的整合稿一致。
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 px-4 pb-6 sm:px-6">
            <PosterRoadshowFlowDocument
              showHeader={false}
              steps={steps}
              challengeQuestion={challengeQuestion}
              evidenceBack={evidenceBack}
              closingSentence={closingSentence}
              className="border-0 shadow-none rounded-lg bg-muted/20"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
