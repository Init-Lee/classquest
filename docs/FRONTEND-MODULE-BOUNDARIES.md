<!--
文件说明：ClassQuest 前端模块边界规范。
职责：明确 platform、modules、shared 三层职责和 import 方向，防止模块 4 复用模块 3 业务代码。
更新触发：前端分层、模块路径、shared 准入标准或模块 URL 规则变化时，需要同步更新本文件。
-->

# 前端模块边界

## 三层结构

```text
src/platform/      → 平台门户、模块注册表、全局路由
src/modules/       → 独立课程模块
src/shared/        → 业务无关 UI 与纯工具
```

## 模块独立性

每个模块拥有自己的：首页、课时路由、本地进度模型、领域类型、特性组件、README、FILE-STRUCTURE。

模块之间禁止直接 import 业务代码。

## shared 准入

允许：`Button`、`Card`、`Dialog`、`Input`、`Textarea`、`Badge`、通用 className 合并工具。

不允许：题卡逻辑、小组合并逻辑、课时 Guard、教师审核、继续学习包格式、任何模块专有概念。

## URL 规则

```text
/                         → 平台门户
/module/3                 → 模块 3 首页
/module/3/lesson/1/...    → 模块 3 课时流
/module/4                 → 模块 4 首页
/module/4/lesson/1/...    → 模块 4 课时流（后续开发）
/module/4/submit          → 模块 4 提交页（后续开发）
/module/4/play            → 模块 4 试答页（后续开发）
/module/4/gallery         → 模块 4 画廊页（后续开发）
```

