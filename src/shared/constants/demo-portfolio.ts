/**
 * 文件说明：教师演示模式专用的预填档案常量
 * 职责：为教师模式提供一份内容充实的模拟 ModulePortfolio，
 *       让老师演示时每个步骤页面均有可见内容，而非空状态
 * 更新触发：课时结构新增字段时需同步补充演示数据；
 *           演示文案需要调整时
 */

import type { ModulePortfolio } from "@/domains/portfolio/types"
import { createEmptyLesson3State } from "@/domains/portfolio/types"

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
    pointer: { lessonId: 1, stepId: 2, updatedAt: now },
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
      completed: false,
    },
    lesson3: {
      ...createEmptyLesson3State(),
      // 演示模式：步骤1~3已完成，供教师展示课时3各步骤内容
      missionAcknowledged: true,
      toolboxCompleted: true,
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
    },
    snapshotHistory: [],
    groupPlanVersion: 1,
    createdAt: now,
    updatedAt: now,
  }
}
