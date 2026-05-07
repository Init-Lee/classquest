/**
 * 文件说明：模块 4 课时 1 第 1 关任务发布页面。
 * 职责：首屏关卡任务蓝字（与第 2 关同款大号 theme 标题样式）；"欢迎"主标题与灰色说明行独立层级；第二屏左文右图（pic1 +5°）；第三屏「最终产出」左图右文（pic2 -5°）；配图均为原尺寸 95% 缩放；末屏三题横向三卡，仅点击底部按钮校验：首次失败即高亮错题快照+一句总提示，第二次及以后显示「想一想」提示；教师讲解模式下客观答案默认隐藏，可由教师按钮显示参考答案。
 * 更新触发：首屏关卡标题层级、分屏文案、配图路径、旋转/缩放、三题文案、教师讲解答案显示规则或按钮校验与错题反馈规则变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import type { Module4Lesson1MissionQuizAttempt } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Lesson1ScreenPage, Lesson1ScreenSection } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/components/Lesson1ScreenLayout"
import { cn } from "@/shared/utils/cn"
import step1Pic1 from "@/modules/module-4-ai-info-detective/lessons/lesson-1/assets/step1-pic1.jpg"
import step1Pic2 from "@/modules/module-4-ai-info-detective/lessons/lesson-1/assets/step1-pic2.jpg"

const QUESTIONS = [
  {
    id: "q1",
    prompt: "本模块最终提交物是什么？",
    answer: "B",
    options: ["A. 一段作文", "B. 两张标准题目卡", "C. 一张海报", "D. 一次聊天记录"],
    hint: "想一想：要能进入网页题库、供同学作答与核验，通常需要提交「标准化的题目卡」，而不是泛泛的一篇作文或海报。",
  },
  {
    id: "q2",
    prompt: "题目进入网页题库前需要什么？",
    answer: "B",
    options: ["A. 同学点赞", "B. 教师基础审核", "C. 自动公开", "D. 不需要任何检查"],
    hint: "集体使用的学习内容一般会先做一道「把关」，避免不当内容进入公共资源。",
  },
  {
    id: "q3",
    prompt: "每人至少提交哪两类题？",
    answer: "A",
    options: ["A. 新闻类 + 图片类", "B. 视频类 + 音频类", "C. 小说类 + 代码类", "D. 漫画类 + 游戏类"],
    hint: "对照模块名称里的两种材料：既要处理文字新闻，也要处理图像材料。",
  },
]

/** 插画：contain；旋转角度可配；统一缩放到原始视觉尺寸的 95%。 */
function ModuleIllustration({
  src,
  alt,
  rotationDeg = 5,
}: {
  src: string
  alt: string
  /** 顺时针为正，逆时针为负（如 -5） */
  rotationDeg?: number
}) {
  return (
    <div className="flex w-full max-w-xl justify-center overflow-visible p-2">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{
          transform: `rotate(${rotationDeg}deg) scale(0.95)`,
        }}
        className={cn(
          "h-auto w-full origin-center rounded-2xl object-contain shadow-2xl ring-1 ring-black/10",
          "max-h-[min(72vh,calc(var(--module4-lesson1-content-h,70dvh)-5rem))]",
        )}
      />
    </div>
  )
}

