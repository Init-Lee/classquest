/**
 * 文件说明：首页
 * 职责：应用入口页面，展示模块标题、当前进度卡、课时入口卡片
 *       未创建档案时引导学生新建档案；已有档案时展示进度并引导继续学习
 * 更新触发：首页展示内容变化时；新增课时卡片时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { BookOpen, ArrowRight, CheckCircle2, Lock, User, Users } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/app/providers/AppProvider"
import { LESSON_REGISTRY } from "@/app/lesson-registry"
import { createNewPortfolio } from "@/domains/portfolio/types"
import type { StudentProfile } from "@/domains/student/types"
import { formatDateReadable } from "@/shared/utils/format"

/** 新建学生档案表单 */
function NewProfileForm({ onCreated }: { onCreated: () => void }) {
  const { savePortfolio } = usePortfolio()
  const [form, setForm] = useState<StudentProfile>({
    clazz: "",
    studentName: "",
    groupName: "",
    role: "member",
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clazz.trim() || !form.studentName.trim() || !form.groupName.trim()) return

    setSaving(true)
    try {
      const portfolio = createNewPortfolio(form)
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
            <label className="text-sm font-medium">班级</label>
            <Input
              placeholder="如：七年级2班"
              value={form.clazz}
              onChange={e => setForm(f => ({ ...f, clazz: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">姓名</label>
            <Input
              placeholder="你的名字"
              value={form.studentName}
              onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">小组名</label>
            <Input
              placeholder="你们小组的名字"
              value={form.groupName}
              onChange={e => setForm(f => ({ ...f, groupName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">我的角色</label>
            <div className="flex gap-3">
              {(["leader", "member"] as const).map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    form.role === role
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  {role === "leader" ? "组长" : "组员"}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {form.role === "leader" ? "组长可编辑小组共识和证据清单，并导出组长文件给组员" : "组员完成个人部分，导入组长文件后查看小组分工"}
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "创建中..." : "开始闯关"}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const { portfolio } = usePortfolio()
  const navigate = useNavigate()
  const [showNewForm, setShowNewForm] = useState(false)

  const handleCreated = () => {
    navigate("/lesson/1/step/1")
  }

  if (!portfolio && !showNewForm) {
    return (
      <div className="space-y-10">
        {/* 模块标题区 */}
        <div className="text-center space-y-3 py-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
            <BookOpen className="h-4 w-4" />
            七年级 · 模块三
          </div>
          <h1 className="text-3xl font-bold text-foreground">AI 科学传播站</h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            这是一个闯关式学习项目。你将带领（或配合）小组，从提出一个 AI 相关的科学问题开始，
            一步步收集证据，形成有说服力的结论。
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Button onClick={() => setShowNewForm(true)} size="lg">
              开始新的闯关
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            已有进度？请使用右上角的「导入进度」按钮
          </p>
        </div>

        {/* 课时介绍卡片 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">本模块包含 6 个课时</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LESSON_REGISTRY.map(lesson => (
              <Card key={lesson.id} className={lesson.enabled ? "" : "opacity-60"}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={lesson.enabled ? "default" : "secondary"}>
                      课时{lesson.id}
                    </Badge>
                    {!lesson.enabled && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <CardTitle className="text-base mt-2">{lesson.title}</CardTitle>
                  <CardDescription className="text-xs">{lesson.subtitle}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* 简短规则 */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3 text-sm">闯关须知</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />随时可以「保存进度」，换电脑也能继续学习</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />关键节点生成「阶段快照」，用于提交作业</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />组长负责整理小组共识，组员导入组长文件查看分工</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />每关完成后才能进入下一关，按提示一步步来</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!portfolio && showNewForm) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">新建你的学习档案</h1>
          <p className="text-muted-foreground text-sm mt-1">填写后系统会记住你，随时可以保存和恢复进度</p>
        </div>
        <NewProfileForm onCreated={handleCreated} />
      </div>
    )
  }

  // 有档案时：显示进度卡和继续学习入口
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 py-4">
        <h1 className="text-2xl font-bold">欢迎回来，{portfolio!.student.studentName}！</h1>
        <p className="text-muted-foreground text-sm">继续你的闯关之旅吧</p>
      </div>

      {/* 当前进度卡 */}
      <Card className="max-w-lg mx-auto border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-primary">当前进度</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">姓名：</span>{portfolio!.student.studentName}</div>
            <div><span className="text-muted-foreground">班级：</span>{portfolio!.student.clazz}</div>
            <div><span className="text-muted-foreground">小组：</span>{portfolio!.student.groupName}</div>
            <div><span className="text-muted-foreground">角色：</span>{portfolio!.student.role === "leader" ? "组长" : "组员"}</div>
          </div>
          <div className="border-t pt-3 text-sm">
            <p className="font-medium">当前在：<span className="text-primary">课时{portfolio!.pointer.lessonId} · 第{portfolio!.pointer.stepId}关</span></p>
            <p className="text-muted-foreground text-xs mt-1">上次保存：{formatDateReadable(portfolio!.updatedAt)}</p>
          </div>
          <Button
            className="w-full"
            onClick={() => navigate(`/lesson/${portfolio!.pointer.lessonId}/step/${portfolio!.pointer.stepId}`)}
          >
            继续闯关
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* 课时卡片 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">全部课时</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LESSON_REGISTRY.map(lesson => {
            const isCompleted = (lesson.id === 1 && portfolio!.lesson1.completed) || (lesson.id === 2 && portfolio!.lesson2.completed)
            const isCurrent = lesson.id === portfolio!.pointer.lessonId

            return (
              <Card key={lesson.id} className={`cursor-pointer transition-all ${lesson.enabled ? "hover:shadow-md" : "opacity-60"} ${isCurrent ? "border-primary" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={isCompleted ? "success" : isCurrent ? "default" : lesson.enabled ? "outline" : "secondary"}>
                      {isCompleted ? "✓ 已完成" : isCurrent ? "进行中" : lesson.enabled ? "待解锁" : "未开放"}
                    </Badge>
                    {!lesson.enabled && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <CardTitle className="text-base mt-2">课时{lesson.id}：{lesson.title}</CardTitle>
                  <CardDescription className="text-xs">{lesson.subtitle}</CardDescription>
                </CardHeader>
                {lesson.enabled && (
                  <CardContent className="pt-0">
                    <Button
                      variant={isCurrent ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/lesson/${lesson.id}/step/1`)}
                    >
                      {isCompleted ? "查看回顾" : isCurrent ? "继续闯关" : "进入课时"}
                    </Button>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
