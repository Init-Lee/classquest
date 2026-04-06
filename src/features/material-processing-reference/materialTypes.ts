/**
 * 文件说明：材料加工参考 · 四类材料的结构化说明数据
 * 职责：为「材料处理参考」面板提供图片/文字/表格数据/视频的处理目标、动作、示例与常见错误
 * 更新触发：课时示例课题或加工方法文案调整时；新增材料类型时
 */

import { BarChart2, FileText, ImageIcon, Video, type LucideIcon } from "lucide-react"

export type MaterialTypeId = "image" | "text" | "data" | "video"

export interface MaterialTypeConfig {
  id: MaterialTypeId
  label: string
  icon: LucideIcon
  color: string
  bgActive: string
  bgInactive: string
  goal: string
  actions: string[]
  posterForm: string
  example: { raw: string; process: string; result: string }
  mistakes: string[]
}

/** 四类材料的配置数据（零浪费食堂示例） */
export const MATERIAL_PROCESSING_TYPES: MaterialTypeConfig[] = [
  {
    id: "image",
    label: "图片",
    icon: ImageIcon,
    color: "text-orange-600",
    bgActive: "bg-orange-50 border-orange-300 text-orange-800",
    bgInactive: "bg-white border-gray-200 text-gray-600",
    goal: "让观众一眼看出图片里最关键的现象",
    actions: ["裁切掉无关背景，突出主体", "用箭头或圆圈标出关键位置", "写一句客观说明：「这张图显示了……」"],
    posterForm: "含标注箭头的图片 + 一句说明文字",
    example: {
      raw: "一张学校食堂的全景照片",
      process: "圈出剩菜明显的餐盘区域，标注「高峰期剩菜集中区」箭头",
      result: "「每日餐后高峰，主菜区平均约 1/3 餐盘有明显剩余」",
    },
    mistakes: ["只上传原图不做任何处理", "标注太多，重点反而不突出", "用截图或网络图代替现场拍摄"],
  },
  {
    id: "text",
    label: "文字",
    icon: FileText,
    color: "text-blue-600",
    bgActive: "bg-blue-50 border-blue-300 text-blue-800",
    bgInactive: "bg-white border-gray-200 text-gray-600",
    goal: "把原始文字压缩成一句可展示的客观表述",
    actions: ["摘录最能说明现象的关键句", "删去修饰性词语，保留事实", "压缩成不超过 30 字的客观表述"],
    posterForm: "引用句 + 来源标注",
    example: {
      raw:
        "采访记录：「其实很多同学点的时候觉得都想吃，但是吃到一半就饱了，剩下的也不好意思打包……」",
      process: "提炼关键信息：学生食量与点餐量不匹配导致剩余",
      result: "「受访学生反映：点餐时高估食量，实际食量不足，导致约半数情况有剩余」",
    },
    mistakes: ["直接大段复制粘贴", "没有注明来源", "把转述的话写成「已经证明了」"],
  },
  {
    id: "data",
    label: "表格数据",
    icon: BarChart2,
    color: "text-green-600",
    bgActive: "bg-green-50 border-green-300 text-green-800",
    bgInactive: "bg-white border-gray-200 text-gray-600",
    goal: "从一堆数字中提炼出清晰的趋势或对比，用文字或图表表达",
    actions: [
      "选出最能说明问题的 2~3 个关键数字",
      "做简单对比（如：今天 vs 昨天，高峰 vs 平峰）",
      "转成一句趋势判断句，不直接跳到原因",
      "也可以用手绘或工具（如 WPS 图表）把数据做成简单柱状图或折线图，更直观",
    ],
    posterForm: "数据比较句 + 来源说明（或简单图表截图 + 一句说明）",
    example: {
      raw: "三天测量：周一剩余率 32%，周三 29%，周五 41%",
      process: "发现周五剩余率明显高于其他两天，对比差值约 10%",
      result: "「周五剩余率（41%）比周一、周三平均高约 10 个百分点，存在明显波动」",
    },
    mistakes: ["贴一整张表格不解释", "数字很多但不说明说明了什么", "直接从数字跳到「因此原因是……」"],
  },
  {
    id: "video",
    label: "视频",
    icon: Video,
    color: "text-purple-600",
    bgActive: "bg-purple-50 border-purple-300 text-purple-800",
    bgInactive: "bg-white border-gray-200 text-gray-600",
    goal: "用关键帧说明视频记录了什么现象",
    actions: ["截取最能说明问题的 1~2 个关键帧", "标注帧的时间点和场景描述", "配一句客观观察说明：「这个画面显示了……」"],
    posterForm: "关键帧截图 + 时间标注 + 一句说明",
    example: {
      raw: "3 分钟食堂收餐视频",
      process: "截取 1:25 处餐盘归还画面，标注「收餐高峰，桶已满溢」",
      result: "「视频 1:25 显示收餐桶已超出容量，说明高峰期剩余量超出收容能力」",
    },
    mistakes: ["只上传整个视频不截关键帧", "依赖 AI 解读整个视频内容", "没说明截这一帧是为了说明什么"],
  },
]
