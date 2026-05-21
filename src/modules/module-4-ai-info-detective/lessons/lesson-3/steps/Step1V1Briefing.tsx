/**
 * 文件说明：模块 4 课时 3 第 1 步页面。
 * 职责：以正向 V1 启动页引导学生明确今天要完成的两张题卡初稿，展示任务路径、题卡结构与课时 2 素材摘要，并确认后进入新闻题卡编辑器。
 * 更新触发：Step1 分屏文案、流程示意、素材摘要字段、CTA 文案或进入第 2 步写入策略变化时，需要同步更新本文件。
 */

import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardCheck,
  FileImage,
  FolderOpen,
  ImageIcon,
  LayoutTemplate,
  Link2,
  ListChecks,
  Newspaper,
  type LucideIcon,
} from "lucide-react"
import type { Module4MaterialKind, Module4MaterialScreeningRecord } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/utils/cn"
import { Lesson3ScreenPage, Lesson3ScreenSection } from "../components/Lesson3ScreenLayout"
import { LESSON3_SOURCE_TYPE_LABELS } from "../data/default-options"
import { getLesson2MaterialReadinessLabel } from "../utils/get-lesson2-material-readiness"

const MISSION_CARDS = [
  {
    icon: Newspaper,
    title: "带入素材",
    text: "从课时 2 读取新闻素材和图片素材，作为两张题卡的展示内容。",
    accent: "from-blue-500/15 to-indigo-500/5",
  },
  {
    icon: FileImage,
    title: "制作题卡",
    text: "填写判断任务、正确答案和核心解析，让同学能作答、能讨论。",
    accent: "from-violet-500/15 to-purple-500/5",
  },
  {
    icon: ArrowRight,
    title: "保存初稿",
    text: "预览两张题卡并保存为 V1，为后续迭代打好结构基础。",
    accent: "from-amber-500/15 to-orange-500/5",
  },
] as const

const CARD_PARTS = [
  { label: "素材展示", hint: "展示新闻或图片原文" },
  { label: "判断任务", hint: "给出可作答的三选项" },
  { label: "核心解析", hint: "说明判断依据与讨论点" },
  { label: "来源与核验入口", hint: "记录来源并支持继续核验" },
] as const

const HERO_CARD_PARTS = [
  { label: "素材展示", icon: ImageIcon },
  { label: "判断任务", icon: ListChecks },
  { label: "核心解析", icon: BookOpenCheck },
  { label: "来源与核验入口", icon: Link2 },
] as const satisfies ReadonlyArray<{ label: string; icon: LucideIcon }>

const HERO_FOCUS_BLOCKS = [
  {
    text: "你已经在课时 2 完成了新闻素材和图片素材的体检。",
    icon: ClipboardCheck,
    accent: "border-sky-200/90 bg-sky-50/90 text-sky-950 dark:border-sky-800/60 dark:bg-sky-950/35 dark:text-sky-50",
    iconWrap: "bg-sky-500/15 text-sky-700 dark:bg-sky-400/20 dark:text-sky-300",
  },
  {
    text: "今天，你要把它们加工成两张可以让同学作答的 AI 信息辨识题卡。",
    icon: LayoutTemplate,
    accent: "border-violet-200/90 bg-violet-50/90 text-violet-950 dark:border-violet-800/60 dark:bg-violet-950/35 dark:text-violet-50",
    iconWrap: "bg-violet-500/15 text-violet-700 dark:bg-violet-400/20 dark:text-violet-300",
  },
] as const

const HERO_FLOW_NODES = [
  { label: "新闻截图卡", icon: Newspaper },
  { label: "图片素材卡", icon: ImageIcon },
  { label: "题卡预览框", icon: LayoutTemplate },
  { label: "V1 文件夹", icon: FolderOpen },
] as const satisfies ReadonlyArray<{ label: string; icon: LucideIcon }>

