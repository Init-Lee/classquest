/**
 * 文件说明：模块 4 课时 1 第 5 关出口任务单页面。
 * 职责：让学生明确下节课要带来的新闻类/图片类候选素材包、来源记录方式和不适宜素材边界，通过底部单次总勾选确认「避免使用素材」与「出口说明」已阅读，并完成课时 1。
 * 更新触发：候选素材包字段、来源类型选项、出口确认呈现方式（左右分栏 + 总勾选）、禁用素材提醒或 Step 5 状态字段变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertTriangle, CheckCircle2, FileText, ImageIcon, ListChecks } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import {
  createEmptyModule4Lesson1Step5State,
  type Module4Lesson1ImageSourceType,
  type Module4Lesson1NewsSourceType,
  type Module4Lesson1Step5State,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Lesson1StepLayout } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/components/Lesson1StepLayout"
import { cn } from "@/shared/utils/cn"

const NEWS_SOURCE_OPTIONS: Array<{ value: Module4Lesson1NewsSourceType; label: string }> = [
  { value: "news_site", label: "新闻网站" },
  { value: "wechat_article", label: "公众号文章" },
  { value: "social_screenshot", label: "社交平台截图" },
  { value: "other", label: "其他" },
]

const IMAGE_SOURCE_OPTIONS: Array<{ value: Module4Lesson1ImageSourceType; label: string }> = [
  { value: "web", label: "网络来源" },
  { value: "ai_generated", label: "AI 生成" },
  { value: "field_capture", label: "现场采集" },
  { value: "mixed", label: "混合加工" },
]

const SOURCE_TYPE_GUIDES = [
  { title: "网络来源", description: "填写网页链接、平台名称或截图来源。" },
  { title: "AI 生成", description: "保留 Prompt 摘要、生成工具名称或生成记录截图。" },
  { title: "现场采集", description: "记录拍摄时间、地点和采集方式。" },
  { title: "混合加工", description: "说明是否经过改写、拼接、二次生成或后期处理。" },
]

const AVOID_MATERIALS = [
  "涉及隐私的人脸、聊天记录、同学照片",
  "血腥、暴力、低俗或引战内容",
  "看不出来源、无法说明出处的截图",
  "只有标题、没有正文或上下文的材料",
  "过于模糊、无法观察细节的图片",
]

/** 出口说明要点（只读展示，与底部总勾选一并确认） */
const EXIT_CONFIRM_POINTS = [
  "我知道要准备 1 份新闻类候选素材包",
  "我知道要准备 1 份图片类候选素材包",
  "我会保留来源链接或生成记录",
  "我会避免不适宜素材",
]

function isStep5Completed(step5: Module4Lesson1Step5State): boolean {
  return (
    step5.newsPlanText.trim().length > 0
    && step5.imagePlanText.trim().length > 0
    && Boolean(step5.newsPossibleSourceType)
    && Boolean(step5.imagePossibleSourceType)
    && step5.exitAndAvoidAcknowledged
  )
}

