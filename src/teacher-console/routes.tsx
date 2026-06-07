/**
 * 文件说明：teacher-console 路由定义。
 * 职责：组合教师控制台 Provider、独立 Shell、登录页、角色首页与 admin 授权页，供平台顶层 /teacher/* 挂载。
 * 更新触发：教师控制台新增页面、路由层级、默认重定向或 Provider/Shell 边界变化时，需要同步更新本文件。
 */

import { Navigate, Route, Routes } from "react-router-dom"
import { TeacherConsoleProvider } from "@/teacher-console/app/TeacherConsoleProvider"
import { TeacherShell } from "@/teacher-console/components/TeacherShell"
import TeacherLoginPage from "@/teacher-console/pages/TeacherLoginPage"
import TeacherHomePage from "@/teacher-console/pages/TeacherHomePage"
import AdminClassAssignmentPage from "@/teacher-console/pages/AdminClassAssignmentPage"
import Module4Lesson5ConsolePage from "@/teacher-console/pages/Module4Lesson5ConsolePage"

export default function TeacherConsoleRoutes() {
  return (
    <TeacherConsoleProvider>
      <Routes>
        <Route element={<TeacherShell />}>
          <Route index element={<TeacherHomePage />} />
          <Route path="login" element={<TeacherLoginPage />} />
          <Route path="admin" element={<AdminClassAssignmentPage />} />
          <Route path="module/4/lesson/5" element={<Module4Lesson5ConsolePage />} />
          <Route path="*" element={<Navigate to="/teacher" replace />} />
        </Route>
      </Routes>
    </TeacherConsoleProvider>
  )
}
