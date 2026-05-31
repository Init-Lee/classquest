/**
 * 文件说明：模块 4 课时 4 教师演示预设补丁。
 * 职责：在教师讲解模式下一键切换 Step1 互审演示态（出站 pending、审查 claimed、双条件通关等），仅改内存 portfolio。
 * 更新触发：Module4Lesson4State 字段、fixture 审查码/题卡快照或教师演示切屏策略变化时，需要同步更新本文件。
 */

import type { Module4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import {
  createEmptyModule4Lesson4State,
  normalizeModule4Portfolio,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { lesson4PeerReviewFixture } from "@/modules/module-4-ai-info-detective/api/lesson4-peer-review.adapter"
import { buildLesson4ReviewRequestJson } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/build-lesson4-review-request"
import { applyLesson4Gate } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/evaluate-lesson4-gate"
import { createModule4TeacherLecturePortfolio } from "@/modules/module-4-ai-info-detective/constants/demo-portfolio"

export type Lesson4TeacherDemoPresetId =
  | "reset_step1"
  | "outbound_pending"
  | "inbound_claimed"
  | "gate_passed"

const DEMO_AUTHOR_SEAT = "0102"
const DEMO_SERVER_NOW = lesson4PeerReviewFixture.serverNow

function addMinutesIso(baseIso: string, minutes: number): string {
  return new Date(new Date(baseIso).getTime() + minutes * 60 * 1000).toISOString()
}

function buildDemoClaimedRequestJson(portfolio: Module4Portfolio) {
  return buildLesson4ReviewRequestJson(portfolio.lesson3)
}

/** 基于标准讲解档案生成指定课时 4 Step1 预设（每次从 createModule4TeacherLecturePortfolio 分叉）。 */
export function applyLesson4TeacherDemoPreset(
  preset: Lesson4TeacherDemoPresetId,
  current?: Module4Portfolio | null,
): Module4Portfolio {
  const base = normalizeModule4Portfolio(createModule4TeacherLecturePortfolio())
  const portfolio = current ? normalizeModule4Portfolio(current) : base
  const now = DEMO_SERVER_NOW
  const emptyLesson4 = createEmptyModule4Lesson4State()

  if (preset === "reset_step1") {
    return normalizeModule4Portfolio({
      ...portfolio,
      progress: { lessonId: 4, stepId: 1 },
      lesson4: emptyLesson4,
    })
  }

  if (preset === "outbound_pending") {
    return normalizeModule4Portfolio({
      ...portfolio,
      progress: { lessonId: 4, stepId: 1 },
      lesson4: applyLesson4Gate({
        ...emptyLesson4,
        outbound: {
          status: "pending",
          requestId: lesson4PeerReviewFixture.pendingRequestId,
          targetReviewerSeatCode: "0102",
          inviteCode: lesson4PeerReviewFixture.inviteCode,
          sentAt: now,
          pendingExpiresAt: addMinutesIso(now, 6),
          reviewExpiresAt: "",
          completed: false,
        },
      }),
    })
  }

  if (preset === "inbound_claimed") {
    const requestJson = buildDemoClaimedRequestJson(portfolio)
    return normalizeModule4Portfolio({
      ...portfolio,
      progress: { lessonId: 4, stepId: 1 },
      lesson4: applyLesson4Gate({
        ...emptyLesson4,
        inbound: {
          status: "claimed",
          requestId: lesson4PeerReviewFixture.claimedRequestId,
          authorSeatCode: DEMO_AUTHOR_SEAT,
          reviewExpiresAt: addMinutesIso(now, 20),
          claimedRequestJson: requestJson,
          completed: false,
        },
      }),
    })
  }

  return normalizeModule4Portfolio({
    ...portfolio,
    progress: { lessonId: 4, stepId: 1 },
    lesson4: applyLesson4Gate({
      ...emptyLesson4,
      outbound: {
        status: "pulled",
        requestId: lesson4PeerReviewFixture.pendingRequestId,
        targetReviewerSeatCode: "0102",
        inviteCode: lesson4PeerReviewFixture.inviteCode,
        sentAt: now,
        pendingExpiresAt: addMinutesIso(now, 6),
        reviewExpiresAt: addMinutesIso(now, 20),
        receivedReviewJson: lesson4PeerReviewFixture.reviewJson,
        completed: true,
      },
      inbound: {
        status: "submitted",
        requestId: lesson4PeerReviewFixture.claimedRequestId,
        authorSeatCode: DEMO_AUTHOR_SEAT,
        reviewExpiresAt: addMinutesIso(now, 20),
        submittedReviewJson: lesson4PeerReviewFixture.reviewJson,
        completed: true,
      },
      gatePassed: true,
      step1Completed: true,
    }),
  })
}

/** 在当前讲解档案上应用预设，保持 lesson1-3 与其它字段不变。 */
export function patchLesson4TeacherDemoPreset(
  portfolio: Module4Portfolio,
  preset: Lesson4TeacherDemoPresetId,
): Module4Portfolio {
  return applyLesson4TeacherDemoPreset(preset, portfolio)
}
