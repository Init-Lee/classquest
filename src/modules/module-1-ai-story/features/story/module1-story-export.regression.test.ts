/**
 * 文件说明：模块 1 小说页整篇作品导出回归测试。
 * 职责：锁定文件名用小说标题、身份只写档案已有字段、四段来自确认稿；HTML 先转义，并带上可被模块二读取的数据块，仍不能当模块一进度导入。
 * 更新触发：导出文件名、身份抬头、分段正文、HTML 转义、数据块、教师样例标记或导入拒绝规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createModule1TeacherLecturePortfolio } from "@/modules/module-1-ai-story/constants/demo-portfolio"
import type { Module1Lesson6ConfirmedEdition, Module1StudentProfile } from "@/modules/module-1-ai-story/domains/portfolio/types"
import { deserializeModule1ContinuePackageText } from "@/modules/module-1-ai-story/infra/persistence/serializers/continue-package"
import {
  MODULE1_NOVEL_DATA_SCRIPT_ID,
  MODULE1_STORY_EXPORT_NOTE,
  MODULE1_STORY_HTML_EXPORT_NOTE,
  buildModule1StoryExport,
  buildModule1StoryExportFilename,
  buildModule1StoryHtml,
  buildModule1StoryIdentityLines,
  buildModule1StoryMarkdown,
  buildModule1StoryTxt,
} from "@/modules/module-1-ai-story/features/story/module1-story-export"

const exportedAt = new Date("2026-10-09T12:00:00.000Z")

function student(partial: Partial<Module1StudentProfile> = {}): Module1StudentProfile {
  return {
    clazz: "初一（1）班",
    studentName: "李 四",
    classSeatCode: "0101",
    ...partial,
  }
}

describe("模块 1 小说页整篇导出", () => {
  it("文件名使用清洗后的小说标题，不写死「我的小说」", () => {
    expect(buildModule1StoryExportFilename("李 四", "关灯这件事", "txt", exportedAt))
      .toBe("模块1_李-四_关灯这件事_2026-10-09.txt")
    expect(buildModule1StoryExportFilename("李 四", "关灯这件事", "md", exportedAt))
      .toBe("模块1_李-四_关灯这件事_2026-10-09.md")
    expect(buildModule1StoryExportFilename("李 四", "关灯<这件事>/稿", "html", exportedAt))
      .toBe("模块1_李-四_关灯-这件事-稿_2026-10-09.html")
    expect(buildModule1StoryExportFilename("李 四", "   ", "txt", exportedAt))
      .toBe("模块1_李-四_未命名_2026-10-09.txt")
    const named = buildModule1StoryExportFilename("李四", "关灯这件事", "txt", exportedAt)
    expect(named).toContain("关灯这件事")
    expect(named).not.toContain("我的小说")
    expect(named).not.toContain("快照")
    expect(buildModule1StoryExportFilename("李四", "我的小说", "txt", exportedAt)).toContain("我的小说")
  })

  it("身份只写档案里已有的字段，正文带四段且仍是确认稿", () => {
    const demo = createModule1TeacherLecturePortfolio()
    demo.lesson6.finalText = "这是还没再次确认的新合段。"
    const edition = demo.lesson6.confirmedEdition!
    expect(buildModule1StoryIdentityLines(student({ clazz: "  ", classSeatCode: "" }))).toEqual(["姓名：李 四"])
    const txt = buildModule1StoryTxt(demo.student, edition)
    const markdown = buildModule1StoryMarkdown(demo.student, edition)
    for (const content of [txt, markdown]) {
      expect(content).toContain("班级：初一（1）班")
      expect(content).toContain("姓名：演示学生")
      expect(content).toContain("班学号：0101")
      expect(content).toContain(edition.storyTitle)
      expect(content).toContain("起·课时3")
      expect(content).toContain("承·课时4")
      expect(content).toContain("转·课时5")
      expect(content).toContain("合·课时6")
      expect(content).toContain(edition.openingText)
      expect(content).toContain(edition.endingText)
      expect(content).toContain(MODULE1_STORY_EXPORT_NOTE)
      expect(content).not.toContain("还没再次确认")
      expect(content).not.toContain("课堂演示提示词")
      expect(content).not.toContain("我的小说")
    }
    const sparse = buildModule1StoryTxt(student({ clazz: "", classSeatCode: "" }), edition)
    expect(sparse).toContain("姓名：李 四")
    expect(sparse).not.toContain("班学号")
    expect(sparse).not.toContain("班级：")
  })

  it("HTML 先转义再排版，并且不能当进度导入", () => {
    const edition: Module1Lesson6ConfirmedEdition = {
      confirmedAt: "2026-10-09T00:00:00.000Z",
      storyTitle: `说"你好"`,
      openingText: "甲\n<script>alert(1)</script>",
      developmentText: "乙<br>丙",
      turnText: "a < b & c > d",
      endingText: "合段正文",
    }
    const html = buildModule1StoryHtml(student(), edition, { isTeachingSample: false })
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
    expect(html).toContain("乙&lt;br&gt;丙")
    expect(html).toContain("a &lt; b &amp; c &gt; d")
    expect(html).toContain("&quot;你好&quot;")
    expect(html).toContain("甲<br>\n")
    expect(html).toContain("起·课时3")
    expect(html).toContain("合·课时6")
    expect(html).toContain(MODULE1_STORY_HTML_EXPORT_NOTE)
    expect(html).not.toContain(MODULE1_STORY_EXPORT_NOTE)
    const file = buildModule1StoryExport(student(), edition, "html", exportedAt, { isTeachingSample: false })
    expect(file.filename).toContain("说-你好")
    expect(file.filename).not.toContain("我的小说")
    expect(() => deserializeModule1ContinuePackageText(file.content, file.filename)).toThrow(/不能恢复进度/)
  })

  it("HTML 数据块与可见正文使用确认稿，并按参数标记教师样例", () => {
    const edition: Module1Lesson6ConfirmedEdition = {
      confirmedAt: "2026-10-09T00:00:00.000Z",
      storyTitle: `说"你好" <关灯>`,
      openingText: "甲\n</script>\n🌱\"引号\"",
      developmentText: "乙<br>丙",
      turnText: "a < b & c > d",
      endingText: "冻结合段",
    }
    const teacher = buildModule1StoryHtml(
      student({ studentName: "演示学生" }),
      edition,
      { isTeachingSample: true },
    )
    const studentFile = buildModule1StoryHtml(student({ studentName: "演示学生" }), edition, { isTeachingSample: false })
    for (const html of [teacher, studentFile]) {
      const opens = html.match(new RegExp(`<script\\b[^>]*\\bid="${MODULE1_NOVEL_DATA_SCRIPT_ID}"`, "g")) ?? []
      expect(opens).toHaveLength(1)
      expect(html.match(/<\/script>/g)).toHaveLength(1)
      expect(html).toContain("\\u003c/script>")
      expect(html).toContain('data-cq-story-title')
      expect(html).toContain('data-cq-part="opening"')
      expect(html).toContain('data-cq-part="development"')
      expect(html).toContain('data-cq-part="turn"')
      expect(html).toContain('data-cq-part="ending"')
      const body = html.match(/<script id="classquest-story-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1]
      expect(body).toBeTruthy()
      const parsed = JSON.parse(body ?? "{}") as {
        documentType: string
        version: number
        sourceModuleId: string
        isTeachingSample: boolean
        confirmedEdition: Module1Lesson6ConfirmedEdition
      }
      expect(parsed.documentType).toBe("classquest-novel")
      expect(parsed.version).toBe(1)
      expect(parsed.sourceModuleId).toBe("module-1-ai-story")
      expect(parsed.confirmedEdition).toEqual({
        confirmedAt: edition.confirmedAt,
        storyTitle: edition.storyTitle,
        openingText: edition.openingText,
        developmentText: edition.developmentText,
        turnText: edition.turnText,
        endingText: edition.endingText,
      })
      expect(html).toContain("冻结合段")
      expect(html).not.toContain("工作稿合段")
    }
    expect(JSON.parse(teacher.match(/<script id="classquest-story-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1] ?? "{}").isTeachingSample).toBe(true)
    expect(JSON.parse(studentFile.match(/<script id="classquest-story-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1] ?? "{}").isTeachingSample).toBe(false)

    const demo = createModule1TeacherLecturePortfolio()
    demo.lesson6.finalText = "这是还没再次确认的新合段。"
    const frozen = buildModule1StoryHtml(demo.student, demo.lesson6.confirmedEdition!, { isTeachingSample: true })
    const frozenBody = frozen.match(/<script id="classquest-story-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1] ?? ""
    const frozenJson = JSON.parse(frozenBody) as { confirmedEdition: Module1Lesson6ConfirmedEdition }
    expect(frozenJson.confirmedEdition.endingText).toBe(demo.lesson6.confirmedEdition!.endingText)
    expect(frozenJson.confirmedEdition.endingText).not.toBe(demo.lesson6.finalText)
    expect(frozen).not.toContain("还没再次确认")
  })
})
