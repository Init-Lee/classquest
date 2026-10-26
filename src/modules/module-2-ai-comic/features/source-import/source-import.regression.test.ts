/**
 * 文件说明：模块 2 小说解析回归测试。
 * 职责：用课时一夹具核对旧 HTML / Markdown，用模块一真实导出函数做新 HTML 往返，并确认歧义文件转人工、危险 HTML 不被执行、拒绝结果不改档案。
 * 更新触发：小说解析规则、教学样例指纹、候选草稿接入或夹具期望变化时，需要同步更新本文件。
 *
 * 本测试会 import 模块一导出函数，只为生成真实 HTML。模块二生产代码不能 import 模块一。
 */

import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it, vi } from "vitest"
import { buildModule1StoryHtml } from "@/modules/module-1-ai-story/features/story/module1-story-export"
import type { Module1Lesson6ConfirmedEdition, Module1StudentProfile } from "@/modules/module-1-ai-story/domains/portfolio/types"
import { confirmModule2SourceImportDraft } from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import { createNewModule2Portfolio, type Module2PortfolioV1 } from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { createManualNovelDraft, editNovelDraft } from "@/modules/module-2-ai-comic/features/source-import/novel-draft"
import { parseNovelSource } from "@/modules/module-2-ai-comic/features/source-import/parse-novel"
import { stageNovelCandidate } from "@/modules/module-2-ai-comic/features/source-import/stage-novel"
import { TEACHING_SAMPLE_PARTS, TEACHING_SAMPLE_TITLE } from "@/modules/module-2-ai-comic/features/source-import/teaching-sample"

const IMPORTED = "2026-10-26T05:00:00.000Z"
const fixturesDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../../build_Plan/module-2/build-classquest-module2-lesson1/assets/fixtures",
)

function readFixture(name: string): Uint8Array {
  return new Uint8Array(readFileSync(resolve(fixturesDir, name)))
}

function textBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

const expected = JSON.parse(readFileSync(resolve(fixturesDir, "expected-source.json"), "utf8")) as {
  student: { clazz: string; studentName: string; classSeatCode: string }
  storyTitle: string
  parts: { opening: string; development: string; turn: string; ending: string }
  sourceConfirmedAt: null
}

function studentFile(): Module1StudentProfile {
  return { clazz: "初一（1）班", studentName: "李四", classSeatCode: "0101" }
}

function riskyEdition(): Module1Lesson6ConfirmedEdition {
  return {
    confirmedAt: "2026-10-09T00:00:00.000Z",
    storyTitle: "说\"你好\" <关灯>",
    openingText: "甲\n</script>\n🌱\"引号\"",
    developmentText: "乙<br>丙",
    turnText: "a < b & c > d",
    endingText: "冻结合段\n第二行",
  }
}

