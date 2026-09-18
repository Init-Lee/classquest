/**
 * 文件说明：模块 1 课时阶段快照回归测试。
 * 职责：锁定 HTML 转义、文件名清洗、课时号/URL 映射，以及课时 1/2/3 快照正文包含必要字段。
 * 更新触发：快照字段、转义策略、文件命名规则、课时号导出或课时映射变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createNewModule1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  buildModule1Lesson1SnapshotFilename,
  buildModule1Lesson1SnapshotHtml,
  buildModule1Lesson2SnapshotFilename,
  buildModule1Lesson2SnapshotHtml,
  buildModule1Lesson3SnapshotFilename,
  buildModule1Lesson3SnapshotHtml,
  resolveModule1SnapshotKind,
  resolveModule1SnapshotKindFromLessonId,
  safeModule1SnapshotFilenamePart,
} from "@/modules/module-1-ai-story/infra/persistence/serializers/snapshot-html"

function createSnapshotPortfolio() {
  const portfolio = createNewModule1Portfolio({
    clazz: "初一（1）班",
    studentName: '演示<script>alert(1)</script>',
    classSeatCode: "0101",
  })
  portfolio.lesson1 = {
    ...portfolio.lesson1,
    completed: true,
    step1Completed: true,
    step2Completed: true,
    step3Completed: true,
    step4Completed: true,
    sdg: "11 可持续城市和社区",
    sdgWhy: "理由<script>alert(1)</script>",
    cityIssue: "问题<img src=x onerror=alert(1)>",
    audience: "受众\"></div>",
    audienceConcern: "关切&关注",
  }
  return portfolio
}

describe("模块 1 课时 1 阶段快照", () => {
  it("转义可控字段中的脚本片段", () => {
    const html = buildModule1Lesson1SnapshotHtml(createSnapshotPortfolio())
    expect(html).not.toContain("<script>")
    expect(html).toContain("&lt;script&gt;")
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;")
    expect(html).toContain("&quot;")
    expect(html).toContain("&amp;")
    expect(html).toContain("未来来信")
    expect(html).toContain("课时 1")
    expect(html).toContain("主题核心")
    expect(html).toContain("11 可持续城市和社区")
  })

  it("清洗文件名中的不安全字符", () => {
    expect(safeModule1SnapshotFilenamePart('张<script>/三')).toBe("张-script-三")
    expect(buildModule1Lesson1SnapshotFilename("李:四", new Date("2026-09-05T00:00:00.000Z")))
      .toBe("模块1_李-四_课时1主题设定快照_2026-09-05.html")
  })
})

describe("模块 1 课时 2 阶段快照", () => {
  it("转义参照、写法和人物字段中的脚本片段", () => {
    const portfolio = createSnapshotPortfolio()
    portfolio.lesson2 = {
      ...portfolio.lesson2,
      completed: true,
      study: { caseId: "shexi", response: "观察<script>", aiReply: "", aiAssistUsed: false },
      reference: {
        ...portfolio.lesson2.reference,
        workTitle: "社戏<script>",
        author: "鲁迅",
        location: "夜航",
        versionNote: "版本<img src=x>",
        excerpt: "片段&原文",
        sourceNote: '出处"一',
      },
      writingPlan: "1. 写法\n2. 另一条",
      reason: "理由</div>",
      character: {
        who: "林禾<script>",
        want: "关灯",
        blocked: "邻居",
        firstAction: "下楼查看",
        possibleChange: "愿意听邻居",
      },
    }
    const html = buildModule1Lesson2SnapshotHtml(portfolio)
    expect(html).not.toContain("<script>")
    expect(html).toContain("&lt;script&gt;")
    expect(html).toContain("&lt;img src=x&gt;")
    expect(html).toContain("&amp;")
    expect(html).toContain("&quot;")
    expect(html).toContain("课时 2")
    expect(html).toContain("文学参照")
    expect(html).toContain("人物四格")
    expect(html).not.toContain("体现个人成长与社会责任")
    expect(html).not.toContain("使用了外部 AI 辅助")
  })

  it("选用第 4 关外部 AI 辅助时在人物旁标注", () => {
    const portfolio = createSnapshotPortfolio()
    portfolio.lesson2 = {
      ...portfolio.lesson2,
      characterAiAssistUsed: true,
      characterAiReply: "方案一",
    }
    const html = buildModule1Lesson2SnapshotHtml(portfolio)
    expect(html).toContain("人物设定外部 AI 辅助")
    expect(html).toContain("使用了外部 AI 辅助")
  })

  it("选用第 3 关外部 AI 辅助时在理由旁标注", () => {
    const portfolio = createSnapshotPortfolio()
    portfolio.lesson2 = {
      ...portfolio.lesson2,
      reason: "希望读者先感到现场",
      reasonAiAssistUsed: true,
      reasonAiReply: "候选一",
    }
    const html = buildModule1Lesson2SnapshotHtml(portfolio)
    expect(html).toContain("选择理由外部 AI 辅助")
    expect(html).toContain("使用了外部 AI 辅助")
  })

  it("选用外部 AI 辅助时在观察旁标注", () => {
    const portfolio = createSnapshotPortfolio()
    portfolio.lesson2 = {
      ...portfolio.lesson2,
      study: {
        caseId: "shexi",
        response: "山向船尾跑",
        aiReply: "候选一",
        aiAssistUsed: true,
      },
    }
    const html = buildModule1Lesson2SnapshotHtml(portfolio)
    expect(html).toContain("使用了外部 AI 辅助")
  })

  it("按课时 URL 或课时号切换快照类型并清洗课时 2 文件名", () => {
    expect(resolveModule1SnapshotKind("/module/1/lesson/1/step/4")).toBe("lesson1")
    expect(resolveModule1SnapshotKind("/module/1/lesson/2/step/4")).toBe("lesson2")
    expect(resolveModule1SnapshotKind("/module/1/lesson/3/step/4")).toBe("lesson3")
    expect(resolveModule1SnapshotKind("/module/1")).toBeNull()
    expect(resolveModule1SnapshotKindFromLessonId(1)).toBe("lesson1")
    expect(resolveModule1SnapshotKindFromLessonId(2)).toBe("lesson2")
    expect(resolveModule1SnapshotKindFromLessonId(3)).toBe("lesson3")
    expect(buildModule1Lesson2SnapshotFilename("李:四", new Date("2026-09-05T00:00:00.000Z")))
      .toBe("模块1_李-四_课时2风格与人物快照_2026-09-05.html")
  })
})

describe("模块 1 课时 3 阶段快照", () => {
  it("转义题目、正文和 AI 过程，并清洗文件名", () => {
    const portfolio = createSnapshotPortfolio()
    portfolio.lesson3 = {
      ...portfolio.lesson3,
      completed: true,
      storyTitle: "关灯<script>",
      observation: "注意到意见单",
      openingPlan: "从关灯开始",
      focusTechnique: "光线",
      draftText: "初稿<img src=x>",
      finalText: "确认稿&正文",
      decisionNote: "我保留了拉窗帘",
      aiProcess: {
        ...portfolio.lesson3.aiProcess,
        p3: {
          ...portfolio.lesson3.aiProcess.p3,
          copySucceeded: true,
          promptEdited: true,
          copyCount: 1,
          copiedAt: "2026-09-18T00:00:00.000Z",
          copiedPrompt: "请写开头<script>",
          aiReply: "一版草稿</div>",
        },
      },
    }
    const html = buildModule1Lesson3SnapshotHtml(portfolio)
    expect(html).not.toContain("<script>")
    expect(html).toContain("&lt;script&gt;")
    expect(html).toContain("&lt;img src=x&gt;")
    expect(html).toContain("&amp;")
    expect(html).toContain("使用了外部 AI 辅助")
    expect(html).toContain("系统生成的原始提示词")
    expect(html).toContain("实际复制的提示词")
    expect(html).toContain("贴回的 AI 回复")
    expect(html).toContain("关灯")
    expect(buildModule1Lesson3SnapshotFilename("李:四", new Date("2026-09-05T00:00:00.000Z")))
      .toBe("模块1_李-四_课时3开头快照_2026-09-05.html")
  })
})
