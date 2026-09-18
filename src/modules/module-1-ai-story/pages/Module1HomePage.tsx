/**
 * 文件说明：模块 1 首页。
 * 职责：承载建档入口、身份与续学信息、六课时状态卡、教师讲解口令入口，以及已开放课卡上的本课阶段快照。
 * 更新触发：身份字段、课时开放状态（含课时 3）、教师入口、课卡阶段快照入口或课程状态文案变化时，需要同步更新本文件。
 */

import { useState, type FormEvent } from "react"
import { ArrowRight, BookOpen, CheckCircle2, Eye, GraduationCap, Lock, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { MODULE1_LESSON_REGISTRY, canAccessModule1Lesson, resolveModule1PortfolioPointer, getModule1LessonResumePath } from "@/modules/module-1-ai-story/app/lesson-registry"
import {
  composeModule1ClassSeatCode,
  MODULE1_CLASS_OPTIONS,
  parseModule1ClassNumber,
  validateModule1SeatOnly,
} from "@/modules/module-1-ai-story/constants/class-options"
import { verifyModule1TeacherPassphrase } from "@/modules/module-1-ai-story/constants/teacher-passphrase"
import { Module1LessonSnapshotDownloadButton } from "@/modules/module-1-ai-story/features/global-actions/Module1LessonSnapshotDownloadButton"
import { getModule1LessonCardSnapshotButton } from "@/modules/module-1-ai-story/features/global-actions/module1-lesson-snapshot-entry"

function TeacherModeEntry() {
  const { enterTeacherMode } = useModule1Portfolio()
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showInput, setShowInput] = useState(false)

  const handleEnter = () => {
    if (verifyModule1TeacherPassphrase(password)) {
      enterTeacherMode()
      navigate("/module/1")
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
          可浏览课时 1、课时 2、课时 3 全部关卡做课堂演示，不写入学生本机档案
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
            进入讲解模式
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

function TeacherEntryBlock() {
  return (
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
  )
}

export default function Module1HomePage() {
  const { portfolio, loading, createPortfolio, isTeacherMode } = useModule1Portfolio()
  const navigate = useNavigate()
  const [form, setForm] = useState({ clazz: "", studentName: "", seatOnly: "" })
  const [saving, setSaving] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const seatError = form.seatOnly ? validateModule1SeatOnly(form.clazz, form.seatOnly) : null
  const valid = Boolean(form.studentName.trim() && form.clazz && form.seatOnly.length === 2 && !seatError)
  const showTeacherEntry = !isTeacherMode

  const create = async (event: FormEvent) => {
    event.preventDefault()
    if (!valid) return
    setSaving(true)
    try {
      await createPortfolio({
        clazz: form.clazz,
        studentName: form.studentName.trim(),
        classSeatCode: composeModule1ClassSeatCode(form.clazz, form.seatOnly),
      })
      navigate("/module/1/lesson/1/step/1")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-24 text-center text-sm text-muted-foreground">正在读取本机学习档案...</div>

  if (!portfolio && !showNewForm) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-8">
        <section className="space-y-3 py-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <BookOpen className="h-4 w-4" />
            七年级 · 模块一
          </div>
          <h1 className="text-3xl font-bold">未来来信：城市故事的设定</h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
            从身边的城市问题出发，借助 AI 写作工具逐步完成主题、人物和“起—承—转—合”，
            写出一封来自 2035 年的未来城市故事。
          </p>
          <Button size="lg" onClick={() => setShowNewForm(true)}>
            开始新的闯关
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground">已有进度？请使用右上角的「导入进度」选择模块一学习包。</p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">本模块包含 6 个课时</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MODULE1_LESSON_REGISTRY.map(lesson => (
              <Card key={lesson.id} className={!lesson.available ? "opacity-65" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={lesson.available ? "default" : "secondary"}>
                      课时 {lesson.id}
                    </Badge>
                    {!lesson.available && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <CardTitle className="mt-2 text-base">{lesson.title}</CardTitle>
                  <CardDescription className="text-xs">{lesson.subtitle}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <h2 className="mb-3 text-sm font-semibold">闯关须知</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />首次开始需登记班级、姓名与四位班学号。</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />输入会保存在本机；换设备前请点击「保存进度」下载最新学习包。</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />完成对应课时后，可在首页该课时卡下载「阶段快照」交作业；阶段快照不能恢复进度。</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />每关完成后才会解锁下一关，可从进度条回看已完成内容。</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />当前阶段开放课时 1 至课时 3，其余课时会清楚标记为待开发。</li>
            </ul>
          </CardContent>
        </Card>
        {showTeacherEntry && <TeacherEntryBlock />}
      </div>
    )
  }

  if (!portfolio && showNewForm) {
    const classNumber = parseModule1ClassNumber(form.clazz)
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
        <div className="space-y-2 text-center">
          <Badge>七年级 · 模块一</Badge>
          <h1 className="text-2xl font-bold">新建你的学习档案</h1>
          <p className="text-sm text-muted-foreground">完成登记后进入课时 1；档案只保存在当前浏览器。</p>
        </div>
        <Card className="mx-auto max-w-md">
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />登记身份</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-4">
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.clazz} onChange={event => setForm(current => ({ ...current, clazz: event.target.value }))}>
                <option value="">请选择班级</option>
                {MODULE1_CLASS_OPTIONS.map(clazz => <option key={clazz}>{clazz}</option>)}
              </select>
              <Input value={form.studentName} onChange={event => setForm(current => ({ ...current, studentName: event.target.value }))} placeholder="姓名" />
              <div className="flex gap-2">
                <span className="flex h-10 min-w-14 items-center justify-center rounded-md border bg-muted font-mono text-sm">{classNumber ? String(classNumber).padStart(2, "0") : "—"}</span>
                <Input inputMode="numeric" maxLength={2} value={form.seatOnly} onChange={event => setForm(current => ({ ...current, seatOnly: event.target.value.replace(/\D/g, "").slice(0, 2) }))} placeholder="班内学号 01～50" />
              </div>
              {seatError && <p className="text-xs text-destructive">{seatError}</p>}
              <Button className="w-full" disabled={!valid || saving}>{saving ? "创建中..." : "创建档案并开始"}</Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center">
          <button type="button" onClick={() => setShowNewForm(false)} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
            ← 返回模块介绍
          </button>
        </div>
      </div>
    )
  }

  if (!portfolio) return null

  const pointer = resolveModule1PortfolioPointer(portfolio)
  const lesson2Done = portfolio.lesson2.completed
  const lesson3Done = portfolio.lesson3.completed
  const canContinue = canAccessModule1Lesson(portfolio, pointer.lessonId, isTeacherMode)
  const continuePath = canContinue
    ? getModule1LessonResumePath(portfolio, pointer.lessonId)
    : lesson3Done
      ? getModule1LessonResumePath(portfolio, 3)
      : lesson2Done
        ? getModule1LessonResumePath(portfolio, 2)
        : getModule1LessonResumePath(portfolio, 1)
  const continueLabel = isTeacherMode
    ? "浏览本课"
    : canContinue
      ? "继续学习"
      : lesson3Done
        ? "等待课时 4 开放"
        : "等待下一课时开放"
  const statusText = isTeacherMode
    ? "当前是课堂演示档案，不会写入本机学生档案。"
    : canContinue
      ? `继续课时 ${pointer.lessonId} 第 ${pointer.stepId} 关。`
      : lesson3Done
        ? "课时 3 已完成；课时 4—6 将在后续阶段开放。"
        : "请先完成已开放课时，再进入后续内容。"
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">欢迎回来，{portfolio.student.studentName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{statusText}</p>
      </div>
      <Card className="mx-auto max-w-xl border-primary/20 bg-primary/5">
        <CardHeader><CardTitle className="text-base">当前档案</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{portfolio.student.clazz} · {portfolio.student.studentName} · {portfolio.student.classSeatCode}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              disabled={!isTeacherMode && !canContinue}
              onClick={() => navigate(isTeacherMode && !canContinue ? getModule1LessonResumePath(portfolio, 3) : continuePath)}
            >
              {continueLabel}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MODULE1_LESSON_REGISTRY.map((lesson) => {
          const complete = lesson.isComplete(portfolio)
          const accessible = canAccessModule1Lesson(portfolio, lesson.id, isTeacherMode)
          const active = accessible && !complete
          const snapshotButton = getModule1LessonCardSnapshotButton(lesson.id, {
            available: lesson.available,
            accessible,
            completed: complete,
          })
          return (
            <Card key={lesson.id} className={!lesson.available ? "opacity-65" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant={complete ? "success" : active ? "default" : "secondary"}>
                    {complete ? "已完成" : active ? "进行中" : lesson.available ? "未解锁" : "待开发"}
                  </Badge>
                  {complete ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : !accessible && <Lock className="h-4 w-4 text-muted-foreground" />}
                </div>
                <CardTitle className="text-base">课时 {lesson.id}：{lesson.title}</CardTitle>
                <CardDescription>{lesson.subtitle}</CardDescription>
              </CardHeader>
              {accessible && (
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(getModule1LessonResumePath(portfolio, lesson.id))}
                  >
                    {isTeacherMode ? "浏览本课" : complete ? "查看本课" : "进入课时"}
                  </Button>
                  {snapshotButton.visible && (
                    <div>
                      <Module1LessonSnapshotDownloadButton
                        portfolio={portfolio}
                        lessonId={lesson.id}
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
      {isTeacherMode && (
        <Card className="bg-amber-50">
          <CardContent className="pt-6 text-sm text-amber-900">
            教师讲解模式使用独立演示档案，演示操作不会写入、覆盖或清除本机学生档案。
          </CardContent>
        </Card>
      )}
      {showTeacherEntry && <TeacherEntryBlock />}
    </div>
  )
}