describe("旧格式小说夹具", () => {
  it("旧 HTML 与旧 Markdown 读出同一份正文，源定稿时间为空", async () => {
    for (const [name, origin] of [
      ["legacy-novel.html", "classquest-html-legacy"],
      ["legacy-novel.md", "classquest-md-legacy"],
    ] as const) {
      const parsed = await parseNovelSource({ bytes: readFixture(name), filename: name, importedAt: IMPORTED })
      expect(parsed.kind).toBe("candidate")
      if (parsed.kind !== "candidate") return
      expect(parsed.review).toBe("extracted")
      expect(parsed.draft.origin).toBe(origin)
      expect(parsed.draft.sourceConfirmedAt).toBeNull()
      expect(parsed.draft.student).toEqual(expected.student)
      expect(parsed.draft.storyTitle).toBe(expected.storyTitle)
      expect(parsed.draft.parts).toEqual(expected.parts)
      expect(parsed.draft.parts.opening).toContain("\n")
      expect(parsed.draft.isTeachingSample).toBe(false)
    }
  })

  it("分段标签重复时转人工，不猜测四段", async () => {
    const parsed = await parseNovelSource({
      bytes: readFixture("ambiguous-novel.md"),
      filename: "ambiguous-novel.md",
      importedAt: IMPORTED,
    })
    expect(parsed.kind).toBe("candidate")
    if (parsed.kind !== "candidate") return
    expect(parsed.review).toBe("manual")
    expect(parsed.draft.origin).toBe("manual")
    expect(parsed.draft.sourceConfirmedAt).toBeNull()
    expect(parsed.draft.parts).toEqual({ opening: "", development: "", turn: "", ending: "" })
    expect(parsed.draft.storyTitle).toBe(expected.storyTitle)
    expect(parsed.draft.student).toEqual(expected.student)
  })

  it("带脚本和外链的 HTML 只抽出正文，不执行、不请求", async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal("fetch", fetchSpy)
    const marker = "__cqImportExecuted"
    expect((globalThis as Record<string, unknown>)[marker]).toBeUndefined()
    const parsed = await parseNovelSource({
      bytes: readFixture("unsafe-novel.html"),
      filename: "unsafe-novel.html",
      importedAt: IMPORTED,
    })
    expect((globalThis as Record<string, unknown>)[marker]).toBeUndefined()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(parsed.kind).toBe("candidate")
    if (parsed.kind !== "candidate") return
    expect(parsed.draft.parts).toEqual(expected.parts)
    expect(JSON.stringify(parsed)).not.toContain("example.invalid")
    expect(JSON.stringify(parsed)).not.toContain("__cqImportExecuted")
  })
})

