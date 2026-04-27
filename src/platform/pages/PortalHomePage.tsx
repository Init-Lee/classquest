/**
 * 文件说明：ClassQuest 平台门户首页。
 * 职责：展示可进入的课程模块卡片，并把用户导向各模块自己的首页。
 * 更新触发：模块清单展示、模块状态口径或平台首页说明文案变化时，需要同步更新本文件。
 */

import { ArrowRight, CheckCircle2, Clock, Layers } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { MODULE_REGISTRY } from "@/platform/module-registry"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

function statusLabel(status: string) {
  if (status === "active") return "可进入"
  if (status === "draft") return "架构占位"
  return "规划中"
}

export default function PortalHomePage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-10">
      <section className="text-center space-y-3 py-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
          <Layers className="h-4 w-4" />
          Platform Portal → Module → Lesson → Step
        </div>
        <h1 className="text-3xl font-bold text-foreground">ClassQuest 程序化教学平台</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
          当前版本正在从单一模块应用升级为平台化结构。模块 3 保持原有学习流程；模块 4 先完成架构占位，课程内容将在后续独立分支中开发。
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULE_REGISTRY.map(module => (
          <Card key={module.id} className={module.status === "draft" ? "border-dashed" : "hover:shadow-md transition-shadow"}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <Badge variant={module.status === "active" ? "default" : "secondary"}>
                  {statusLabel(module.status)}
                </Badge>
                {module.status === "active" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <CardTitle className="pt-2">{module.title}</CardTitle>
              <CardDescription>{module.grade}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{module.subtitle}</p>
              <Button className="w-full" variant={module.status === "active" ? "default" : "outline"} onClick={() => navigate(module.route)}>
                {module.status === "active" ? "进入模块" : "查看占位"}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}
