/**
 * 文件说明：模块 4 首页。
 * 职责：与模块三首页一致的建档与课时网格流程——无档案时仅展示介绍与课时预览，须点击「开始新的闯关」登记姓名、班级与学号后两位（与只读班级前缀合成四位班学号）后方可闯关。
 * 更新触发：建档字段、课时卡片布局、进度卡或与模块三首页对齐策略变化时，需要同步更新本文件。
 */

import { useState, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import type { FormEvent } from "react"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  Lock,
  User,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Input } from "@/shared/ui/input"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { MODULE4_LESSON_REGISTRY } from "@/modules/module-4-ai-info-detective/app/lesson-registry"
import {
  createNewModule4Portfolio,
  type Module4StudentProfile,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { MODULE4_CLASS_OPTIONS } from "@/modules/module-4-ai-info-detective/constants/class-options"
import {
  composeModule4ClassSeatFromSeat,
  parseModule4ClassNumber,
  validateModule4SeatOnly,
} from "@/modules/module-4-ai-info-detective/utils/class-seat-code"
import { formatDateReadable } from "@/modules/module-4-ai-info-detective/utils/format"

/** Shell main 全宽时的首页等内容区宽度约束（与课时 2+ max-w-7xl 对齐） */
function Module4PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl px-4 py-8">{children}</div>
}

