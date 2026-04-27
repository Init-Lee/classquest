<!--
文件说明：ClassQuest 平台化迁移计划。
职责：记录从单模块 3 应用迁移到平台结构的阶段、验证点和回滚方式。
更新触发：迁移阶段、目标目录、路由策略或验证清单变化时，需要同步更新本文件。
-->

# 平台化迁移计划

## 目标

把当前单模块 ClassQuest 迁移为可承载模块 3、模块 4 与后续模块的平台结构，且不破坏模块 3。

## 目标结构

```text
src/
├── platform/
├── modules/
│   ├── module-3-ai-science-station/
│   └── module-4-ai-info-detective/
└── shared/
```

## 阶段

1. 创建平台壳：`src/platform/`、门户首页、模块注册表和全局路由。
2. 迁移模块 3：把 lessons/domains/features/infra/app/pages 下沉到模块 3。
3. 修复 import 与路径：旧 `/lesson/...` 重定向到 `/module/3/lesson/...`。
4. 创建模块 4 占位：仅首页、routes、module.config、文档。
5. 创建 backend 骨架：仅健康检查和空 router。
6. 重写 README / FILE-STRUCTURE：根文档只到平台/模块级，细节下沉。

## 验证

- `npm run build` 必须通过。
- `/` 显示平台门户。
- `/module/3` 显示模块 3 首页。
- `/module/3/lesson/1/step/1` 到 `/module/3/lesson/6/step/2` 可访问。
- 旧路径 `/lesson/3/step/4` 能重定向。
- 模块 3 保存、导入、快照、教师演示模式可用。
- `/module/4` 仅显示占位页。

## 分支策略

本轮分支：`refactor/module-platform-v1.5`。

模块 4 后续逐课开发分支：`module-4-lesson-1-dev` 至 `module-4-lesson-6-dev`。

