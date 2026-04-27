/**
 * 文件说明：平台级 404 页面。
 * 职责：处理不存在的平台或模块入口路由，并引导用户回到平台首页。
 * 更新触发：平台级异常路由提示或返回路径变化时，需要同步更新本文件。
 */

import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
      <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
      <p className="text-muted-foreground">这个页面不存在，可能是链接有误</p>
      <Button onClick={() => navigate("/")}>回到平台首页</Button>
    </div>
  )
}
