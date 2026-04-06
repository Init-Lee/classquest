/**
 * 文件说明：材料处理参考面板（可跨课时复用）
 * 职责：以标签页展示四类材料的加工参考；支持锁定部分 Tab 与后续解锁提示
 * 更新触发：参考文案/Tab 策略变化时；复用到其他课时时调整 props 契约即可
 */

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { MATERIAL_PROCESSING_TYPES, type MaterialTypeId } from "./materialTypes"

export interface MaterialProcessingReferencePanelProps {
  /** 当前可查看内容的 Tab；未列入者显示锁定与后续解锁提示 */
  unlockedTabIds?: MaterialTypeId[]
  /** 外部指定初始激活 Tab（不受控，仅影响初始值）；切换材料时可通过 key 强制重置 */
  defaultTab?: MaterialTypeId
}

const DEFAULT_UNLOCKED: MaterialTypeId[] = ["text"]

export function MaterialProcessingReferencePanel({
  unlockedTabIds = DEFAULT_UNLOCKED,
  defaultTab,
}: MaterialProcessingReferencePanelProps) {
  const [activeTab, setActiveTab] = useState<MaterialTypeId>(() => {
    if (defaultTab && unlockedTabIds.includes(defaultTab)) return defaultTab
    return unlockedTabIds.includes("text") ? "text" : unlockedTabIds[0] ?? "text"
  })

  const isUnlocked = (id: MaterialTypeId) => unlockedTabIds.includes(id)
  const activeMaterial = MATERIAL_PROCESSING_TYPES.find((m) => m.id === activeTab)!

  const selectTab = (id: MaterialTypeId) => {
    if (!isUnlocked(id)) return
    setActiveTab(id)
  }

  return (
    <div className="flex flex-col gap-4 min-h-0 min-w-0">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          材料处理参考
        </p>
        <div className="flex gap-2 flex-wrap mb-3" role="tablist" aria-label="材料类型参考">
          {MATERIAL_PROCESSING_TYPES.map((m) => {
            const Icon = m.icon
            const unlocked = isUnlocked(m.id)
            const isActive = activeTab === m.id && unlocked
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-disabled={!unlocked}
                disabled={!unlocked}
                onClick={() => selectTab(m.id)}
                title={unlocked ? m.label : "后续关卡解锁"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                  !unlocked
                    ? "opacity-60 cursor-not-allowed bg-muted/40 border-muted text-muted-foreground"
                    : isActive
                      ? m.bgActive
                      : m.bgInactive + " hover:bg-gray-50"
                }`}
              >
                {unlocked ? (
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "" : "text-gray-400"}`} />
                ) : (
                  <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                )}
                {m.label}
              </button>
            )
          })}
        </div>

        {!isUnlocked(activeTab) ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              <Lock className="h-8 w-8 mx-auto mb-2 opacity-40" aria-hidden />
              <p>该类型处理参考将在后续关卡解锁。</p>
              <p className="text-xs mt-1">当前请先完成「文字」类材料的加工思路学习。</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = activeMaterial.icon
                  return <Icon className={`h-4 w-4 ${activeMaterial.color}`} />
                })()}
                <CardTitle className="text-sm">{activeMaterial.label}的处理方法</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">处理目标</p>
                <p className="text-sm text-gray-700">{activeMaterial.goal}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">最小加工动作</p>
                <ul className="space-y-1">
                  {activeMaterial.actions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">加工后在海报上的形态</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded px-2 py-1.5">{activeMaterial.posterForm}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">示例：「零浪费食堂」课题</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex gap-2">
                    <span className="shrink-0 text-xs text-muted-foreground w-16">原始材料</span>
                    <span className="text-gray-600">{activeMaterial.example.raw}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="shrink-0 text-xs text-muted-foreground w-16">加工过程</span>
                    <span className="text-gray-700">{activeMaterial.example.process}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="shrink-0 text-xs text-muted-foreground w-16">加工结果</span>
                    <span className="font-medium text-gray-800">{activeMaterial.example.result}</span>
                  </div>
                </div>
              </div>

              {activeTab === "data" && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">三种常用图表类型 · 怎么选？</p>
                  <div className="space-y-2">
                    <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2.5 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-green-700">柱状图</span>
                        <span className="text-xs text-green-600">— 对比多个类别 / 时间点的数量</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">零浪费食堂示例：</span>
                        周一 32%、周三 29%、周五 41% → 画三根柱子，高低一目了然
                      </p>
                    </div>
                    <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-blue-700">折线图</span>
                        <span className="text-xs text-blue-600">— 展示随时间变化的趋势</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">零浪费食堂示例：</span>
                        连续 5 天每天的剩余量 → 折线走势，看出是否呈上升或下降规律
                      </p>
                    </div>
                    <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2.5 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-orange-700">饼图</span>
                        <span className="text-xs text-orange-600">— 展示各部分的占比构成</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">零浪费食堂示例：</span>
                        剩余类型占比 → 饼图扇形，哪类浪费最多一眼看出
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">常见错误</p>
                <ul className="space-y-1">
                  {activeMaterial.mistakes.map((err, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-red-400 shrink-0" />
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
