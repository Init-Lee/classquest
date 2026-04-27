/**
 * 文件说明：课时6 · 第1关 · 示例拆解与路径定标
 * 职责：5 页横向滑轨（纯 CSS transform）；主区占宽垂直居中；翻页为左右 Chevron 侧栏非底栏；
 *       第3页四步翻转卡须顺序首次解锁、已读可重复点开弹窗，关弹窗计读满四步后才可下一页；第4页路径栅格；第5页确认
 * 更新触发：分页布局、滑轨动效或各页文案变化时
 */

import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Images,
  Info,
  Lock,
  MessageCircle,
  Scale,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { usePortfolio } from "@/modules/module-3-ai-science-station/app/providers/AppProvider"
import { advancePointer } from "@/modules/module-3-ai-science-station/utils/pointer"
import { cn } from "@/shared/utils/cn"
import { LESSON6_PATH_DIAGRAM_STEPS, LESSON6_ROADSHOW_META } from "../config"

const PAGE_COUNT = 5
/** 第3页翻转卡数量，与 LESSON6_ROADSHOW_META 一致 */
const FLIP_STEP_COUNT = LESSON6_ROADSHOW_META.length
const PATH_ICONS = [FileText, Images, Scale, MessageCircle] as const

/** 两侧预览条短文案 */
const DECK_SIDE_HINTS: { prev: string; next: string }[] = [
  { prev: "", next: "先看完整示例" },
  { prev: "路径与课堂提示", next: "固定四步（翻转卡）" },
  { prev: "完整示例", next: "海报编号示意" },
  { prev: "四步流程", next: "确认进入" },
  { prev: "编号与示意", next: "" },
]

type Meta = (typeof LESSON6_ROADSHOW_META)[number]

function FlipStepCard({
  meta,
  isFlipped,
  locked,
  completed,
  onOpenDetail,
}: {
  meta: Meta
  isFlipped: boolean
  /** 尚未轮到：不可点 */
  locked: boolean
  /** 已关闭弹窗，计为已读 */
  completed: boolean
  onOpenDetail: () => void
}) {
  return (
    <div className="[perspective:1200px] w-full">
      <button
        type="button"
        disabled={locked}
        onClick={onOpenDetail}
        className={cn(
          "relative w-full min-h-[158px] rounded-xl border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          locked && "cursor-not-allowed opacity-55"
        )}
        aria-label={
          locked
            ? `第${meta.step}步 ${meta.name}，请先按顺序完成前一步`
            : completed
              ? `第${meta.step}步 ${meta.name}，已读过，可再次点击查看讲解要点`
              : `第${meta.step}步 ${meta.name}，点击查看讲解要点`
        }
      >
        <div
          className={cn(
            "relative min-h-[168px] w-full [transform-style:preserve-3d] transition-transform duration-500 motion-reduce:duration-150",
            isFlipped && "[transform:rotateY(180deg)]"
          )}
        >
          <div
            className={cn(
              "absolute inset-0 flex min-h-[168px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-primary/25 bg-gradient-to-br from-violet-50/90 to-background px-3 py-3 shadow-sm",
              "[backface-visibility:hidden] [transform:rotateY(0deg)]"
            )}
          >
            <span className="text-xs font-bold text-primary tabular-nums">第 {meta.step} 步</span>
            <span className="text-base font-semibold text-foreground text-center leading-snug">{meta.name}</span>
            {locked ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" aria-hidden />
                请先完成前一步
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">点击查看本步要点</span>
            )}
          </div>
          <div
            className={cn(
              "absolute inset-0 flex min-h-[168px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-primary/30 bg-muted/50 px-2 py-3",
              "[backface-visibility:hidden] [transform:rotateY(180deg)]"
            )}
          >
            <span className="text-xs font-bold text-primary tabular-nums">第 {meta.step} 步</span>
            <span className="text-base font-semibold text-foreground text-center leading-snug line-clamp-2">
              {meta.name}
            </span>
            {completed ? (
              <>
                <CheckCircle2 className="h-7 w-7 text-primary shrink-0" aria-hidden />
                <span className="text-[11px] font-medium text-primary">已阅读</span>
                <span className="text-[10px] text-muted-foreground text-center px-0.5 leading-snug">
                  可再次点击查看要点
                </span>
              </>
            ) : (
              <>
                <span className="text-[11px] font-medium text-primary">已在弹窗中展开</span>
                <span className="text-[10px] text-muted-foreground text-center px-0.5 leading-snug">
                  关闭弹窗后计为已读
                </span>
              </>
            )}
          </div>
        </div>
      </button>
    </div>
  )
}

