<!--
文件说明：ClassQuest repository-facing English README.
职责：Provide the English entry point for project positioning, platform architecture, module status, setup, stack, version strategy, and documentation links.
更新触发：When README.md changes its project positioning, feature scope, setup steps, stack, deployment model, module status, or release/version policy, this file must be updated in sync.
-->

# ClassQuest — Programmatic Teaching Platform

> A classroom-oriented programmatic teaching platform. ClassQuest is currently being refactored from a single-module app into a platform portal with independent curriculum modules and a lightweight V1.5 backend.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TypeScript-61DAFB)](https://vitejs.dev)
[![Chinese](https://img.shields.io/badge/README-中文-red)](README.md)
[![Release](https://img.shields.io/badge/release-v0.7.0-emerald)](https://github.com/Init-Lee/classquest/releases)

## Current Architecture Goal

```text
Platform Portal → Module → Lesson → Step
```

```text
src/
├── platform/                         # Platform portal, global routes, module registry
├── modules/
│   ├── module-3-ai-science-station/   # Completed Module 3: AI Science Station
│   └── module-4-ai-info-detective/    # Module 4: AI Information Detective, placeholder first
└── shared/                            # Business-neutral UI and pure utilities

backend/                              # V1.5 lightweight FastAPI backend skeleton
```

## Module Status

- **Module 3 · AI Science Station**: completed with 6 lessons and 24 steps. It preserves local-first progress, continue packages, cross-role file flow, stage snapshots, and teacher demo mode. See `src/modules/module-3-ai-science-station/README.md`.
- **Module 4 · AI Information Detective**: currently architecture placeholder only. Each lesson will be developed later on its own branch. See `src/modules/module-4-ai-info-detective/README.md`.
- **V1.5 Backend**: currently a skeleton with a health check only. Real submission, review, quiz, stats, and gallery export features will be implemented after Module 4 mock workflows stabilize. See `backend/README.md`.

## Getting Started

Requirements: Node.js >= 18.

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

Production build:

```bash
npm run build
```

## Tech Stack

- Frontend: React + TypeScript + Vite
- Routing: React Router v6
- UI: Tailwind CSS + shadcn-style local wrappers
- Module 3 local data: browser local storage + continue package export/import
- V1.5 backend target: FastAPI + SQLite + local runtime files + Nginx + HTTPS

## Deployment Model (V1.5)

```text
Frontend: Vite build output → OSS static hosting
Backend: lightweight server → Nginx → FastAPI → SQLite / local runtime files
```

Before Module 4 connects to the real backend, the frontend should first validate workflows with local state and mock API adapters.

## Branching and Version Strategy

- Current mainline release: `v0.7.0`, after the platform refactor merge (Module 3 preserved, Module 4 placeholder, backend skeleton).
- Previous milestone: `v0.6.0`, when Module 3 shipped as a single-app layout.
- Later Module 4 work: one branch per lesson, for example `module-4-lesson-1-dev`.
- After Module 4 mock workflows stabilize: move toward `v0.8.0`.
- After Module 4 connects to the real backend: move toward `v0.9.0`.

Note: `appVersion` inside student learning packages tracks the data-package format and is maintained separately from the product release number.

## Documentation Entry Points

- `FILE-STRUCTURE.md`: repository structure source of truth, limited to platform/module-level boundaries.
- `docs/CURSOR-START-HERE.md`: development entry guide.
- `docs/MIGRATION-PLAN.md`: platform migration plan.
- `docs/ARCHITECTURE-V1_5.md`: V1.5 architecture overview.
- `.cursor/rules/classquest-platform.mdc`: Cursor development rules.

## License

[MIT License](LICENSE) © 2026 ClassQuest Contributors
