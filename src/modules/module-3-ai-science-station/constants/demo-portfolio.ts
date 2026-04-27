/**
 * 文件说明：教师演示模式专用的预填档案常量
 * 职责：为教师模式提供一份内容充实的模拟 ModulePortfolio，
 *       让老师演示时每个步骤页面均有可见内容，而非空状态
 * 更新触发：课时结构新增字段时需同步补充演示数据；
 *           演示文案需要调整时；与首页指针/「已完成」叙事冲突的字段（如 lesson2.completed）需修正时
 */

import type { ModulePortfolio } from "@/modules/module-3-ai-science-station/domains/portfolio/types"
import { createEmptyLesson3State } from "@/modules/module-3-ai-science-station/domains/portfolio/types"

/** 创建教师演示用的预填档案（每次进入教师模式时调用，避免引用同一对象） */
export function createDemoPortfolio(): ModulePortfolio {
  const now = new Date().toISOString()
  return {
    id: "demo-portfolio-teacher-mode",
    moduleId: "G7_M3",
    schemaVersion: 1,
    appVersion: "1.0.0",
    student: {
      clazz: "演示班级",
      studentName: "演示同学",
      groupName: "科学探索组",
      role: "leader",
    },
    /** 教师演示：课时5已完成，指针落在课时6第2关，便于直接预览「讲解路径单」填写态 */
    pointer: { lessonId: 6, stepId: 2, updatedAt: now },
    lesson1: {
      introDone: true,
      r1ByMember: [
        {
          author: "演示同学",
          themePack: "B",
          scope: "学校 500 米范围内的主要水源点",
          researchQuestionDraft: "学校附近的水质状况如何？是否符合饮用水标准？",
          minEvidenceIdea: "至少 3 个采样点的水质检测数据 + 对比国家标准",
          roughRecordIdea: "先记采样点位置和时间，再补检测数值，拍照留档",
          driftWarnings: ["注意不要扩展到整个城市水质，范围要聚焦在学校周边"],
          sourceRows: [
            {
              meta: "《2023年城市饮用水水质年报》，市生态环境局，2024年3月发布",
              fact: "全市饮用水达标率 97.8%，部分城郊河道仍存在超标情况",
              inspire: "可将年报数值作为对比基准，与我们实测数据形成对照",
            },
          ],
          savedAt: now,
        },
        {
          author: "小明",
          themePack: "B",
          scope: "学校食堂用水",
          researchQuestionDraft: "学校食堂的用水来源是什么？水质达标吗？",
          minEvidenceIdea: "食堂水质检测报告 + 现场水龙头取样",
          roughRecordIdea: "拍摄检测报告，记录取样时间和地点",
          driftWarnings: ["不要纠结于全校所有用水，聚焦食堂一个区域"],
          sourceRows: [],
          savedAt: now,
        },
      ],
      groupDiscussion: [
        {
          memberName: "演示同学",
          r1Question: "学校附近的水质状况如何？是否符合饮用水标准？",
          r1EvidenceIdeas: ["水质检测仪读数", "市环保局公开年报"],
          adopted: "yes",
          note: "方向最清晰，证据来源明确，可操作性强",
        },
        {
          memberName: "小明",
          r1Question: "学校食堂的用水来源与水质是否达标？",
          r1EvidenceIdeas: ["食堂检测报告"],
          adopted: "partial",
          note: "食堂方向与主方向有重叠，将食堂列为其中一个采样点",
        },
      ],
      groupConsensus: {
        themePack: "B",
        scope: "学校 500 米范围内的水源点（含饮用水管道出口、周边河道、食堂）",
        finalResearchQuestion: "学校附近的主要水源地水质是否达标？与国家标准值相差多少？",
        firstHandEvidenceIdeas: ["便携水质检测仪现场读数（3个采样点）", "水样送检后的报告"],
        secondHandSourceIdeas: ["市环保局年度水质公告"],
        roughRecordIdeas: [
          "采样点：位置 + 时间 + 检测值 + 照片",
          "公开数据：来源网址 + 发布日期 + 数据表格编号",
        ],
        whyThisPlan: "水质问题直接影响师生健康，公开数据可免费获取，现场检测也可自行操作，两类证据可交叉印证",
        confirmedAt: now,
      },
      groupMembers: ["演示同学", "小明", "小红"],
      evidenceRows: [
        {
          item: "学校主楼一楼水龙头水质检测",
          type: "first-hand",
          whereWhen: "学校主楼一楼走廊，周三课后 15:30",
          method: "便携水质检测仪 + 手机拍照记录",
          recordIdea: "记时间地点 + pH 值 + 浑浊度 + 现场照片",
          owners: ["演示同学"],
        },
        {
          item: "学校东侧小河水样采集",
          type: "first-hand",
          whereWhen: "学校东侧小河，周六上午 9:00",
          method: "水样采集瓶 + 现场便携检测仪",
          recordIdea: "标注采样位置、时间、天气，拍摄周边环境",
          owners: ["小明", "小红"],
        },
        {
          item: "市环保局公开水质数据（年报）",
          type: "second-hand",
          whereWhen: "市环保局官网，随时可获取",
          method: "浏览器访问 + 截图保存",
          recordIdea: "记录来源网址、发布日期、数据表格编号",
          owners: ["演示同学"],
        },
      ],
      declarationAgreed: true,
      aiAssistLogs: [
        {
          kind: "R2",
          inputSummary: "主题：水质，范围：学校500米，研究问题：水质是否达标",
          outputText:
            "建议设置 3 个对比采样点：①自来水管出口（室内参考值），②学校旁河道上游，③学校旁河道下游（对照污染程度变化）。每次采样建议同时记录天气情况，避免雨天影响数据。",
          adopted: true,
          adoptedNote: "采纳了三点对比采样建议，已更新到证据清单",
          createdAt: now,
        },
      ],
      completed: true,
    },
    lesson2: {
      resumeDone: true,
      leaderSyncDone: true,
      assignments: [
        {
          planIndex: 0,
          item: "学校主楼一楼水龙头水质检测",
          owners: ["演示同学"],
          expectedSourceType: "field",
          fromLeaderVersion: 1,
        },
        {
          planIndex: 2,
          item: "市环保局公开水质数据（年报）",
          owners: ["演示同学"],
          expectedSourceType: "public",
          fromLeaderVersion: 1,
        },
      ],
      publicRecords: [
        {
          planIndex: 2,
          item: "市环保局公开水质数据（年报）",
          owner: "演示同学",
          sourceType: "public",
          resourceType: "机构报告",
          sourcePlatform: "政府/机构官网",
          sourceOrg: "市生态环境局",
          urls: ["https://example-env.gov.cn/water-report-2023"],
          publishedAt: "2024-03-01",
          publishedUnknown: false,
          capturedAt: "2026-03-15",
          materialTypes: ["数据", "图像"],
          methods: ["截图", "数据整理"],
          quoteOrNote:
            "2023年全市饮用水达标率97.8%，学校所在区达标率96.2%，略低于全市平均水平，其中pH均值为7.1，浑浊度均值为0.8NTU，均在标准范围内",
          citationFull:
            "演示同学（2026-03-15）。政府/机构官网·机构报告：市环保局公开水质数据（年报）【数据/图像】。方法：截图/数据整理。链接：https://example-env.gov.cn/water-report-2023（发布：2024-03-01）",
          status: "checked",
        },
      ],
      fieldTasks: [
        {
          planIndex: 0,
          item: "学校主楼一楼水龙头水质检测",
          owner: "演示同学",
          sourceType: "field",
          materialName: "饮水台出水水质读数",
          scene: "校园",
          location: "主楼一楼走廊饮水台",
          date: "2026-03-20",
          materialTypes: ["数据", "图像"],
          methods: ["拍照", "测量"],
          compNoFace: true,
          compNoPrivate: true,
          compNoFake: true,
          compSafety: true,
          citationFull:
            "演示同学（2026-03-20）。饮水台出水水质读数【数据/图像】。地点：校园 主楼一楼走廊饮水台。采集方法：拍照/测量。",
          status: "done",
        },
      ],
      qualityChecks: [
        {
          recordIndex: 0,
          hasSourceAndTime: true,
          provesSomething: true,
          isLocatable: true,
          passed: true,
          checkedAt: now,
        },
      ],
      /** 与指针已到课时5 的演示叙事一致，须为 true，避免首页「课时2 待解锁」断层 */
      completed: true,
    },
    lesson3: {
      ...createEmptyLesson3State(),
      // 演示模式：步骤1~5全部已完成，供教师展示课时3全关内容
      missionAcknowledged: true,
      toolboxCompleted: true,
      toolboxNoticeWhat: "学校附近多个取水点的检测数据存在差异，部分指标超出正常范围",
      toolboxWhyOnPoster: "学校周边水质参差不齐，最高超标点 pH 偏低约 0.3，值得深入调查以保障师生用水安全",
      selectedMaterials: [
        {
          sourceType: "public",
          sourceIndex: 0,
          explanation: "该数据显示学校所在区饮用水达标率略低于全市均值，说明存在潜在水质风险",
        },
        {
          sourceType: "field",
          sourceIndex: 0,
          explanation: "现场检测读数与年报数值接近，可作为印证年报的现场一手证据",
        },
      ],
      evidenceCards: [
        {
          materialIndex: 0,
          materialType: "data",
          title: "市环保局公开水质数据（年报）",
          objectiveStatement: "该数据显示学校所在区饮用水达标率为96.2%，略低于全市97.8%的均值，说明存在潜在水质风险",
          processingResult: "截取了年报中学校所在区的达标率与全市均值两列数据，删去其他行政区数据，保留 pH 均值（7.1）与浑浊度均值（0.8NTU）字段",
          posterExpression: "「市年报数据显示，我区饮用水达标率（96.2%）低于全市均值（97.8%），存在一定改善空间」",
          evidenceShows: "",
          relationToQuestion: "",
          limitedClaim: "",
        },
        {
          materialIndex: 1,
          materialType: "data",
          title: "饮水台出水水质读数",
          objectiveStatement: "现场检测读数显示主楼一楼饮水台出水 pH 值为 7.0，浑浊度 0.9NTU，与年报数值接近",
          processingResult: "保留了 pH 值和浑浊度两项核心检测数值，记录了采样时间和地点，删去无关的设备型号备注",
          posterExpression: "「实地测量：主楼饮水台 pH=7.0、浑浊度=0.9NTU，与官方年报数据吻合，印证了数据的可靠性」",
          evidenceShows: "",
          relationToQuestion: "",
          limitedClaim: "",
        },
      ],
      personalPackageExported: true,
      completed: true,
    },
    lesson4: {
      // 演示模式：课时4全部5关已完成（组长视角）
      memberPackagesImported: 3,
      groupMergeCompleted: true,
      possibleCauses: "初步推测可能原因：①周边管网老化导致二次污染；②部分取水点附近存在工业排放；③学校东侧河道上游存在面源污染。以上均为初步推测，需后续数据印证。",
      posterTitle: "学校周边水质问题调查——我们喝的水安全吗？",
      posterSubtitle: "基于7年级3班对校区取水点的实地采样与多源资料分析",
      skeletonExported: true,
      skeletonImported: false,
      importedPackagesJson: "[]",
      skeletonPackageJson: JSON.stringify({
        packageType: "skeleton-package-v1",
        groupName: "科学探索组",
        leaderName: "演示同学",
        researchQuestion: "学校附近的主要水源地水质是否达标？与国家标准值相差多少？",
        posterTitle: "学校周边水质问题调查——我们喝的水安全吗？",
        posterSubtitle: "基于7年级3班对校区取水点的实地采样与多源资料分析",
        mergedWhyCare:
          "【演示同学】学校周边水质参差不齐，最高超标点 pH 偏低约 0.3，值得深入调查以保障师生用水安全",
        mergedWhatWeSee: [
          "【演示同学】「市年报数据显示，我区饮用水达标率（96.2%）低于全市均值（97.8%），存在一定改善空间」",
          "【演示同学】「实地测量：主楼饮水台 pH=7.0、浑浊度=0.9NTU，与官方年报数据吻合，印证了数据的可靠性」",
        ],
        mergedSources: [
          "演示同学（2026-03-15）。政府/机构官网·机构报告：市环保局公开水质数据（年报）【数据/图像】。方法：截图/数据整理。链接：https://example-env.gov.cn/water-report-2023（发布：2024-03-01）",
          "演示同学（2026-03-20）。饮水台出水水质读数【数据/图像】。地点：校园 主楼一楼走廊饮水台。采集方法：拍照/测量。",
        ],
        memberPackages: [],
        possibleCauses:
          "初步推测可能原因：①周边管网老化导致二次污染；②部分取水点附近存在工业排放；③学校东侧河道上游存在面源污染。以上均为初步推测，需后续数据印证。",
        exportedAt: "2026-03-22T10:00:00.000Z",
      }),
      personalDraftHtml: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>学校周边水质探究报告</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #1e40af; }
    .section { margin: 20px 0; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .evidence-card { background: #f5f3ff; padding: 12px; margin: 8px 0; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>探究问题：学校附近的主要水源地水质是否达标？</h1>
  <div class="section">
    <h2>为什么关注这个问题</h2>
    <p>学校周边水质参差不齐，最高超标点 pH 偏低约 0.3，值得深入调查以保障师生用水安全。</p>
  </div>
  <div class="section">
    <h2>我们看见了什么（证据）</h2>
    <div class="evidence-card">
      <p>市年报数据显示，我区饮用水达标率（96.2%）低于全市均值（97.8%）。</p>
    </div>
    <div class="evidence-card">
      <p>实地测量：主楼饮水台 pH=7.0、浑浊度=0.9NTU，与官方年报数据吻合。</p>
    </div>
  </div>
  <div class="section">
    <h2>可能的原因</h2>
    <p>初步推测：①管网老化；②工业排放；③面源污染。以上均为推测，需后续验证。</p>
  </div>
  <footer style="margin-top: 40px; font-size: 12px; color: #9ca3af;">
    <p>AI 使用声明：使用豆包生成了 HTML 骨架结构，内容由小组自行填写</p>
    <p>来源：市环保局年报（2024-03-01）；现场采集（2026-03-20）</p>
  </footer>
</body>
</html>`,
      personalDraftCompleted: true,
      productionPlan: {
        baseAuthor: "演示同学",
        operatorName: "演示同学",
        evidenceCheckerName: "小明",
        sourceCheckerName: "小红",
        aiVerifierName: "演示同学",
        mediaReplacementPlan: "将证据区两张占位图替换为实测水质检测仪截图",
        aiUsageBoundary: "允许AI生成HTML骨架和CSS样式，禁止AI填充事实性内容",
        manualCheckPoints: "证据数据必须与原始记录核对；来源说明必须人工逐条核查",
      },
      planCompleted: true,
      groupWebpageV1: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>学校周边水质探究 · 小组网页 v1</title>
  <style>
    body { font-family: sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    h1 { color: #1e40af; text-align: center; }
    .section { margin: 20px 0; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
    .evidence-card { background: #f5f3ff; padding: 12px; margin: 10px 0; border-radius: 8px; border-left: 3px solid #7c3aed; }
    footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <h1>学校附近的主要水源地水质是否达标？</h1>
  <div class="section">
    <h2>🔍 为什么关注这个问题</h2>
    <p>学校周边水质参差不齐，最高超标点 pH 偏低约 0.3，影响师生用水安全，值得深入探究。</p>
  </div>
  <div class="section">
    <h2>📊 我们看见了什么</h2>
    <div class="evidence-card">
      <strong>公开数据：</strong>市年报显示我区达标率（96.2%）低于全市均值（97.8%）
      <p style="font-size:12px;color:#6b7280">来源：市生态环境局年报（2024-03-01）</p>
    </div>
    <div class="evidence-card">
      <strong>现场测量：</strong>主楼饮水台 pH=7.0、浑浊度=0.9NTU，在标准范围内
      <p style="font-size:12px;color:#6b7280">来源：现场采集（2026-03-20）</p>
    </div>
  </div>
  <div class="section">
    <h2>💡 可能的原因</h2>
    <p>初步推测（非定论）：①管网老化；②工业排放；③面源污染。</p>
  </div>
  <footer>
    <p>AI 使用声明：AI 辅助生成了 HTML/CSS 骨架，事实内容均由小组填写核实</p>
    <p>来源追溯：市环保局年报 | 学校现场检测记录</p>
  </footer>
</body>
</html>`,
      collabCompleted: true,
      finalHtml: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>学校周边水质探究 · 最终版</title>
  <style>
    body { font-family: "Noto Sans SC", sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    h1 { color: #1e40af; text-align: center; padding: 20px; }
    .section { margin: 20px 0; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
    .evidence-card { background: #f0fdf4; padding: 14px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #16a34a; }
    .cause-block { background: #eff6ff; padding: 14px; border-radius: 8px; }
    footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <h1>📍 学校附近的主要水源地水质探究报告</h1>
  <div class="section">
    <h2>🔍 探究问题</h2>
    <p>学校附近的主要水源地水质是否达标？与国家标准值相差多少？</p>
  </div>
  <div class="section">
    <h2>❤️ 为什么关注</h2>
    <p>学校周边水质参差不齐，师生饮用水安全值得关注。我们团队来自不同采样视角，共同探究这一问题。</p>
  </div>
  <div class="section">
    <h2>📊 我们看见了什么</h2>
    <div class="evidence-card">
      <strong>官方数据：</strong>市年报显示我区达标率（96.2%）低于全市均值（97.8%）
      <p style="font-size:12px;color:#6b7280;margin-top:6px">来源：市生态环境局年报（2024-03-01）</p>
    </div>
    <div class="evidence-card">
      <strong>现场实测：</strong>主楼饮水台 pH=7.0、浑浊度=0.9NTU，均在国家标准范围内
      <p style="font-size:12px;color:#6b7280;margin-top:6px">来源：现场采集（2026-03-20，便携式检测仪）</p>
    </div>
  </div>
  <div class="section">
    <h2>💡 可能的原因</h2>
    <div class="cause-block">
      <p>基于上述证据，我们<strong>初步推测</strong>（非定论）可能的原因包括：</p>
      <ul>
        <li>①部分管网老化，存在二次污染风险</li>
        <li>②河道上游存在面源污染</li>
        <li>③达标率统计口径与实测点位可能存在差异</li>
      </ul>
    </div>
  </div>
  <footer>
    <p>AI 使用声明：AI 辅助生成了 HTML/CSS 结构和样式，所有事实内容均由小组核实填写，未使用 AI 填充数据</p>
    <p>来源追溯：①市生态环境局年报（2024-03-01）②学校现场检测记录（2026-03-20）</p>
    <p>小组成员：演示同学、小明、小红 | 制作日期：2026-04-07</p>
  </footer>
</body>
</html>`,
      verificationPassed: true,
      finalExported: true,
      completed: true,
    },
    lesson5: {
      feedbackDimensions: [
        { name: "海报逻辑", status: "needs-change", suggestion: "先说研究背景再说结论，目前顺序有些跳跃" },
        { name: "证据支撑", status: "needs-change", suggestion: "「浪费很严重」这句结论缺乏数据支撑，建议补充具体数字" },
        { name: "结论合理性", status: "clear", suggestion: "" },
        { name: "建议可行性", status: "clear", suggestion: "" },
      ],
      priorityChange: "优先：为「浪费很严重」补实测或缩小结论；统一讲解顺序为先点题再证据；建议写具体可行动项。",
      peerFeedbackImportedPackagesJson: JSON.stringify([
        {
          packageType: "peer-feedback-opinion-v1",
          studentName: "小明",
          role: "member",
          clazz: "演示班级",
          groupName: "科学探索组",
          feedbackDimensions: [
            { name: "海报逻辑", status: "needs-change", suggestion: "标题区字太多" },
            { name: "证据支撑", status: "clear", suggestion: "" },
            { name: "结论合理性", status: "", suggestion: "" },
            { name: "建议可行性", status: "", suggestion: "" },
          ],
          priorityChange: "建议把数据图放大，脚注字号统一。",
          exportedAt: now,
        },
      ]),
      feedbackExported: true,
      feedbackCompleted: true,
      changeRecords: [
        {
          item: "标题",
          before: "「食堂浪费」",
          after: "「食堂浪费：从收餐台数据说起」",
          reason: "【组长·本轮优先修改】优先：为「浪费很严重」补实测或缩小结论；统一讲解顺序为先点题再证据；建议写具体可行动项。",
        },
        {
          item: "探究问题",
          before: "浪费严重吗？",
          after: "食堂高峰期剩餐量是否超过合理范围？",
          reason: "【小明·优先修改】建议把数据图放大，脚注字号统一。",
        },
      ],
      versionChangeLeaderPackageExported: true,
      importedVersionChangePackageJson: "",
      versionChangeMemberAcknowledged: false,
      completed: true,
    },
    lesson6: {
      exampleAcknowledged: true,
      roadshowSteps: [
        {
          step: 1,
          name: "点题",
          posterArea: "标题区与探究问题区",
          mustSay: "我们研究的问题是学校周边主要水源地的水质是否达标。",
          expand: "可一句话点出与师生健康的关联",
          presenterBy: "演示同学",
        },
        {
          step: 2,
          name: "指证据",
          posterArea: "中部数据图与脚注区",
          mustSay: "请看海报这里，年报数据与现场实测可以对照阅读。",
          expand: "",
          presenterBy: "小明",
        },
        {
          step: 3,
          name: "说判断与建议",
          posterArea: "「可能的原因」与建议区",
          mustSay: "因此我们认为需要同时关注管网老化与面源污染两类风险。",
          expand: "",
          presenterBy: "小红",
        },
        {
          step: 4,
          name: "应追问并收束",
          posterArea: "结论与行动建议区",
          mustSay: "若被追问「你怎么证明」，我们会回到脚注与采样记录对应位置。",
          expand: "",
          presenterBy: "演示同学",
        },
      ],
      challengeQuestion: "你们怎么证明这和同学的健康直接有关？",
      evidenceBack: "回到主楼饮水台实测与市年报对照那一块证据。",
      closingSentence: "以上就是我们基于现有证据能负责任讲到的程度。",
      pathExported: false,
      roadshowPathLeaderPackageExported: false,
      importedRoadshowPathPackageJson: "",
      roadshowPathMemberAcknowledged: false,
      completed: false,
    },
    snapshotHistory: [],
    groupPlanVersion: 1,
    createdAt: now,
    updatedAt: now,
  }
}
