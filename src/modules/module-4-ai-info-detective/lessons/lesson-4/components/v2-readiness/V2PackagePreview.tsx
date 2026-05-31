/**
 * 文件说明：模块 4 课时 4 V2 准备包预览组件。
 * 职责：在 Step4 中用可读摘要展示即将写入本地 portfolio 的 ready_for_lesson5 包内容。
 * 更新触发：准备包字段、Step4 预览摘要或课时五承接信息变化时，需要同步更新本文件。
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import type { Lesson4ReadyForLesson5Package } from "../../utils/build-lesson4-ready-package"

export function V2PackagePreview({ readyPackage }: { readyPackage: Lesson4ReadyForLesson5Package }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">准备包预览</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>题卡版本：{readyPackage.cards.news.version}</p>
        <p>生成时间：{readyPackage.createdAt}</p>
        <p>新闻题卡：{readyPackage.cards.news.material.titleOrName || "未填写标题"}</p>
        <p>图片题卡：{readyPackage.cards.image.material.titleOrName || "未填写标题"}</p>
        <p>收到同伴反馈：{readyPackage.peerReviewSummary.receivedReviewPresent ? "是" : "否"}</p>
        <p>反馈决策数：{readyPackage.peerReviewSummary.feedbackDecisionCount}</p>
        <p>可进入第 5 课：{readyPackage.readiness.readyForLesson5 ? "是" : "待保存"}</p>
      </CardContent>
    </Card>
  )
}

