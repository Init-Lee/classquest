# 贡献指南

感谢你对 ClassQuest 的关注！本文档说明如何参与贡献。

## 贡献方式

- **提 Issue**：发现 Bug、有功能建议、发现文档错误，均可开 Issue
- **提 PR**：修复 Bug、实现新功能、改善文档
- **分享使用经验**：作为教师或开发者，分享你的使用场景与反馈

## 开发流程

### 环境准备

```bash
git clone https://github.com/<your-username>/classquest.git
cd classquest
npm install
npm run dev
```

### 分支策略

- `main`：稳定主分支
- `feat/<功能名>`：新功能开发
- `fix/<问题描述>`：Bug 修复
- `docs/<文档说明>`：文档更新

### Commit 规范

使用语义化提交信息：

```
feat: 新增功能描述
fix: 修复问题描述
docs: 更新文档说明
refactor: 重构说明
style: 样式调整
test: 测试相关
chore: 构建/工具/配置变更
```

示例：
```
feat: 添加课时1步骤3个人R1填写功能
fix: 修复组员导入组长文件后名字选择异常
docs: 更新 README 快速开始章节
```

### PR 要求

1. PR 标题清晰描述改动内容
2. PR 描述说明：改动原因、影响范围、测试方法
3. 确保 `npm run build` 可以正常通过
4. 不引入新的 TypeScript 错误
5. 不暴露真实密钥或敏感信息

## 代码规范

- 所有代码注释与 docstring 使用中文
- 每个新文件开头需有中文说明块，包含：文件职责、所属层次、更新触发条件
- 严格遵循 `FILE-STRUCTURE.md` 中定义的分层与依赖方向
- 禁止在页面组件中直接操作 IndexedDB，必须通过 Repository 接口
- 学生端界面禁止出现技术术语（JSON、schema、IndexedDB 等）

## 问题反馈

提 Issue 时请包含：

- 操作系统与浏览器版本
- 问题复现步骤
- 预期行为 vs 实际行为
- 截图（如适用）
