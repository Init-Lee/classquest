/**
 * 文件说明：课时3 四格漫画配图 URL 列表（Vite glob）
 * 职责：仅从 lesson-3/assets 根目录加载 jpg/jpeg（按文件名排序取前 4 张），供 Step2 栅格与课堂翻页共用。
 * 更新触发：assets 目录约定、扩展名或排序规则变化时
 */

import { useMemo } from "react"

import panel1Url from "../assets/第1格：原始材料是什么.jpg"
import panel2Url from "../assets/第2格：我看到了什么.jpg"
import panel3Url from "../assets/lesson3-frame-3-minimal-processing.jpg"
import panel4Url from "../assets/lesson3-frame-4-poster-copy.jpg"

const COMIC_PANEL_URLS = [panel1Url, panel2Url, panel3Url, panel4Url]

export function useComicPanelUrls(): string[] {
  return useMemo(() => {
    return COMIC_PANEL_URLS
  }, [])
}
