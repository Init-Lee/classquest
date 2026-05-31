/**
 * 文件说明：模块 4 课时 4 反馈摘要构建工具。
 * 职责：把 Step1 收到的同伴 reviewJson 拆成作者可阅读的分卡反馈摘要，并生成 Step2 需要保存的作者决策列表。
 * 更新触发：互审 JSON 结构、反馈档位、Step2 决策规则或内容合规映射变化时，需要同步更新本文件。
 */

import type {
  Lesson4FeedbackDecision,
  Lesson4ReviewArea,
  Lesson4ReviewRubricDimensionKey,
  Lesson4ReviewRubricLevel,
  Module4Lesson4ReviewJson,
  Module4MaterialKind,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export type Lesson4FeedbackDigestLevel = Lesson4ReviewRubricLevel | "content_violation"

export interface Lesson4FeedbackDigestItem {
  id: string
  cardKind: Module4MaterialKind
  area: Lesson4ReviewArea | "overall"
  level: Lesson4FeedbackDigestLevel
  label: string
  reviewerReason: string
}

export interface Lesson4FeedbackDigestCard {
  cardKind: Module4MaterialKind
  items: Lesson4FeedbackDigestItem[]
  overallComment: string
  contentViolation: boolean | null
  contentViolationNote: string
}

export interface Lesson4FeedbackDigest {
  cards: Record<Module4MaterialKind, Lesson4FeedbackDigestCard>
  createdAt: string
}

const CARD_LABELS: Record<Module4MaterialKind, string> = {
  news: "新闻题卡",
  image: "图片题卡",
}

const AREA_LABELS: Record<Lesson4ReviewArea | "overall", string> = {
  material: "素材",
  task: "任务",
  explanation: "解析",
  source: "来源",
  safety: "内容合规",
  overall: "整体建议",
}

/** 与学生填评价顺序一致：素材 → 任务 → 解析 → 来源。 */
export const RUBRIC_DIMENSION_KEYS: Lesson4ReviewRubricDimensionKey[] = ["material", "task", "explanation", "source"]

export function getLesson4CardLabel(kind: Module4MaterialKind): string {
  return CARD_LABELS[kind]
}

export function getLesson4FeedbackAreaLabel(area: Lesson4ReviewArea | "overall"): string {
  return AREA_LABELS[area]
}

function buildDigestItemId(cardKind: Module4MaterialKind, area: Lesson4ReviewArea, level: Lesson4FeedbackDigestLevel): string {
  return `${cardKind}-${area}-${level}`
}

export function buildLesson4FeedbackDigest(reviewJson: Module4Lesson4ReviewJson): Lesson4FeedbackDigest {
  const createdAt = new Date().toISOString()
  const cards = Object.fromEntries(
    (["news", "image"] as Module4MaterialKind[]).map(cardKind => {
      const cardFeedback = reviewJson.cards[cardKind]
      const items: Lesson4FeedbackDigestItem[] = RUBRIC_DIMENSION_KEYS.map(area => {
        const entry = cardFeedback.rubric[area]
        const level = entry.level ?? "pass"
        return {
          id: buildDigestItemId(cardKind, area, level),
          cardKind,
          area,
          level,
          label: AREA_LABELS[area],
          reviewerReason: entry.reason,
        }
      })

      if (cardFeedback.contentViolation === true) {
        items.push({
          id: buildDigestItemId(cardKind, "safety", "content_violation"),
          cardKind,
          area: "safety",
          level: "content_violation",
          label: AREA_LABELS.safety,
          reviewerReason: cardFeedback.contentViolationNote || "同伴标记了安全、隐私、侵权或不适宜风险。",
        })
      }

      return [
        cardKind,
        {
          cardKind,
          items,
          overallComment: cardFeedback.overallComment,
          contentViolation: cardFeedback.contentViolation,
          contentViolationNote: cardFeedback.contentViolationNote,
        },
      ]
    }),
  ) as Record<Module4MaterialKind, Lesson4FeedbackDigestCard>

  return { cards, createdAt }
}

export function createLesson4FeedbackDecisionsFromDigest(digest: Lesson4FeedbackDigest): Lesson4FeedbackDecision[] {
  return (["news", "image"] as Module4MaterialKind[]).flatMap(cardKind =>
    digest.cards[cardKind].items.flatMap(item => {
      if (item.level === "pass") return []
      const isMinor = item.level === "minor_fix"
      return [{
        id: item.id,
        cardKind,
        area: item.area,
        level: item.level === "content_violation" ? "content_violation" : item.level,
        reviewerReason: item.reviewerReason,
        action: isMinor ? "accept" : "must_revise",
        authorPlan: "",
        resolved: false,
        resolvedAt: "",
      }]
    }),
  )
}

