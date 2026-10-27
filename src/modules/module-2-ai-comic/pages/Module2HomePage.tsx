/**
 * 文件说明：模块 2 首页。
 * 职责：介绍模块目标、按有无本机档案展示六课时课卡，并按课时 1 进度显示中间主按钮（不要求先登记身份）。进行中进入当前可访问的一关，已完成进入第 4 关；课时 2—6 不能从这里跳入。没有档案时提示用右上角导入学习包。另提供教师讲解口令入口。课时 1 卡片在有档案且可进入时，进入按钮与阶段快照都占满整行；快照为绿色描边，未完成时不可点，并在按钮下旁注。
 * 更新触发：课时开放状态、课卡徽章与标题、首页续学入口、课卡按钮文案、课卡阶段快照、教师入口或身份登记策略变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { ArrowRight, CheckCircle2, Construction, Eye, GraduationCap, Images, Lock } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { useModule2State } from "@/modules/module-2-ai-comic/app/providers/Module2Provider"
import {
  canAccessModule2Lesson,
  isModule2LessonAvailable,
  MODULE2_LESSON_REGISTRY,
} from "@/modules/module-2-ai-comic/app/lesson-registry"
import { verifyModule2TeacherPassphrase } from "@/modules/module-2-ai-comic/constants/teacher-passphrase"
import { Lesson1StageSnapshotButton } from "@/modules/module-2-ai-comic/features/global-actions/Lesson1StageSnapshotButton"
import { getModule2LessonCardSnapshotButton } from "@/modules/module-2-ai-comic/features/global-actions/lesson1-stage-snapshot"
import { MODULE2_CONFIG } from "@/modules/module-2-ai-comic/module.config"
import { resolveModule2HomeContinue } from "@/modules/module-2-ai-comic/pages/module2-home-continue"

const LESSON1_ENTRY = "/module/2/lesson/1"

/** 没有本机档案时课卡只写课时号；有档案后与模块一相同：已完成、进行中、未解锁、待开发。 */
function module2LessonCardBadge(
  hasArchive: boolean,
  lessonId: number,
  available: boolean,
  complete: boolean,
  accessible: boolean,
): string {
  if (!hasArchive) return `课时 ${lessonId}`
  if (complete) return "已完成"
  if (accessible) return "进行中"
  if (available) return "未解锁"
  return "待开发"
}

function module2LessonCardBadgeVariant(
  hasArchive: boolean,
  available: boolean,
  complete: boolean,
  accessible: boolean,
): "default" | "secondary" | "success" {
  if (!hasArchive) return available ? "default" : "secondary"
  if (complete) return "success"
  if (accessible) return "default"
  return "secondary"
}

