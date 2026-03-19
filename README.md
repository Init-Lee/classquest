# ClassQuest — 程序化教学闯关平台

> 一个学生可自驱闯关、教师以引导为主、离线优先、可持续迭代的程序化教学课程应用。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TypeScript-61DAFB)](https://vitejs.dev)

---

## 项目背景

ClassQuest 是一次**程序化教学模式**的试探与测试，面向中学课堂，首版服务于七年级「AI 科学传播站」模块三的教学场景。

传统课堂中，教师往往承担大量的串讲与引导工作，学生缺乏自驱学习的结构。ClassQuest 通过将课程拆解为「课时 → 步骤 → 闯关」的结构，让学生在清晰的任务边界内推进，教师主要承担巡视与点拨，从而探索一种更可持续的程序化教学范式。

**我们希望更多的老师今后可以将其作为教学辅助手段。**

---

## 功能亮点

| 功能 | 说明 |
|------|------|
| 闯关式自学 | 每课固定 6 步，步步有 Guard，学生自驱推进 |
| 离线优先 | 基于 IndexedDB 本地存储，无需网络也能学习 |
| 进度随身带 | 随时导出「继续学习包」，换电脑导入即可续学 |
| 小组协作 | 组长-组员分工，组长文件一键导出分发 |
| 阶段快照 | 关键节点生成 HTML 快照，可打印/上传 Moodle |
| AI 助手引导 | 提供提示词模板，引导学生使用豆包等 AI 工具辅助思考 |
| 可扩展架构 | Repository 抽象隔离数据层，未来可平滑迁移到后端 |

---

## 首版覆盖范围

- **课时 1**：项目启动与定题（6 步闯关）
- **课时 2**：证据采集与规范记录（6 步闯关）
- 课时 3-6：架构预留，暂未实现

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 构建 | Vite |
| 框架 | React 18 + TypeScript |
| UI 库 | shadcn/ui + Tailwind CSS v3 |
| 路由 | React Router v6（懒加载） |
| 数据层 | IndexedDB（本地优先） |
| 状态管理 | React Context + Reducer |

---

## 快速开始

**环境要求**：Node.js >= 18

```bash
# 克隆项目
git clone https://github.com/<your-username>/classquest.git
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
| Phase 3: 课时 1（6 步闯关 + AI 助手 + 快照） | ✅ 完成 |
| Phase 4: 课时 2（6 步闯关 + 组长文件同步 + 质检） | ✅ 完成 |
| Phase 5: 细节收口 | ✅ 完成 |

---

## 路线图

- [ ] AI 助手 API 接入（当前为提示词模板 + 外部跳转）
- [ ] 课时 3-6 实现
- [ ] 教师端后台
- [ ] 后端同步支持

---

## 贡献指南

欢迎教师、教育技术研究者、开发者参与贡献，请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 设计文档

项目的产品设计规格文档保存在 [`build_Plan/`](build_Plan/) 目录下，供参考：

- [范围与边界](build_Plan/docs/00_SCOPE_AND_LOCKS.md)
- [系统架构](build_Plan/docs/01_SYSTEM_ARCHITECTURE.md)
- [数据模型](build_Plan/docs/02_DATA_AND_PERSISTENCE.md)
- [课时 1 规格](build_Plan/docs/04_LESSON1_SPEC.md)
- [课时 2 规格](build_Plan/docs/05_LESSON2_SPEC.md)

---

## 开源许可

[MIT License](LICENSE) © 2026 ClassQuest Contributors
