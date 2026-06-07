/**
 * 文件说明：teacher-console 管理员班级授权页。
 * 职责：允许 admin 查看班级、账号和授权明细，并对 teacher 账号执行班级授权全量覆盖写入。
 * 更新触发：admin 授权 API、教师筛选规则、授权编辑交互或保存请求结构变化时，需要同步更新本文件。
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { teacherAdminAdapter } from "@/teacher-console/api/teacher-admin.adapter"
import { getTeacherPermissionLabel } from "@/teacher-console/app/teacher-permissions"
import { useTeacherConsole } from "@/teacher-console/app/TeacherConsoleProvider"
import { PermissionGuard } from "@/teacher-console/components/PermissionGuard"
import type {
  TeacherAdminAssignment,
  TeacherAdminClass,
  TeacherClassPermission,
  TeacherUser,
} from "@/teacher-console/types"

type DraftAssignments = Record<string, TeacherClassPermission | "">

function buildDraft(
  selectedTeacherId: string,
  classes: TeacherAdminClass[],
  assignments: TeacherAdminAssignment[],
): DraftAssignments {
  const selectedAssignments = assignments.filter(item => item.userId === selectedTeacherId)
  return Object.fromEntries(
    classes.map(item => {
      const current = selectedAssignments.find(assignment => assignment.classId === item.classId)
      return [item.classId, current?.permission ?? ""]
    }),
  )
}

export default function AdminClassAssignmentPage() {
  const { session } = useTeacherConsole()
  const [classes, setClasses] = useState<TeacherAdminClass[]>([])
  const [users, setUsers] = useState<TeacherUser[]>([])
  const [assignments, setAssignments] = useState<TeacherAdminAssignment[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState("")
  const [draft, setDraft] = useState<DraftAssignments>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const teachers = useMemo(
    () => users.filter(user => user.role === "teacher"),
    [users],
  )

  const selectedTeacher = teachers.find(user => user.userId === selectedTeacherId)

  const reload = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError("")
    try {
      const [nextClasses, nextUsers, nextAssignments] = await Promise.all([
        teacherAdminAdapter.listAdminClasses(session.token),
        teacherAdminAdapter.listUsers(session.token),
        teacherAdminAdapter.listClassAssignments(session.token),
      ])
      setClasses(nextClasses)
      setUsers(nextUsers)
      setAssignments(nextAssignments)
      setSelectedTeacherId(current => current || nextUsers.find(user => user.role === "teacher")?.userId || "")
    } catch (err) {
      setError(err instanceof Error ? err.message : "授权数据加载失败，请稍后再试。")
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (!selectedTeacherId) {
      setDraft({})
      return
    }
    setDraft(buildDraft(selectedTeacherId, classes, assignments))
  }, [selectedTeacherId, classes, assignments])

  const updatePermission = (classId: string, permission: TeacherClassPermission | "") => {
    setDraft(current => ({ ...current, [classId]: permission }))
    setMessage("")
  }

  const handleSave = async () => {
    if (!session || !selectedTeacher) return
    setSaving(true)
    setMessage("")
    setError("")
    try {
      const payload = {
        assignments: classes
          .map(item => ({
            classId: item.classId,
            className: item.className,
            permission: draft[item.classId],
          }))
          .filter((item): item is { classId: string; className: string; permission: TeacherClassPermission } => (
            item.permission === "manage" || item.permission === "view"
          )),
      }
      const response = await teacherAdminAdapter.putTeacherClasses(session.token, selectedTeacher.userId, payload)
      setMessage(`已保存 ${selectedTeacher.displayName} 的 ${response.updatedCount} 条班级授权。`)
      const nextAssignments = await teacherAdminAdapter.listClassAssignments(session.token)
      setAssignments(nextAssignments)
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存授权失败，请稍后再试。")
    } finally {
      setSaving(false)
    }
  }

  return (
    <PermissionGuard allow={["admin"]}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">班级授权管理</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            选择教师账号后勾选班级并设置权限；保存时会以当前勾选结果全量覆盖该教师的班级授权。
          </p>
        </section>

        {loading ? (
          <p className="text-sm text-muted-foreground">正在加载授权数据...</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>选择教师</CardTitle>
                <CardDescription>左侧只选择教师账号；班级授权请在右侧列表中勾选并保存。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <select
                  value={selectedTeacherId}
                  onChange={event => setSelectedTeacherId(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {teachers.map(user => (
                    <option key={user.userId} value={user.userId}>
                      {user.displayName}
                      {" · "}
                      {user.account}
                    </option>
                  ))}
                </select>
                <div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-muted-foreground">
                  选择教师后，右侧会显示该教师当前授权；勾选班级默认设置为“可查看”，可再调整为“可管理”。
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{selectedTeacher ? `${selectedTeacher.displayName} 的授权` : "授权明细"}</CardTitle>
                <CardDescription>
                  取消勾选表示移除该班级授权；服务端会回填 className，不信任前端班级名。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {classes.map(item => {
                    const permission = draft[item.classId] ?? ""
                    const checked = permission === "manage" || permission === "view"
                    return (
                      <div key={item.classId} className="rounded-lg border bg-white p-4">
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={event => updatePermission(item.classId, event.target.checked ? "view" : "")}
                            className="mt-1"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">{item.className}</span>
                            <span className="block text-xs text-muted-foreground">
                              {item.gradeLabel}
                              {" · "}
                              {item.classId}
                            </span>
                          </span>
                        </label>
                        <select
                          value={permission}
                          onChange={event => updatePermission(item.classId, event.target.value as TeacherClassPermission)}
                          disabled={!checked}
                          className="mt-3 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">未授权</option>
                          <option value="view">{getTeacherPermissionLabel("view")}</option>
                          <option value="manage">{getTeacherPermissionLabel("manage")}</option>
                        </select>
                      </div>
                    )
                  })}
                </div>

                {message && <p className="text-sm text-emerald-700">{message}</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end">
                  <Button onClick={() => void handleSave()} disabled={saving || !selectedTeacher}>
                    {saving ? "保存中..." : "保存授权"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PermissionGuard>
  )
}
