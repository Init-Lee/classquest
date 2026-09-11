/**
 * 文件说明：模块 1 已选写作风格摘要展示。
 * 职责：在课时 2 页面展示当前预设或自定义风格的名称、特点与两条示例开头。
 * 更新触发：风格摘要字段、自定义/预设展示口径或空态文案变化时，需要同步更新本文件。
 */

import {
  MODULE1_CUSTOM_STYLE_ID,
  type Module1Lesson2State,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { getModule1StyleCardById } from "@/modules/module-1-ai-story/constants/story-options"

export function StyleSummary({ state }: { state: Module1Lesson2State }) {
  if (!state.styleId.trim() || !state.styleName.trim()) {
    return (
      <div className="flex min-h-[72px] items-center justify-center rounded-lg border border-dashed px-4 text-sm text-muted-foreground">
        还没有选择写作风格。请打开风格选择，挑选一张预设卡或完成自定义风格。
      </div>
    )
  }

  const preset = state.styleId !== MODULE1_CUSTOM_STYLE_ID
    ? getModule1StyleCardById(state.styleId)
    : undefined
  const hint = preset?.hint || state.styleHint
  const examples = preset?.examples ?? state.styleExamples.filter(item => item.trim()).slice(0, 2)

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
      <p className="font-semibold text-primary">{state.styleName}</p>
      {preset && (
        <p className="mt-1 text-xs text-muted-foreground">适配 SDG：{preset.sdg.join("、")}</p>
      )}
      {hint && <p className="mt-2 leading-relaxed">{hint}</p>}
      {examples.length > 0 && (
        <div className="mt-3 space-y-1 text-xs leading-relaxed">
          <p className="text-muted-foreground">示例开头：</p>
          {examples.map((example, index) => (
            <p key={example}>{index === 0 ? "①" : "②"} {example}</p>
          ))}
        </div>
      )}
      {state.styleId === MODULE1_CUSTOM_STYLE_ID && (
        <p className="mt-2 text-xs text-muted-foreground">自定义风格</p>
      )}
    </div>
  )
}
