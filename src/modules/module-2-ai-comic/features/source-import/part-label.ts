/**
 * 文件说明：模块 2 小说四段标签识别。
 * 职责：把「起·课时3」等标签归一成 opening/development/turn/ending；允许空白和间隔号差异，认不出就返回空，交给人工核对。
 * 更新触发：课时分段标签文案或允许的写法差异变化时，需要同步更新本文件。
 */

import type { FourPart } from "@/modules/module-2-ai-comic/domains/portfolio/types"

const PARTS: Record<string, FourPart> = {
  "起·课时3": "opening",
  "承·课时4": "development",
  "转·课时5": "turn",
  "合·课时6": "ending",
}

/** 去掉全部空白，并把常见间隔号收成「·」。无法对应四段之一时返回 null。 */
export function partFromLabel(label: string): FourPart | null {
  const compact = label.normalize("NFC").trim().replace(/\s+/g, "").replace(/[・•‧]/g, "·")
  return PARTS[compact] ?? null
}
