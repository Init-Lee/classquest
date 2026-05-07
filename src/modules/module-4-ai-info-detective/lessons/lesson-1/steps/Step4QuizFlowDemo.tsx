/**
 * 文件说明：模块 4 课时 1 第 4 关完整题卡模板页面。
 * 职责：以“说明书”方式引导学生按顺序看懂完整题卡四个模块的填写目的、字段、要求和示例，不在本关进行正式创作。
 * 更新触发：完整题卡四模块说明、模块解锁节奏、总检查清单呈现方式（底部单次总确认）、关卡标题样式与 Step 3 对齐或 Step 4 完成字段变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, BookOpenCheck, CheckCircle2, ImageIcon, Link2, ListChecks } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { Lesson1StepLayout } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/components/Lesson1StepLayout"
import { cn } from "@/shared/utils/cn"

type TemplateModuleKey = "material" | "task" | "explanation" | "source"

interface TemplateModuleGuide {
  key: TemplateModuleKey
  title: string
  shortHint: string
  icon: typeof ImageIcon
  tone: string
  purpose: string
  fields: string[]
  requirements: string[]
  example: string[]
}

const CARD_TEMPLATE_MODULES: TemplateModuleGuide[] = [
  {
    key: "material",
    title: "素材展示",
    shortHint: "让别人先看到“要判断什么”。",
    icon: ImageIcon,
    tone: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100",
    purpose: "先把要判断的内容放出来，让同学看见“对象”再开始判断。",
    fields: ["素材类型：新闻类 / 图片类", "素材文件：新闻截图或单张图片", "素材标题：一句话说明这是什么", "素材说明：可选，简短补充"],
    requirements: ["新闻截图尽量看得到标题、来源、时间。", "图片要主体清楚，不要裁得太碎。", "不要只截一小块，让别人看不懂上下文。"],
    example: ["新闻类：文具盲盒新闻网页截图。", "图片类：摄影比赛争议图片。"],
  },
  {
    key: "task",
    title: "判断任务",
    shortHint: "让别人先独立判断。",
    icon: ListChecks,
    tone: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
    purpose: "给别人一个明确问题，让别人先判断。",
    fields: ["判断问题", "选项 A / B / C", "参考答案"],
    requirements: ["问题统一围绕：“是否存在 AI 痕迹”。", "选项建议固定：A. 明显存在 AI 痕迹；B. 暂无明显 AI 痕迹；C. 证据不足，仍需核验。", "参考答案只能选一个。", "不要一题里同时问两个问题，比如“是真是假、是不是 AI”。"],
    example: ["问题：请判断这张图片是否存在 AI 痕迹。", "参考答案：A"],
  },
  {
    key: "explanation",
    title: "解析",
    shortHint: "告诉别人“判断依据是什么”。",
    icon: BookOpenCheck,
    tone: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
    purpose: "告诉别人，为什么答案是这样。",
    fields: ["核心解析 1 段", "判断依据 1～2 条", "可选：常见误判提醒"],
    requirements: ["解析要说“依据”，不能只说“我觉得”。", "要写具体观察点，例如手部异常、光影不自然、来源信息不完整，或仅凭截图不能下结论。", "解析长度不宜太长，能让同学看懂最重要。", "优秀题卡可以额外写“错误选项为什么不稳”，这是增强项，不是当前必填。"],
    example: ["这张图片来自一则关于 AI 摄影作品争议的报道。结合报道上下文和局部细节，可判断其存在明显 AI 痕迹。"],
  },
  {
    key: "source",
    title: "来源与核验入口",
    shortHint: "告诉别人“去哪里复核”。",
    icon: Link2,
    tone: "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-100",
    purpose: "告诉别人：这份素材从哪里来，别人怎么去核实。",
    fields: ["来源类型", "原始链接", "页面定位方式", "核验建议"],
    requirements: ["不能只写“网上找的”。", "要让别人真的能找到原页面。", "页面定位要能帮助别人快速找到对应内容。", "核验建议至少写 2 条。", "如果后面图片是 AI 自己生成的，可补充生成平台、提示词摘要、生成记录截图；本轮先作为后续可用项。"],
    example: ["来源类型：网络来源。", "原始链接：某新闻网页。", "页面定位：查找标题《一口气买480支笔，文具盲盒盯上小学生》。", "核验建议：查看发布时间和来源名称；阅读完整正文，不只看截图。"],
  },
] as const

/** 总检查清单：仅作回顾列表，最终只需在下方勾选一次总确认。 */
const FINAL_CHECKLIST_LINES = [
  "我知道素材展示要放什么",
  "我知道判断任务要写什么",
  "我知道解析要说明什么",
  "我知道来源与核验入口要保留什么",
] as const

