/**
 * 文件说明：模块 2 教师讲解模式写入策略。
 * 职责：提供不碰数据库的内存 persistence，并让导入、重置等学生档案变更在教师模式下一律 no-op。
 * 更新触发：教师模式旁路、内存协调器边界或学生档案保护规则变化时，需要同步更新本文件。
 */

import type { Module2PersistenceBoundary } from "@/modules/module-2-ai-comic/app/providers/module2-save-coordinator"

export function createModule2MemoryPersistence(): Module2PersistenceBoundary {
  let revision = 0
  return {
    save: async () => ({ revision: (revision += 1) }),
    replace: async () => ({ revision: (revision += 1) }),
  }
}

/** 教师模式下返回 false 且不执行 mutation；学生模式执行并返回 true。 */
export async function runModule2StudentArchiveMutation(
  isTeacherMode: boolean,
  mutation: () => Promise<void>,
): Promise<boolean> {
  if (isTeacherMode) return false
  await mutation()
  return true
}
