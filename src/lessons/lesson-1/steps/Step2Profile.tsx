/**
 * 文件说明：课时1 · 步骤2 · 我的信息
 * 职责：采集学生身份信息（班级、姓名、小组、角色），写入 student profile
 *       过关条件：所有必填字段均已填写
 * 更新触发：需要新增学生信息字段时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, User, Users } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { usePortfolio } from "@/app/providers/AppProvider"
import type { StudentProfile } from "@/domains/student/types"

export default function Step2Profile() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [form, setForm] = useState<StudentProfile>(
    portfolio?.student ?? { clazz: "", studentName: "", groupName: "", role: "member" }
  )
  const [saving, setSaving] = useState(false)

  const isValid = form.clazz.trim() && form.studentName.trim() && form.groupName.trim()

  const handleNext = async () => {
    if (!portfolio || !isValid) return
    setSaving(true)
    try {
      await savePortfolio({
        ...portfolio,
        student: { ...form },
        lesson1: { ...portfolio.lesson1, profileDone: true },
        pointer: { ...portfolio.pointer, lessonId: 1, stepId: 3 },
      })
      navigate("/lesson/1/step/3")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第2关：先登记你的身份</h3>
        <p className="text-muted-foreground text-sm">系统才能记住你，后面组长和组员会进入不同流程</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> 个人信息
          </CardTitle>
          <CardDescription>请如实填写，这会影响你的学习档案和小组协作</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">班级 <span className="text-destructive">*</span></label>
            <Input
              placeholder="如：七年级2班"
              value={form.clazz}
              onChange={e => setForm(f => ({ ...f, clazz: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">姓名 <span className="text-destructive">*</span></label>
            <Input
              placeholder="你的真实姓名（组长会按这个设置分工）"
              value={form.studentName}
              onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">小组名 <span className="text-destructive">*</span></label>
            <Input
              placeholder="你们小组的名字"
              value={form.groupName}
              onChange={e => setForm(f => ({ ...f, groupName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">我的角色 <span className="text-destructive">*</span></label>
            <div className="flex gap-3">
              {(["leader", "member"] as const).map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
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
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
              {form.role === "leader"
                ? "✓ 组长：你需要整理所有人的 R1、形成小组共识、制定证据清单，并导出组长文件给组员"
                : "✓ 组员：你完成个人 R1 后，等待组长发出组长文件，导入后查看你的分工任务"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={!isValid || saving || !portfolio}>
          {saving ? "保存中..." : "下一关：开始个人 R1"}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
