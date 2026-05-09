/**
 * 文件说明：模块 4 课时 2 QuickCheck 自动评估工具。
 * 职责：依据可观察的完成状态与过程计数生成 T1/T2/T3 记录，不进行教师评分、来源真伪判断或 AI 鉴定。
 * 更新触发：QuickCheck 指标定义、四关复判、素材完成条件、过程计数字段或报告展示口径变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson2QuickCheckState,
  Module4Lesson2State,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { isLesson2MaterialComplete, isValidLesson2Note } from "./material-completion"

export function evaluateLesson2QuickCheck(lesson2: Module4Lesson2State): Module4Lesson2QuickCheckState {
  const news = lesson2.news
  const image = lesson2.image
  const newsAssetReady = Boolean(news.asset?.dataUrl)
  const imageAssetReady = Boolean(image.asset?.dataUrl)
  const newsShortNameReady = news.titleOrName.trim().length > 0
  const imageShortNameReady = image.titleOrName.trim().length > 0
  const criteriaCalibrationCompleted = lesson2.step2Completed
  const newsSourceCheckPassed = news.sourceAutoPassed
  const imageSourceCheckPassed = image.sourceAutoPassed
  const newsSelfChecksCompleted = news.selfChecks.typeFits && news.selfChecks.contentCompliant && news.selfChecks.hasJudgmentValue
  const imageSelfChecksCompleted = image.selfChecks.typeFits && image.selfChecks.contentCompliant && image.selfChecks.hasJudgmentValue
  const newsClueNoteValid = isValidLesson2Note(news.clueNote)
  const imageClueNoteValid = isValidLesson2Note(image.clueNote)

  return {
    T1: {
      achieved: newsAssetReady && imageAssetReady && newsShortNameReady && imageShortNameReady,
      evidence: {
        newsAssetReady,
        imageAssetReady,
        newsShortNameReady,
        imageShortNameReady,
      },
    },
    T2: {
      achieved: criteriaCalibrationCompleted
        && newsSourceCheckPassed
        && imageSourceCheckPassed
        && newsSelfChecksCompleted
        && imageSelfChecksCompleted,
      evidence: {
        criteriaCalibrationCompleted,
        newsSourceCheckPassed,
        imageSourceCheckPassed,
        newsSelfChecksCompleted,
        imageSelfChecksCompleted,
      },
    },
    T3: {
      achieved: newsClueNoteValid && imageClueNoteValid,
      evidence: {
        newsClueNoteValid,
        imageClueNoteValid,
      },
    },
    evaluatedAt: new Date().toISOString(),
    metrics: {
      criteriaAttemptCount: lesson2.criteriaExampleAttemptCount,
      newsUploadCount: news.asset?.uploadCount ?? 0,
      imageUploadCount: image.asset?.uploadCount ?? 0,
      newsSourceCheckCount: news.sourceCheckCount,
      imageSourceCheckCount: image.sourceCheckCount,
      newsClueEditCount: news.clueEditCount,
      imageClueEditCount: image.clueEditCount,
      newsPeerOrSelfNoteEditCount: news.peerFeedbackEditCount,
      imagePeerOrSelfNoteEditCount: image.peerFeedbackEditCount,
    },
  }
}

export function isLesson2ReadyForReport(lesson2: Module4Lesson2State): boolean {
  return isLesson2MaterialComplete(lesson2.news) && isLesson2MaterialComplete(lesson2.image)
}