export default function Step1MissionBrief() {
  const { portfolio, savePortfolio, isTeacherMode } = useModule4Portfolio()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showTeacherAnswers, setShowTeacherAnswers] = useState(false)
  /** 点击「进入样例观察」后校验失败的累计次数（仅按钮触发，不因改选项重置） */
  const [verifyFailCount, setVerifyFailCount] = useState(0)
  /** 最近一次按钮校验失败时记录的错题 id；仅在校验失败回调里更新，改选项不会刷新 */
  const [lastVerifyWrongIds, setLastVerifyWrongIds] = useState<string[]>([])
  const [error, setError] = useState("")

  if (!portfolio) return null

  const missionAlreadyPassed = portfolio.lesson1.missionAcknowledged && portfolio.lesson1.outcomeCheckPassed
  const missionQuizAttempts = portfolio.lesson1.missionQuizAttempts
  const passedAttempt = [...missionQuizAttempts].reverse().find(attempt => attempt.passed)

  const buildMissionQuizAttempt = (passed: boolean, wrongQuestionIds: string[]): Module4Lesson1MissionQuizAttempt => ({
    attemptNo: missionQuizAttempts.length + 1,
    submittedAt: new Date().toISOString(),
    answers: Object.fromEntries(QUESTIONS.map(question => [question.id, answers[question.id] ?? ""])),
    wrongQuestionIds,
    passed,
  })

  const handleComplete = async () => {
    if (isTeacherMode) {
      navigate("/module/4/lesson/1/step/2")
      return
    }

    if (missionAlreadyPassed) {
      navigate("/module/4/lesson/1/step/2")
      return
    }

    const wrongIds = QUESTIONS.filter(question => answers[question.id] !== question.answer).map(question => question.id)
    const allCorrect = wrongIds.length === 0
    const attempt = buildMissionQuizAttempt(allCorrect, wrongIds)

    if (!allCorrect) {
      setLastVerifyWrongIds(wrongIds)
      setVerifyFailCount(prev => {
        const next = prev + 1
        if (next === 1) {
          setError("部分题目尚未答对，错题卡片已高亮，请修改选项后再次点击按钮验证。")
        } else {
          setError("仍有题目未答对，错题下方已显示「想一想」提示，请修改后再点击验证。")
        }
        return next
      })
      await savePortfolio({
        ...portfolio,
        lesson1: {
          ...portfolio.lesson1,
          missionQuizAttempts: [...missionQuizAttempts, attempt],
        },
      })
      return
    }

    setError("")
    await savePortfolio({
      ...portfolio,
      progress: portfolio.progress.lessonId === 1
        ? { lessonId: 1, stepId: Math.max(portfolio.progress.stepId, 2) }
        : portfolio.progress,
      lesson1: {
        ...portfolio.lesson1,
        missionAcknowledged: true,
        outcomeCheckPassed: true,
        missionQuizAttempts: [...missionQuizAttempts, attempt],
        missionQuizPassedAt: attempt.submittedAt,
      },
    })
    navigate("/module/4/lesson/1/step/2")
  }

  return (
    <Lesson1ScreenPage>
      {/* 第一屏：课程主题（原 Lesson1StepLayout 级标题区） */}
      <Lesson1ScreenSection bgClassName="bg-gradient-to-b from-indigo-50/95 via-background to-background dark:from-indigo-950/50">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 text-center">
          <p className="text-balance text-3xl font-bold tracking-[0.06em] text-primary md:text-4xl">
            关卡1 · 任务发布
          </p>
          <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
            欢迎进入 AI 信息辨识员训练营
          </h1>
          <p className="text-pretty text-base text-muted-foreground md:text-xl">
            先明确本模块最终要交什么，再开始观察样例。
          </p>
        </div>
      </Lesson1ScreenSection>

      {/* 第二屏：故事线 + pic1 */}
      <Lesson1ScreenSection bgClassName="bg-gradient-to-b from-background via-indigo-50/40 to-background dark:via-indigo-950/20">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">
          <div className="space-y-4">
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">模块故事线</h2>
            <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              面对一条新闻或一张图片，我们不能只问「像不像 AI 生成」，还要能说明：我为什么这样判断？证据从哪里来？别人如何核验？
            </p>
            <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              你的任务不是简单判断「像不像 AI」，而是设计一套别人能答、能讨论、能核验的辨识题目。
            </p>
          </div>
          <div className="flex min-h-0 justify-center lg:justify-end lg:pr-4">
            <ModuleIllustration src={step1Pic1} alt="模块故事线配图" />
          </div>
        </div>
      </Lesson1ScreenSection>

      {/* 第三屏：最终产出 + pic2（左图右文，图为 -5°） */}
      <Lesson1ScreenSection bgClassName="bg-gradient-to-b from-amber-50/70 via-muted/25 to-background dark:from-amber-950/30">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">
          <div className="flex min-h-0 justify-center lg:justify-start lg:pl-4">
            <ModuleIllustration src={step1Pic2} alt="最终产出配图" rotationDeg={-5} />
          </div>
          <div className="space-y-4">
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">本模块最终产出</h2>
            <ul className="space-y-3 text-base text-muted-foreground md:text-lg">
              <li className="flex gap-2"><span className="text-primary">·</span>新闻类题目卡 1 张</li>
              <li className="flex gap-2"><span className="text-primary">·</span>图片类题目卡 1 张</li>
              <li className="flex gap-2"><span className="text-primary">·</span>通过基础审核后进入班级网页题库</li>
              <li className="flex gap-2"><span className="text-primary">·</span>参与其他同学题目的匿名作答与题后快评</li>
            </ul>
          </div>
        </div>
      </Lesson1ScreenSection>

      {/* 第四屏：三题确认 */}
      <Lesson1ScreenSection bgClassName="bg-muted/35 dark:bg-muted/20">
        <div className="mx-auto w-full max-w-7xl space-y-8 px-0 sm:px-2">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">讲解完后的三题确认</h2>
            <p className="text-muted-foreground md:text-lg">
              {isTeacherMode
                ? "教师讲解模式下，答案默认隐藏；需要讲评时可手动显示参考答案。"
                : missionAlreadyPassed ? "你已完成本关确认，可以直接继续到下一关。" : "全部答对后即可进入下一关「样例观察」。"}
            </p>
            {isTeacherMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-full"
                onClick={() => setShowTeacherAnswers(prev => !prev)}
              >
                {showTeacherAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showTeacherAnswers ? "隐藏参考答案" : "显示参考答案"}
              </Button>
            )}
          </div>
          {missionAlreadyPassed && !isTeacherMode ? (
            <div className="mx-auto max-w-3xl rounded-2xl border border-green-200 bg-green-50/80 p-6 text-center shadow-sm">
              <p className="text-lg font-semibold text-green-800">第 1 关三题确认已通过</p>
              <p className="mt-2 text-sm text-green-700">
                共提交 {missionQuizAttempts.length} 次；通过时间：
                {passedAttempt?.submittedAt ? new Date(passedAttempt.submittedAt).toLocaleString("zh-CN") : "已记录"}
              </p>
              <p className="mt-3 text-sm text-green-700">
                答题记录已保存到学习档案，并会进入课时 1 阶段快照，供后续评价参考。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-5">
              {QUESTIONS.map(question => {
                const pinnedWrong = lastVerifyWrongIds.includes(question.id)
                const showHighlight = verifyFailCount >= 1 && pinnedWrong
                const showThinkHint = verifyFailCount >= 2 && pinnedWrong
                const thinkBody = question.hint.replace(/^想一想[:：]\s*/, "").trim()
                return (
                  <div
                    key={question.id}
                    className={cn(
                      "relative rounded-2xl border bg-background/90 p-4 shadow-sm backdrop-blur-sm dark:bg-background/70",
                      showHighlight
                        ? "border-amber-500 ring-2 ring-amber-400/80"
                        : "border-border/80",
                    )}
                  >
                    <p className="pr-1 font-medium text-sm leading-snug md:text-base">{question.prompt}</p>
                    {showThinkHint && (
                      <div
                        role="note"
                        className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs leading-relaxed text-amber-950 shadow-sm"
                      >
                        <span className="font-semibold text-amber-900">想一想：</span>
                        <span>{thinkBody}</span>
                      </div>
                    )}
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {question.options.map(option => {
                        const key = option.slice(0, 1)
                        const isReferenceAnswer = showTeacherAnswers && key === question.answer
                        return (
                          <label
                            key={option}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5 md:text-sm",
                              isReferenceAnswer ? "border-green-400 bg-green-50 text-green-900" : "border-input",
                            )}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              value={key}
                              checked={answers[question.id] === key}
                              onChange={() => {
                                setAnswers(prev => ({ ...prev, [question.id]: key }))
                              }}
                              className="h-4 w-4 shrink-0 accent-primary"
                            />
                            <span className="leading-snug">
                              {option}
                              {isReferenceAnswer && <span className="ml-2 text-xs font-semibold text-green-700">参考答案</span>}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              {error && <p className="col-span-full text-center text-sm text-red-600 lg:text-left">{error}</p>}
            </div>
          )}
          <div className="flex justify-center pb-8 lg:justify-end">
            <Button type="button" onClick={handleComplete} size="lg" className="gap-2 rounded-full px-10">
              {missionAlreadyPassed || isTeacherMode ? "继续第 2 关" : "进入样例观察"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Lesson1ScreenSection>
    </Lesson1ScreenPage>
  )
}
