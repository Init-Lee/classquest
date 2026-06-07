/**
 * 文件说明：teacher-console 权限守卫组件。
 * 职责：按当前会话角色控制页面片段或路由内容展示，权限不足时显示中文提示并提供返回入口。
 * 更新触发：角色访问规则、权限不足提示或受保护页面范围变化时，需要同步更新本文件。
 */

import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useTeacherConsole } from "@/teacher-console/app/TeacherConsoleProvider"
import type { TeacherAccountRole } from "@/teacher-console/types"

interface PermissionGuardProps {
  allow: TeacherAccountRole[]
  children: ReactNode
}

export function PermissionGuard({ allow, children }: PermissionGuardProps) {
  const { session } = useTeacherConsole()
  if (session && allow.includes(session.user.role)) return <>{children}</>

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>无权访问此页面</CardTitle>
          <CardDescription>
            当前账号没有该教师控制台页面的访问权限，请切换管理员账号或返回首页。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/teacher">返回教师首页</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
