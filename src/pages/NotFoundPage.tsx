/**
 * 文件说明：404 页面
 * 职责：处理不存在的路由，引导用户回到首页
 * 更新触发：404 页面样式或文案调整时
 */

import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
      <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
      <p className="text-muted-foreground">这个页面不存在，可能是链接有误</p>
      <Button onClick={() => navigate("/")}>回到首页</Button>
    </div>
  )
}
