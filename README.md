# ClassQuest — 程序化教学闯关平台

> 一个学生可自驱闯关、教师以引导为主、离线优先、可持续迭代的程序化教学课程应用。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TypeScript-61DAFB)](https://vitejs.dev)
[![English](https://img.shields.io/badge/README-English-blue)](README_EN.md)
[![Release](https://img.shields.io/badge/release-v0.5.0-emerald)](https://github.com/Init-Lee/classquest/releases)

---

## 版本与发布（SemVer）

- **当前发布**：`v0.5.0`（与 `package.json` 中 `version` 一致；`0.x` 表示快速迭代期）。
- **Git 标签**：在 GitHub 仓库 **Tags / Releases** 可查看；本地核对：`git describe --tags` 或 `git show v0.5.0`。
- **以后发新版**：合并到 `main` 后，将 `package.json` / `package-lock.json` 根版本 bump 为下一号（如 `0.6.0`），提交后执行 `git tag v0.6.0 && git push origin v0.6.0`，并在 GitHub 上写 Release 说明即可。

> 说明：学生档案里的 `appVersion`（如 `1.0.0`）表示**数据包格式口径**，与上述**产品发布号**分开维护。

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
| 闯关式自学 | 课时结构化闯关（课时1~4 各5关，共20关全部已实现），步步有 Guard，学生自驱推进 |
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
- **课时 3**：素材整理与证据加工（5 关全部实现 — 继承锚定 → 材料工具箱与表述确认 → 筛选材料 → 证据加工工坊 → 个人预览与导出）
- **课时 4**：结论形成与网页传播（5 关全部实现 — 小组合并 → 个人 HTML 草稿 → 制作方案 → 协商生成 → 升级校验与最终导出）
- **课时 5**：预演展示与反馈优化（2 关全部实现 — 意见入池·同伴反馈单 v2 → 改动落地·版本改动说明 v2）
- 课时 6：终版海报路演与表达设计（架构预留，类型已预埋）

> 课时 3-5 跨课时数据流：课时3第5关导出 JSON「个人整理包」→ 课时4第1关组长导入所有成员包、合并并导出「小组骨架包 v1」→ 组员导入骨架包 → 各自完成个人草稿 → 组长记录制作方案并导出供组员导入 → 协商生成网页 v1 → 升级校验并导出最终版 HTML → 课时5第1关小组预演并汇总优先修改点 → 第2关记录版本改动并导出。**结构说明见 [FILE-STRUCTURE.md](FILE-STRUCTURE.md)**。

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
| Phase 6: 课时 3 开发 | ✅ 完成（5关全部实现；第5关导出 JSON 个人整理包，与课时4衔接） |
| Phase 7: 课时 4 开发 | ✅ 完成（5关全部实现；组长/组员双视图；双栏编辑器布局；跨角色文件分发链路完整） |
| Phase 8: 课时 5 开发 | ✅ 完成（2关全部实现；同伴反馈单 v2 + 版本改动说明 v2；文本/JSON 导出；课时4→5智能跳转） |
| Phase 9: UI/UX 视觉优化（色彩系统、排版、响应式） | 📋 规划中 |

---

## 路线图

- [x] 课时 1 完整闯关流程（5 关）
- [x] 课时 2 完整闯关流程（5 关）
- [x] 小组协作（组长文件导出 / 组员导入）
- [x] 旧版数据迁移向导（临时功能）
- [x] 课时 3（5关全部实现；第5关导出 JSON 个人整理包）
- [x] 课时 4（5关全部实现；个人整理包 → 骨架包 → 制作方案单 → HTML 编辑/预览 → 校验导出）
- [x] 课时 5（2关全部实现；同伴反馈单 v2 + 版本改动说明 v2；文本/JSON 导出）
- [ ] 课时 6 实现
- [ ] AI 助手 API 接入（当前为提示词模板 + 外部跳转）
- [ ] 教师端后台
- [ ] 后端同步支持

---

## 贡献指南

欢迎教师、教育技术研究者、开发者参与贡献，请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 开源许可

[MIT License](LICENSE) © 2026 ClassQuest Contributors