describe("模块一真实导出的新 HTML", () => {
  it("特殊字符往返，教师与学生的样例标记按参数而不是姓名", async () => {
    const edition = riskyEdition()
    const teacherHtml = buildModule1StoryHtml(studentFile(), edition, { isTeachingSample: true })
    const studentHtml = buildModule1StoryHtml(
      { ...studentFile(), studentName: "演示学生" },
      edition,
      { isTeachingSample: false },
    )
    const teacher = await parseNovelSource({ bytes: textBytes(teacherHtml), filename: "teacher.html", importedAt: IMPORTED })
    const student = await parseNovelSource({ bytes: textBytes(studentHtml), filename: "student.html", importedAt: IMPORTED })
    expect(teacher.kind).toBe("candidate")
    expect(student.kind).toBe("candidate")
    if (teacher.kind !== "candidate" || student.kind !== "candidate") return
    expect(teacher.draft.origin).toBe("classquest-html-v1")
    expect(teacher.draft.sourceConfirmedAt).toBe(edition.confirmedAt)
    expect(teacher.draft.storyTitle).toBe(edition.storyTitle)
    expect(teacher.draft.parts).toEqual({
      opening: edition.openingText,
      development: edition.developmentText,
      turn: edition.turnText,
      ending: edition.endingText,
    })
    expect(teacher.draft.isTeachingSample).toBe(true)
    expect(student.draft.isTeachingSample).toBe(false)
    expect(student.draft.student.studentName).toBe("演示学生")
  })

  it("导出的是确认稿，工作稿不会进入数据块或可见正文", async () => {
    const frozen = "已经确认的合段"
    const html = buildModule1StoryHtml(studentFile(), {
      confirmedAt: "2026-10-09T00:00:00.000Z",
      storyTitle: "冻结题目",
      openingText: "起",
      developmentText: "承",
      turnText: "转",
      endingText: frozen,
    }, { isTeachingSample: false })
    expect(html).not.toContain("还没确认的工作稿")
    const parsed = await parseNovelSource({ bytes: textBytes(html), filename: "frozen.html", importedAt: IMPORTED })
    expect(parsed.kind).toBe("candidate")
    if (parsed.kind !== "candidate") return
    expect(parsed.draft.parts.ending).toBe(frozen)
  })

  it("正文与已知教学样例一致时标为教学样例，不看姓名", async () => {
    const html = buildModule1StoryHtml({
      clazz: "初一（2）班",
      studentName: "张三",
      classSeatCode: "0201",
    }, {
      confirmedAt: "2026-09-05T02:00:00.000Z",
      storyTitle: TEACHING_SAMPLE_TITLE,
      openingText: TEACHING_SAMPLE_PARTS.opening,
      developmentText: TEACHING_SAMPLE_PARTS.development,
      turnText: TEACHING_SAMPLE_PARTS.turn,
      endingText: TEACHING_SAMPLE_PARTS.ending,
    }, { isTeachingSample: false })
    const parsed = await parseNovelSource({ bytes: textBytes(html), filename: "sample.html", importedAt: IMPORTED })
    expect(parsed.kind).toBe("candidate")
    if (parsed.kind !== "candidate") return
    expect(parsed.draft.isTeachingSample).toBe(true)
    expect(parsed.draft.student.studentName).toBe("张三")
  })

  it("元数据损坏、版本过高、正文矛盾或重复数据块都失败，不降级成旧 HTML", async () => {
    const html = buildModule1StoryHtml(studentFile(), {
      confirmedAt: "2026-10-09T00:00:00.000Z",
      storyTitle: "对照题",
      openingText: "起段唯一标记",
      developmentText: "承",
      turnText: "转",
      endingText: "合",
    }, { isTeachingSample: false })
    const index = html.indexOf("起段唯一标记")
    const mismatched = `${html.slice(0, index)}被改过的正文${html.slice(index + "起段唯一标记".length)}`
    const corrupt = html.replace(
      /<script id="classquest-story-data" type="application\/json">[\s\S]*?<\/script>/,
      "<script id=\"classquest-story-data\" type=\"application/json\">{</script>",
    )
    const future = html.replace("\"version\":1", "\"version\":2")
    const duplicate = html.replace("</body>", "<script id=\"classquest-story-data\" type=\"application/json\">{}</script></body>")
    for (const [file, code] of [
      [mismatched, "visible-mismatch"],
      [corrupt, "metadata-invalid"],
      [future, "version-unsupported"],
      [duplicate, "duplicate-data-block"],
    ] as const) {
      const parsed = await parseNovelSource({ bytes: textBytes(file), filename: "bad.html", importedAt: IMPORTED })
      expect(parsed.kind).toBe("rejected")
      if (parsed.kind !== "rejected") return
      expect(parsed.code).toBe(code)
    }
  })
})

