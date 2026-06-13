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
platform        → modules / teacher-console / shared
teacher-console → shared
modules         → shared
shared          → 无业务依赖
```

平台可以组合模块路由与 teacher-console 独立路由，但不承载模块内部业务或教师控制台业务。

`router/index.tsx` 中 `/m4/challenge` 是模块 4 课时 6 公共挑战的顶层公开路由，直接 lazy 加载 `Module4PublicChallengePage`。该路由必须与 `/module/4` 平级，绕开 `Module4Shell`、`Module4Provider` 和课时访问 guard，以便访客无需登录或建档即可进入公共挑战。

