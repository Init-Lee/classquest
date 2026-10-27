/**
 * 文件说明：模块 2 课时 1 阶段快照。
 * 职责：把当前档案里的身份、小说题目、第 2 关观察、四句分镜和视觉词与理由渲染成一份转义过的独立 HTML，并给出文件名与下载入口规则。版式沿用模块四阶段快照的页眉、信息卡和分区。评价表的「系统初看」只展示纯函数返回的档位和事实说明；教师记录留空，由老师手写 √ 或 ×。快照只用于交作业，不能恢复学习进度，也不写入学生本机档案。
 * 更新触发：课时 1 快照字段、教师快速评价维度、系统初看的展示方式、转义规则、文件名、课卡或教师课时页入口变化时，需要同步更新本文件与回归测试。档位规则本身改 lesson1-system-preview.ts。
 */

import {
  MODULE2_FOUR_PARTS,
  type FourPart,
  type Module2PortfolioV1,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"
import {
  previewModule2Lesson1SystemLook,
  type Module2Lesson1SystemLook,
} from "@/modules/module-2-ai-comic/features/global-actions/lesson1-system-preview"

const PART_LABELS: Record<FourPart, string> = {
  opening: "起",
  development: "承",
  turn: "转",
  ending: "合",
}

/**
 * 教案「课堂 Quick Check」的三项目标与证据要点。
 * 系统初看另由纯函数给出；这一份不预填 √、×、分数或星级。
 */
const TEACHER_QUICK_CHECK = [
  {
    goal: "能结合样例说明四格漫画与创作记录的任务要求，并区分作者选取、AI 生成、作者核查三项职责。",
    observe: "学生能说明最终要交四格漫画与创作记录，并正确区分作者选取、AI 生成、作者核查。仅勾选“我知道了”不作为达成证据。若认为 AI 生成后无需核查，引导其回看样例修改。对照本页「第 2 关观察」。",
  },
  {
    goal: "能从已确认小说中选出起、承、转、合四个关键时刻，写成包含人物、地点和主要动作的四句画面描述。",
    observe: "四句均含可识别的人物、地点和主要动作；能在原作中找到依据；连读可以辨认起点、推进、变化和最终状态。表达有不同方案，但四句不能只是同一事件的重复描述。对照本页「四句分镜」。",
  },
  {
    goal: "能用 2–3 个视觉词说明初步风格，并用一句话解释该风格与故事情绪的关系。",
    observe: "能用 2—3 个视觉词描述初步方向，并说明与故事情绪的一处具体关系。选择教师推荐款式或词语数量满足要求，均不能单独证明达成。对照本页「视觉词与理由」。",
  },
] as const

export interface Module2LessonCardSnapshotButton {
  visible: boolean
  enabled: boolean
  hint: string
}

const HIDDEN_CARD_SNAPSHOT: Module2LessonCardSnapshotButton = {
  visible: false,
  enabled: false,
  hint: "",
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function snapshotText(value: string): string {
  const trimmed = value.trim()
  return escapeHtml(trimmed || "未填写")
}

/** 去掉文件名里的路径和非法字符。空白也换成连字符，避免下载名被拆开。 */
export function safeModule2SnapshotFilenamePart(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[\\/:*?"<>|\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return cleaned || "未填写"
}

export function buildModule2Lesson1StageSnapshotFilename(studentName: string, now = new Date()): string {
  const day = now.toISOString().slice(0, 10)
  return `模块2_${safeModule2SnapshotFilenamePart(studentName)}_课时1_阶段快照_${day}.html`
}

/** 学生顶栏不放阶段快照。恢复进度只用「保存学习包」「导入学习包」；「重置」只清本机模块二档案。 */
export function shouldShowModule2StudentTopBarSnapshot(): boolean {
  return false
}

/** 教师讲解模式只在课时 1 页面提供当前课快照。首页和其他课时不从这里下载。 */
export function shouldShowModule2TeacherLessonSnapshot(pathname: string, isTeacherMode: boolean): boolean {
  return isTeacherMode && /\/module\/2\/lesson\/1(?:\/|$)/.test(pathname)
}

/**
 * 首页课卡：只有课时 1 显示。未完成时按钮不可点，并旁注「完成本课后可下载」。
 * 课时 2—6 本轮不提供快照。
 */
export function getModule2LessonCardSnapshotButton(
  lessonId: number,
  options: { available: boolean; completed: boolean },
): Module2LessonCardSnapshotButton {
  if (lessonId !== 1 || !options.available) return HIDDEN_CARD_SNAPSHOT
  if (!options.completed) {
    return { visible: true, enabled: false, hint: "完成本课后可下载" }
  }
  return { visible: true, enabled: true, hint: "" }
}

function identitySection(portfolio: Module2PortfolioV1, now: Date): string {
  const { clazz, studentName, classSeatCode } = portfolio.student
  return `<section>
      <h2>身份</h2>
      <div class="info-grid">
        <div class="info-card"><span class="label">班级</span><span class="value">${snapshotText(clazz)}</span></div>
        <div class="info-card"><span class="label">姓名</span><span class="value">${snapshotText(studentName)}</span></div>
        <div class="info-card"><span class="label">班学号</span><span class="value">${snapshotText(classSeatCode)}</span></div>
        <div class="info-card"><span class="label">生成时间</span><span class="value">${escapeHtml(now.toLocaleString("zh-CN"))}</span></div>
      </div>
    </section>`
}

function storySection(portfolio: Module2PortfolioV1): string {
  const title = portfolio.sourceSnapshot?.storyTitle ?? ""
  const frames = MODULE2_FOUR_PARTS.map(part => {
    const sentence = portfolio.storyboard.frames[part].sceneSentence
    return `<div class="info-card"><span class="label">${PART_LABELS[part]}</span><span class="value">${snapshotText(sentence)}</span></div>`
  }).join("\n        ")
  const words = portfolio.visualDirection.words.map(word => word.trim()).filter(Boolean)
  const wordText = words.length === 0 ? "" : words.join("、")
  return `<section>
      <h2>小说题目</h2>
      <p class="value">${snapshotText(title)}</p>
    </section>
    <section>
      <h2>第 2 关观察</h2>
      <p class="value">${snapshotText(portfolio.lesson1.sampleObservation)}</p>
    </section>
    <section>
      <h2>四句分镜</h2>
      <div class="info-grid">
        ${frames}
      </div>
    </section>
    <section>
      <h2>视觉词与理由</h2>
      <div class="info-grid">
        <div class="info-card"><span class="label">视觉词</span><span class="value">${snapshotText(wordText)}</span></div>
        <div class="info-card"><span class="label">理由</span><span class="value">${snapshotText(portfolio.visualDirection.reason)}</span></div>
      </div>
    </section>`
}

function systemLookCell(look: Module2Lesson1SystemLook): string {
  return `<td class="system-look"><p class="level">${escapeHtml(look.level)}</p><p class="fact">${escapeHtml(look.fact)}</p></td>`
}

/** 教师记录单元格保持空白。档位和事实说明只来自系统初看纯函数，这里不改写、不打勾。 */
function teacherSection(portfolio: Module2PortfolioV1): string {
  const preview = previewModule2Lesson1SystemLook(portfolio)
  const rows = [
    { item: TEACHER_QUICK_CHECK[0], look: preview.task },
    { item: TEACHER_QUICK_CHECK[1], look: preview.scenes },
    { item: TEACHER_QUICK_CHECK[2], look: preview.visual },
  ].map(({ item, look }) => `<tr>
          <td>${escapeHtml(item.goal)}</td>
          <td>${escapeHtml(item.observe)}</td>
          ${systemLookCell(look)}
          <td class="teacher-record"><div class="handwrite"></div></td>
        </tr>`).join("\n        ")
  return `<section>
      <h2>教师快速评价</h2>
      <p class="note">系统初看：这是字段与规则检查，不是教师评价，不代表目标已经达成。</p>
      <p>教师记录由老师手写。√ 表示目前证据支持达成，× 表示尚需改进，没看到证据就留空。这里不打分，也不自动勾选。</p>
      <table>
        <thead>
          <tr><th>目标</th><th>观察点</th><th>系统初看</th><th>教师记录（√ / ×）</th></tr>
        </thead>
        <tbody>
        ${rows}
        </tbody>
      </table>
    </section>`
}

/** 生成独立 HTML。全部学生字段先转义，页内不引用教师样例图。 */
export function buildModule2Lesson1StageSnapshotHtml(portfolio: Module2PortfolioV1, now = new Date()): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>模块二课时1阶段快照</title>
  <style>
    :root { color-scheme: light; --ink: #172033; --muted: #667085; --line: #d8e2f0; --primary: #2563eb; --soft: #eff6ff; --warm: #fff7ed; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif;
      line-height: 1.7;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 30%),
        linear-gradient(135deg, #f8fbff 0%, #f3f7ff 45%, #fff7ed 100%);
    }
    main { max-width: 980px; margin: 0 auto; padding: 36px 24px 48px; }
    h1, h2, p { margin-top: 0; }
    .hero {
      border: 1px solid rgba(37, 99, 235, 0.18);
      border-radius: 28px;
      padding: 28px;
      color: white;
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #f97316 130%);
      box-shadow: 0 20px 50px rgba(37, 99, 235, 0.22);
    }
    .hero h1 { font-size: 30px; margin-bottom: 8px; letter-spacing: 0.04em; }
    .hero .muted { color: rgba(255, 255, 255, 0.78); }
    section {
      border: 1px solid var(--line);
      border-radius: 22px;
      padding: 20px;
      margin-top: 18px;
      background: rgba(255, 255, 255, 0.88);
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
    }
    section h2 { font-size: 20px; margin-bottom: 12px; color: #1d4ed8; }
    .muted { color: var(--muted); }
    .info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .info-card { border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; background: #ffffff; }
    .label { display: block; color: var(--muted); font-size: 13px; margin-bottom: 4px; }
    .value { font-weight: 700; white-space: pre-wrap; }
    .level { font-weight: 700; margin: 0 0 4px; }
    .fact { margin: 0; font-weight: 400; }
    .note { border-left: 4px solid #f97316; padding: 10px 12px; border-radius: 12px; background: var(--warm); }
    table { border-collapse: separate; border-spacing: 0; width: 100%; margin-top: 10px; overflow: hidden; border: 1px solid var(--line); border-radius: 14px; font-size: 14px; background: white; }
    th, td { border-bottom: 1px solid var(--line); padding: 9px 10px; text-align: left; vertical-align: top; }
    tr:last-child td { border-bottom: 0; }
    th { background: #eef4ff; color: #1e3a8a; }
    .handwrite { min-height: 3.2em; border: 1px solid #e5e7eb; border-radius: 4px; background: #f9fafb; }
    footer { margin-top: 18px; }
    @media print {
      body { background: white; }
      main { padding: 0; }
      section, .hero { box-shadow: none; }
    }
  </style>
</head>
<body>
  <main>
    <div class="hero">
      <h1>ClassQuest 模块二：AI 四格漫画</h1>
      <p class="muted">课时 1：小说怎样变成漫画 · 阶段快照</p>
      <p>本文件只用于交作业，不能恢复学习进度。换设备继续学习请使用「保存学习包」。</p>
    </div>
    ${identitySection(portfolio, now)}
    ${storySection(portfolio)}
    ${teacherSection(portfolio)}
    <footer>
      <p class="note">本页未经教师评阅，没有成绩，也不给出分数或星级。阶段快照不能恢复学习进度。</p>
    </footer>
  </main>
</body>
</html>`
}

/** 只触发浏览器下载。不读取、不写入学生本机数据库。 */
export function downloadModule2Lesson1StageSnapshot(portfolio: Module2PortfolioV1, now = new Date()): void {
  const html = buildModule2Lesson1StageSnapshotHtml(portfolio, now)
  const filename = buildModule2Lesson1StageSnapshotFilename(portfolio.student.studentName, now)
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}
