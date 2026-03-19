/**
 * 文件说明：cn 工具函数
 * 职责：合并 Tailwind CSS 类名，处理条件类名与冲突解析
 * 更新触发：引入新的类名合并需求时无需更新，直接使用即可
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