export default function Step5TaskChecklist() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const [step5, setStep5] = useState<Module4Lesson1Step5State>(() => portfolio?.lesson1.step5 ?? createEmptyModule4Lesson1Step5State())

  if (!portfolio) return null

  const canComplete = isStep5Completed(step5)

  const handleComplete = async () => {
    if (!canComplete) return
    const now = new Date().toISOString()
    const completedStep5: Module4Lesson1Step5State = {
      ...step5,
      newsPlanText: step5.newsPlanText.trim(),
      imagePlanText: step5.imagePlanText.trim(),
      exitAndAvoidAcknowledged: true,
      confirmed: {
        prepareNewsPack: true,
        prepareImagePack: true,
        keepSourceRecord: true,
        avoidUnsuitableMaterial: true,
      },
      completed: true,
    }
    await savePortfolio({
      ...portfolio,
      progress: { lessonId: 2, stepId: 1 },
      lesson1: {
        ...portfolio.lesson1,
        step5: completedStep5,
        personalTaskChecklistCompleted: true,
        materialPrepChecklistKeys: ["prepareNewsPack", "prepareImagePack", "keepSourceRecord", "avoidUnsuitableMaterial", "exitAndAvoid"],
        materialPrepChecklistCompletedAt: portfolio.lesson1.materialPrepChecklistCompletedAt || now,
        newsSourcePlan: completedStep5.newsPlanText,
        imageSourcePlan: completedStep5.imagePlanText,
        completed: true,
      },
    })
    navigate("/module/4?lesson1=completed")
  }

  return (
    <Lesson1StepLayout
      title="第5关 · 领取素材准备任务"
      titleClassName="text-balance tracking-[0.06em] text-primary"
      subtitle="不是随便找一张图，而是准备能被判断、能被说明、能被核验的素材。"
      footer={(
        <Button onClick={handleComplete} disabled={!canComplete} className="gap-1.5">
          <CheckCircle2 className="h-4 w-4" />
          完成课时1
        </Button>
      )}
    >
      <section className="rounded-[2rem] border bg-gradient-to-br from-primary/10 via-background to-amber-50 p-6 dark:to-amber-950/20">
        <p className="text-sm font-semibold text-primary">本关目标</p>
        <h3 className="mt-2 text-2xl font-bold">下节课，请带来两份候选素材包</h3>
        <div className="mt-4 grid gap-4 text-sm leading-relaxed text-muted-foreground md:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border bg-white/80 p-4 dark:bg-slate-950/80">
            <p className="font-semibold text-foreground">你要为下节课准备：</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>新闻类候选素材包</li>
              <li>图片类候选素材包</li>
            </ol>
          </div>
          <div className="rounded-2xl border bg-white/80 p-4 dark:bg-slate-950/80">
            <p className="font-semibold text-foreground">每份素材包都要能回答三个问题：</p>
            <ul className="mt-2 space-y-1">
              <li>它从哪里来？</li>
              <li>我为什么觉得它值得判断？</li>
              <li>别人能不能核验？</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <MaterialPackCard
          icon="news"
          title="新闻类候选素材包"
          items={["一张新闻网页截图", "原始网页链接", "来源名称与发布时间", "初步判断：A / B / C", "一句话说明：为什么这条新闻值得判断？"]}
          tip="尽量截到标题、来源、发布时间和正文开头。"
          label="我计划寻找的新闻主题"
          placeholder="例如：文具盲盒、校园食品、游戏充值、AI照片获奖、短视频谣言"
          value={step5.newsPlanText}
          onValueChange={(value) => setStep5(prev => ({ ...prev, newsPlanText: value }))}
          sourceLabel="我可能使用的新闻来源"
          sourceValue={step5.newsPossibleSourceType}
          sourceOptions={NEWS_SOURCE_OPTIONS}
          onSourceChange={(value) => setStep5(prev => ({ ...prev, newsPossibleSourceType: value as Module4Lesson1NewsSourceType }))}
        />
        <MaterialPackCard
          icon="image"
          title="图片类候选素材包"
          items={["一张单独的图片素材", "图片来源链接或生成记录", "来源类型说明", "初步判断：A / B / C", "一句话说明：我发现了什么可疑点？"]}
          tip="主体清楚，不要太糊，不要只截一小块。"
          label="我计划寻找的图片主题"
          placeholder="例如：AI摄影图、广告图、校园宣传图、网络热图、自己用 AI 生成的图片"
          value={step5.imagePlanText}
          onValueChange={(value) => setStep5(prev => ({ ...prev, imagePlanText: value }))}
          sourceLabel="我可能使用的图片来源"
          sourceValue={step5.imagePossibleSourceType}
          sourceOptions={IMAGE_SOURCE_OPTIONS}
          onSourceChange={(value) => setStep5(prev => ({ ...prev, imagePossibleSourceType: value as Module4Lesson1ImageSourceType }))}
        />
      </section>

      <section className="rounded-[2rem] border bg-muted/20 p-5">
        <h3 className="font-semibold">来源类型怎么写？</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {SOURCE_TYPE_GUIDES.map(source => (
            <div key={source.title} className="rounded-2xl border bg-white p-4 dark:bg-slate-950">
              <p className="text-sm font-semibold">{source.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{source.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border bg-white p-5 shadow-sm dark:bg-slate-950">
        <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
          <div className="flex h-full flex-col rounded-2xl border border-orange-200 bg-orange-50/80 p-4 dark:border-orange-900 dark:bg-orange-950/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0 text-orange-700 dark:text-orange-300" />
              <h3 className="font-semibold text-orange-950 dark:text-orange-100">请避免使用这些素材</h3>
            </div>
            <ul className="mt-4 grid flex-1 gap-2 text-sm text-orange-900 dark:text-orange-100">
              {AVOID_MATERIALS.map(item => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-600 dark:bg-orange-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex h-full flex-col rounded-2xl border bg-muted/25 p-4 dark:bg-slate-900/40">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 shrink-0 text-primary" />
              <h3 className="font-semibold">出口确认</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">确认后，本课时结束；下节课将进入「素材搜集与合规初筛」。</p>
            <ul className="mt-4 space-y-2 text-sm font-medium text-foreground">
              {EXIT_CONFIRM_POINTS.map(line => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <label
          className={cn(
            "mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border bg-muted/20 p-4 text-sm transition-all md:items-center",
            step5.exitAndAvoidAcknowledged && "border-primary/40 bg-primary/5 ring-2 ring-primary/15",
          )}
        >
          <input
            type="checkbox"
            checked={step5.exitAndAvoidAcknowledged}
            onChange={(event) => setStep5(prev => ({ ...prev, exitAndAvoidAcknowledged: event.target.checked }))}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring md:mt-0"
          />
          <span className="font-medium leading-relaxed">
            我已阅读左侧「避免使用素材」与右侧「出口确认」说明，并会在下节课按要求准备两份候选素材包。
          </span>
        </label>
      </section>
    </Lesson1StepLayout>
  )
}

function MaterialPackCard({
  icon,
  title,
  items,
  tip,
  label,
  placeholder,
  value,
  onValueChange,
  sourceLabel,
  sourceValue,
  sourceOptions,
  onSourceChange,
}: {
  icon: "news" | "image"
  title: string
  items: string[]
  tip: string
  label: string
  placeholder: string
  value: string
  onValueChange: (value: string) => void
  sourceLabel: string
  sourceValue?: string
  sourceOptions: Array<{ value: string; label: string }>
  onSourceChange: (value: string) => void
}) {
  const Icon = icon === "news" ? FileText : ImageIcon
  return (
    <article className="rounded-[2rem] border bg-white p-5 shadow-sm dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <div className="mt-5 rounded-2xl bg-muted/30 p-4">
        <p className="text-sm font-semibold">你需要准备：</p>
        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
          {items.map(item => (
            <li key={item} className="flex gap-2">
              <span className="text-primary">□</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm font-semibold">建议：</p>
        <p className="mt-1 text-sm text-muted-foreground">{tip}</p>
      </div>
      <label className="mt-5 block">
        <span className="text-sm font-semibold">{label}</span>
        <textarea
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          className="mt-2 min-h-24 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>
      <div className="mt-4">
        <p className="text-sm font-semibold">{sourceLabel}</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {sourceOptions.map(option => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all",
                sourceValue === option.value ? "border-primary bg-primary/10 text-primary" : "bg-background hover:bg-muted/40",
              )}
            >
              <input
                type="radio"
                checked={sourceValue === option.value}
                onChange={() => onSourceChange(option.value)}
                className="h-4 w-4 border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </article>
  )
}
