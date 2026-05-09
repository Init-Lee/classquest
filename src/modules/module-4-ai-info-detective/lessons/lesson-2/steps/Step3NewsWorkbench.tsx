/**
 * 文件说明：模块 4 课时 2 第 3 关页面。
 * 职责：以五段式新闻素材工作台引导学生上传截图、补全来源、完成四关复核、记录疑点并检查完成状态。
 * 更新触发：新闻素材工作台区块、来源动态提示、自检要求、自动状态推导或进入下一关策略变化时，需要同步更新本文件。
 */

import { useNavigate } from "react-router-dom"
import type {
  Module4CompressedMaterialAsset,
  Module4MaterialScreeningRecord,
  Module4MaterialSourceType,
  Module4PostCriteriaStatus,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { Lesson2StepLayout } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/components/Lesson2StepLayout"
import { CompressedMaterialUploader } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/components/CompressedMaterialUploader"
import { MaterialPreviewDialog } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/components/MaterialPreviewDialog"
import { SourceRecordCheckBadge } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/components/SourceRecordCheckBadge"
import { LESSON2_SOURCE_TYPE_LABELS } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/data/screening-examples"
import { evaluateLesson2QuickCheck } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/utils/evaluate-lesson2-quickcheck"
import { checkSourceRecord } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/utils/source-record-check"
import { isLesson2MaterialComplete, isValidLesson2Note } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/utils/material-completion"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/utils/cn"

const WORKBENCH_STEPS = [
  { id: "news-shot", label: "截图" },
  { id: "news-source", label: "来源" },
  { id: "news-review", label: "复核" },
  { id: "news-notes", label: "记录" },
  { id: "news-complete", label: "完成" },
] as const

const SOURCE_TYPES: Module4MaterialSourceType[] = ["web", "ai_generated", "field_capture", "mixed"]
const SOURCE_HINTS: Record<Module4MaterialSourceType, string> = {
  web: "填写链接、平台名称、栏目名称或发布时间线索。",
  ai_generated: "说明工具名称、Prompt 摘要、生成时间或生成记录截图。",
  field_capture: "说明拍摄时间、地点、采集方式或采集者备注。",
  mixed: "说明原始来源，以及裁剪、拼接、二次生成等加工方式。",
}
const NEWS_CLUE_CHIPS = ["来源缺失", "标题党风险", "数据出处不明", "文字表达过于模板化", "截图信息不完整"]

function deriveNewsStatus(record: Module4MaterialScreeningRecord): Module4PostCriteriaStatus {
  const selfChecksComplete = record.selfChecks.typeFits && record.selfChecks.contentCompliant && record.selfChecks.hasJudgmentValue
  const complete = Boolean(record.asset)
    && record.titleOrName.trim().length > 0
    && Boolean(record.sourceType)
    && record.sourceRecord.trim().length > 0
    && record.sourceAutoPassed
    && selfChecksComplete
    && isValidLesson2Note(record.clueNote)
    && isValidLesson2Note(record.peerFeedbackNote)

  if (complete) return "usable"
  return "need_fix"
}

function withCompletionState(record: Module4MaterialScreeningRecord): Module4MaterialScreeningRecord {
  const withStatus = { ...record, postCriteriaStatus: deriveNewsStatus(record), completed: false, completedAt: "" }
  const completed = isLesson2MaterialComplete(withStatus)
  return { ...withStatus, completed, completedAt: completed ? new Date().toISOString() : "" }
}

function scrollToWorkbenchSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

function StatusMark({ ok }: { ok: boolean }) {
  return <span className={ok ? "text-green-600" : "text-red-500"}>{ok ? "✅" : "⛔"}</span>
}

export default function Step3NewsWorkbench() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  if (!portfolio) return null
  const lesson2 = portfolio.lesson2

  const updateNews = (news: Module4MaterialScreeningRecord) => {
    const nextNews = withCompletionState(news)
    const nextLesson2 = {
      ...lesson2,
      news: nextNews,
      step3Completed: isLesson2MaterialComplete(nextNews),
    }
    void savePortfolio({
      ...portfolio,
      lesson2: {
        ...nextLesson2,
        quickCheck: evaluateLesson2QuickCheck(nextLesson2),
      },
    })
  }

  const updateNewsPatch = (patch: Partial<Module4MaterialScreeningRecord>) => {
    updateNews({ ...lesson2.news, ...patch })
  }

  const handleAssetChange = (asset: Module4CompressedMaterialAsset) => updateNewsPatch({ asset })

  const handleSourceCheck = () => {
    const result = checkSourceRecord(lesson2.news.sourceType, lesson2.news.sourceRecord)
    updateNewsPatch({
      sourceAutoPassed: result.passed,
      sourceCheckLastReason: result.reason,
      sourceCheckCount: lesson2.news.sourceCheckCount + 1,
    })
  }

  const appendClueChip = (chip: string) => {
    const text = lesson2.news.clueNote.trim()
    const next = text ? `${text}；${chip}` : chip
    updateNewsPatch({ clueNote: next, clueEditCount: lesson2.news.clueEditCount + 1 })
  }

  const complete = () => {
    if (!isLesson2MaterialComplete(lesson2.news)) return
    void savePortfolio({
      ...portfolio,
      progress: { lessonId: 2, stepId: 4 },
      lesson2: { ...lesson2, step3Completed: true },
    })
    navigate("/module/4/lesson/2/step/4")
  }

  const record = lesson2.news
  const sourceHint = record.sourceType ? SOURCE_HINTS[record.sourceType] : "请先选择来源类型，系统会给出对应填写提示。"
  const selfChecksComplete = record.selfChecks.typeFits && record.selfChecks.contentCompliant && record.selfChecks.hasJudgmentValue
  const completionItems = [
    { label: "新闻截图已上传", ok: Boolean(record.asset) },
    { label: "新闻短名已填写", ok: record.titleOrName.trim().length > 0 },
    { label: "来源类型已选择", ok: Boolean(record.sourceType) },
    { label: "来源记录格式通过", ok: record.sourceAutoPassed },
    { label: "三项自检已完成", ok: selfChecksComplete },
    { label: "初步疑点已填写", ok: isValidLesson2Note(record.clueNote) },
    { label: "交流记录已填写", ok: isValidLesson2Note(record.peerFeedbackNote) },
  ]
  const statusMessage = record.postCriteriaStatus === "usable"
    ? "当前新闻素材可以进入下一步。"
    : record.postCriteriaStatus === "need_replace"
      ? "当前新闻素材建议更换后再继续。"
      : "当前新闻素材还需要补充信息或完成复核。"
  const statusClassName = record.postCriteriaStatus === "usable"
    ? "border-green-200 bg-green-50 text-green-800"
    : record.postCriteriaStatus === "need_replace"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-900"
  const hasStep1NewsAsset = record.initialStatus !== "none" && Boolean(record.asset)
  const stepProgressItems = [
    { ...WORKBENCH_STEPS[0], ok: Boolean(record.asset) },
    { ...WORKBENCH_STEPS[1], ok: record.titleOrName.trim().length > 0 && Boolean(record.sourceType) && record.sourceAutoPassed },
    { ...WORKBENCH_STEPS[2], ok: Boolean(record.asset) && record.sourceAutoPassed && selfChecksComplete },
    { ...WORKBENCH_STEPS[3], ok: isValidLesson2Note(record.clueNote) && isValidLesson2Note(record.peerFeedbackNote) },
    { ...WORKBENCH_STEPS[4], ok: isLesson2MaterialComplete(record) },
  ]

  return (
    <Lesson2StepLayout
      title="第3关 · 新闻素材工作台"
      subtitle="用四关标准处理你自己的新闻素材"
      footer={<Button onClick={complete} disabled={!isLesson2MaterialComplete(record)}>完成新闻素材工作台，进入第4关</Button>}
    >
      <div>
        <aside className="mb-5 lg:fixed lg:left-3 lg:top-[calc(var(--module4-sticky-stack-height,6.75rem)+var(--module4-lesson2-chrome-h,8rem)+1.5rem)] lg:z-20 lg:mb-0 lg:w-16">
          <div className="rounded-2xl border bg-white/95 p-3 shadow-sm backdrop-blur lg:rounded-full lg:p-2">
            <p className="mb-3 text-xs font-medium text-muted-foreground lg:sr-only">新闻工作台</p>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {stepProgressItems.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  className={cn(
                    "flex min-w-24 items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm transition hover:bg-slate-50 lg:min-w-0 lg:w-12 lg:flex-col lg:justify-center lg:gap-1 lg:rounded-full lg:border-0 lg:px-0 lg:py-2 lg:text-center lg:text-[11px]",
                    step.ok ? "border-green-200 bg-green-50 text-green-800 lg:bg-green-50" : "border-slate-200 bg-white text-slate-700 lg:bg-transparent",
                  )}
                  onClick={() => scrollToWorkbenchSection(step.id)}
                >
                  <span className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    step.ok ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600",
                  )}
                  >
                    {index + 1}
                  </span>
                  <span>{step.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <Card id="news-shot" className="scroll-mt-36">
              <CardHeader>
                <CardTitle className="text-xl">新闻截图</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-7 text-muted-foreground">
                  新闻素材不是整篇文章，也不是只有标题。本课需要的是一张能展示标题、导语 / 正文片段，并尽量保留来源信息的新闻截图。
                </p>
                {hasStep1NewsAsset && (
                  <p className="rounded-2xl bg-green-50 px-4 py-2 text-sm text-green-800">已带入第1关新闻截图，可在下方替换。</p>
                )}
                <CompressedMaterialUploader kind="news" asset={record.asset} onAssetChange={handleAssetChange} />
              </CardContent>
            </Card>

            <Card id="news-source" className="scroll-mt-36">
              <CardHeader>
                <CardTitle className="text-xl">来源记录与基础信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium">新闻短名</span>
                    <Input value={record.titleOrName} onChange={event => updateNewsPatch({ titleOrName: event.target.value })} placeholder="例如：校园 AI 新闻截图" />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium">来源类型</span>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={record.sourceType ?? ""}
                      onChange={event => updateNewsPatch({
                        sourceType: event.target.value ? event.target.value as Module4MaterialSourceType : undefined,
                        sourceAutoPassed: false,
                      })}
                    >
                      <option value="">请选择来源类型</option>
                      {SOURCE_TYPES.map(type => <option key={type} value={type}>{LESSON2_SOURCE_TYPE_LABELS[type]}</option>)}
                    </select>
                  </label>
                </div>
                <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-900">{sourceHint}</p>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">来源记录</span>
                  <Textarea value={record.sourceRecord} onChange={event => updateNewsPatch({ sourceRecord: event.target.value, sourceAutoPassed: false })} placeholder="填写链接、平台、生成记录、拍摄说明或加工过程。" />
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="outline" onClick={handleSourceCheck}>检查来源记录</Button>
                  <SourceRecordCheckBadge checked={record.sourceCheckCount > 0} passed={record.sourceAutoPassed} reason={record.sourceCheckLastReason} />
                  <span className="text-xs text-muted-foreground">已检查 {record.sourceCheckCount} 次。系统只检查格式，不判断来源真实可信。</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card id="news-review" className="scroll-mt-36">
              <CardHeader>
                <CardTitle className="text-xl">四关复核</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-7 text-muted-foreground">现在用第2关学到的四项标准，正式检查这份新闻素材。</p>
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900">
                  四关：类型符合 / 来源可追溯 / 内容合规 / 具备判断价值
                </p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <div className="rounded-2xl border p-4 text-sm"><StatusMark ok={Boolean(record.asset)} /> 有新闻截图</div>
                  <div className="rounded-2xl border p-4 text-sm"><StatusMark ok={record.sourceAutoPassed} /> 来源记录通过格式检查</div>
                </div>
                <div className="space-y-3 rounded-2xl border bg-white p-4">
                  <p className="font-medium">学生自检三项</p>
                  {[
                    ["typeFits", "这是一份新闻类素材，符合本模块范围。"],
                    ["contentCompliant", "这份素材不涉及明显隐私、侵权或不适宜内容。"],
                    ["hasJudgmentValue", "这份素材能围绕 AI 痕迹或核验需求提出讨论。"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-start gap-3 rounded-xl border p-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4"
                        checked={record.selfChecks[key as keyof typeof record.selfChecks]}
                        onChange={event => updateNewsPatch({ selfChecks: { ...record.selfChecks, [key]: event.target.checked } })}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card id="news-notes" className="scroll-mt-36">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-xl">初步疑点与交流记录</CardTitle>
                  <MaterialPreviewDialog kind="news" record={record} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {NEWS_CLUE_CHIPS.map(chip => (
                    <Button key={chip} type="button" variant="outline" size="sm" className="rounded-full" onClick={() => appendClueChip(chip)}>
                      {chip}
                    </Button>
                  ))}
                </div>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">初步疑点提示</span>
                  <p className="text-xs leading-6 text-muted-foreground">写 1 条 AI 痕迹、信息缺口或需要进一步核验之处。这里不是最终解析，只是给下一课留下观察线索。</p>
                  <Textarea
                    value={record.clueNote}
                    onChange={event => updateNewsPatch({ clueNote: event.target.value, clueEditCount: record.clueEditCount + 1 })}
                    placeholder="例如：这条新闻目前只有截图，缺少原网页链接，需要进一步核验来源和发布时间。"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">同伴 / 自我交流记录</span>
                  <p className="text-xs leading-6 text-muted-foreground">记录一条和同学交流后的提醒，或你自己发现的修改意见。</p>
                  <Textarea
                    value={record.peerFeedbackNote}
                    onChange={event => updateNewsPatch({ peerFeedbackNote: event.target.value, peerFeedbackEditCount: record.peerFeedbackEditCount + 1 })}
                    placeholder="例如：同学提醒我补充原始链接，避免只凭截图判断。"
                  />
                </label>
              </CardContent>
            </Card>
          </div>

          <Card id="news-complete" className="scroll-mt-36">
            <CardHeader>
              <CardTitle className="text-xl">新闻素材完成检查</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {completionItems.map(item => (
                  <div key={item.label} className="flex items-center gap-2 rounded-2xl border p-3 text-sm">
                    <StatusMark ok={item.ok} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
              <p className={cn("rounded-2xl border px-4 py-3 text-sm font-medium", statusClassName)}>{statusMessage}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Lesson2StepLayout>
  )
}