export default function Step4QuizFlowDemo() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const allModuleKeys = CARD_TEMPLATE_MODULES.map(module => module.key)
  const [activeKey, setActiveKey] = useState<TemplateModuleKey>("material")
  const [completedKeys, setCompletedKeys] = useState<TemplateModuleKey[]>(
    portfolio?.lesson1.fullCardTemplateConfirmed ? allModuleKeys : [],
  )
  const [finalChecklistAcknowledged, setFinalChecklistAcknowledged] = useState(
    portfolio?.lesson1.fullCardTemplateConfirmed ?? false,
  )

  if (!portfolio) return null

  const activeModule = CARD_TEMPLATE_MODULES.find(module => module.key === activeKey) ?? CARD_TEMPLATE_MODULES[0]
  const ActiveIcon = activeModule.icon
  const activeIndex = CARD_TEMPLATE_MODULES.findIndex(module => module.key === activeKey)
  const allModulesCompleted = CARD_TEMPLATE_MODULES.every(module => completedKeys.includes(module.key))
  const canComplete = allModulesCompleted && finalChecklistAcknowledged

  const isUnlocked = (index: number) => {
    if (portfolio.lesson1.fullCardTemplateConfirmed) return true
    return index <= completedKeys.length
  }

  const getStatus = (key: TemplateModuleKey) => {
    if (completedKeys.includes(key)) return "已完成"
    if (key === activeKey) return "查看中"
    return "未查看"
  }

  const handleKnowCurrent = () => {
    const nextCompleted = completedKeys.includes(activeKey)
      ? completedKeys
      : [...completedKeys, activeKey]
    setCompletedKeys(nextCompleted)
    const nextIndex = activeIndex + 1
    if (nextIndex < CARD_TEMPLATE_MODULES.length) {
      setActiveKey(CARD_TEMPLATE_MODULES[nextIndex].key)
    }
  }

  const handleComplete = async () => {
    if (!canComplete) return
    const now = new Date().toISOString()
    await savePortfolio({
      ...portfolio,
      progress: { lessonId: 1, stepId: 5 },
      lesson1: {
        ...portfolio.lesson1,
        quizFlowSimulated: true,
        beforeAfterReason: portfolio.lesson1.beforeAfterReason || "已确认完整题卡由素材展示、判断任务、解析、来源与核验入口四部分组成。",
        fullCardTemplateConfirmed: true,
        fullCardTemplateConfirmedAt: portfolio.lesson1.fullCardTemplateConfirmedAt || now,
      },
    })
    navigate("/module/4/lesson/1/step/5")
  }

  return (
    <Lesson1StepLayout
      title="第4关 · 完整题卡长什么样？"
      titleClassName="text-balance tracking-[0.06em] text-primary"
      subtitle="这关是题卡说明书：只看懂字段、要求和示例，不在这里正式填写。"
      footer={(
        <Button onClick={handleComplete} disabled={!canComplete} className="gap-1.5">
          领取素材准备任务
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    >
      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[2rem] border bg-white p-5 shadow-sm dark:bg-slate-950">
          <p className="text-sm font-semibold text-primary">四个模块导航</p>
          <p className="mt-1 text-sm text-muted-foreground">默认按顺序查看；已完成的模块可以随时回看。</p>
          <div className="mt-5 grid gap-3">
            {CARD_TEMPLATE_MODULES.map((module, index) => {
              const Icon = module.icon
              const status = getStatus(module.key)
              const unlocked = isUnlocked(index)
              return (
                <button
                  key={module.key}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => setActiveKey(module.key)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45",
                    activeKey === module.key ? `${module.tone} ring-2 ring-primary/25` : "bg-white hover:bg-muted/40 dark:bg-slate-950",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold">{module.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{module.shortHint}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                        status === "已完成" && "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
                        status === "查看中" && "bg-primary/10 text-primary",
                        status === "未查看" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {status}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="rounded-[2rem] border bg-muted/20 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ActiveIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold text-primary">当前模块说明</p>
              <h3 className="text-2xl font-bold">{activeModule.title}</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <GuideBlock title="这个模块是干什么的" items={[activeModule.purpose]} />
            <GuideBlock title="你要填写哪些内容" items={activeModule.fields} />
            <GuideBlock title="填写要求 / 注意事项" items={activeModule.requirements} />
            <GuideBlock title="一个简短示例" items={activeModule.example} />
          </div>

          <Button type="button" className="mt-6 rounded-full px-6" onClick={handleKnowCurrent}>
            {completedKeys.includes(activeKey) ? "已知道，继续查看下一项" : "我知道了"}
          </Button>
        </aside>
      </section>

      {allModulesCompleted && (
        <section className="rounded-[2rem] border bg-green-50/70 p-5 dark:border-green-900 dark:bg-green-950/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-700 dark:text-green-300" />
            <h3 className="font-semibold text-green-900 dark:text-green-100">总检查清单</h3>
          </div>
          <p className="mt-2 text-sm text-green-800/80 dark:text-green-100/75">四个模块都看完后，请对照下面四项回顾；确认无误后在底部勾选一次即可。</p>
          <ul className="mt-4 space-y-2 rounded-2xl border border-green-200/80 bg-white/90 p-4 text-sm dark:border-green-900 dark:bg-slate-950">
            {FINAL_CHECKLIST_LINES.map(line => (
              <li key={line} className="flex gap-2 text-green-900 dark:text-green-100">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-600 dark:bg-green-400" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <label
            className={cn(
              "mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border bg-white p-4 text-sm shadow-sm dark:bg-slate-950",
              finalChecklistAcknowledged && "border-green-400 ring-2 ring-green-200 dark:border-green-700 dark:ring-green-900",
            )}
          >
            <input
              type="checkbox"
              checked={finalChecklistAcknowledged}
              onChange={(event) => setFinalChecklistAcknowledged(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="font-medium text-foreground">
              我确认已理解以上四项，可以进入下一关领取素材准备任务。
            </span>
          </label>
        </section>
      )}
    </Lesson1StepLayout>
  )
}

function GuideBlock({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="rounded-2xl border bg-white p-4 dark:bg-slate-950">
      <h4 className="font-semibold">{title}</h4>
      <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {items.map(item => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
