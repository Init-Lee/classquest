/**
 * 文件说明：模块 1 首页。
 * 职责：承载建档入口、身份与续学信息，以及六课时完成、进行中和待开发状态卡。
 * 更新触发：身份字段、课时开放状态、首页行动或课程状态文案变化时，需要同步更新本文件。
 */

import { useState, type FormEvent } from "react"
import { ArrowRight, BookOpen, CheckCircle2, Lock, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { MODULE1_LESSON_REGISTRY, resolveModule1PortfolioPointer } from "@/modules/module-1-ai-story/app/lesson-registry"
import {
  composeModule1ClassSeatCode,
  MODULE1_CLASS_OPTIONS,
  parseModule1ClassNumber,
  validateModule1SeatOnly,
} from "@/modules/module-1-ai-story/constants/class-options"

export default function Module1HomePage() {
  const { portfolio, loading, createPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const [form, setForm] = useState({ clazz: "", studentName: "", seatOnly: "" })
  const [saving, setSaving] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const seatError = form.seatOnly ? validateModule1SeatOnly(form.clazz, form.seatOnly) : null
  const valid = Boolean(form.studentName.trim() && form.clazz && form.seatOnly.length === 2 && !seatError)

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
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />每关完成后才会解锁下一关，可从进度条回看已完成内容。</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />当前阶段只开放课时 1，其余课时会清楚标记为待开发。</li>
            </ul>
          </CardContent>
        </Card>
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
  const lesson1Done = portfolio.lesson1.completed
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">欢迎回来，{portfolio.student.studentName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{lesson1Done ? "课时 1 已完成；其余课时将在后续阶段开放。" : `继续课时 1 第 ${pointer.stepId} 关。`}</p>
      </div>
      <Card className="mx-auto max-w-xl border-primary/20 bg-primary/5">
        <CardHeader><CardTitle className="text-base">当前档案</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{portfolio.student.clazz} · {portfolio.student.studentName} · {portfolio.student.classSeatCode}</p>
          <Button disabled={lesson1Done} onClick={() => navigate(`/module/1/lesson/1/step/${pointer.stepId}`)}>
            {lesson1Done ? "等待课时 2 开放" : "继续学习"}<ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MODULE1_LESSON_REGISTRY.map((lesson) => {
          const complete = lesson.isComplete(portfolio)
          const active = lesson.id === 1 && !complete
          return (
            <Card key={lesson.id} className={!lesson.available ? "opacity-65" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant={complete ? "success" : active ? "default" : "secondary"}>
                    {complete ? "已完成" : active ? "进行中" : "待开发"}
                  </Badge>
                  {complete ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : !lesson.available && <Lock className="h-4 w-4 text-muted-foreground" />}
                </div>
                <CardTitle className="text-base">课时 {lesson.id}：{lesson.title}</CardTitle>
                <CardDescription>{lesson.subtitle}</CardDescription>
              </CardHeader>
              {lesson.available && (
                <CardContent><Button variant="outline" className="w-full" onClick={() => navigate(complete ? "/module/1/lesson/1/step/4" : `/module/1/lesson/1/step/${pointer.stepId}`)}>{complete ? "查看主题" : "进入课时"}</Button></CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
