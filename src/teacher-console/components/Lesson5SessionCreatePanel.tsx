/**
 * 文件说明：课时 5 教师会话创建弹窗。
 * 职责：在弹窗中选择可管理班级、默认生成中文会话标题、选择运行类型和题量，并触发创建请求。
 * 更新触发：会话创建字段、默认标题规则、题量选项、弹窗交互、班级 manage 权限口径或创建表单变化时，需要同步更新本文件。
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { ClassSelector } from "@/teacher-console/components/ClassSelector"
import type {
  CreateLesson5SessionRequest,
  Lesson5SessionRunType,
  TeacherVisibleClass,
} from "@/teacher-console/types"

interface Lesson5SessionCreatePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classes: TeacherVisibleClass[]
  selectedClassId: string
  onClassChange: (classId: string) => void
  onCreate: (payload: CreateLesson5SessionRequest) => Promise<void>
  disabled?: boolean
}

const runTypeOptions: Array<{ value: Lesson5SessionRunType; label: string }> = [
  { value: "normal", label: "常规课" },
  { value: "makeup", label: "补课/补测" },
  { value: "test", label: "测试演练" },
]

const questionCountOptions = [6, 8, 10] as const

function formatLocalDateTime(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hour = String(date.getHours()).padStart(2, "0")
  const minute = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function buildDefaultSessionTitle(className: string) {
  return `${className} 课时5 试答 ${formatLocalDateTime(new Date())}`
}

export function Lesson5SessionCreatePanel({
  open,
  onOpenChange,
  classes,
  selectedClassId,
  onClassChange,
  onCreate,
  disabled = false,
}: Lesson5SessionCreatePanelProps) {
  const [title, setTitle] = useState("")
  const [runType, setRunType] = useState<Lesson5SessionRunType>("normal")
  const [questionCount, setQuestionCount] = useState(8)
  const [saving, setSaving] = useState(false)
  const lastAutoTitleRef = useRef("")

  const selectedClass = classes.find(item => item.classId === selectedClassId)
  const canManageSelected = selectedClass?.permission === "manage"
  const selectableClasses = useMemo(
    () => classes.map(item => ({ ...item, active: true })),
    [classes],
  )

  useEffect(() => {
    if (!selectedClass) return
    const nextAutoTitle = buildDefaultSessionTitle(selectedClass.className)
    const previousAutoTitle = lastAutoTitleRef.current
    lastAutoTitleRef.current = nextAutoTitle
    setTitle(current => {
      const shouldRefresh = current.trim() === "" || current === previousAutoTitle
      return shouldRefresh ? nextAutoTitle : current
    })
  }, [selectedClass])

  const handleSubmit = async () => {
    if (!selectedClassId || !canManageSelected) return
    const fallbackTitle = selectedClass ? buildDefaultSessionTitle(selectedClass.className) : selectedClassId
    setSaving(true)
    try {
      await onCreate({
        classId: selectedClassId,
        runType,
        title: title.trim() || fallbackTitle,
        settings: { questionCount },
      })
      lastAutoTitleRef.current = fallbackTitle
      setTitle(fallbackTitle)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>创建课时 5 会话</DialogTitle>
          <DialogDescription>
            创建教师会话并准备锁池；学生加入、作答和统计在后续阶段进行。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
          <label className="space-y-1 text-sm">
            <span className="font-medium">班级</span>
            <ClassSelector
              classes={selectableClasses}
              value={selectedClassId}
              onChange={onClassChange}
              disabled={disabled || saving}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">运行类型</span>
            <select
              value={runType}
              onChange={event => setRunType(event.target.value as Lesson5SessionRunType)}
              disabled={disabled || saving || !canManageSelected}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {runTypeOptions.map(item => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">会话标题</span>
          <Input
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="选择班级后自动生成，可手动修改"
            disabled={disabled || saving || !canManageSelected}
          />
        </label>

        <fieldset className="space-y-2 text-sm" disabled={disabled || saving || !canManageSelected}>
          <legend className="font-medium">锁池题量</legend>
          <div className="flex flex-wrap gap-2">
            {questionCountOptions.map(option => {
              const halfCount = option / 2
              return (
                <label
                  key={option}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                    questionCount === option ? "border-slate-900 bg-slate-900 text-white" : "bg-white text-slate-700"
                  } ${disabled || saving || !canManageSelected ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input
                    type="radio"
                    name="lesson5-question-count"
                    value={option}
                    checked={questionCount === option}
                    onChange={() => setQuestionCount(option)}
                    className="sr-only"
                  />
                  {option} 题
                  <span className="ml-2 text-xs opacity-80">
                    新闻 {halfCount} + 图片 {halfCount}
                  </span>
                </label>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            题量固定为 6 / 8 / 10，锁池时按一半新闻题、一半图片题准备。
          </p>
        </fieldset>

        {!canManageSelected && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            当前班级不是“可管理”权限，只能查看会话和题池概览，不能创建或锁池。
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            取消
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={disabled || saving || !canManageSelected || !selectedClassId}>
            {saving ? "创建中..." : "创建会话"}
          </Button>
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
