/**
 * 文件说明：课时 1 阶段快照回归测试。
 * 职责：锁定系统初看三档规则、HTML 只展示这些结果且教师记录留空、页脚声明未经评阅且不能恢复进度，以及课卡、学生顶栏、教师课时页的入口规则。
 * 更新触发：快照字段、系统初看档位、教师记录展示、转义、文件名或三个下载入口的可见规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createNewModule2Portfolio, type Module2PortfolioV1 } from "@/modules/module-2-ai-comic/domains/portfolio/types"
import {
  buildModule2Lesson1StageSnapshotFilename,
  buildModule2Lesson1StageSnapshotHtml,
  getModule2LessonCardSnapshotButton,
  safeModule2SnapshotFilenamePart,
  shouldShowModule2StudentTopBarSnapshot,
  shouldShowModule2TeacherLessonSnapshot,
} from "@/modules/module-2-ai-comic/features/global-actions/lesson1-stage-snapshot"
import { previewModule2Lesson1SystemLook } from "@/modules/module-2-ai-comic/features/global-actions/lesson1-system-preview"

const NOW = "2026-10-27T02:00:00.000Z"

function portfolioWithMarkup(): Module2PortfolioV1 {
  const base = createNewModule2Portfolio(
    { clazz: "初一（2）班", studentName: "王<芳>", classSeatCode: "0205" },
    NOW,
  )
  return {
    ...base,
    sourceSnapshot: {
      id: "src-1",
      origin: "manual",
      filename: null,
      sourceFileSha256: null,
      importedAt: NOW,
      studentConfirmedAt: NOW,
      sourceConfirmedAt: null,
      student: { ...base.student },
      storyTitle: "夜灯<script>alert(1)</script>",
      parts: { opening: "起", development: "承", turn: "转", ending: "合" },
      isTeachingSample: false,
      importNote: "",
    },
    lesson1: { ...base.lesson1, sampleViewed: true, sampleObservation: "作者留下了 <选择>。" },
    storyboard: {
      sourceSnapshotId: "src-1",
      frames: {
        opening: { sceneSentence: "起句" },
        development: { sceneSentence: "承句" },
        turn: { sceneSentence: "转句" },
        ending: { sceneSentence: "合句" },
      },
      confirmedAt: NOW,
    },
    visualDirection: {
      words: ["冷暖", "线条"],
      reason: "想让夜里显得安静。",
      referenceStyleId: null,
      confirmedAt: NOW,
    },
  }
}

describe("课时 1 系统初看", () => {
  it("观察已填，身份、自己的小说和样例都在，仍是需教师判断", () => {
    const look = previewModule2Lesson1SystemLook(portfolioWithMarkup())
    expect(look.task).toEqual({
      level: "需教师判断",
      fact: "只看到观察句已填写，不能据此判断是否分得清作者选取、AI 生成、作者核查。",
    })
    expect(look.task.fact).not.toContain("作者留下了")
    expect(look.task.fact).not.toContain("<")
  })

  it("没看过样例或观察为空时，任务项是待补充并说明缺哪一项", () => {
    const unseen = portfolioWithMarkup()
    unseen.lesson1 = { ...unseen.lesson1, sampleViewed: false }
    expect(previewModule2Lesson1SystemLook(unseen).task).toEqual({
      level: "待补充",
      fact: "还没有看过样例。",
    })

    const blank = portfolioWithMarkup()
    blank.lesson1 = { ...blank.lesson1, sampleObservation: "  " }
    expect(previewModule2Lesson1SystemLook(blank).task).toEqual({
      level: "待补充",
      fact: "第 2 关观察还没写。",
    })
  })

  it("四句已填写并确认、且对应当前小说时是材料齐全", () => {
    expect(previewModule2Lesson1SystemLook(portfolioWithMarkup()).scenes).toEqual({
      level: "材料齐全",
      fact: "四句已填写并确认。",
    })
  })

  it("四句有空句时是待补充", () => {
    const portfolio = portfolioWithMarkup()
    portfolio.storyboard.frames.turn.sceneSentence = "   "
    const look = previewModule2Lesson1SystemLook(portfolio)
    expect(look.scenes).toEqual({
      level: "待补充",
      fact: "转还是空的。",
    })
    const html = buildModule2Lesson1StageSnapshotHtml(portfolio)
    expect(html).toContain("待补充")
    expect(html).toContain("转还是空的。")
    expect(html.match(/<td class="teacher-record"><div class="handwrite"><\/div><\/td>/g)).toHaveLength(3)
  })

  it("四句已确认但来源是教学样例时是需教师判断", () => {
    const portfolio = portfolioWithMarkup()
    portfolio.sourceSnapshot = { ...portfolio.sourceSnapshot!, isTeachingSample: true }
    const look = previewModule2Lesson1SystemLook(portfolio)
    expect(look.scenes).toEqual({
      level: "需教师判断",
      fact: "四句已经确认，但来源是教学样例。",
    })
    expect(look.task.level).toBe("待补充")
    expect(look.task.fact).toContain("现在用的是教学样例，还不是自己的小说")
  })

  it("视觉词去重后不是 2–3 个时是待补充", () => {
    const tooMany = portfolioWithMarkup()
    tooMany.visualDirection = { ...tooMany.visualDirection, words: ["夜色", "夜色", "冷光", "线条", "阴影"] }
    expect(previewModule2Lesson1SystemLook(tooMany).visual).toEqual({
      level: "待补充",
      fact: "不同的视觉词超过 3 个。",
    })

    const collapsed = portfolioWithMarkup()
    collapsed.visualDirection = { ...collapsed.visualDirection, words: ["夜色", " 夜色 "] }
    expect(previewModule2Lesson1SystemLook(collapsed).visual).toEqual({
      level: "待补充",
      fact: "不同的视觉词不到 2 个。",
    })
  })

  it("视觉词和理由齐全且不需要重核时是材料齐全", () => {
    expect(previewModule2Lesson1SystemLook(portfolioWithMarkup()).visual).toEqual({
      level: "材料齐全",
      fact: "已有 2–3 个不同视觉词，理由已填写。",
    })
  })

  it("视觉词已确认但前面改过需要重核时是需教师判断", () => {
    const portfolio = portfolioWithMarkup()
    portfolio.lesson1 = {
      ...portfolio.lesson1,
      reviewNeeded: { ...portfolio.lesson1.reviewNeeded, visualDirection: true },
    }
    expect(previewModule2Lesson1SystemLook(portfolio).visual).toEqual({
      level: "需教师判断",
      fact: "视觉词和理由已经确认，但前面改过，需要重新核对。",
    })
  })
})

describe("课时 1 阶段快照 HTML", () => {
  it("含 < 的小说被转义，系统初看只展示档位，教师记录留空，页脚声明未经评阅且不能恢复", () => {
    const html = buildModule2Lesson1StageSnapshotHtml(portfolioWithMarkup())
    expect(html).toContain("ClassQuest 模块二：AI 四格漫画")
    expect(html).toContain("课时 1：小说怎样变成漫画 · 阶段快照")
    expect(html).toContain("交作业")
    expect(html).toContain("不能恢复学习进度")
    expect(html).toContain("夜灯&lt;script&gt;alert(1)&lt;/script&gt;")
    expect(html).not.toContain("<script>alert(1)</script>")
    expect(html).toContain("作者留下了 &lt;选择&gt;。")
    expect(html).toContain("王&lt;芳&gt;")
    expect(html).toContain("小说题目")
    expect(html).toContain("第 2 关观察")
    expect(html).toContain("四句分镜")
    expect(html).toContain("视觉词与理由")
    expect(html).toContain("能结合样例说明四格漫画与创作记录的任务要求，并区分作者选取、AI 生成、作者核查三项职责。")
    expect(html).toContain("能从已确认小说中选出起、承、转、合四个关键时刻，写成包含人物、地点和主要动作的四句画面描述。")
    expect(html).toContain("能用 2–3 个视觉词说明初步风格，并用一句话解释该风格与故事情绪的关系。")
    expect(html).toContain("四句均含可识别的人物、地点和主要动作")
    expect(html).toContain("系统初看：这是字段与规则检查，不是教师评价，不代表目标已经达成。")
    expect(html).toContain("教师记录（√ / ×）")
    expect(html).toContain("√ 表示目前证据支持达成，× 表示尚需改进，没看到证据就留空。")
    const levels = [...html.matchAll(/<p class="level">([^<]*)<\/p>/g)].map(match => match[1])
    expect(levels).toEqual(["需教师判断", "材料齐全", "材料齐全"])
    expect(html).toContain("只看到观察句已填写，不能据此判断是否分得清作者选取、AI 生成、作者核查。")
    expect(html).toContain("四句已填写并确认。")
    expect(html).toContain("已有 2–3 个不同视觉词，理由已填写。")
    const systemCells = [...html.matchAll(/<td class="system-look">([\s\S]*?)<\/td>/g)].map(match => match[1])
    expect(systemCells).toHaveLength(3)
    for (const cell of systemCells) {
      expect(cell).not.toContain("√")
      expect(cell).not.toContain("×")
      expect(cell).not.toContain("已通过")
    }
    const teacherCells = [...html.matchAll(/<td class="teacher-record">([\s\S]*?)<\/td>/g)].map(match => match[1])
    expect(teacherCells).toEqual([
      '<div class="handwrite"></div>',
      '<div class="handwrite"></div>',
      '<div class="handwrite"></div>',
    ])
    expect(html.split("√").length - 1).toBe(2)
    expect(html.split("×").length - 1).toBe(2)
    expect(html).not.toContain("已通过")
    expect(html).not.toContain("☑")
    expect(html).not.toContain("✓")
    expect(html).not.toContain("★")
    expect(html).not.toContain("☆")
    expect(html).not.toContain('type="checkbox"')
    expect(html).not.toContain("<input")
    expect(html).not.toContain("<img")
    expect(html).not.toContain(".png")
    expect(html).not.toContain("guan-deng")
    const footer = html.slice(html.lastIndexOf("<footer>"))
    expect(footer).toContain("本页未经教师评阅，没有成绩，也不给出分数或星级。")
    expect(footer).toContain("不能恢复")
  })

  it("文件名清洗非法字符，并带上日期", () => {
    expect(safeModule2SnapshotFilenamePart("王/芳:1")).toBe("王-芳-1")
    expect(safeModule2SnapshotFilenamePart("   ")).toBe("未填写")
    expect(safeModule2SnapshotFilenamePart("王<芳>")).toBe("王-芳")
    expect(buildModule2Lesson1StageSnapshotFilename("王/芳", new Date(NOW))).toBe(
      "模块2_王-芳_课时1_阶段快照_2026-10-27.html",
    )
  })
})

describe("课时 1 阶段快照入口", () => {
  it("课卡只在课时 1 出现；未完成不可点，学生顶栏不出现", () => {
    expect(getModule2LessonCardSnapshotButton(1, { available: true, completed: false })).toEqual({
      visible: true,
      enabled: false,
      hint: "完成本课后可下载",
    })
    expect(getModule2LessonCardSnapshotButton(1, { available: true, completed: true })).toEqual({
      visible: true,
      enabled: true,
      hint: "",
    })
    expect(getModule2LessonCardSnapshotButton(2, { available: false, completed: false }).visible).toBe(false)
    expect(getModule2LessonCardSnapshotButton(2, { available: true, completed: true }).visible).toBe(false)
    expect(shouldShowModule2StudentTopBarSnapshot()).toBe(false)
  })

  it("教师只在课时 1 页面看到当前课快照", () => {
    expect(shouldShowModule2TeacherLessonSnapshot("/module/2/lesson/1/step/4", true)).toBe(true)
    expect(shouldShowModule2TeacherLessonSnapshot("/module/2/lesson/1/step/1", true)).toBe(true)
    expect(shouldShowModule2TeacherLessonSnapshot("/module/2/lesson/1/step/4", false)).toBe(false)
    expect(shouldShowModule2TeacherLessonSnapshot("/module/2", true)).toBe(false)
    expect(shouldShowModule2TeacherLessonSnapshot("/module/2/lesson/2/step/1", true)).toBe(false)
  })

  it("学生顶栏源码不放阶段快照按钮", () => {
    const sources = import.meta.glob("./Module2GlobalActions.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>
    expect(sources["./Module2GlobalActions.tsx"]).not.toContain("阶段快照")
  })

  it("课卡按钮文案标明交作业，并说明不能恢复进度", () => {
    const sources = import.meta.glob("./Lesson1StageSnapshotButton.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>
    const code = sources["./Lesson1StageSnapshotButton.tsx"]
    expect(code).toContain("下载本课阶段快照（交作业用）")
    expect(code).toContain("交作业用。阶段快照不能恢复进度。")
    expect(code).toContain("完成本课后可下载")
  })
})
