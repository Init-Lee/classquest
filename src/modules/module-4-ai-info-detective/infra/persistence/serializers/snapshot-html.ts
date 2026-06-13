/**
 * 文件说明：模块 4 阶段快照 HTML 序列化工具。
 * 职责：根据 Module4Portfolio 生成课时 1/2/3/4/5/6 阶段快照，并提供浏览器下载入口，方便学生提交过程证据。
 * 更新触发：课时快照内容、文件命名规则、脱敏边界或新增课时快照类型时，需要同步更新本文件。
 */

import type {
  Module4Lesson3AiReviewArea,
  Module4Lesson3AiReviewHistoryEntry,
  Module4Lesson3AiReviewLevel,
  Module4Lesson3AiReviewResult,
  Module4Lesson3AiReviewState,
  Module4Lesson3QuestionCardDraft,
  Module4Portfolio,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { evaluateLesson2QuickCheck } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/utils/evaluate-lesson2-quickcheck"
import { evaluateLesson3QuickCheck } from "@/modules/module-4-ai-info-detective/lessons/lesson-3/utils/evaluate-lesson3-quickcheck"
import { evaluateLesson4QuickCheck } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/evaluate-lesson4-quick-check"
import { evaluateLesson5QuickCheck } from "@/modules/module-4-ai-info-detective/lessons/lesson-5/utils/evaluate-lesson5-quick-check"
import { evaluateLesson6QuickCheck } from "@/modules/module-4-ai-info-detective/lessons/lesson-6/utils/build-lesson6-stage-snapshot"
import { LESSON3_SOURCE_TYPE_LABELS } from "@/modules/module-4-ai-info-detective/lessons/lesson-3/data/default-options"
import {
  deriveLesson3AiReviewTier,
  getLesson3AiReviewTierLabel,
} from "@/modules/module-4-ai-info-detective/lessons/lesson-3/utils/derive-lesson3-ai-review-tier"

export type Module4SnapshotType = "lesson1-full" | "lesson2-full" | "lesson3-full" | "lesson4-full" | "lesson5-full" | "lesson6-full"

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function safeFilenamePart(value: string): string {
  return value.trim().replace(/[\\/:*?"<>|\s]+/g, "-") || "module4"
}

function newsSourceTypeLabel(value: string | undefined): string {
  const labels: Record<string, string> = {
    news_site: "新闻网站",
    wechat_article: "公众号文章",
    social_screenshot: "社交平台截图",
    other: "其他",
  }
  return value ? labels[value] ?? value : "未选择"
}

function imageSourceTypeLabel(value: string | undefined): string {
  const labels: Record<string, string> = {
    web: "网络来源",
    ai_generated: "AI 生成",
    field_capture: "现场采集",
    mixed: "混合加工",
  }
  return value ? labels[value] ?? value : "未选择"
}

export function buildModule4Lesson1SnapshotHtml(portfolio: Module4Portfolio): string {
  const lesson1 = portfolio.lesson1
  const completedAt = new Date().toLocaleString("zh-CN")
  const name = escapeHtml(portfolio.student.studentName || "未填写")
  const clazz = escapeHtml(portfolio.student.clazz || "未填写")
  const seat = escapeHtml(portfolio.student.classSeatCode || "未填写")
  const missionQuizAttempts = lesson1.missionQuizAttempts
  const missionQuizPassedAttempt = [...missionQuizAttempts].reverse().find(attempt => attempt.passed)
  const step2 = lesson1.step2
  const step5 = lesson1.step5
  const step2Rows = [
    ["新闻类", step2.news],
    ["图片类", step2.image],
  ].map(([label, sample]) => {
    const record = sample as typeof step2.news
    return `
      <tr>
        <td>${label}</td>
        <td>${record.answered ? `已作答（选择 ${escapeHtml(record.selectedOptionKey || "未记录")}，${record.isCorrect ? "答对" : "未答对"}）` : "未作答"}</td>
        <td>${escapeHtml(record.selectedAt || "未记录")}</td>
        <td>${escapeHtml(record.answeredAt || "未记录")}</td>
        <td>${escapeHtml(record.explanationViewedAt || "未记录")}</td>
        <td>${record.materialPreviewOpenedCount}</td>
        <td>${record.structureInteractionCount}</td>
        <td>${Object.values(record.structureMatched).filter(Boolean).length}/4</td>
      </tr>`
  }).join("")
  const missionQuizRows = missionQuizAttempts.length
    ? missionQuizAttempts.map(attempt => `
      <tr>
        <td>${attempt.attemptNo}</td>
        <td>${escapeHtml(attempt.submittedAt || "未记录")}</td>
        <td>${attempt.passed ? "通过" : "未通过"}</td>
        <td>${escapeHtml(attempt.wrongQuestionIds.join("、") || "无")}</td>
      </tr>`).join("")
    : `<tr><td colspan="4" class="muted">暂无三题确认记录</td></tr>`

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>模块四课时1阶段快照</title>
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
    h1, h2, h3, p { margin-top: 0; }
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
    .item { margin: 8px 0; }
    .info-grid, .stat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .info-card, .stat-card { border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; background: #ffffff; }
    .label { display: block; color: var(--muted); font-size: 13px; margin-bottom: 4px; }
    .value { font-weight: 700; }
    .status { display: inline-flex; align-items: center; border-radius: 999px; padding: 2px 10px; font-size: 13px; font-weight: 700; background: var(--soft); color: #1d4ed8; }
    .status.pending { background: #f3f4f6; color: #475467; }
    .note { border-left: 4px solid #f97316; padding: 10px 12px; border-radius: 12px; background: var(--warm); }
    table { border-collapse: separate; border-spacing: 0; width: 100%; margin-top: 10px; overflow: hidden; border: 1px solid var(--line); border-radius: 14px; font-size: 14px; background: white; }
    th, td { border-bottom: 1px solid var(--line); padding: 9px 10px; text-align: left; vertical-align: top; }
    tr:last-child td { border-bottom: 0; }
    th { background: #eef4ff; color: #1e3a8a; }
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
      <h1>ClassQuest 模块四：AI 信息辨识员</h1>
      <p class="muted">课时1：框架发布与样例拆解 · 阶段快照 lesson1-full</p>
      <p>本快照按第 1 关到第 5 关记录学习过程，用于提交阶段证据与回看学习进度。</p>
    </div>
    <section>
      <h2>学习者信息</h2>
      <div class="info-grid">
        <div class="info-card"><span class="label">姓名</span><span class="value">${name}</span></div>
        <div class="info-card"><span class="label">班级</span><span class="value">${clazz}</span></div>
        <div class="info-card"><span class="label">班学号</span><span class="value">${seat}</span></div>
        <div class="info-card"><span class="label">生成时间</span><span class="value">${escapeHtml(completedAt)}</span></div>
      </div>
    </section>
    <section>
      <h2>学习进度概览</h2>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">当前指针</span><span class="value">课时 ${portfolio.progress.lessonId} · 第 ${portfolio.progress.stepId} 关</span></div>
        <div class="stat-card"><span class="label">课时 1 状态</span><span class="status ${lesson1.completed ? "" : "pending"}">${lesson1.completed ? "已完成" : "进行中"}</span></div>
        <div class="stat-card"><span class="label">创建时间</span><span class="value">${escapeHtml(portfolio.createdAt || "未记录")}</span></div>
        <div class="stat-card"><span class="label">最近更新时间</span><span class="value">${escapeHtml(portfolio.updatedAt || "未记录")}</span></div>
      </div>
    </section>
    <section>
      <h2>第 1 关 · 任务发布确认</h2>
      <p class="item"><span class="status ${lesson1.missionAcknowledged ? "" : "pending"}">${lesson1.missionAcknowledged ? "已确认" : "未确认"}</span> 理解最终产出：新闻题卡 1 张 + 图片题卡 1 张。</p>
      <p class="item">三题确认：共提交 ${missionQuizAttempts.length} 次；${missionQuizPassedAttempt ? `通过时间：${escapeHtml(missionQuizPassedAttempt.submittedAt || "未记录")}` : "尚未通过"}。</p>
      <table>
        <thead>
          <tr><th>次数</th><th>提交时间</th><th>结果</th><th>错题 ID</th></tr>
        </thead>
        <tbody>${missionQuizRows}</tbody>
      </table>
    </section>
    <section>
      <h2>第 2 关 · 样例观察与解析核验</h2>
      <p class="item"><span class="status ${step2.completed ? "" : "pending"}">${step2.completed ? "已完成" : "未完成"}</span> 样例观察任务；说明页：${step2.introViewed ? "已查看" : "未查看"}。</p>
      <p class="item">新闻样例：${lesson1.newsSampleViewed ? "已查看" : "未查看"}；图片样例：${lesson1.imageSampleViewed ? "已查看" : "未查看"}。</p>
      <table>
        <thead>
          <tr><th>样例</th><th>作答</th><th>最近选择</th><th>提交判断</th><th>查看解析</th><th>放大素材次数</th><th>结构操作次数</th><th>结构配对</th></tr>
        </thead>
        <tbody>${step2Rows}</tbody>
      </table>
    </section>
    <section>
      <h2>第 3 关 · 四部分结构拆解</h2>
      <p class="item"><span class="status ${lesson1.cardAnatomyCompleted ? "" : "pending"}">${lesson1.cardAnatomyCompleted ? "已完成" : "未完成"}</span> 田字型结构配对。</p>
      <p class="item">结构拆解得分：<strong>${lesson1.cardAnatomyScore}/4</strong>。</p>
    </section>
    <section>
      <h2>第 4 关 · 完整题卡模板确认</h2>
      <p class="item"><span class="status ${lesson1.fullCardTemplateConfirmed ? "" : "pending"}">${lesson1.fullCardTemplateConfirmed ? "已确认" : "未确认"}</span> 完整题卡模板；确认时间：${escapeHtml(lesson1.fullCardTemplateConfirmedAt || "未记录")}。</p>
      <p><strong>完整题卡模板确认记录：</strong></p>
      <p class="note">${escapeHtml(lesson1.beforeAfterReason || "未填写")}</p>
    </section>
    <section>
      <h2>第 5 关 · 素材准备出口任务</h2>
      <p class="item"><span class="status ${step5.completed || lesson1.personalTaskChecklistCompleted ? "" : "pending"}">${step5.completed || lesson1.personalTaskChecklistCompleted ? "已完成" : "未完成"}</span> 候选素材包准备确认。</p>
      <p><strong>新闻素材计划：</strong>${escapeHtml(step5.newsPlanText || lesson1.newsSourcePlan || "未填写")}</p>
      <p><strong>新闻可能来源：</strong>${escapeHtml(newsSourceTypeLabel(step5.newsPossibleSourceType))}</p>
      <p><strong>图片素材计划：</strong>${escapeHtml(step5.imagePlanText || lesson1.imageSourcePlan || "未填写")}</p>
      <p><strong>图片可能来源：</strong>${escapeHtml(imageSourceTypeLabel(step5.imagePossibleSourceType))}</p>
      <p><strong>避免素材与出口总确认：</strong>${step5.exitAndAvoidAcknowledged ? "已确认" : "未确认"}</p>
    </section>
  </main>
</body>
</html>`
}

function materialPrepStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    ready: "已准备",
    incomplete: "材料不完整",
    none: "暂无合适素材",
  }
  return labels[value] ?? "未记录"
}

function postCriteriaStatusLabel(value: string | undefined): string {
  const labels: Record<string, string> = {
    usable: "按标准看，可以继续",
    need_fix: "按标准看，需要补充",
    need_replace: "按标准看，需要更换",
  }
  return value ? labels[value] ?? value : "未复判"
}

export function buildModule4Lesson2SnapshotHtml(portfolio: Module4Portfolio): string {
  const lesson2 = portfolio.lesson2
  const generatedAt = new Date().toLocaleString("zh-CN")
  const name = escapeHtml(portfolio.student.studentName || "未填写")
  const clazz = escapeHtml(portfolio.student.clazz || "未填写")
  const seat = escapeHtml(portfolio.student.classSeatCode || "未填写")
  const quickCheck = evaluateLesson2QuickCheck(lesson2)
  const latestAttempt = lesson2.criteriaAttempts.at(-1)

  const renderMaterialSection = (title: string, record: typeof lesson2.news) => `
    <section>
      <h2>${title}</h2>
      ${record.asset ? `<img class="material-preview" src="${record.asset.dataUrl}" alt="${title}" />` : `<p class="muted">暂无素材预览</p>`}
      <div class="info-grid">
        <div class="info-card"><span class="label">初始状态</span><span class="value">${escapeHtml(materialPrepStatusLabel(record.initialStatus))}</span></div>
        <div class="info-card"><span class="label">标准复判</span><span class="value">${escapeHtml(postCriteriaStatusLabel(record.postCriteriaStatus))}</span></div>
        <div class="info-card"><span class="label">素材短名</span><span class="value">${escapeHtml(record.titleOrName || "未填写")}</span></div>
        <div class="info-card"><span class="label">来源类型</span><span class="value">${escapeHtml(imageSourceTypeLabel(record.sourceType))}</span></div>
      </div>
      <p class="item"><strong>来源记录：</strong>${escapeHtml(record.sourceRecord || "未填写")}</p>
      <p class="item"><strong>来源格式：</strong>${record.sourceAutoPassed ? "来源记录格式通过" : "尚未通过"}；检查 ${record.sourceCheckCount} 次。</p>
      <p class="item"><strong>三项自检：</strong>类型符合 ${record.selfChecks.typeFits ? "是" : "否"}；内容合规 ${record.selfChecks.contentCompliant ? "是" : "否"}；具备判断价值 ${record.selfChecks.hasJudgmentValue ? "是" : "否"}。</p>
      <p class="note"><strong>初步疑点：</strong>${escapeHtml(record.clueNote || "未填写")}</p>
      <p class="note"><strong>交流记录：</strong>${escapeHtml(record.peerFeedbackNote || "未填写")}</p>
    </section>`

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>模块四课时2阶段快照</title>
  <style>
    :root { color-scheme: light; --ink: #172033; --muted: #667085; --line: #d8e2f0; --primary: #2563eb; --soft: #eff6ff; --green: #ecfdf3; --warm: #fff7ed; }
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
    h1, h2, h3, p { margin-top: 0; }
    .hero {
      border: 1px solid rgba(37, 99, 235, 0.18);
      border-radius: 28px;
      padding: 28px;
      color: white;
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #16a34a 130%);
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
    .item { margin: 8px 0; }
    .info-grid, .stat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .info-card, .stat-card { border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; background: #ffffff; }
    .label { display: block; color: var(--muted); font-size: 13px; margin-bottom: 4px; }
    .value { font-weight: 700; }
    .status { display: inline-flex; align-items: center; border-radius: 999px; padding: 2px 10px; font-size: 13px; font-weight: 700; background: var(--soft); color: #1d4ed8; }
    .status.done { background: var(--green); color: #067647; }
    .note { border-left: 4px solid #16a34a; padding: 10px 12px; border-radius: 12px; background: var(--green); }
    .material-preview { max-width: 100%; max-height: 260px; object-fit: contain; border-radius: 16px; border: 1px solid var(--line); background: white; }
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
      <h1>ClassQuest 模块四：AI 信息辨识员</h1>
      <p class="muted">课时2：素材搜集与合规初筛 · 阶段快照 lesson2-full</p>
      <p>本快照记录新闻素材与图片素材的合规初筛结果。绿色与通过状态只代表基础准备完整，不代表素材一定真实或优秀。</p>
    </div>
    <section>
      <h2>学习者信息</h2>
      <div class="info-grid">
        <div class="info-card"><span class="label">姓名</span><span class="value">${name}</span></div>
        <div class="info-card"><span class="label">班级</span><span class="value">${clazz}</span></div>
        <div class="info-card"><span class="label">班学号</span><span class="value">${seat}</span></div>
        <div class="info-card"><span class="label">生成时间</span><span class="value">${escapeHtml(generatedAt)}</span></div>
      </div>
    </section>
    <section>
      <h2>课时2进度概览</h2>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">当前指针</span><span class="value">课时 ${portfolio.progress.lessonId} · 第 ${portfolio.progress.stepId} 关</span></div>
        <div class="stat-card"><span class="label">课时 2 状态</span><span class="status ${lesson2.completed ? "done" : ""}">${lesson2.completed ? "已完成" : "进行中"}</span></div>
        <div class="stat-card"><span class="label">第1关</span><span class="status ${lesson2.step1Completed ? "done" : ""}">${lesson2.step1Completed ? "已完成" : "未完成"}</span></div>
        <div class="stat-card"><span class="label">第2关</span><span class="status ${lesson2.step2Completed ? "done" : ""}">${lesson2.step2Completed ? "已完成" : "未完成"}</span></div>
        <div class="stat-card"><span class="label">第3关</span><span class="status ${lesson2.step3Completed ? "done" : ""}">${lesson2.step3Completed ? "已完成" : "未完成"}</span></div>
        <div class="stat-card"><span class="label">第4关</span><span class="status ${lesson2.step4Completed ? "done" : ""}">${lesson2.step4Completed ? "已完成" : "未完成"}</span></div>
        <div class="stat-card"><span class="label">第5关</span><span class="status ${lesson2.step5Completed || lesson2.completed ? "done" : ""}">${lesson2.step5Completed || lesson2.completed ? "已完成" : "未完成"}</span></div>
      </div>
    </section>
    <section>
      <h2>第1关 · 素材准备现状</h2>
      <p class="item">新闻素材：${escapeHtml(materialPrepStatusLabel(lesson2.news.initialStatus))}</p>
      <p class="item">图片素材：${escapeHtml(materialPrepStatusLabel(lesson2.image.initialStatus))}</p>
    </section>
    <section>
      <h2>第2关 · 四关体检标准</h2>
      <p class="item">挑战提交次数：${lesson2.criteriaExampleAttemptCount}；最近得分：${lesson2.criteriaExampleScore}/4。</p>
      <p class="item">最近提交时间：${escapeHtml(latestAttempt?.submittedAt || "未记录")}</p>
      <p class="item">新闻复判：${escapeHtml(postCriteriaStatusLabel(lesson2.news.postCriteriaStatus))}；图片复判：${escapeHtml(postCriteriaStatusLabel(lesson2.image.postCriteriaStatus))}。</p>
    </section>
    ${renderMaterialSection("第3关 · 新闻素材体检卡", lesson2.news)}
    ${renderMaterialSection("第4关 · 图片素材体检卡", lesson2.image)}
    <section>
      <h2>第5关 · QuickCheck 自动记录</h2>
      <p class="item">T1 素材收集整理：${quickCheck.T1.achieved ? "完成" : "未完成"}</p>
      <p class="item">证据：新闻素材 ${quickCheck.T1.evidence.newsAssetReady ? "已上传" : "未上传"}；图片素材 ${quickCheck.T1.evidence.imageAssetReady ? "已上传" : "未上传"}；新闻短名 ${quickCheck.T1.evidence.newsShortNameReady ? "已填写" : "未填写"}；图片短名 ${quickCheck.T1.evidence.imageShortNameReady ? "已填写" : "未填写"}。</p>
      <p class="item">T2 四项标准初筛：${quickCheck.T2.achieved ? "完成" : "未完成"}</p>
      <p class="item">证据：标准校准 ${quickCheck.T2.evidence.criteriaCalibrationCompleted ? "已完成" : "未完成"}；新闻来源格式 ${quickCheck.T2.evidence.newsSourceCheckPassed ? "通过" : "未通过"}；图片来源格式 ${quickCheck.T2.evidence.imageSourceCheckPassed ? "通过" : "未通过"}；新闻自检 ${quickCheck.T2.evidence.newsSelfChecksCompleted ? "完成" : "未完成"}；图片自检 ${quickCheck.T2.evidence.imageSelfChecksCompleted ? "完成" : "未完成"}。</p>
      <p class="item">T3 初步疑点提示：${quickCheck.T3.achieved ? "完成" : "未完成"}</p>
      <p class="item">证据：新闻疑点 ${quickCheck.T3.evidence.newsClueNoteValid ? "有效" : "未达要求"}；图片疑点 ${quickCheck.T3.evidence.imageClueNoteValid ? "有效" : "未达要求"}。</p>
      <p class="item">评估时间：${escapeHtml(quickCheck.evaluatedAt || "未生成")}</p>
    </section>
    <section>
      <h2>过程数据摘要</h2>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">标准校准尝试次数</span><span class="value">${quickCheck.metrics.criteriaAttemptCount}</span></div>
        <div class="stat-card"><span class="label">新闻上传次数</span><span class="value">${quickCheck.metrics.newsUploadCount}</span></div>
        <div class="stat-card"><span class="label">图片上传次数</span><span class="value">${quickCheck.metrics.imageUploadCount}</span></div>
        <div class="stat-card"><span class="label">新闻来源检查次数</span><span class="value">${quickCheck.metrics.newsSourceCheckCount}</span></div>
        <div class="stat-card"><span class="label">图片来源检查次数</span><span class="value">${quickCheck.metrics.imageSourceCheckCount}</span></div>
        <div class="stat-card"><span class="label">新闻疑点编辑次数</span><span class="value">${quickCheck.metrics.newsClueEditCount}</span></div>
        <div class="stat-card"><span class="label">图片疑点编辑次数</span><span class="value">${quickCheck.metrics.imageClueEditCount}</span></div>
        <div class="stat-card"><span class="label">新闻交流记录编辑次数</span><span class="value">${quickCheck.metrics.newsPeerOrSelfNoteEditCount}</span></div>
        <div class="stat-card"><span class="label">图片交流记录编辑次数</span><span class="value">${quickCheck.metrics.imagePeerOrSelfNoteEditCount}</span></div>
      </div>
    </section>
  </main>
</body>
</html>`
}

const AREA_LABELS_FOR_SNAPSHOT: Record<Module4Lesson3AiReviewArea, string> = {
  material: "素材展示",
  task: "判断任务",
  explanation: "核心解析",
  source: "来源核验",
}

const AREA_ORDER_FOR_SNAPSHOT: Module4Lesson3AiReviewArea[] = ["material", "task", "explanation", "source"]

function aiAreaPassed(result: Module4Lesson3AiReviewResult, area: Module4Lesson3AiReviewArea): boolean {
  if (result.missingRequiredFields.includes(area)) return false
  const check = result.checks.find(item => item.area === area)
  return !check || check.level === "ok"
}

function aiLevelLabel(level: Module4Lesson3AiReviewLevel): string {
  if (level === "ok") return "✅"
  if (level === "warning") return "⚠️"
  return "❌"
}

function renderAiHistoryRow(entry: Module4Lesson3AiReviewHistoryEntry): string {
  const tierLabel = entry.tier === "excellent" ? "优秀" : entry.tier === "good" ? "基本合格" : "不通过"
  return `
    <tr>
      <td>${escapeHtml(entry.reviewedAt || "未记录")}</td>
      <td>${escapeHtml(tierLabel)}</td>
      <td>${aiLevelLabel(entry.areaLevels.material)}</td>
      <td>${aiLevelLabel(entry.areaLevels.task)}</td>
      <td>${aiLevelLabel(entry.areaLevels.explanation)}</td>
      <td>${aiLevelLabel(entry.areaLevels.source)}</td>
      <td>${entry.suggestedEditCount}</td>
    </tr>`
}

function renderAiReviewSection(card: Module4Lesson3QuestionCardDraft): string {
  const aiReview: Module4Lesson3AiReviewState = card.aiReview
  const result = aiReview.result
  const requestCount = card.metrics.aiReviewRequestCount
  const lastReviewedAt = aiReview.lastReviewedAt || "未记录"
  const stale = aiReview.isStale
  const history = aiReview.history ?? []

  if (!result) {
    return `
    <section>
      <h2>AI 自检助手记录</h2>
      <p class="item">尚未运行 AI 题卡自检助手；成功调用次数：<strong>${requestCount}</strong>。</p>
      <p class="muted">完成首次自检后，这里会展示整体结论、四个板块结果与最近一次自检的建议要点。</p>
    </section>`
  }

  const tier = deriveLesson3AiReviewTier(result)
  const tierLabel = getLesson3AiReviewTierLabel(tier)
  const summary = escapeHtml(result.summary || "未记录")
  const missing = result.missingRequiredFields
    .map(area => {
      const key = area as Module4Lesson3AiReviewArea
      return AREA_LABELS_FOR_SNAPSHOT[key] ?? area
    })
    .join("、")
  const suggestionItems = result.suggestedEdits.slice(0, 3)
    .map(text => `<li>${escapeHtml(text)}</li>`)
    .join("")
  const checkRows = AREA_ORDER_FOR_SNAPSHOT.map(area => {
    const passed = aiAreaPassed(result, area)
    const check = result.checks.find(item => item.area === area)
    return `
      <tr>
        <td>${escapeHtml(AREA_LABELS_FOR_SNAPSHOT[area])}</td>
        <td>${passed ? "✅ 通过" : "❌ 待修改"}</td>
        <td>${escapeHtml(check?.message || (passed ? "本项已满足 V1 基本要求。" : "尚未满足 V1 基本要求。"))}</td>
        <td>${escapeHtml(check?.suggestion || "无")}</td>
      </tr>`
  }).join("")

  const historyBlock = history.length
    ? `
      <p class="item"><strong>历史成功调用轨迹（最近 ${history.length} 次）：</strong></p>
      <table>
        <thead>
          <tr><th>时间</th><th>整体</th><th>素材</th><th>任务</th><th>解析</th><th>来源</th><th>建议条数</th></tr>
        </thead>
        <tbody>${history.map(renderAiHistoryRow).join("")}</tbody>
      </table>`
    : `<p class="item muted">暂无更早的成功调用记录。</p>`

  return `
    <section>
      <h2>AI 自检助手记录</h2>
      <div class="info-grid">
        <div class="info-card"><span class="label">整体结果</span><span class="value">${escapeHtml(tierLabel)}</span></div>
        <div class="info-card"><span class="label">成功调用次数</span><span class="value">${requestCount}</span></div>
        <div class="info-card"><span class="label">最近自检时间</span><span class="value">${escapeHtml(lastReviewedAt)}</span></div>
        <div class="info-card"><span class="label">是否过期</span><span class="value">${stale ? "题卡有改动，建议重新自检" : "与当前题卡内容一致"}</span></div>
      </div>
      <p class="item"><strong>整体总结：</strong>${summary}</p>
      ${missing ? `<p class="item"><strong>必填缺失板块：</strong>${escapeHtml(missing)}</p>` : ""}
      <table>
        <thead>
          <tr><th>板块</th><th>结果</th><th>说明</th><th>建议</th></tr>
        </thead>
        <tbody>${checkRows}</tbody>
      </table>
      ${suggestionItems ? `<p class="item"><strong>关键修改建议（前 3 条）：</strong></p><ul>${suggestionItems}</ul>` : ""}
      ${historyBlock}
    </section>`
}

export function buildModule4Lesson3SnapshotHtml(portfolio: Module4Portfolio): string {
  const lesson3 = portfolio.lesson3
  const generatedAt = new Date().toLocaleString("zh-CN")
  const name = escapeHtml(portfolio.student.studentName || "未填写")
  const clazz = escapeHtml(portfolio.student.clazz || "未填写")
  const seat = escapeHtml(portfolio.student.classSeatCode || "未填写")
  const quickCheck = evaluateLesson3QuickCheck(lesson3)
  const renderCard = (title: string, card: typeof lesson3.newsCard, trial: typeof lesson3.selfTrial.news) => {
    const optionRows = card.task.options.map(option => `
      <tr>
        <td>${escapeHtml(option.key)}</td>
        <td>${escapeHtml(option.label || "未填写")}</td>
        <td>${escapeHtml(option.rationale || "未填写")}</td>
        <td>${option.key === card.task.correctOptionKey ? "是" : "否"}</td>
      </tr>`).join("")
    return `
    <section>
      <h2>${title}</h2>
      ${card.material.asset ? `<img class="material-preview" src="${card.material.asset.dataUrl}" alt="${escapeHtml(title)}" />` : `<p class="muted">暂无素材预览</p>`}
      <div class="info-grid">
        <div class="info-card"><span class="label">题卡状态</span><span class="value">${card.status === "ready_for_lesson4" ? "已保存 V1" : "草稿"}</span></div>
        <div class="info-card"><span class="label">素材短名</span><span class="value">${escapeHtml(card.material.titleOrName || "未填写")}</span></div>
        <div class="info-card"><span class="label">参考答案</span><span class="value">${escapeHtml(card.task.correctOptionKey || "未选择")}</span></div>
        <div class="info-card"><span class="label">来源类型</span><span class="value">${escapeHtml(card.source.sourceType ? LESSON3_SOURCE_TYPE_LABELS[card.source.sourceType] : "未选择")}</span></div>
        <div class="info-card"><span class="label">自测试答</span><span class="value">${trial.confirmed ? "已确认" : trial.submitted ? "已提交待确认" : trial.needsRetrial ? "需要重新作答" : "未自测"}</span></div>
        <div class="info-card"><span class="label">自测结果</span><span class="value">${trial.submitted ? `${escapeHtml(trial.selectedOptionKey || "未记录")} · ${trial.isCorrect ? "答对" : "未答对"}` : "未提交"}</span></div>
      </div>
      <p class="item"><strong>题干：</strong>${escapeHtml(card.task.prompt || "未填写")}</p>
      <table>
        <thead>
          <tr><th>选项</th><th>文案</th><th>选项解析 rationale</th><th>是否参考答案</th></tr>
        </thead>
        <tbody>${optionRows || `<tr><td colspan="4" class="muted">暂无选项</td></tr>`}</tbody>
      </table>
      <p class="note"><strong>核心解析：</strong>${escapeHtml(card.explanation.text || "未填写")}</p>
      <p class="item"><strong>来源记录：</strong>${escapeHtml(card.source.sourceRecord || "未填写")}</p>
      <p class="item"><strong>核验观察指引：</strong>${escapeHtml(card.source.verificationNote || "未填写")}</p>
      <p class="item"><strong>自审状态：</strong>${card.selfCheck.allRequiredPassed ? "四部分齐全" : "仍需补充"}</p>
      <p class="item"><strong>自测确认时间：</strong>${escapeHtml(trial.confirmedAt || "未记录")}；内容指纹：${escapeHtml(trial.contentFingerprint || "未记录")}</p>
    </section>
    ${renderAiReviewSection(card)}`
  }

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>模块四课时3阶段快照</title>
  <style>
    :root { color-scheme: light; --ink: #172033; --muted: #667085; --line: #d8e2f0; --primary: #2563eb; --soft: #eff6ff; --green: #ecfdf3; --warm: #fff7ed; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif; line-height: 1.7; color: var(--ink); background: linear-gradient(135deg, #f8fbff 0%, #f3f7ff 50%, #fff7ed 100%); }
    main { max-width: 980px; margin: 0 auto; padding: 36px 24px 48px; }
    h1, h2, p { margin-top: 0; }
    .hero { border-radius: 28px; padding: 28px; color: white; background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #f97316 130%); box-shadow: 0 20px 50px rgba(37, 99, 235, 0.22); }
    .hero h1 { font-size: 30px; margin-bottom: 8px; letter-spacing: 0.04em; }
    .hero .muted { color: rgba(255, 255, 255, 0.78); }
    section { border: 1px solid var(--line); border-radius: 22px; padding: 20px; margin-top: 18px; background: rgba(255, 255, 255, 0.9); box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08); }
    section h2 { font-size: 20px; margin-bottom: 12px; color: #1d4ed8; }
    .muted { color: var(--muted); }
    .item { margin: 8px 0; }
    .info-grid, .stat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .info-card, .stat-card { border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; background: #ffffff; }
    .label { display: block; color: var(--muted); font-size: 13px; margin-bottom: 4px; }
    .value { font-weight: 700; }
    .status { display: inline-flex; align-items: center; border-radius: 999px; padding: 2px 10px; font-size: 13px; font-weight: 700; background: var(--soft); color: #1d4ed8; }
    .status.done { background: var(--green); color: #067647; }
    .note { border-left: 4px solid #f97316; padding: 10px 12px; border-radius: 12px; background: var(--warm); }
    .material-preview { max-width: 100%; max-height: 260px; object-fit: contain; border-radius: 16px; border: 1px solid var(--line); background: white; }
    table { border-collapse: separate; border-spacing: 0; width: 100%; margin-top: 10px; overflow: hidden; border: 1px solid var(--line); border-radius: 14px; font-size: 14px; background: white; }
    th, td { border-bottom: 1px solid var(--line); padding: 9px 10px; text-align: left; vertical-align: top; }
    tr:last-child td { border-bottom: 0; }
    th { background: #eef4ff; color: #1e3a8a; }
  </style>
</head>
<body>
  <main>
    <div class="hero">
      <h1>ClassQuest 模块四：AI 信息辨识员</h1>
      <p class="muted">课时3：题目卡 V1 制作与解析填写 · 阶段快照 lesson3-full</p>
      <p>本快照记录两张 V1 题卡初稿。当前仅作为课时 3 过程证据，不代表正式入库。</p>
    </div>
    <section>
      <h2>学习者信息</h2>
      <div class="info-grid">
        <div class="info-card"><span class="label">姓名</span><span class="value">${name}</span></div>
        <div class="info-card"><span class="label">班级</span><span class="value">${clazz}</span></div>
        <div class="info-card"><span class="label">班学号</span><span class="value">${seat}</span></div>
        <div class="info-card"><span class="label">生成时间</span><span class="value">${escapeHtml(generatedAt)}</span></div>
      </div>
    </section>
    <section>
      <h2>课时3进度概览</h2>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">当前指针</span><span class="value">课时 ${portfolio.progress.lessonId} · 第 ${portfolio.progress.stepId} 步</span></div>
        <div class="stat-card"><span class="label">课时 3 状态</span><span class="status ${lesson3.completed ? "done" : ""}">${lesson3.completed ? "已保存 V1" : "进行中"}</span></div>
        <div class="stat-card"><span class="label">最终确认</span><span class="value">${lesson3.finalPreviewConfirmed ? "已确认" : "未确认"}</span></div>
        <div class="stat-card"><span class="label">确认时间</span><span class="value">${escapeHtml(lesson3.finalPreviewConfirmedAt || "未记录")}</span></div>
      </div>
    </section>
    ${renderCard("新闻题卡 V1", lesson3.newsCard, lesson3.selfTrial.news)}
    ${renderCard("图片题卡 V1", lesson3.imageCard, lesson3.selfTrial.image)}
    <section>
      <h2>QuickCheck 自动记录</h2>
      <p class="item">T1 素材快照：${quickCheck.T1.achieved ? "完成" : "未完成"}</p>
      <p class="item">证据：新闻快照 ${quickCheck.T1.evidence.newsSnapshotReady ? "已生成" : "未生成"}；图片快照 ${quickCheck.T1.evidence.imageSnapshotReady ? "已生成" : "未生成"}；新闻素材 ${quickCheck.T1.evidence.newsAssetReady ? "已带入" : "未带入"}；图片素材 ${quickCheck.T1.evidence.imageAssetReady ? "已带入" : "未带入"}。</p>
      <p class="item">T2 题卡四部分：${quickCheck.T2.achieved ? "完成" : "未完成"}</p>
      <p class="item">证据：新闻素材/任务/解析/来源 ${quickCheck.T2.evidence.newsMaterialReady ? "✓" : "×"} ${quickCheck.T2.evidence.newsTaskReady ? "✓" : "×"} ${quickCheck.T2.evidence.newsExplanationReady ? "✓" : "×"} ${quickCheck.T2.evidence.newsSourceReady ? "✓" : "×"}；图片素材/任务/解析/来源 ${quickCheck.T2.evidence.imageMaterialReady ? "✓" : "×"} ${quickCheck.T2.evidence.imageTaskReady ? "✓" : "×"} ${quickCheck.T2.evidence.imageExplanationReady ? "✓" : "×"} ${quickCheck.T2.evidence.imageSourceReady ? "✓" : "×"}。</p>
      <p class="item">T3 V1 保存：${quickCheck.T3.achieved ? "完成" : "未完成"}</p>
      <p class="item">证据：最终确认 ${quickCheck.T3.evidence.finalPreviewConfirmed ? "是" : "否"}；新闻待课时4 ${quickCheck.T3.evidence.newsReadyForLesson4 ? "是" : "否"}；图片待课时4 ${quickCheck.T3.evidence.imageReadyForLesson4 ? "是" : "否"}；新闻自测确认 ${quickCheck.T3.evidence.newsSelfTrialConfirmed ? "是" : "否"}；图片自测确认 ${quickCheck.T3.evidence.imageSelfTrialConfirmed ? "是" : "否"}。</p>
      <p class="item">评估时间：${escapeHtml(quickCheck.evaluatedAt || "未生成")}</p>
    </section>
  </main>
</body>
</html>`
}

export function buildModule4Lesson4SnapshotHtml(portfolio: Module4Portfolio): string {
  const { student, lesson4 } = portfolio
  const snapshot = lesson4.stageSnapshot
  const v2 = lesson4.v2
  const decisions = lesson4.feedbackInbox.decisions
  const generatedAt = new Date()
  const generatedAtText = generatedAt.toLocaleString("zh-CN")
  const quickCheck = evaluateLesson4QuickCheck(lesson4, generatedAt.toISOString())
  const observation = snapshot?.rubricObservationSummary ?? {
    passCount: 0,
    minorFixCount: 0,
    majorFixCount: 0,
    contentViolationCount: 0,
    unresolvedBlockingCount: quickCheck.T2.evidence.unresolvedBlockingDecisionIds.length,
  }
  const decisionRows = snapshot?.decisionsSummary ?? decisions
  const levelLabel: Record<string, string> = {
    excellent: "优秀",
    achieved: "达标",
    basic: "基础达成",
    not_achieved: "未达成",
  }
  const readyStatusLabel: Record<string, string> = {
    green: "绿色：可进入课时五",
    amber: "黄色：基本可用，建议复核",
    red: "红色：仍有阻塞",
  }
  const cardKindLabel: Record<string, string> = {
    news: "新闻题卡",
    image: "图片题卡",
  }
  const areaLabel: Record<string, string> = {
    material: "素材",
    task: "任务",
    explanation: "解析",
    source: "来源",
    safety: "安全",
    overall: "整体",
  }
  const decisionLevelLabel: Record<string, string> = {
    minor_fix: "小修",
    major_fix: "重改",
    content_violation: "内容违规",
  }
  const actionLabel: Record<string, string> = {
    accept: "采纳",
    partial_accept: "部分采纳",
    keep_with_reason: "保留并说明理由",
    must_revise: "必须修改",
  }

  const renderDecisionRows = () => {
    if (decisionRows.length === 0) {
      return `<tr><td colspan="6" class="muted">无作者决策项（同伴四段均为通过）。</td></tr>`
    }
    return decisionRows.map(decision => `
      <tr>
        <td>${escapeHtml(cardKindLabel[decision.cardKind] ?? decision.cardKind)}</td>
        <td>${escapeHtml(areaLabel[decision.area] ?? decision.area)}</td>
        <td>${escapeHtml(decisionLevelLabel[decision.level] ?? decision.level)}</td>
        <td>${escapeHtml(actionLabel[decision.action] ?? decision.action)}</td>
        <td>${decision.resolved ? "已解决" : "未解决"}</td>
        <td>${escapeHtml(decision.authorPlan || "无")}</td>
      </tr>
    `).join("")
  }

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>模块四课时4阶段快照</title>
  <style>
    :root { color-scheme: light; --ink: #172033; --muted: #667085; --line: #d8e2f0; --primary: #2563eb; --soft: #eff6ff; --green: #ecfdf3; --warm: #fff7ed; --danger: #fef2f2; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif; line-height: 1.7; color: var(--ink); background: linear-gradient(135deg, #f8fbff 0%, #f3f7ff 50%, #fff7ed 100%); }
    main { max-width: 980px; margin: 0 auto; padding: 36px 24px 48px; }
    h1, h2, p { margin-top: 0; }
    .hero { border-radius: 28px; padding: 28px; color: white; background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #f97316 130%); box-shadow: 0 20px 50px rgba(37, 99, 235, 0.22); }
    .hero h1 { font-size: 30px; margin-bottom: 8px; letter-spacing: 0.04em; }
    .hero .muted { color: rgba(255, 255, 255, 0.78); }
    section { border: 1px solid var(--line); border-radius: 22px; padding: 20px; margin-top: 18px; background: rgba(255, 255, 255, 0.9); box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08); }
    section h2 { font-size: 20px; margin-bottom: 12px; color: #1d4ed8; }
    .muted { color: var(--muted); }
    .item { margin: 8px 0; }
    .info-grid, .stat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .info-card, .stat-card { border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; background: #ffffff; }
    .label { display: block; color: var(--muted); font-size: 13px; margin-bottom: 4px; }
    .value { font-weight: 700; }
    .status { display: inline-flex; align-items: center; border-radius: 999px; padding: 2px 10px; font-size: 13px; font-weight: 700; background: var(--soft); color: #1d4ed8; }
    .status.done { background: var(--green); color: #067647; }
    .status.warning { background: var(--warm); color: #c2410c; }
    .status.danger { background: var(--danger); color: #b42318; }
    .note { border-left: 4px solid #f97316; padding: 10px 12px; border-radius: 12px; background: var(--warm); }
    table { border-collapse: separate; border-spacing: 0; width: 100%; margin-top: 10px; overflow: hidden; border: 1px solid var(--line); border-radius: 14px; font-size: 14px; background: white; }
    th, td { border-bottom: 1px solid var(--line); padding: 9px 10px; text-align: left; vertical-align: top; }
    tr:last-child td { border-bottom: 0; }
    th { background: #eef4ff; color: #1e3a8a; }
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
      <h1>ClassQuest 模块四：AI 信息辨识员</h1>
      <p class="muted">课时4：同伴互审、V2 修改与入库准备 · 阶段快照 lesson4-full</p>
      <p>本快照记录课时 4 的互审 gate、QuickCheck T1/T2/T3、两张 V2 题卡确认状态与入库准备摘要。</p>
    </div>
    <section>
      <h2>学习者信息</h2>
      <div class="info-grid">
        <div class="info-card"><span class="label">姓名</span><span class="value">${escapeHtml(student.studentName || "未登记")}</span></div>
        <div class="info-card"><span class="label">班级</span><span class="value">${escapeHtml(student.clazz || "未选班")}</span></div>
        <div class="info-card"><span class="label">班学号</span><span class="value">${escapeHtml(student.classSeatCode || "—")}</span></div>
        <div class="info-card"><span class="label">生成时间</span><span class="value">${escapeHtml(generatedAtText)}</span></div>
      </div>
    </section>
    <section>
      <h2>课时4进度概览</h2>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">第 1 关互审</span><span class="status ${lesson4.step1Completed ? "done" : ""}">${lesson4.step1Completed ? "已完成" : "未完成"}</span></div>
        <div class="stat-card"><span class="label">第 2 关反馈</span><span class="status ${lesson4.step2Completed ? "done" : ""}">${lesson4.step2Completed ? "已完成" : "未完成"}</span></div>
        <div class="stat-card"><span class="label">第 3 关 V2</span><span class="status ${lesson4.step3Completed ? "done" : ""}">${lesson4.step3Completed ? "已完成" : "未完成"}</span></div>
        <div class="stat-card"><span class="label">第 4 关就绪</span><span class="status ${lesson4.step4Completed ? "done" : ""}">${lesson4.step4Completed ? "已完成" : "未完成"}</span></div>
        <div class="stat-card"><span class="label">互审 gate</span><span class="status ${lesson4.gatePassed ? "done" : ""}">${lesson4.gatePassed ? "已通过" : "未通过"}</span></div>
        <div class="stat-card"><span class="label">收到同伴反馈</span><span class="value">${lesson4.outbound.receivedReviewJson ? "是" : "否"}</span></div>
      </div>
    </section>
    <section>
      <h2>QuickCheck 自动记录</h2>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">总分</span><span class="value">${quickCheck.totalScore}/100</span></div>
        <div class="stat-card"><span class="label">等级</span><span class="value">${escapeHtml(levelLabel[quickCheck.level] ?? quickCheck.level)}</span></div>
        <div class="stat-card"><span class="label">评估时间</span><span class="value">${escapeHtml(quickCheck.evaluatedAt || "未生成")}</span></div>
        <div class="stat-card"><span class="label">快照时间</span><span class="value">${escapeHtml(snapshot?.snappedAt ?? "尚未保存阶段快照")}</span></div>
      </div>
      <p class="item">T1 同伴互审 gate：<span class="status ${quickCheck.T1.achieved ? "done" : ""}">${quickCheck.T1.score}/35 · ${quickCheck.T1.achieved ? "达成" : "未达成"}</span></p>
      <p class="item">证据：作者送审 ${quickCheck.T1.evidence.outboundCompleted ? "完成" : "未完成"}；审查他人 ${quickCheck.T1.evidence.inboundCompleted ? "完成" : "未完成"}；gate ${quickCheck.T1.evidence.gatePassed ? "通过" : "未通过"}；收到反馈 ${quickCheck.T1.evidence.receivedReviewPresent ? "是" : "否"}。</p>
      <p class="item">T2 反馈消化：<span class="status ${quickCheck.T2.achieved ? "done" : quickCheck.T2.score > 0 ? "warning" : ""}">${quickCheck.T2.score}/30 · ${quickCheck.T2.achieved ? "达成" : "未达成"}</span></p>
      <p class="item">证据：反馈已读 ${quickCheck.T2.evidence.allFeedbackReviewed ? "是" : "否"}；作者决策 ${quickCheck.T2.evidence.decisionCount} 项；小修 ${quickCheck.T2.evidence.minorFixDecisionCount} 项；必改/安全 ${quickCheck.T2.evidence.blockingDecisionCount} 项；未解决 ${quickCheck.T2.evidence.unresolvedBlockingDecisionIds.length} 项。</p>
      <p class="item">T3 V2 就绪：<span class="status ${quickCheck.T3.achieved ? "done" : quickCheck.T3.score > 0 ? "warning" : "danger"}">${quickCheck.T3.score}/35 · ${quickCheck.T3.achieved ? "达成" : "未达成"}</span></p>
      <p class="item">证据：新闻确认 ${quickCheck.T3.evidence.newsConfirmed ? "是" : "否"}；图片确认 ${quickCheck.T3.evidence.imageConfirmed ? "是" : "否"}；就绪评估 ${escapeHtml(readyStatusLabel[quickCheck.T3.evidence.readyForLesson5Status] ?? quickCheck.T3.evidence.readyForLesson5Status)}；无需修改 ${quickCheck.T3.evidence.noRevisionNeeded ? "是" : "否"}。</p>
      ${quickCheck.blockers.length ? `<p class="note"><strong>待处理：</strong>${escapeHtml(quickCheck.blockers.join("；"))}</p>` : `<p class="note"><strong>结论：</strong>QuickCheck 三项均已达成，可作为课时 4 阶段证据。</p>`}
    </section>
    <section>
      <h2>V2 双卡状态</h2>
      <div class="info-grid">
        <div class="info-card"><span class="label">新闻题卡</span><span class="value">${v2.newsConfirmed ? "已确认" : "未确认"} · ${escapeHtml(v2.newsCard.status)}</span></div>
        <div class="info-card"><span class="label">图片题卡</span><span class="value">${v2.imageConfirmed ? "已确认" : "未确认"} · ${escapeHtml(v2.imageCard.status)}</span></div>
        <div class="info-card"><span class="label">新闻已解决决策</span><span class="value">${escapeHtml(v2.newsCard.revision.decisionIdsResolved.join("、") || "无")}</span></div>
        <div class="info-card"><span class="label">图片已解决决策</span><span class="value">${escapeHtml(v2.imageCard.revision.decisionIdsResolved.join("、") || "无")}</span></div>
      </div>
      <p class="note"><strong>新闻修改说明：</strong>${escapeHtml(v2.newsCard.revision.summary || "无，全通过时可省略")}</p>
      <p class="note"><strong>图片修改说明：</strong>${escapeHtml(v2.imageCard.revision.summary || "无，全通过时可省略")}</p>
    </section>
    <section>
      <h2>作者决策摘要</h2>
      <table>
        <thead><tr><th>题卡</th><th>维度</th><th>档位</th><th>动作</th><th>解决</th><th>作者计划</th></tr></thead>
        <tbody>${renderDecisionRows()}</tbody>
      </table>
    </section>
    <section>
      <h2>就绪与入库包</h2>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">readyForLesson5</span><span class="value">${lesson4.readiness.readyForLesson5 ? "是" : "否"}</span></div>
        <div class="stat-card"><span class="label">就绪评估</span><span class="value">${escapeHtml(readyStatusLabel[quickCheck.T3.evidence.readyForLesson5Status] ?? quickCheck.T3.evidence.readyForLesson5Status)}</span></div>
        <div class="stat-card"><span class="label">检查时间</span><span class="value">${escapeHtml(lesson4.readiness.checkedAt || "—")}</span></div>
        <div class="stat-card"><span class="label">入库包</span><span class="value">${lesson4.readiness.exportedPackageJson ? "已生成" : "未生成"}</span></div>
      </div>
      <p class="item">量规观测：通过 ${observation.passCount}；小修 ${observation.minorFixCount}；重改 ${observation.majorFixCount}；内容违规 ${observation.contentViolationCount}；未解决必改/安全 ${observation.unresolvedBlockingCount}。</p>
    </section>
  </main>
</body>
</html>`
}

export function buildModule4Lesson5SnapshotHtml(portfolio: Module4Portfolio): string {
  const { student, lesson5 } = portfolio
  const generatedAt = new Date()
  const generatedAtText = generatedAt.toLocaleString("zh-CN")
  const quickCheck = lesson5.quickCheck.evaluatedAt
    ? lesson5.quickCheck
    : evaluateLesson5QuickCheck(lesson5, generatedAt.toISOString())
  const reportItems = lesson5.myReport?.items ?? []
  const revision = lesson5.revision
  const snapshot = lesson5.stageSnapshot
  const cardKindLabel: Record<string, string> = {
    news: "新闻题卡",
    image: "图片题卡",
  }
  const actionLabel: Record<string, string> = {
    keep: "基本保留",
    minor_fix: "小修优化",
    major_fix: "重改关键部分",
  }
  const readyLabel: Record<string, string> = {
    none: "未准备",
    partial: "部分准备",
    full: "双卡已准备",
  }
  const phaseLabel: Record<string, string> = {
    pool_locked: "题池锁定，等待试答",
    trial_open: "正在开放试答",
    trial_locked: "试答已锁定",
    analytics_open: "统计报告已开放",
    revision_open: "V3 修订已开放",
    closed: "课堂已结束",
  }
  const statsStatusLabel: Record<string, string> = {
    insufficient: "样本不足",
    preliminary: "初步统计",
    stable: "统计较稳定",
  }
  const problemLabel: Record<string, string> = {
    needs_more_samples: "样本不足",
    low_correct_rate: "正确率偏低",
    low_clarity: "题干不够清晰",
    low_thinking_value: "思考价值不足",
    low_explanation_helpfulness: "解析帮助度不足",
    high_issue_flag_rate: "问题标记偏高",
  }
  const levelLabel: Record<string, string> = {
    excellent: "优秀",
    achieved: "达标",
    basic: "基础达成",
    not_achieved: "未达成",
  }
  const problemLabelsText = (problems: string[]) => problems
    .map(problem => problemLabel[problem] ?? problem)
    .join("、")
  const renderReportRows = () => {
    if (reportItems.length === 0) {
      return `<tr><td colspan="6" class="muted">尚未保存本人题卡统计报告。</td></tr>`
    }
    return reportItems.map(item => `
      <tr>
        <td>${escapeHtml(cardKindLabel[item.kind] ?? item.kind)}</td>
        <td>${item.validAnswerCount}</td>
        <td>${Math.round(item.correctRate * 100)}%</td>
        <td>${Math.round(item.issueFlagRate * 100)}%</td>
        <td>${escapeHtml(statsStatusLabel[item.statsStatus] ?? item.statsStatus)}</td>
        <td>${escapeHtml(item.sampleComments[0] || "暂无样例评论")}</td>
      </tr>
    `).join("")
  }
  const renderRevisionRows = () => {
    if (!revision) {
      return `<tr><td colspan="7" class="muted">尚未保存 V3 修订草稿。</td></tr>`
    }
    return (["news", "image"] as const).map(kind => {
      const item = revision.cards[kind]
      return `
        <tr>
          <td>${escapeHtml(cardKindLabel[kind])}</td>
          <td>${item.v3VersionId ? "已提交" : "草稿"}</td>
          <td>${escapeHtml(actionLabel[item.revisionPlan.revisionAction] ?? "已停用选项")}</td>
          <td>${escapeHtml(problemLabelsText(item.revisionPlan.selectedProblems) || "未选择")}</td>
          <td>${escapeHtml(item.revisionPlan.revisionReason || "未填写")}</td>
          <td>${escapeHtml(item.revisionPlan.expectedEffect || "未填写")}</td>
          <td>${escapeHtml(item.v3VersionId || "未生成")}</td>
        </tr>
      `
    }).join("")
  }

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>模块四课时5阶段快照</title>
  <style>
    :root { color-scheme: light; --ink: #172033; --muted: #667085; --line: #d8e2f0; --primary: #2563eb; --soft: #eff6ff; --green: #ecfdf3; --warm: #fff7ed; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif; line-height: 1.7; color: var(--ink); background: linear-gradient(135deg, #f8fbff 0%, #f3f7ff 50%, #fff7ed 100%); }
    main { max-width: 980px; margin: 0 auto; padding: 36px 24px 48px; }
    h1, h2, p { margin-top: 0; }
    .hero { border-radius: 28px; padding: 28px; color: white; background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #0f766e 130%); box-shadow: 0 20px 50px rgba(37, 99, 235, 0.22); }
    .hero h1 { font-size: 30px; margin-bottom: 8px; letter-spacing: 0.04em; }
    .hero .muted { color: rgba(255, 255, 255, 0.78); }
    section { border: 1px solid var(--line); border-radius: 22px; padding: 20px; margin-top: 18px; background: rgba(255, 255, 255, 0.9); box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08); }
    section h2 { font-size: 20px; margin-bottom: 12px; color: #1d4ed8; }
    .muted { color: var(--muted); }
    .item { margin: 8px 0; }
    .info-grid, .stat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .info-card, .stat-card { border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; background: #ffffff; }
    .label { display: block; color: var(--muted); font-size: 13px; margin-bottom: 4px; }
    .value { font-weight: 700; }
    .status { display: inline-flex; align-items: center; border-radius: 999px; padding: 2px 10px; font-size: 13px; font-weight: 700; background: var(--soft); color: #1d4ed8; }
    .status.done { background: var(--green); color: #067647; }
    .status.warning { background: var(--warm); color: #c2410c; }
    .note { border-left: 4px solid #0f766e; padding: 10px 12px; border-radius: 12px; background: var(--green); }
    table { border-collapse: separate; border-spacing: 0; width: 100%; margin-top: 10px; overflow: hidden; border: 1px solid var(--line); border-radius: 14px; font-size: 14px; background: white; }
    th, td { border-bottom: 1px solid var(--line); padding: 9px 10px; text-align: left; vertical-align: top; }
    tr:last-child td { border-bottom: 0; }
    th { background: #eef4ff; color: #1e3a8a; }
  </style>
</head>
<body>
  <main>
    <div class="hero">
      <h1>ClassQuest 模块四：AI 信息辨识员</h1>
      <p class="muted">课时5：网页试答与反馈优化 · 阶段快照</p>
      <p>本快照记录 V2 入池、课堂试答反馈、本人统计、V3 修订计划与课时 6 准备度。</p>
    </div>
    <section>
      <h2>学习者信息</h2>
      <div class="info-grid">
        <div class="info-card"><span class="label">姓名</span><span class="value">${escapeHtml(student.studentName || "未登记")}</span></div>
        <div class="info-card"><span class="label">班级</span><span class="value">${escapeHtml(student.clazz || "未选班")}</span></div>
        <div class="info-card"><span class="label">班学号</span><span class="value">${escapeHtml(student.classSeatCode || "—")}</span></div>
        <div class="info-card"><span class="label">生成时间</span><span class="value">${escapeHtml(generatedAtText)}</span></div>
      </div>
    </section>
    <section>
      <h2>课时5进度概览</h2>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">V2 提交</span><span class="status ${lesson5.submissionSummary ? "done" : ""}">${lesson5.submissionSummary ? "已提交" : "未提交"}</span></div>
        <div class="stat-card"><span class="label">课堂阶段</span><span class="value">${escapeHtml(lesson5.connectedSession?.phase ? phaseLabel[lesson5.connectedSession.phase] : "未连接课堂")}</span></div>
        <div class="stat-card"><span class="label">V3 已提交</span><span class="value">${revision?.submittedCount ?? 0}/2</span></div>
        <div class="stat-card"><span class="label">课时 6 准备度</span><span class="value">${escapeHtml(readyLabel[quickCheck.readyForLesson6] ?? quickCheck.readyForLesson6)}</span></div>
      </div>
      <p class="item">最近完成摘要：${escapeHtml(snapshot?.snappedAt || "尚未保存阶段快照")}</p>
    </section>
    <section>
      <h2>QuickCheck 自动记录</h2>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">总分</span><span class="value">${quickCheck.totalScore}/100</span></div>
        <div class="stat-card"><span class="label">等级</span><span class="value">${escapeHtml(levelLabel[quickCheck.level] ?? quickCheck.level)}</span></div>
        <div class="stat-card"><span class="label">评估时间</span><span class="value">${escapeHtml(quickCheck.evaluatedAt || "未生成")}</span></div>
        <div class="stat-card"><span class="label">快照时间</span><span class="value">${escapeHtml(snapshot?.snappedAt ?? "尚未保存阶段快照")}</span></div>
      </div>
      <p class="item">T1 V2 入池：<span class="status ${quickCheck.T1.achieved ? "done" : ""}">${quickCheck.T1.score}/35 · ${quickCheck.T1.achieved ? "达成" : "未达成"}</span></p>
      <p class="item">证据：V2 双卡提交 ${quickCheck.T1.evidence.v2Submitted ? "已确认" : "未确认"}；新闻题卡 ${quickCheck.T1.evidence.hasNewsItem ? "已入池" : "未入池"}；图片题卡 ${quickCheck.T1.evidence.hasImageItem ? "已入池" : "未入池"}。</p>
      <p class="item">T2 试答统计：<span class="status ${quickCheck.T2.achieved ? "done" : ""}">${quickCheck.T2.score}/30 · ${quickCheck.T2.achieved ? "达成" : "未达成"}</span></p>
      <p class="item">证据：统计报告 ${quickCheck.T2.evidence.trialStatsReady ? "已保存" : "未保存"}；题卡统计 ${quickCheck.T2.evidence.reportItemCount} 项；新闻统计 ${quickCheck.T2.evidence.hasNewsStats ? "有" : "无"}；图片统计 ${quickCheck.T2.evidence.hasImageStats ? "有" : "无"}。</p>
      <p class="item">T3 V3 修订：<span class="status ${quickCheck.T3.achieved ? "done" : quickCheck.T3.score > 0 ? "warning" : ""}">${quickCheck.T3.score}/35 · ${quickCheck.T3.achieved ? "达成" : "未达成"}</span></p>
      <p class="item">证据：V3 修订 ${quickCheck.T3.evidence.v3Submitted ? "已提交" : "未提交"}；已提交 ${quickCheck.T3.evidence.submittedCount}/2；新闻题卡 ${quickCheck.T3.evidence.newsSubmitted ? "已提交" : "未提交"}；图片题卡 ${quickCheck.T3.evidence.imageSubmitted ? "已提交" : "未提交"}；课时 6 准备度 ${escapeHtml(readyLabel[quickCheck.T3.evidence.readyForLesson6] ?? quickCheck.T3.evidence.readyForLesson6)}。</p>
      ${quickCheck.blockers.length ? `<p class="note"><strong>待处理：</strong>${escapeHtml(quickCheck.blockers.join("；"))}</p>` : `<p class="note"><strong>结论：</strong>QuickCheck 三项均已达成，可作为课时 5 阶段证据。</p>`}
    </section>
    <section>
      <h2>本人题卡统计摘要</h2>
      <table>
        <thead><tr><th>题卡</th><th>有效作答</th><th>正确率</th><th>问题率</th><th>样本状态</th><th>样例评论</th></tr></thead>
        <tbody>${renderReportRows()}</tbody>
      </table>
    </section>
    <section>
      <h2>V3 修订计划与提交</h2>
      <table>
        <thead><tr><th>题卡</th><th>状态</th><th>动作</th><th>诊断问题</th><th>修订原因</th><th>预期效果</th><th>V3 版本</th></tr></thead>
        <tbody>${renderRevisionRows()}</tbody>
      </table>
      <p class="note">本快照不包含任何教师密钥，只记录本地学习档案内的课堂身份与修订证据。</p>
    </section>
  </main>
</body>
</html>`
}

export function buildModule4Lesson6SnapshotHtml(portfolio: Module4Portfolio): string {
  const { student, lesson6 } = portfolio
  const generatedAt = new Date()
  const generatedAtText = generatedAt.toLocaleString("zh-CN")
  const quickCheck = lesson6.quickCheck.evaluatedAt
    ? lesson6.quickCheck
    : evaluateLesson6QuickCheck(lesson6, lesson6.reflection, generatedAt.toISOString())
  const snapshot = lesson6.stageSnapshot
  const statusLabel: Record<string, string> = {
    pending_teacher_check: "等待教师确认",
    publishable: "已确认可发布",
    unknown: "暂未同步",
  }
  const levelLabel: Record<string, string> = {
    excellent: "优秀达成",
    achieved: "达成",
    basic: "基本达成",
    not_achieved: "未达成",
  }
  const publicationRows = (snapshot?.publicationStatus.items ?? lesson6.publicationStatus?.items ?? [])
    .map(item => `
      <tr>
        <td>${escapeHtml(item.kind === "image" ? "图片题卡" : "新闻题卡")}</td>
        <td>${escapeHtml(statusLabel[item.status] ?? item.label ?? item.status)}</td>
        <td>${escapeHtml(item.checkedAt || "未记录")}</td>
      </tr>
    `).join("") || `<tr><td colspan="3" class="muted">尚未保存发布状态摘要。</td></tr>`
  const reflectionRows = (snapshot?.reflection.principles ?? lesson6.reflection?.principles ?? [])
    .map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.principle || "未填写")}</td>
        <td>${escapeHtml(item.reason || "未填写")}</td>
        <td>${escapeHtml(item.scenario || "未填写")}</td>
        <td>${escapeHtml(item.action || "未填写")}</td>
      </tr>
    `).join("") || `<tr><td colspan="5" class="muted">尚未填写可信复盘原则。</td></tr>`
  const publicChallenge = snapshot?.publicChallenge ?? lesson6.publicChallenge

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>模块四课时6阶段快照</title>
  <style>
    :root { color-scheme: light; --ink: #172033; --muted: #667085; --line: #d8e2f0; --primary: #2563eb; --soft: #eff6ff; --green: #ecfdf3; --warm: #fff7ed; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif; line-height: 1.7; color: var(--ink); background: linear-gradient(135deg, #f8fbff 0%, #f3f7ff 50%, #fff7ed 100%); }
    main { max-width: 980px; margin: 0 auto; padding: 36px 24px 48px; }
    h1, h2, p { margin-top: 0; }
    .hero { border-radius: 28px; padding: 28px; color: white; background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #7c3aed 130%); box-shadow: 0 20px 50px rgba(37, 99, 235, 0.22); }
    .hero h1 { font-size: 30px; margin-bottom: 8px; letter-spacing: 0.04em; }
    .hero .muted { color: rgba(255, 255, 255, 0.78); }
    section { border: 1px solid var(--line); border-radius: 22px; padding: 20px; margin-top: 18px; background: rgba(255, 255, 255, 0.9); box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08); }
    section h2 { font-size: 20px; margin-bottom: 12px; color: #1d4ed8; }
    .muted { color: var(--muted); }
    .item { margin: 8px 0; }
    .info-grid, .stat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .info-card, .stat-card { border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; background: #ffffff; }
    .label { display: block; color: var(--muted); font-size: 13px; margin-bottom: 4px; }
    .value { font-weight: 700; }
    .status { display: inline-flex; align-items: center; border-radius: 999px; padding: 2px 10px; font-size: 13px; font-weight: 700; background: var(--soft); color: #1d4ed8; }
    .status.done { background: var(--green); color: #067647; }
    .note { border-left: 4px solid #7c3aed; padding: 10px 12px; border-radius: 12px; background: var(--warm); }
    table { border-collapse: separate; border-spacing: 0; width: 100%; margin-top: 10px; overflow: hidden; border: 1px solid var(--line); border-radius: 14px; font-size: 14px; background: white; }
    th, td { border-bottom: 1px solid var(--line); padding: 9px 10px; text-align: left; vertical-align: top; }
    tr:last-child td { border-bottom: 0; }
    th { background: #eef4ff; color: #1e3a8a; }
  </style>
</head>
<body>
  <main>
    <div class="hero">
      <h1>ClassQuest 模块四：AI 信息辨识员</h1>
      <p class="muted">课时6：题库发布与可信反思 · 阶段快照 lesson6-stage-v1</p>
      <p>本快照记录发布状态摘要、课时内公共挑战完成证明与可信复盘，不包含 runId、答案、得分、排名、匿名 session 或完整题卡 JSON。</p>
    </div>
    <section>
      <h2>学习者信息</h2>
      <div class="info-grid">
        <div class="info-card"><span class="label">姓名</span><span class="value">${escapeHtml(student.studentName || "未登记")}</span></div>
        <div class="info-card"><span class="label">班级</span><span class="value">${escapeHtml(student.clazz || "未选班")}</span></div>
        <div class="info-card"><span class="label">班学号</span><span class="value">${escapeHtml(student.classSeatCode || "—")}</span></div>
        <div class="info-card"><span class="label">生成时间</span><span class="value">${escapeHtml(generatedAtText)}</span></div>
      </div>
    </section>
    <section>
      <h2>课时6进度概览</h2>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">课时状态</span><span class="status ${lesson6.completed ? "done" : ""}">${lesson6.completed ? "已完成" : "进行中"}</span></div>
        <div class="stat-card"><span class="label">完成时间</span><span class="value">${escapeHtml(lesson6.completedAt || "未完成")}</span></div>
        <div class="stat-card"><span class="label">快照时间</span><span class="value">${escapeHtml(snapshot?.snappedAt ?? "尚未保存阶段快照")}</span></div>
        <div class="stat-card"><span class="label">QuickCheck</span><span class="value">${quickCheck.completed ? "三项达成" : "仍有待处理项"}</span></div>
      </div>
    </section>
    <section>
      <h2>QuickCheck 自动记录</h2>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">总分</span><span class="value">${quickCheck.totalScore}/100</span></div>
        <div class="stat-card"><span class="label">等级</span><span class="value">${escapeHtml(levelLabel[quickCheck.level] ?? quickCheck.level)}</span></div>
        <div class="stat-card"><span class="label">评估时间</span><span class="value">${escapeHtml(quickCheck.evaluatedAt || "未生成")}</span></div>
        <div class="stat-card"><span class="label">快照时间</span><span class="value">${escapeHtml(snapshot?.snappedAt ?? "尚未保存阶段快照")}</span></div>
      </div>
      <p class="item">T1 发布状态查看：<span class="status ${quickCheck.T1.achieved ? "done" : ""}">${quickCheck.T1.score}/35 · ${quickCheck.T1.achieved ? "达成" : "未达成"}</span>；发布状态摘要 ${quickCheck.T1.evidence.publicationItemCount} 项，其中已确认可发布 ${quickCheck.T1.evidence.publishableCount} 项。</p>
      <p class="item">T2 公共挑战完成：<span class="status ${quickCheck.T2.achieved ? "done" : ""}">${quickCheck.T2.score}/30 · ${quickCheck.T2.achieved ? "达成" : "未达成"}</span>；已答 ${quickCheck.T2.evidence.answeredCount}/${quickCheck.T2.evidence.questionCount} 题。</p>
      <p class="item">T3 可信复盘：<span class="status ${quickCheck.T3.achieved ? "done" : ""}">${quickCheck.T3.score}/35 · ${quickCheck.T3.achieved ? "达成" : "未达成"}</span>；原则 ${quickCheck.T3.evidence.principleCount}/3，发布责任说明 ${quickCheck.T3.evidence.responsibilityWritten ? "已填写" : "未填写"}。</p>
      ${quickCheck.blockers.length ? `<p class="note"><strong>待处理：</strong>${escapeHtml(quickCheck.blockers.join("；"))}</p>` : `<p class="note"><strong>结论：</strong>QuickCheck 三项均已达成，可作为课时 6 阶段证据。</p>`}
    </section>
    <section>
      <h2>发布状态摘要</h2>
      <table>
        <thead><tr><th>题卡类型</th><th>状态</th><th>确认时间</th></tr></thead>
        <tbody>${publicationRows}</tbody>
      </table>
    </section>
    <section>
      <h2>公共挑战完成证明</h2>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">context</span><span class="value">${escapeHtml(publicChallenge?.context ?? "lesson6_class")}</span></div>
        <div class="stat-card"><span class="label">答题数量</span><span class="value">${publicChallenge?.answeredCount ?? 0}/${publicChallenge?.questionCount ?? 0}</span></div>
        <div class="stat-card"><span class="label">完成时间</span><span class="value">${escapeHtml(publicChallenge?.completedAt ?? "未完成")}</span></div>
      </div>
    </section>
    <section>
      <h2>可信复盘</h2>
      <table>
        <thead><tr><th>#</th><th>原则</th><th>理由</th><th>场景</th><th>操作</th></tr></thead>
        <tbody>${reflectionRows}</tbody>
      </table>
      <p class="note"><strong>发布责任说明：</strong>${escapeHtml(snapshot?.reflection.responsibilityText ?? lesson6.reflection?.responsibilityText ?? "未填写")}</p>
    </section>
  </main>
</body>
</html>`
}

export function downloadModule4Snapshot(type: Module4SnapshotType, portfolio: Module4Portfolio): void {
  const html = type === "lesson6-full"
    ? buildModule4Lesson6SnapshotHtml(portfolio)
    : type === "lesson5-full"
    ? buildModule4Lesson5SnapshotHtml(portfolio)
    : type === "lesson4-full"
    ? buildModule4Lesson4SnapshotHtml(portfolio)
    : type === "lesson3-full"
      ? buildModule4Lesson3SnapshotHtml(portfolio)
      : type === "lesson2-full"
        ? buildModule4Lesson2SnapshotHtml(portfolio)
        : buildModule4Lesson1SnapshotHtml(portfolio)
  const date = new Date().toISOString().slice(0, 10)
  const namePart = safeFilenamePart(portfolio.student.studentName || "未登记")
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = type === "lesson6-full"
    ? `模块4_${namePart}_课时6可信复盘快照_${date}.html`
    : type === "lesson5-full"
    ? `模块4_${namePart}_课时5V3修订快照_${date}.html`
    : type === "lesson4-full"
    ? `模块4_${namePart}_课时4V2入库准备快照_${date}.html`
    : type === "lesson3-full"
      ? `模块4_${namePart}_课时3题卡V1快照_${date}.html`
      : `模块4_${namePart}_${type}_阶段快照_${date}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
