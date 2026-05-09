/**
 * 文件说明：模块 4 课时 2 四关体检标准卡片。
 * 职责：以统一视觉呈现类型符合、来源可追溯、内容合规、具备判断价值四项标准。
 * 更新触发：四项标准文案、展示层级或课堂提示变化时，需要同步更新本文件。
 */

export function ScreeningCriteriaCard({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}