/** 第4页：四步路径同屏展示（栅格 + 格内纵向排版，避免横向滚动条） */
function PosterPathRibbonOneRow() {
  return (
    <div
      className="w-full rounded-lg border border-border/50 bg-muted/15 p-2 sm:p-3"
      role="list"
      aria-label="海报讲解路径四步示意"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2 md:gap-3">
        {LESSON6_PATH_DIAGRAM_STEPS.map((s, stepIdx) => {
          const Icon = PATH_ICONS[stepIdx] ?? FileText
          return (
            <div
              key={s.step}
              role="listitem"
              className="flex min-w-0 flex-col items-center gap-1 rounded-md border bg-card px-1.5 py-2 text-center shadow-sm sm:px-2 sm:py-2.5"
            >
              <div className="flex items-center justify-center gap-1">
                <span className="text-[11px] font-bold text-primary tabular-nums">{s.step}</span>
                <Icon
                  className="h-5 w-5 shrink-0 text-muted-foreground stroke-[1.5] sm:h-6 sm:w-6"
                  aria-hidden
                />
              </div>
              <span className="text-[11px] font-semibold leading-tight text-foreground sm:text-xs">
                {s.short}
              </span>
              <span className="text-[10px] leading-snug text-muted-foreground sm:text-[11px] line-clamp-4">
                {s.caption}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type SlideProps = {
  handleCardActivate: (i: number) => void
  flippedIndex: number | null
  openDialogIndex: number | null
  /** 已按顺序读完并关闭弹窗的步数（0～FLIP_STEP_COUNT） */
  sequentialStepsCompleted: number
  done: boolean
  understood: boolean
  setUnderstood: (v: boolean) => void
  saving: boolean
  handleConfirm: () => void
  navigate: (path: string) => void
}

function renderSlide(pageIndex: number, p: SlideProps) {
  const {
    handleCardActivate,
    flippedIndex,
    openDialogIndex,
    sequentialStepsCompleted,
    done,
    understood,
    setUnderstood,
    saving,
    handleConfirm,
    navigate,
  } = p

  switch (pageIndex) {
    case 0:
      return (
        <div className="space-y-6 w-full">
          <div className="text-center pb-2 border-b border-border/60">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              终版海报路演与表达设计
            </h2>
          </div>
          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">为什么要先定讲解路径？</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              同一张海报，如果想到哪儿讲到哪儿，听的人就容易乱。
              先把讲解顺序定下来，等于先铺好一条「带观众看海报」的路线。
              这节课先统一四步流程，再进入第2关写你们自己的讲解路径单。
            </p>
          </section>
          <Card className="border-amber-200 bg-amber-50/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-950">
                <Info className="h-4 w-4 shrink-0" />
                课堂提示
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-950 space-y-1.5 leading-relaxed">
              <p>所有成员按同一流程讲。</p>
              <p>可以详略不同，但不能跳步。</p>
              <p>先看懂流程，再给自己的海报编号。</p>
            </CardContent>
          </Card>
        </div>
      )
    case 1:
      return (
        <div className="space-y-4 w-full">
          <h3 className="text-lg font-semibold text-foreground">先看一段完整示例</h3>
          <p className="text-sm text-muted-foreground">
            请先读完下面这段示例。注意看它是怎样按「点题 → 指证据 → 说判断与建议 → 应追问并收束」连起来讲的。
          </p>
          <Card className="border-blue-100 bg-blue-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-blue-950">
                示例：一段完整的海报路演怎么讲
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-blue-950/90 leading-relaxed">
              <p className="whitespace-pre-wrap">
                {`我们研究的问题是：学校食堂里有没有比较明显的剩饭剩菜现象，这个问题值不值得关注。
请看海报中间这一组照片和右边的记录表，我们连续几天观察后发现，在午餐高峰后，部分餐盘里都还有比较多没有吃完的主食和配菜。
因此我们认为，食堂浪费现象是存在的，但它不是「所有人都严重浪费」，而是集中出现在部分餐段和部分菜品上。所以我们建议先从优化打餐提醒、增加半份菜选择这两件更容易做到的事开始。
如果有人问「你们怎么证明」，我们会回到这组照片和记录表，因为这就是我们判断的主要依据。总之，我们想说明的是：讨论浪费问题，不能只靠感觉，要回到证据。`}
              </p>
              <div className="rounded-md bg-white/60 border border-blue-100 px-3 py-2.5 text-xs space-y-1.5">
                <p className="font-medium text-blue-900">读完后想一想：</p>
                <ul className="list-disc list-inside space-y-1 text-blue-900/90">
                  <li>第1句在哪里点题？</li>
                  <li>哪一句开始真正「指海报上的证据」？</li>
                  <li>哪一句在说判断和建议？</li>
                  <li>最后一句是怎么回到证据收束的？</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    case 2:
      return (
        <div className="space-y-4 w-full">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              固定四步讲解流程（请先看清再进入填写）
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              须按第 1 步 → 第 4 步<strong className="text-foreground/90">依次</strong>
              首次点开；每步在弹窗中阅读后关闭，才算读完该步。已读过的步骤可随时再点开复习。四步都读完前，无法进入下一页。
            </p>
            {sequentialStepsCompleted < FLIP_STEP_COUNT && (
              <p className="text-xs text-amber-800/90 bg-amber-50 border border-amber-200/80 rounded-md px-3 py-2 mt-2">
                进度：已读完 {sequentialStepsCompleted} / {FLIP_STEP_COUNT} 步
                <span className="text-muted-foreground">
                  {" "}
                  · 当前请点「第 {sequentialStepsCompleted + 1} 步」卡片
                </span>
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LESSON6_ROADSHOW_META.map((meta, i) => {
              const locked = i > sequentialStepsCompleted
              const completed = i < sequentialStepsCompleted
              const isFlipped =
                completed || openDialogIndex === i || flippedIndex === i
              return (
                <FlipStepCard
                  key={meta.step}
                  meta={meta}
                  locked={locked}
                  completed={completed}
                  isFlipped={isFlipped}
                  onOpenDetail={() => handleCardActivate(i)}
                />
              )
            })}
          </div>
        </div>
      )
    case 3:
      return (
        <div className="space-y-4 w-full">
          <div>
            <h3 className="text-lg font-semibold text-foreground">先给自己的海报标出 1 → 2 → 3 → 4</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              现在不要写完整讲稿。请先想清楚：如果你带着观众看海报，第一眼从哪里开始，接下来指向哪里，再落到哪里，最后回到哪里收束。
              先把讲解路线定下来，第2关再正式填写讲解路径单。
            </p>
          </div>
          <ul className="text-sm space-y-2 list-none pl-0 border-l-2 border-primary/30 pl-3">
            <li>
              <span className="text-muted-foreground">• </span>第1步，我先讲海报的哪一块？
            </li>
            <li>
              <span className="text-muted-foreground">• </span>第2步，我会指向哪一块证据？
            </li>
            <li>
              <span className="text-muted-foreground">• </span>第3步，我会落到哪一块判断或建议？
            </li>
            <li>
              <span className="text-muted-foreground">• </span>第4步，我准备回到哪条证据来应追问并收束？
            </li>
          </ul>
          <p className="text-xs text-muted-foreground leading-relaxed">
            说明：这里先做「编号定路」，不是写全文稿。所有成员顺序相同，但每一步可以讲得详一点或简一点。
          </p>
          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium text-foreground">海报讲解路径示意</p>
            <p className="text-[11px] text-muted-foreground mb-1">
              同一张海报按 1 → 2 → 3 → 4 走一条路线；下方四步同屏对照，无需横滑。
            </p>
            <PosterPathRibbonOneRow />
          </div>
        </div>
      )
    case 4:
      return (
        <div className="w-full flex flex-col items-center">
          <Card className="w-full max-w-xl bg-muted/25 border-muted text-center">
            <CardContent className="pt-5 pb-5 space-y-4 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-foreground">确认进入下一关</h3>
              <label className="flex w-full max-w-md flex-row items-start gap-3 cursor-pointer group text-left mx-auto px-1">
                <input
                  type="checkbox"
                  checked={done || understood}
                  disabled={done}
                  onChange={e => setUnderstood(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary shrink-0 mt-0.5"
                />
                <span className="text-sm leading-relaxed group-hover:text-foreground transition-colors">
                  我已经看懂固定四步流程，并且已经想好自己海报的大致讲解顺序。
                </span>
              </label>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 w-full">
                <Button
                  size="lg"
                  className="gap-2 w-full sm:w-auto"
                  disabled={saving || done || !understood}
                  onClick={handleConfirm}
                >
                  {saving ? (
                    "保存中…"
                  ) : done ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      已确认
                    </>
                  ) : (
                    <>
                      已确认，进入第2关
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
                {done && (
                  <Button variant="outline" onClick={() => navigate("/module/3/lesson/6/step/2")}>
                    前往第2关
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    default:
      return null
  }
}

export default function Step1ExampleAnalysis() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [saving, setSaving] = useState(false)
  const [understood, setUnderstood] = useState(false)
  const [openDialogIndex, setOpenDialogIndex] = useState<number | null>(null)
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null)
  /** 已按顺序关闭弹窗计数的步数，达到 FLIP_STEP_COUNT 后第3页可进入下一页 */
  const [sequentialStepsCompleted, setSequentialStepsCompleted] = useState(0)

  const done = portfolio?.lesson6.exampleAcknowledged ?? false

  const handleCardActivate = useCallback(
    (i: number) => {
      // 仅未解锁的后续步不可点；当前步与已读完的步骤均可点开（后者可重复查看弹窗）
      if (i > sequentialStepsCompleted) return
      setFlippedIndex(i)
      window.setTimeout(() => setOpenDialogIndex(i), 220)
    },
    [sequentialStepsCompleted]
  )

  const handleDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setOpenDialogIndex(prevOpen => {
        if (prevOpen !== null) {
          setSequentialStepsCompleted(c =>
            prevOpen === c ? Math.min(c + 1, FLIP_STEP_COUNT) : c
          )
        }
        return null
      })
      window.setTimeout(() => setFlippedIndex(null), 320)
    }
  }, [])

  const handleConfirm = async () => {
    if (!portfolio || saving || !understood) return
    setSaving(true)
    try {
      await savePortfolio({
        ...portfolio,
        pointer: advancePointer(portfolio.pointer, 6, 2),
        lesson6: {
          ...portfolio.lesson6,
          exampleAcknowledged: true,
        },
      })
      navigate("/module/3/lesson/6/step/2")
    } finally {
      setSaving(false)
    }
  }

  if (!portfolio) {
    return <p className="text-sm text-muted-foreground">正在加载档案…</p>
  }

  const flipPageIndex = 2
  const flipStepsAllDone = sequentialStepsCompleted >= FLIP_STEP_COUNT
  const canPrev = page > 0
  const canNext =
    page < PAGE_COUNT - 1 && (page !== flipPageIndex || flipStepsAllDone)
  const side = DECK_SIDE_HINTS[page] ?? { prev: "", next: "" }
  const openMeta = openDialogIndex !== null ? LESSON6_ROADSHOW_META[openDialogIndex] : null

  const slideProps: SlideProps = {
    handleCardActivate,
    flippedIndex,
    openDialogIndex,
    sequentialStepsCompleted,
    done,
    understood,
    setUnderstood,
    saving,
    handleConfirm,
    navigate,
  }

  /** 滑轨宽度为视口的 PAGE_COUNT 倍，translateX 按页移动（纯 CSS，无需插件） */
  const trackWidthPct = PAGE_COUNT * 100
  const translatePct = (page * 100) / PAGE_COUNT

  return (
    <div className="w-full max-w-[min(100%,110rem)] mx-auto px-1.5 sm:px-3 pb-6">
      <div
        className={cn(
          "flex flex-col justify-center min-h-[min(82vh,920px)]",
          "py-4 md:py-6"
        )}
      >
        <div className="flex items-stretch justify-center gap-1 sm:gap-2 md:gap-3 w-full max-w-[min(100%,110rem)] mx-auto">
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

          <main className="flex min-w-0 flex-1 flex-col rounded-xl border bg-card/60 shadow-md px-2 py-4 sm:px-5 sm:py-6 lg:px-8 xl:px-10">
            {/* 横向滑页：overflow 裁剪 + transform 平移动画 */}
            <div className="overflow-hidden w-full rounded-lg flex-1 flex flex-col justify-center min-h-[min(58vh,640px)]">
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
                {Array.from({ length: PAGE_COUNT }, (_, i) => (
                  <div
                    key={i}
                    className="w-1/5 shrink-0 min-w-0 box-border px-1 sm:px-3 md:px-5 py-2 flex min-h-[min(52vh,560px)] items-center"
                  >
                    {renderSlide(i, slideProps)}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-[11px] text-muted-foreground tabular-nums pt-2 shrink-0">
              第 {page + 1} / {PAGE_COUNT} 页
              {side.next ? (
                <span className="text-muted-foreground/80"> · 下一主题：{side.next}</span>
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
              title={
                page === flipPageIndex && !flipStepsAllDone
                  ? "请先在第3页按顺序读完四步（关闭每步弹窗）后再进入下一页"
                  : undefined
              }
              onClick={() => setPage(p => Math.min(PAGE_COUNT - 1, p + 1))}
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

      <Dialog open={openDialogIndex !== null} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto sm:max-w-xl">
          {openMeta && (
            <>
              <DialogHeader>
                <DialogTitle>
                  第{openMeta.step}步 · {openMeta.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">本步任务：</span>
                  <p className="mt-1">{openMeta.task}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">建议句式：</span>
                  <p className="mt-1 whitespace-pre-line font-medium">{openMeta.suggestedPhrases}</p>
                </div>
                <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  常见错误：{openMeta.mistake}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
