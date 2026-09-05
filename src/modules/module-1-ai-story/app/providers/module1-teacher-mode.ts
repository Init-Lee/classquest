/**
 * 文件说明：模块 1 教师讲解模式写入策略。
 * 职责：提供不落盘的内存 persistence，并让导入/重置在教师模式下对真实档案 no-op。
 * 更新触发：教师模式旁路、内存 coordinator 边界或真实档案保护规则变化时，需要同步更新本文件。
 */

import type { Module1PersistenceBoundary } from "@/modules/module-1-ai-story/app/providers/module1-save-coordinator"

export function createModule1MemoryPersistence(): Module1PersistenceBoundary {
  return {
    save: async () => undefined,
    replaceWithImported: async () => undefined,
    clear: async () => undefined,
  }
}

export async function runModule1StudentArchiveMutation(
  isTeacherMode: boolean,
  mutation: () => Promise<void>,
): Promise<boolean> {
  if (isTeacherMode) return false
  await mutation()
  return true
}