function V1HeroFocusPanel() {
  return (
    <div className="space-y-4">
      <p className="text-xl font-bold tracking-wide text-primary md:text-2xl">今天聚焦</p>
      {HERO_FOCUS_BLOCKS.map(block => {
        const Icon = block.icon
        return (
          <div
            key={block.text}
            className={cn("flex items-center gap-4 rounded-2xl border p-4 shadow-sm md:p-5", block.accent)}
          >
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                block.iconWrap,
              )}
              aria-hidden
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <p className="text-pretty text-sm leading-7 md:text-base">{block.text}</p>
          </div>
        )
      })}
      <div className="rounded-2xl border border-amber-200/90 bg-amber-50/90 p-4 shadow-sm dark:border-amber-800/60 dark:bg-amber-950/35 md:p-5">
        <p className="text-sm leading-7 text-amber-950 dark:text-amber-50 md:text-base">
          每张题卡都会包含：
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {HERO_CARD_PARTS.map(part => {
            const PartIcon = part.icon
            return (
              <span
                key={part.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-amber-950 shadow-sm dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-50 md:text-sm"
              >
                <PartIcon className="h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-300" strokeWidth={2} />
                {part.label}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function V1HeroFlowDiagram() {
  return (
    <div
      className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-white/80 bg-white/90 p-5 shadow-xl backdrop-blur md:max-w-md md:p-6"
      aria-hidden
    >
      {HERO_FLOW_NODES.map((node, index) => {
        const Icon = node.icon
        return (
          <div key={node.label} className="flex w-full flex-col items-center">
            <div className="flex w-full items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="text-base font-semibold text-primary">{node.label}</span>
            </div>
            {index < HERO_FLOW_NODES.length - 1 && (
              <svg viewBox="0 0 24 28" className="my-1 h-7 w-6 shrink-0" aria-hidden>
                <defs>
                  <linearGradient id={`lesson3-flow-line-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary) / 0.35)" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" />
                  </linearGradient>
                </defs>
                <line
                  x1="12"
                  y1="2"
                  x2="12"
                  y2="20"
                  stroke={`url(#lesson3-flow-line-${index})`}
                  strokeWidth="2"
                />
                <polygon points="8,20 12,26 16,20" fill="hsl(var(--primary))" />
              </svg>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MiniQuestionCardDiagram() {
  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border-2 border-primary/20 bg-white p-4 shadow-xl">
      <div className="space-y-2">
        {CARD_PARTS.map((part, index) => (
          <div
            key={part.label}
            className={cn(
              "relative rounded-2xl border px-4 py-3",
              index === 0 && "border-blue-200 bg-blue-50/80",
              index === 1 && "border-violet-200 bg-violet-50/80",
              index === 2 && "border-amber-200 bg-amber-50/80",
              index === 3 && "border-emerald-200 bg-emerald-50/80",
            )}
          >
            <p className="text-sm font-semibold text-foreground">{part.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{part.hint}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        每张题卡都由以上四部分构成，新闻题卡与图片题卡结构相同。
      </p>
    </div>
  )
}

function MaterialSummaryCard({
  kind,
  record,
}: {
  kind: Module4MaterialKind
  record: Module4MaterialScreeningRecord
}) {
  const title = kind === "news" ? "新闻素材" : "图片素材"
  const readiness = getLesson2MaterialReadinessLabel(record)
  const ready = readiness === "已就绪"

  return (
    <Card className="border-white/70 bg-white/90 shadow-xl backdrop-blur">
      <CardContent className="space-y-4 p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-primary">{title}</p>
            <h3 className="mt-1 text-lg font-semibold">{record.titleOrName || "尚未填写短名"}</h3>
          </div>
          <Badge variant={ready ? "success" : "warning"}>{readiness}</Badge>
        </div>
        <div className="overflow-hidden rounded-2xl border bg-muted/30">
          {record.asset?.dataUrl ? (
            <img
              src={record.asset.dataUrl}
              alt={`${title}缩略图`}
              className="max-h-48 w-full object-contain"
            />
          ) : (
            <div className="flex min-h-[10rem] flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="h-10 w-10 opacity-40" />
              <p className="text-sm">暂无素材缩略图</p>
            </div>
          )}
        </div>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">来源类型</dt>
            <dd className="font-medium">
              {record.sourceType ? LESSON3_SOURCE_TYPE_LABELS[record.sourceType] : "未选择"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">初步疑点</dt>
            <dd className="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6">
              {record.clueNote.trim() || "尚未填写线索笔记"}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

export default function Step1V1Briefing() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()

  if (!portfolio) return null

  const lesson2 = portfolio.lesson2

  const startEditing = () => {
    const now = new Date().toISOString()
    void savePortfolio({
      ...portfolio,
      progress: { lessonId: 3, stepId: 2 },
      lesson3: {
        ...portfolio.lesson3,
        step1Acknowledged: true,
        step1AcknowledgedAt: now,
      },
    })
    navigate("/module/4/lesson/3/step/2")
  }

  return (
    <Lesson3ScreenPage>
      <Lesson3ScreenSection
        id="lesson3-step1-hero"
        bgClassName="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-background to-background"
      >
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-5">
            <p className="text-balance text-3xl font-bold tracking-[0.06em] text-primary md:text-4xl">
              第1步 · 启动 V1 制作
            </p>
            <V1HeroFocusPanel />
          </div>
          <div className="flex justify-center lg:justify-end">
            <V1HeroFlowDiagram />
          </div>
        </div>
      </Lesson3ScreenSection>

      <Lesson3ScreenSection
        id="lesson3-step1-mission"
        bgClassName="bg-gradient-to-b from-background via-violet-50/60 to-blue-50"
      >
        <div className="mx-auto w-full max-w-7xl space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">今日任务地图</h2>
            <p className="text-muted-foreground md:text-lg">按顺序完成以下三步，即可拿到两张 V1 题卡初稿。</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {MISSION_CARDS.map((card, index) => {
              const Icon = card.icon
              return (
                <Card
                  key={card.title}
                  className={cn(
                    "border-white/70 bg-gradient-to-br shadow-xl backdrop-blur",
                    card.accent,
                  )}
                >
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-primary shadow-sm">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold">{card.title}</h3>
                    <p className="text-sm leading-7 text-muted-foreground">{card.text}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </Lesson3ScreenSection>

      <Lesson3ScreenSection
        id="lesson3-step1-card-structure"
        bgClassName="bg-gradient-to-b from-blue-50 via-amber-50/50 to-background"
      >
        <div className="mx-auto w-full max-w-7xl space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">好题卡长什么样</h2>
            <p className="text-muted-foreground md:text-lg">
              每张 V1 题卡都包含四个部分，让同学能看素材、做判断、读解析、继续核验。
            </p>
          </div>
          <MiniQuestionCardDiagram />
        </div>
      </Lesson3ScreenSection>

      <Lesson3ScreenSection
        id="lesson3-step1-materials"
        bgClassName="bg-gradient-to-b from-orange-50/60 via-background to-indigo-50/40"
      >
        <div className="mx-auto w-full max-w-7xl space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">我的起步素材</h2>
            <p className="text-muted-foreground md:text-lg">
              以下两份素材来自课时 2 体检记录，将分别用于新闻题卡与图片题卡。
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <MaterialSummaryCard kind="news" record={lesson2.news} />
            <MaterialSummaryCard kind="image" record={lesson2.image} />
          </div>
          <div className="flex flex-col items-center gap-3 pb-4">
            <Button size="lg" className="gap-2 rounded-full px-8" onClick={startEditing}>
              开始制作新闻题卡 V1
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Lesson3ScreenSection>
    </Lesson3ScreenPage>
  )
}
