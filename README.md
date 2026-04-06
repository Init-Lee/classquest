# ClassQuest — 程序化教学闯关平台

> 一个学生可自驱闯关、教师以引导为主、离线优先、可持续迭代的程序化教学课程应用。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TypeScript-61DAFB)](https://vitejs.dev)
[![English](https://img.shields.io/badge/README-English-blue)](README_EN.md)

---

## 项目背景

ClassQuest 是一次**程序化教学模式**的试探与测试，面向中学课堂，首版服务于七年级「AI 科学传播站」模块三的教学场景。

传统课堂中，教师往往承担大量的串讲与引导工作，学生缺乏自驱学习的结构。ClassQuest 通过将课程拆解为「课时 → 关卡 → 子步骤」的结构，让学生在清晰的任务边界内推进，教师主要承担巡视与点拨，从而探索一种更可持续的程序化教学范式。

**我们希望更多的老师今后可以将其作为教学辅助手段。**

📖 [English Version →](README_EN.md)

---

## 功能亮点

| 功能 | 说明 |
|------|------|
| 闯关式自学 | 课时结构化闯关（课时1/2/3 各5关；全部已实现），步步有 Guard，学生自驱推进 |
| 离线优先 | 基于 IndexedDB 本地存储，无需网络也能学习 |
| 进度随身带 | 随时导出「继续学习包」，换电脑导入即可续学 |
| 小组协作 | 组长-组员分工，组长文件一键导出分发给组员 |
| 阶段快照 | 关键节点生成 HTML 快照，可打印 / 上传 Moodle |
| AI 助手引导 | 提供提示词模板，引导学生使用豆包等 AI 工具辅助思考 |
| 教师演示模式 | 口令进入演示状态，预填数据、绕过 Guard，可自由浏览全部页面 |
| 数据迁移支持 | 旧版工具 JSON 导入向导，帮助学生无缝衔接新版进度 |
| 可扩展架构 | Repository 抽象隔离数据层，未来可平滑迁移到后端 |

---

## 首版覆盖范围

- **课时 1**：项目启动与定题（5 关闯关）
- **课时 2**：证据采集与规范记录（5 关闯关）
- **课时 3**：素材整理与证据加工 — **5关全部已实现**（继承锚定 → 材料工具箱与表述确认 → 筛选材料（资料池）→ 证据加工工坊（逐条生成证据卡）→ 个人预览与导出）
- 课时 4-6：架构预留

> 课时 3 使用 `Lesson3State` 持久化全部进度：第2关「为何关注」草稿、第3关筛选材料与现象说明句、第4关证据卡列表（`evidenceCards[]`）、第5关完成标记；与继续学习包、IndexedDB 旧数据合并策略配套。**结构说明见 [FILE-STRUCTURE.md](FILE-STRUCTURE.md) 中「课时3 · 结构摘要」**。

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 构建 | Vite |
| 框架 | React 18 + TypeScript |
| UI 库 | shadcn/ui + Tailwind CSS v3 |
| 展示字体 | `@fontsource/noto-serif-sc` / `@fontsource/cormorant-garamond`（npm 本地字体，Vite 打包进产物，**不依赖在线字体 CDN**） |
| 路由 | React Router v6（懒加载） |
| 数据层 | IndexedDB（本地优先） |
| 状态管理 | React Context + Reducer |

---

## 快速开始

**环境要求**：Node.js >= 18

```bash
# 克隆项目
git clone https://github.com/Init-Lee/classquest.git
cd classquest

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开浏览器访问 `http://localhost:5173`

---

## 项目状态

| 阶段 | 状态 |
|------|------|
| Phase 0: 项目初始化 + 开源文件 | ✅ 完成 |
| Phase 1: 壳与导航 | ✅ 完成 |
| Phase 2: 数据底座（IndexedDB + 继续学习包） | ✅ 完成 |
| Phase 3: 课时 1（5 关闯关 + AI 助手 + 快照） | ✅ 完成 |
| Phase 4: 课时 2（5 关闯关 + 组长文件同步 + 双模板证据入库 + 质检） | ✅ 完成 |
| Phase 5: 细节收口（Bug修复、Guard优化、数据结构重构） | ✅ 完成 |
| Phase 6: 课时 3 开发 | 🚧 进行中（第1~3关可用；第2关含跨课时材料参考 Feature、表述确认状态与海报聚光灯预览） |
| Phase 7: UI/UX 视觉优化（色彩系统、排版、响应式） | 📋 规划中 |

---

## 路线图

- [x] 课时 1 完整闯关流程（5 关）
- [x] 课时 2 完整闯关流程（5 关）
- [x] 小组协作（组长文件导出 / 组员导入）
- [x] 旧版数据迁移向导（临时功能）
- [✅] 课时 3（5关全部已实现）
- [ ] 课时 4-6 实现
- [ ] AI 助手 API 接入（当前为提示词模板 + 外部跳转）
- [ ] 教师端后台
- [ ] 后端同步支持

---

## 贡献指南

欢迎教师、教育技术研究者、开发者参与贡献，请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 开源许可

[MIT License](LICENSE) © 2026 ClassQuest Contributors