function TeacherModeEntry() {
  const { enterTeacherMode } = useModule4Portfolio()
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showInput, setShowInput] = useState(false)

  const handleEnter = () => {
    if (password === "xnwy") {
      enterTeacherMode()
      navigate("/module/4")
      return
    }
    setError("口令错误，请重试")
    setPassword("")
  }

  return (
    <Card className="max-w-md mx-auto border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <GraduationCap className="h-5 w-5" />
          教师演示模式
        </CardTitle>
        <CardDescription className="text-amber-700/80">
          浏览全部页面，预填演示数据，所有操作不影响学生数据
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showInput ? (
          <Button
            variant="outline"
            className="w-full border-amber-400 text-amber-800 hover:bg-amber-100"
            onClick={() => setShowInput(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            进入演示模式
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-amber-800">请输入教师口令</label>
              <Input
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
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs"
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

/** 登记表单草稿：学号后两位；左侧只读显示班级序号前缀，提交时合成四位 classSeatCode 入库 */
type Module4ProfileDraft = Pick<Module4StudentProfile, "clazz" | "studentName"> & { seatOnly: string }

function NewProfileForm({ onCreated }: { onCreated: () => void }) {
  const { savePortfolio } = useModule4Portfolio()
  const [form, setForm] = useState<Module4ProfileDraft>({
    clazz: "",
    studentName: "",
    seatOnly: "",
  })
  const [saving, setSaving] = useState(false)
  const [seatError, setSeatError] = useState("")

  const seatValidation = validateModule4SeatOnly(form.clazz, form.seatOnly)
  const isValid = Boolean(
    form.clazz && form.studentName.trim() && form.seatOnly.replace(/\D/g, "").length === 2 && !seatValidation,
  )
  const classPrefixDisplay = (() => {
    const n = parseModule4ClassNumber(form.clazz)
    return n !== null ? String(n).padStart(2, "0") : null
  })()

  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const err = validateModule4SeatOnly(form.clazz, form.seatOnly)
    if (err) {
      setSeatError(err)
      return
    }
    setSaving(true)
    try {
      const classSeatCode = composeModule4ClassSeatFromSeat(form.clazz, form.seatOnly)
      const portfolio = createNewModule4Portfolio({
        clazz: form.clazz,
        studentName: form.studentName.trim(),
        classSeatCode,
      })
      await savePortfolio(portfolio)
      onCreated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          先登记你的身份
        </CardTitle>
        <CardDescription>系统会记住你的信息，方便后续保存和恢复进度</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              班级
              {" "}
              <span className="text-destructive">*</span>
            </label>
            <select
              value={form.clazz}
              onChange={(event) => {
                setForm(f => ({ ...f, clazz: event.target.value }))
                setSeatError("")
              }}
              required
              className={selectClass}
            >
              <option value="">请选择班级</option>
              {MODULE4_CLASS_OPTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              姓名
              {" "}
              <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="你的名字"
              value={form.studentName}
              onChange={event => setForm(f => ({ ...f, studentName: event.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              班学号
              {" "}
              <span className="text-destructive">*</span>
            </label>
            <div className="flex items-stretch gap-2">
              <div
                className="flex h-10 min-w-[3.25rem] shrink-0 items-center justify-center rounded-md border border-input bg-muted px-3 font-mono text-sm font-semibold tabular-nums text-foreground"
                title={classPrefixDisplay ? `班级序号 ${classPrefixDisplay}` : undefined}
              >
                {classPrefixDisplay ?? "—"}
              </div>
              <Input
                className="flex-1 min-w-0 font-mono tabular-nums"
                inputMode="numeric"
                placeholder="后两位：01～50"
                maxLength={2}
                value={form.seatOnly}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "").slice(0, 2)
                  setForm(f => ({ ...f, seatOnly: digits }))
                  setSeatError("")
                }}
                aria-describedby="module4-student-no-hint"
                aria-label="班学号后两位（班级序号已在左侧显示）"
              />
            </div>
            <p id="module4-student-no-hint" className="text-xs text-muted-foreground">
              左侧为班级序号（随所选班级自动显示，无需填写）；右侧填写班内学号后两位（01～50），合成为档案中的四位班学号。
            </p>
            {seatError && <p className="text-xs text-red-600">{seatError}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={!isValid || saving}>
            {saving ? "创建中..." : "开始闯关"}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function Module4HomePage() {
  const { portfolio, loading, isTeacherMode } = useModule4Portfolio()
  const navigate = useNavigate()
  const location = useLocation()
  const [showNewForm, setShowNewForm] = useState(false)

  const lesson1Completed = Boolean(portfolio?.lesson1.completed)
  const showCompletionHint = lesson1Completed || new URLSearchParams(location.search).get("lesson1") === "completed"
  const showTeacherEntry = !isTeacherMode

  const handleCreated = () => {
    navigate("/module/4/lesson/1/step/1")
  }

  const handleContinueLearning = () => {
    if (!portfolio) return
    if (portfolio.progress.lessonId === 1) {
      navigate(`/module/4/lesson/1/step/${portfolio.progress.stepId}`)
      return
    }
    navigate("/module/4")
  }

  if (loading) {
    return (
      <Module4PageContainer>
        <div className="py-24 text-center text-sm text-muted-foreground">
          加载中...
        </div>
      </Module4PageContainer>
    )
  }

  if (!portfolio && !isTeacherMode && !showNewForm) {
    return (
      <Module4PageContainer>
      <div className="space-y-10">
        <div className="text-center space-y-3 py-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
            <BookOpen className="h-4 w-4" />
            七年级 · 模块四
          </div>
          <h1 className="text-3xl font-bold text-foreground">AI 信息辨识员</h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            围绕新闻与图片中的 AI 痕迹判断，完成题卡创作、基础审核、匿名试答与班级题库发布。
            闯关前请先登记身份。
          </p>
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <Button onClick={() => setShowNewForm(true)} size="lg">
              开始新的闯关
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            已有进度？请使用右上角的「导入进度」按钮
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">本模块包含 6 个课时</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULE4_LESSON_REGISTRY.map(lesson => (
              <Card key={lesson.id} className={lesson.available ? "" : "opacity-60"}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={lesson.available ? "default" : "secondary"}>
                      课时
                      {lesson.id}
                    </Badge>
                    {!lesson.available && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <CardTitle className="text-base mt-2">{lesson.title}</CardTitle>
                  <CardDescription className="text-xs">{lesson.subtitle}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3 text-sm">闯关须知</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                首次闯关请先点击「开始新的闯关」登记姓名、班级与班学号
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                随时可以「保存进度」，换电脑也能继续学习
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                关键节点可生成「阶段快照」，用于提交作业
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                每关完成后才能进入下一关，按提示一步步来
              </li>
            </ul>
          </CardContent>
        </Card>

        {showTeacherEntry && (
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
      </Module4PageContainer>
    )
  }

  if (!portfolio && !isTeacherMode && showNewForm) {
    return (
      <Module4PageContainer>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">新建你的学习档案</h1>
            <p className="text-muted-foreground text-sm mt-1">填写后系统会记住你，随时可以保存和恢复进度</p>
          </div>
          <NewProfileForm onCreated={handleCreated} />
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              ← 返回首页
            </button>
          </div>
        </div>
      </Module4PageContainer>
    )
  }

  if (!portfolio) {
    return null
  }

  return (
    <Module4PageContainer>
    <div className="space-y-8">
      <div className="text-center space-y-2 py-4">
        <Badge variant={lesson1Completed ? "default" : "secondary"} className="gap-1.5">
          {lesson1Completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
          {lesson1Completed ? "课时1已完成" : "学习中"}
        </Badge>
        <h1 className="text-2xl font-bold">
          欢迎回来，
          {portfolio.student.studentName}
          ！
        </h1>
        <p className="text-muted-foreground text-sm">继续你的闯关之旅吧</p>
      </div>

      {showCompletionHint && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-sm text-green-800">
            课时1已完成。下一课将进入「素材搜集与合规初筛」。
          </CardContent>
        </Card>
      )}

      <Card className="max-w-lg mx-auto border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-primary">当前进度</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">姓名：</span>
              {portfolio.student.studentName}
            </div>
            <div>
              <span className="text-muted-foreground">班级：</span>
              {portfolio.student.clazz || "—"}
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">班学号：</span>
              {portfolio.student.classSeatCode || "—"}
            </div>
          </div>
          <div className="border-t pt-3 text-sm">
            <p className="font-medium">
              当前在：
              <span className="text-primary">
                课时
                {portfolio.progress.lessonId}
                {" "}
                · 第
                {portfolio.progress.stepId}
                关
              </span>
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              上次保存：
              {formatDateReadable(portfolio.updatedAt)}
            </p>
          </div>
          <Button className="w-full" onClick={handleContinueLearning}>
            继续闯关
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">全部课时</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULE4_LESSON_REGISTRY.map((lesson) => {
            const isCompleted = lesson.isComplete(portfolio)
            const isCurrent = lesson.id === portfolio.progress.lessonId

            return (
              <Card
                key={lesson.id}
                className={`transition-all ${lesson.available ? "cursor-pointer hover:shadow-md" : "opacity-60"} ${isCurrent ? "border-primary" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={
                      isCompleted
                        ? "success"
                        : isCurrent
                          ? "default"
                          : lesson.available
                            ? "outline"
                            : "secondary"
                    }
                    >
                      {isCompleted ? "✓ 已完成" : isCurrent ? "进行中" : lesson.available ? "待解锁" : "未开放"}
                    </Badge>
                    {!lesson.available && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <CardTitle className="text-base mt-2">
                    课时
                    {lesson.id}
                    ：
                    {lesson.title}
                  </CardTitle>
                  <CardDescription className="text-xs">{lesson.subtitle}</CardDescription>
                </CardHeader>
                {lesson.available && (
                  <CardContent className="pt-0">
                    <Button
                      variant={isCurrent ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(lesson.path)}
                    >
                      {isTeacherMode
                        ? "浏览本课"
                        : isCurrent
                          ? "继续闯关"
                          : isCompleted
                            ? "查看回顾"
                            : "进入课时"}
                    </Button>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {showTeacherEntry && (
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
    </Module4PageContainer>
  )
}
