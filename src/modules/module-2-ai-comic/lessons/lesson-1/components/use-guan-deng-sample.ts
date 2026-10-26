/**
 * 文件说明：课时一教师样例的加载钩子。
 * 职责：进入看样例或选画面的页面时读取《关灯这件事》清单，并把缺失结果交给页面显示。
 * 更新触发：样例加载时机或返回结构变化时，需要同步更新本文件。
 */

import { useEffect, useState } from "react"
import { loadGuanDengSample, type GuanDengLoadResult } from "@/modules/module-2-ai-comic/lessons/lesson-1/sample/load-guan-deng-sample"

export function useGuanDengSample(): GuanDengLoadResult | null {
  const [result, setResult] = useState<GuanDengLoadResult | null>(null)
  useEffect(() => {
    let cancelled = false
    void loadGuanDengSample().then((loaded) => {
      if (!cancelled) setResult(loaded)
    })
    return () => { cancelled = true }
  }, [])
  return result
}
