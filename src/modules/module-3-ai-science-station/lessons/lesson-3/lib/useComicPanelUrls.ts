/**
 * 文件说明：课时3 四格漫画配图 URL 列表（Vite glob）
 * 职责：仅从 lesson-3/assets 根目录加载 jpg/jpeg（按文件名排序取前 4 张），供 Step2 栅格与课堂翻页共用。
 * 更新触发：assets 目录约定、扩展名或排序规则变化时
 */

import { useMemo } from "react"

export function useComicPanelUrls(): string[] {
  return useMemo(() => {
    const modules = import.meta.glob<string>("../assets/*.{jpg,jpeg}", {
      eager: true,
      import: "default",
    })
    return Object.keys(modules)
      .sort((a, b) => a.localeCompare(b, "zh-Hans-CN", { numeric: true }))
      .map((key) => modules[key])
      .slice(0, 4)
  }, [])
}
