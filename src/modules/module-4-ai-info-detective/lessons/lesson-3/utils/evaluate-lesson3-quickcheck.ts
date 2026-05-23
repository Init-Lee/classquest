/**
 * 文件说明：模块 4 课时 3 QuickCheck 评估工具。
 * 职责：根据两张 V1 题卡状态生成课时 3 的无感过程记录，供保存包与阶段快照使用。
 * 更新触发：课时 3 QuickCheck 指标、题卡完成状态或过程计数字段变化时，需要同步更新本文件。
 */

import type { Module4Lesson3QuickCheckState, Module4Lesson3State } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export function evaluateLesson3QuickCheck(lesson3: Module4Lesson3State): Module4Lesson3QuickCheckState {
  const news = lesson3.newsCard
  const image = lesson3.imageCard
  const newsSnapshotReady = news.sourceMaterialSnapshot.snappedAt.length > 0
  const imageSnapshotReady = image.sourceMaterialSnapshot.snappedAt.length > 0
  const newsMaterialReady = news.selfCheck.materialReady
  const imageMaterialReady = image.selfCheck.materialReady
  const newsTaskReady = news.selfCheck.taskReady && news.selfCheck.answerSelected
  const imageTaskReady = image.selfCheck.taskReady && image.selfCheck.answerSelected
  const newsExplanationReady = news.selfCheck.explanationReady
  const imageExplanationReady = image.selfCheck.explanationReady
  const newsSourceReady = news.selfCheck.sourceReady && news.selfCheck.verificationReady
  const imageSourceReady = image.selfCheck.sourceReady && image.selfCheck.verificationReady

  return {
    T1: {
      achieved: newsSnapshotReady && imageSnapshotReady,
      evidence: {
        newsSnapshotReady,
        imageSnapshotReady,
        newsAssetReady: Boolean(news.material.asset),
        imageAssetReady: Boolean(image.material.asset),
      },
    },
    T2: {
      achieved: newsMaterialReady && newsTaskReady && newsExplanationReady && newsSourceReady
        && imageMaterialReady && imageTaskReady && imageExplanationReady && imageSourceReady,
      evidence: {
        newsMaterialReady,
        newsTaskReady,
        newsExplanationReady,
        newsSourceReady,
        imageMaterialReady,
        imageTaskReady,
        imageExplanationReady,
        imageSourceReady,
      },
    },
    T3: {
      achieved: lesson3.finalPreviewConfirmed
        && news.status === "ready_for_lesson4"
        && image.status === "ready_for_lesson4"
        && lesson3.selfTrial.news.confirmed
        && lesson3.selfTrial.image.confirmed,
      evidence: {
        finalPreviewConfirmed: lesson3.finalPreviewConfirmed,
        newsReadyForLesson4: news.status === "ready_for_lesson4",
        imageReadyForLesson4: image.status === "ready_for_lesson4",
        newsSelfTrialConfirmed: lesson3.selfTrial.news.confirmed,
        imageSelfTrialConfirmed: lesson3.selfTrial.image.confirmed,
      },
    },
    evaluatedAt: new Date().toISOString(),
    metrics: {
      newsExplanationEditCount: news.metrics.explanationEditCount,
      imageExplanationEditCount: image.metrics.explanationEditCount,
      newsSourceEditCount: news.metrics.sourceEditCount,
      imageSourceEditCount: image.metrics.sourceEditCount,
      newsPreviewModeSwitchCount: news.metrics.previewModeSwitchCount,
      imagePreviewModeSwitchCount: image.metrics.previewModeSwitchCount,
      newsAiReviewRequestCount: news.metrics.aiReviewRequestCount,
      imageAiReviewRequestCount: image.metrics.aiReviewRequestCount,
    },
  }
}
