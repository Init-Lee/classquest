<!--
文件说明：src/platform/ 目录结构真相源。
职责：记录平台层文件职责、依赖方向和禁止放入的业务内容。
更新触发：平台层新增、移动、删除文件或调整路由组合方式时，需要同步更新本文件。
-->

# FILE-STRUCTURE — src/platform

## 结构

```text
src/platform/
├── README.md
├── FILE-STRUCTURE.md
├── router/
│   └── index.tsx
├── layout/
│   └── PlatformShell.tsx
├── pages/
│   ├── PortalHomePage.tsx
│   └── NotFoundPage.tsx
├── module-registry.ts
└── types.ts
```

## 依赖方向

```text
platform → modules / shared
modules  → shared
shared   → 无业务依赖
```

平台可以组合模块路由，但不承载模块内部业务。

