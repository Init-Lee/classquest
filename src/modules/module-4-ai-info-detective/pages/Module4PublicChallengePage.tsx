/**
 * 文件说明：模块 4 课时 6 公共挑战独立页面。
 * 职责：读取 /m4/challenge 的 context 查询参数并渲染 standalone PublicChallengeShell，不依赖 Module4Provider 或学生档案。
 * 更新触发：公共挑战路由参数、页面头部文案、standalone/embed 边界或匿名访问策略变化时，需要同步更新本文件。
 */

import { useSearchParams } from "react-router-dom"
import { Badge } from "@/shared/ui/badge"
import { PublicChallengeShell } from "@/modules/module-4-ai-info-detective/features/public-challenge/PublicChallengeShell"
import type { PublicChallengeContext } from "@/modules/module-4-ai-info-detective/api/lesson6-types"

function normalizeContext(value: string | null): PublicChallengeContext {
  return value === "lesson6_class" || value === "public_showcase" ? value : "public_showcase"
}

export default function Module4PublicChallengePage() {
  const [searchParams] = useSearchParams()
  const context = normalizeContext(searchParams.get("context"))

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
        <header className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant="secondary">模块 4 · 课时 6</Badge>
              <div>
                <h1 className="text-3xl font-bold text-foreground">公共挑战</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                  无需登录或建立学习档案，直接挑战 6 道已发布题卡。每题提交后才会显示正解、解析与来源摘要。
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-primary/10 px-4 py-3 text-sm text-primary">
              {context === "lesson6_class" ? "课堂挑战模式" : "公开展示模式"}
            </div>
          </div>
        </header>

        <PublicChallengeShell context={context} />
      </div>
    </main>
  )
}
