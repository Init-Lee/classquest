/**
 * 文件说明：模块 4 课时 4 完成后的导航目标解析工具。
 * 职责：根据 lesson-registry 判断是否存在可进入的课时 5，并返回与课时 3 V1 保存一致的 navigate 目标。
 * 更新触发：课时 5 注册表 availability/path 变化，或模块 4 课时完成后的回退策略调整时，需要同步更新本文件。
 */

import { MODULE4_LESSON_REGISTRY } from "@/modules/module-4-ai-info-detective/app/lesson-registry"

export interface Lesson4PostSaveTarget {
  path: string
  label: string
}

/** Step4 保存入库包后的导航目标：有课时 5 则进入其入口，否则回模块 4 首页。 */
export function getLesson4PostSaveTarget(): Lesson4PostSaveTarget {
  const lesson5 = MODULE4_LESSON_REGISTRY.find(entry => entry.id === 5)
  if (lesson5?.available) {
    return { path: lesson5.path, label: "进入课时5" }
  }
  return { path: "/module/4", label: "返回模块首页" }
}
