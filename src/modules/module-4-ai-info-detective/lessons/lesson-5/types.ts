/**
 * 文件说明：模块 4 课时 5 页面层类型。
 * 职责：集中定义 lesson5 Step1 使用的本地提交状态与 ready 包窄化类型，避免页面直接散落 unknown 断言。
 * 更新触发：课时 5 Step1 UI 状态、ready 包字段或提交结果展示变化时，需要同步更新本文件。
 */

import type { Lesson4ReadyForLesson5Package } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/build-lesson4-ready-package"
import type { Lesson5V2SubmissionResponse } from "@/modules/module-4-ai-info-detective/api/lesson5-types"

export type Lesson5ReadyPackage = Lesson4ReadyForLesson5Package

export type Lesson5SubmitStatus = "idle" | "submitting" | "success" | "error"

export interface Lesson5SubmitUiState {
  status: Lesson5SubmitStatus
  message: string
  response?: Lesson5V2SubmissionResponse
}