function TeacherModeEntry() {
  const { enterTeacherMode } = useModule2State()
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showInput, setShowInput] = useState(false)

  const handleEnter = () => {
    if (verifyModule2TeacherPassphrase(password)) {
      enterTeacherMode()
      navigate("/module/2")
      return
    }
    setError("口令错误，请重试")
    setPassword("")
  }

  return (
    <Card className="mx-auto max-w-md border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <GraduationCap className="h-5 w-5" />
          教师讲解模式
        </CardTitle>
        <CardDescription className="text-amber-700/80">
          可浏览课时 1 全部关卡做课堂演示，不写入学生本机档案
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showInput ? (
          <Button
            variant="outline"
            className="w-full border-amber-400 text-amber-800 hover:bg-amber-100"
            onClick={() => setShowInput(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            进入讲解模式
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="module2-teacher-passphrase" className="text-sm font-medium text-amber-800">请输入教师口令</label>
              <Input
                id="module2-teacher-passphrase"
                type="password"
                placeholder="输入口令后按回车"
                value={password}
                onChange={event => { setPassword(event.target.value); setError("") }}
                onKeyDown={event => { if (event.key === "Enter") handleEnter() }}
                autoFocus
                className="border-amber-300 focus:border-amber-500"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => { setShowInput(false); setPassword(""); setError("") }}
              >
                取消
              </Button>
              <Button
                className="flex-1 bg-amber-500 text-xs text-white hover:bg-amber-600"
                onClick={handleEnter}
                disabled={!password}
              >
                确认进入
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function Module2HomePage() {
  const { portfolio, isTeacherMode, loading, loadError } = useModule2State()
  const navigate = useNavigate()
  const homeContinue = resolveModule2HomeContinue(isTeacherMode ? null : portfolio)
  const hasArchive = Boolean(portfolio)

  if (loading && !isTeacherMode) {
    return <div className="py-24 text-center text-sm text-muted-foreground">正在读取本机学习档案...</div>
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-8">
      <section className="space-y-3 py-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Images className="h-4 w-4" />
          七年级 · 模块二
        </div>
        <h1 className="text-3xl font-bold">{MODULE2_CONFIG.subtitle}</h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
          从模块一完成的小说出发，选出起、承、转、合四个关键画面，确定角色与视觉风格，
          再借助外部 AI 绘图工具生成、比较和修改，完成一部属于自己的四格漫画。
        </p>
        <Button size="lg" onClick={() => navigate(isTeacherMode ? LESSON1_ENTRY : homeContinue.path)}>
          {isTeacherMode ? "浏览课时 1" : homeContinue.label}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
        {!isTeacherMode && homeContinue.hint && (
          <p className="text-xs text-muted-foreground">{homeContinue.hint}</p>
        )}
        {!isTeacherMode && !portfolio && !loadError && (
          <p className="text-xs text-muted-foreground">已有学习包请用右上角的「导入学习包」。</p>
        )}
        {!isTeacherMode && loadError && (
          <p className="text-xs text-destructive">{loadError}</p>
        )}
        <p className="text-xs text-muted-foreground">首次进入不需要先登记身份；第 1 关会根据你的小说文件核对班级与姓名。</p>
      </section>

      <Card className="mx-auto max-w-3xl border-dashed bg-muted/30">
        <CardContent className="flex gap-3 pt-6 text-sm text-muted-foreground">
          <Construction className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            课时 1 的四关已经可以在这台电脑上完成。课时 2—6 还没开放。
            进入课时 1 后，学习记录保存在这台电脑上。右上角可以保存或导入本模块学习包，也可以重置这台电脑上的模块二档案。
          </p>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-4 text-lg font-semibold">本模块包含 6 个课时</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MODULE2_LESSON_REGISTRY.map((lesson) => {
            const available = isModule2LessonAvailable(lesson.id)
            const accessible = canAccessModule2Lesson(portfolio, lesson.id, isTeacherMode)
            const complete = lesson.isComplete(portfolio)
            const snapshotButton = getModule2LessonCardSnapshotButton(lesson.id, {
              available,
              completed: complete,
            })
            const showActions = hasArchive && accessible
            return (
              <Card key={lesson.id} className={!available ? "opacity-65" : ""}>
                <CardHeader className={hasArchive ? undefined : "pb-3"}>
                  <div className="flex items-center justify-between">
                    <Badge variant={module2LessonCardBadgeVariant(hasArchive, available, complete, accessible)}>
                      {module2LessonCardBadge(hasArchive, lesson.id, available, complete, accessible)}
                    </Badge>
                    {!hasArchive
                      ? !available && <Lock className="h-4 w-4 text-muted-foreground" />
                      : complete
                        ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                        : !accessible && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <CardTitle className={hasArchive ? "text-base" : "mt-2 text-base"}>
                    {hasArchive ? `课时 ${lesson.id}：${lesson.title}` : lesson.title}
                  </CardTitle>
                  <CardDescription className={hasArchive ? undefined : "text-xs"}>{lesson.subtitle}</CardDescription>
                </CardHeader>
                {showActions && (
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full" onClick={() => navigate(lesson.id === 1 ? LESSON1_ENTRY : lesson.path)}>
                      {isTeacherMode ? "浏览本课" : complete ? "查看本课" : "进入课时"}
                    </Button>
                    {snapshotButton.visible && portfolio && (
                      <div>
                        <Lesson1StageSnapshotButton
                          portfolio={portfolio}
                          enabled={snapshotButton.enabled}
                          disabledHint={snapshotButton.hint}
                          className="w-full"
                        />
                        {!snapshotButton.enabled && (
                          <p className="mt-1 text-xs text-muted-foreground">{snapshotButton.hint}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </section>

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <h2 className="mb-3 text-sm font-semibold">闯关须知</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />请先在模块一「我的小说」下载自己的小说，课时 1 第 1 关会用到它。</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />图片在课堂指定的外部 AI 工具中生成；本模块负责规划画面、记录提示词与版本、比较修改。</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />每关完成后才会解锁下一关；完成按钮只代表信息填写齐全，作品质量由老师和你一起检查。</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />完成课时 1 后，可以在本课卡片或完成弹窗下载阶段快照交作业。阶段快照不能恢复进度，换设备请用学习包。</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />当前只开放课时 1 的入口，课时 2—6 还没开放。</li>
          </ul>
        </CardContent>
      </Card>

      {isTeacherMode ? (
        <Card className="bg-amber-50">
          <CardContent className="pt-6 text-sm text-amber-900">
            教师讲解模式使用独立演示状态，演示操作不会写入、覆盖或清除本机学生档案。
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-xs text-muted-foreground">教师入口</span>
            </div>
          </div>
          <TeacherModeEntry />
        </>
      )}
    </div>
  )
}
