/**
 * 文件说明：课时 1 阶段快照回归测试。
 * 职责：锁定 HTML 转义、三行手写评价留空、页脚声明不能恢复进度，以及课卡、学生顶栏、教师课时页的入口规则。
 * 更新触发：快照字段、转义、文件名或三个下载入口的可见规则变化时，需要同步更新本文件。
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
    lesson1: { ...base.lesson1, sampleObservation: "作者留下了 <选择>。" },
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

describe("课时 1 阶段快照 HTML", () => {
  it("含 < 的小说被转义，三行评价为空，页脚声明不能恢复", () => {
    const html = buildModule2Lesson1StageSnapshotHtml(portfolioWithMarkup())
    expect(html).toContain("模块二 · 课时 1 · 阶段快照")
    expect(html).toContain("交作业")
    expect(html).toContain("不能恢复学习进度")
    expect(html).toContain("夜灯&lt;script&gt;alert(1)&lt;/script&gt;")
    expect(html).not.toContain("<script>alert(1)</script>")
    expect(html).toContain("作者留下了 &lt;选择&gt;。")
    expect(html).toContain("王&lt;芳&gt;")
    expect(html.match(/<div class="handwrite"><\/div>/g)).toHaveLength(3)
    expect(html).toContain("系统不打勾，也不写通过。")
    expect(html).not.toContain("已通过")
    expect(html).not.toContain("☑")
    expect(html).not.toContain("✓")
    expect(html).not.toContain('type="checkbox"')
    expect(html).not.toContain("<img")
    expect(html).not.toContain(".png")
    expect(html).not.toContain("guan-deng")
    const footer = html.slice(html.lastIndexOf("<footer>"))
    expect(footer).toContain("本页不代表老师已经检查，也不给出分数或星级。")
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
})
