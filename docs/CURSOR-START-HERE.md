<!--
文件说明：ClassQuest 平台重构的开发入口说明。
职责：告诉开发者在修改平台、模块或后端前应先阅读哪些文档，并明确本轮不能破坏模块 3。
更新触发：开发流程、必读文档、阶段划分或非目标事项变化时，需要同步更新本文件。
-->

# Cursor Start Here — ClassQuest 平台重构

ClassQuest 正从单一模块 3 应用迁移为平台化结构：

```text
Platform Portal → Module → Lesson → Step
```

## 非破坏性原则

模块 3 是当前已验证完成的实现。平台化重构期间必须保留：

- 本地优先学习进度
- 继续学习包导出/导入
- 跨课时与跨角色文件链路
- 阶段快照
- 教师演示模式
- Guard 与自动跳转行为

## 开发前必读

修改前按顺序读取：

1. 根 `README.md`
2. 根 `FILE-STRUCTURE.md`
3. 目标模块 `README.md`
4. 目标模块 `FILE-STRUCTURE.md`
5. `docs/MIGRATION-PLAN.md`
6. `docs/ARCHITECTURE-V1_5.md`

后端修改还需读取：

1. `backend/README.md`
2. `backend/FILE-STRUCTURE.md`
3. `backend/app/modules/module4/README.md`
4. `backend/app/modules/module4/FILE-STRUCTURE.md`

## 当前阶段约束

- 模块 4 只保留占位入口，不写课程内容。
- 后端只保留健康检查和空 router，不接入前端。
- shared 只放业务无关 UI 与纯工具。
- 不冻结数据库 schema。

