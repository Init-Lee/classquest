/**
 * 文件说明：课时6第2关表单校验
 * 职责：必填校验（学生友好文案）；每步 `presenterBy` 必选；第2步「证据位置」启发式仅供 UI 软提示，不拦截提交
 * 更新触发：校验规则或 Lesson6State / RoadshowStep 字段变化时
 */

import type { Lesson6State } from "@/modules/module-3-ai-science-station/domains/portfolio/types"
import type { ModulePortfolio } from "@/modules/module-3-ai-science-station/domains/portfolio/types"

/** 第2步「指证据」：用于判断海报位置是否够具体（仅 UI 提示，不作为完成拦截条件） */
export function isStep2EvidencePosterAreaOk(text: string): boolean {
  const t = text.trim()
  if (t.length < 2) return false
  if (t.length >= 6) return true
  return /照片|数据|访谈|图表|海报|证据|截图|表格|标题|左|右|上|下|中部|角落|区域|版块|数据图|柱状|折线|饼图/i.test(
    t
  )
}

/** 校验身份信息是否可用于展示（与导出一致） */
export function identityCompleteForLesson6(portfolio: ModulePortfolio): boolean {
  const c = portfolio.student.clazz?.trim()
  const g = portfolio.student.groupName?.trim()
  return Boolean(c && g)
}

/** 返回错误文案列表；空数组表示通过 */
export function validateLesson6Step2(
  portfolio: ModulePortfolio,
  lesson6: Lesson6State
): string[] {
  const errs: string[] = []

  if (!identityCompleteForLesson6(portfolio)) {
    errs.push("请先在学生档案中补全班级和小组")
  }

  const steps = lesson6.roadshowSteps
  for (let i = 0; i < steps.length; i++) {
    const row = steps[i]
    const n = i + 1
    if (!row.posterArea.trim()) {
      errs.push(`请先写清第${n}步你要指向海报哪里`)
    }
    if (!row.mustSay.trim()) {
      errs.push(`请写出第${n}步你一定会说的一句话`)
    }
    if (!row.presenterBy?.trim()) {
      errs.push(
        `请选择第${n}步的演讲负责人（小组成员真实姓名；尽量让小组都参与，避免一人全包）`
      )
    }
  }

  if (!lesson6.challengeQuestion.trim()) {
    errs.push("请补充最可能被问的问题")
  }
  if (!lesson6.evidenceBack.trim()) {
    errs.push("请写明你准备回到哪条证据回答")
  }
  if (!lesson6.closingSentence.trim()) {
    errs.push("请补上最后一句收束话")
  }

  return errs
}
