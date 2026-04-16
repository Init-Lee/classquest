/**
 * 文件说明：课时6第2关表单校验
 * 职责：集中必填与第2步「证据位置/类型」启发式校验，错误文案对齐 skill pack 6.2
 * 更新触发：校验规则或 Lesson6State 字段变化时
 */

import type { Lesson6State } from "@/domains/portfolio/types"
import type { ModulePortfolio } from "@/domains/portfolio/types"

/** 第2步「指证据」：须写出证据位置或材料类型（启发式，不强制唯一写法） */
export function isStep2EvidencePosterAreaOk(text: string): boolean {
  const t = text.trim()
  if (t.length < 2) return false
  if (t.length >= 6) return true
  return /照片|数据|访谈|图表|海报|证据|截图|表格|标题|左|右|上|下|中部|角落|区域|版块|数据图|柱状|折线|饼图/i.test(t)
}

/** 校验身份信息是否可用于展示（与导出一致） */
export function identityCompleteForLesson6(portfolio: ModulePortfolio): boolean {
  const c = portfolio.student.clazz?.trim()
  const g = portfolio.student.groupName?.trim()
  return Boolean(c && g)
}

/** 返回错误文案列表；空数组表示通过 */
export function validateLesson6Step2(portfolio: ModulePortfolio, lesson6: Lesson6State): string[] {
  const errs: string[] = []

  if (!identityCompleteForLesson6(portfolio)) {
    errs.push("请先填写班级、小组（学生档案中班级与小组名称须完整）")
  }

  const steps = lesson6.roadshowSteps
  for (let i = 0; i < steps.length; i++) {
    const row = steps[i]
    if (!row.posterArea.trim() || !row.mustSay.trim()) {
      errs.push("请完成 4 个步骤的讲解路径（每步「海报位置」与「必说句」均须填写）")
      break
    }
  }

  const step2 = steps[1]
  if (step2 && !isStep2EvidencePosterAreaOk(step2.posterArea)) {
    errs.push("第2步请写清楚证据对应的海报位置或证据类型（如照片、数据图、访谈摘录等）")
  }

  if (!lesson6.challengeQuestion.trim() || !lesson6.evidenceBack.trim() || !lesson6.closingSentence.trim()) {
    errs.push("第4步请补全追问、回证据和收束句（下方三个追问区字段均须填写）")
  }

  return errs
}