describe("错误入口与候选接入", () => {
  it("阶段快照和模块一进度文件只给指引", async () => {
    const snapshot = "<!doctype html><html><body><h1>课时 1 主题设定阶段快照</h1><p>阶段快照不能恢复进度。</p></body></html>"
    const module1 = JSON.stringify({ packageType: "classquest-module1-continue-package", version: 1, portfolio: { student: { studentName: "甲" } } })
    const snapshotResult = await parseNovelSource({ bytes: textBytes(snapshot), filename: "snap.html", importedAt: IMPORTED })
    const packageResult = await parseNovelSource({ bytes: textBytes(module1), filename: "progress.json", importedAt: IMPORTED })
    expect(snapshotResult.kind).toBe("rejected")
    expect(packageResult.kind).toBe("rejected")
    if (snapshotResult.kind !== "rejected" || packageResult.kind !== "rejected") return
    expect(snapshotResult.code).toBe("stage-snapshot")
    expect(snapshotResult.message).toContain("我的小说")
    expect(packageResult.code).toBe("module1-package")
    expect(packageResult.message).toContain("导入进度")
  })

  it("拒绝结果不改档案；候选只写入待核对草稿", async () => {
    const current = createNewModule2Portfolio({ clazz: "初一（1）班", studentName: "王芳", classSeatCode: "0101" }, IMPORTED)
    const confirmed: Module2PortfolioV1 = {
      ...current,
      sourceSnapshot: {
        id: "src-old",
        origin: "manual",
        filename: null,
        sourceFileSha256: null,
        importedAt: IMPORTED,
        studentConfirmedAt: IMPORTED,
        sourceConfirmedAt: null,
        student: { ...current.student },
        storyTitle: "旧题目",
        parts: { opening: "旧起", development: "旧承", turn: "旧转", ending: "旧合" },
        isTeachingSample: false,
        importNote: "",
      },
    }
    const module1 = await parseNovelSource({
      bytes: textBytes(JSON.stringify({ packageType: "classquest-module1-continue-package", version: 1 })),
      filename: "a.json",
      importedAt: IMPORTED,
    })
    const rejectedStage = stageNovelCandidate(confirmed, module1)
    expect(rejectedStage.applied).toBe(false)
    expect(rejectedStage.portfolio).toBe(confirmed)

    const html = buildModule1StoryHtml(studentFile(), riskyEdition(), { isTeachingSample: false })
    const parsed = await parseNovelSource({ bytes: textBytes(html), filename: "novel.html", importedAt: IMPORTED })
    const staged = stageNovelCandidate(confirmed, parsed)
    expect(staged.applied).toBe(true)
    expect(staged.portfolio.sourceSnapshot).toEqual(confirmed.sourceSnapshot)
    expect(staged.portfolio.student).toEqual(confirmed.student)
    expect(staged.portfolio.sourceImportDraft?.storyTitle).toBe(riskyEdition().storyTitle)
    expect(staged.portfolio.lesson1.completed).toBe(false)

    const done = confirmModule2SourceImportDraft(staged.portfolio, {
      snapshotId: "src-new",
      student: { clazz: "初一（1）班", studentName: "李四", classSeatCode: "0101" },
      now: "2026-10-26T06:00:00.000Z",
    })
    expect(done.ok).toBe(true)
    if (!done.ok) return
    expect(done.outcome).toBe("switched")
    expect(done.portfolio.sourceImportDraft).toBeNull()
    expect(done.portfolio.sourceSnapshot?.parts.ending).toBe("冻结合段\n第二行")
    expect(done.portfolio.sourceHistory.map(item => item.id)).toEqual(["src-old"])
    expect(done.portfolio.lesson1.reviewNeeded).toEqual({ storyboard: true, visualDirection: true })
  })

  it("人工粘贴和改写都不沿用源定稿时间", () => {
    const pasted = createManualNovelDraft({
      filename: null,
      importedAt: IMPORTED,
      sourceFileSha256: null,
    }, {
      storyTitle: "手写题目",
      parts: { opening: "起" },
    })
    expect(pasted.origin).toBe("manual")
    expect(pasted.sourceConfirmedAt).toBeNull()
    expect(pasted.isTeachingSample).toBe(false)

    const edited = editNovelDraft({
      ...pasted,
      origin: "classquest-html-v1",
      sourceConfirmedAt: "2026-10-09T00:00:00.000Z",
      parts: { opening: "起", development: "承", turn: "转", ending: "合" },
    }, { parts: { ending: "改过的合" } })
    expect(edited.origin).toBe("manual")
    expect(edited.sourceConfirmedAt).toBeNull()
    expect(edited.importNote).toContain("2026-10-09T00:00:00.000Z")
    expect(edited.parts.ending).toBe("改过的合")
  })

  it("解析实现不构造 DOM、不写页面、不发请求", () => {
    const sources = import.meta.glob(["./*.ts", "!./*.regression.test.ts"], { query: "?raw", import: "default", eager: true }) as Record<string, string>
    const offenders = Object.entries(sources)
      .filter(([, code]) => /DOMParser|innerHTML|dangerouslySetInnerHTML|document\.|createElement|fetch\(|new Worker|iframe/.test(code))
      .map(([path]) => path)
    expect(Object.keys(sources).length).toBeGreaterThan(3)
    expect(offenders).toEqual([])
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})
